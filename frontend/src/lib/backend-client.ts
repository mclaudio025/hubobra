/**
 * Cliente de Conexão Resiliente de Alta Performance com o Backend NestJS
 * - Circuit Breaker com auto-recovery (evita travamento de threads em instabilidades)
 * - Memorização do alias Docker ativo (0ms de overhead)
 * - Sanitização automática de headers e proteção contra timeouts
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  lastFailureTime: number;
  openedAt: number;
}

const circuit: CircuitBreakerState = {
  state: 'CLOSED',
  failures: 0,
  lastFailureTime: 0,
  openedAt: 0,
};

const MAX_FAILURES = 3;
const CIRCUIT_COOLDOWN_MS = 15000; // 15 segundos para tentar reconectar (Half-Open)
let cachedWorkingBase: string | null = null;
let lastWorkingBaseTime: number = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minuto de cache para o host validado

export class CircuitBreakerError extends Error {
  constructor(message = 'Circuito do backend aberto temporariamente para proteção') {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export function getCircuitStatus() {
  return { ...circuit, cachedWorkingBase };
}

export async function fetchBackend(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const now = Date.now();

  // 1. Verificação do Circuit Breaker
  if (circuit.state === 'OPEN') {
    if (now - circuit.openedAt > CIRCUIT_COOLDOWN_MS) {
      circuit.state = 'HALF_OPEN';
    } else {
      // Falha rápida em 0ms para não prender threads do Traefik/Next.js
      throw new CircuitBreakerError(
        `Backend indisponível temporariamente. Circuito reabrindo em ${Math.ceil(
          (CIRCUIT_COOLDOWN_MS - (now - circuit.openedAt)) / 1000
        )}s`
      );
    }
  }

  const isCacheValid = cachedWorkingBase && now - lastWorkingBaseTime < CACHE_TTL_MS;

  // Lista de bases candidatas ordenada por prioridade
  const rawCandidateBases = [
    isCacheValid ? cachedWorkingBase : null,
    'http://tasks.n8n_api:8081',
    'http://tasks.n8n-api:8081',
    'https://api.hubobra.com.br',
    process.env.BACKEND_URL,
    process.env.API_URL,
    process.env.NEXT_PUBLIC_API_URL,
    'http://n8n_api:8081',
    'http://n8n-api:8081',
    'http://n8n_backend:8081',
    'http://api:8081',
    'http://backend:8081',
    'http://backend-nestjs:8081',
    'http://172.17.0.1:8081',
    'http://host.docker.internal:8081',
    'http://127.0.0.1:8081',
    'http://localhost:8081',
  ];

  const candidateBases = Array.from(
    new Set(
      rawCandidateBases
        .filter((u): u is string => Boolean(u && typeof u === 'string' && u.trim().length > 0))
        .map((u) => u.trim().replace(/\/+$/, ''))
    )
  );

  // Em modo HALF_OPEN, testa apenas o host principal para canário
  const hostsToTry = circuit.state === 'HALF_OPEN' ? candidateBases.slice(0, 2) : candidateBases;

  // Sanitiza headers (remove strings vazias)
  const sanitizedHeaders: Record<string, string> = {};
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((val, key) => {
        if (val && val.trim().length > 0) sanitizedHeaders[key] = val;
      });
    } else if (Array.isArray(options.headers)) {
      for (const [key, val] of options.headers) {
        if (val && val.trim().length > 0) sanitizedHeaders[key] = val;
      }
    } else if (typeof options.headers === 'object') {
      for (const [key, val] of Object.entries(options.headers)) {
        if (val && typeof val === 'string' && val.trim().length > 0) {
          sanitizedHeaders[key] = val;
        }
      }
    }
  }

  let lastError: any = null;
  let lastResponse: Response | null = null;

  for (const base of hostsToTry) {
    try {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const fullUrl = `${base}${cleanEndpoint}`;

      const isPrimary = base === cachedWorkingBase || base === 'http://tasks.n8n_api:8081';
      const timeoutMs = isPrimary ? 10000 : 2500;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      if (options.signal) {
        options.signal.addEventListener('abort', () => controller.abort(), { once: true });
      }

      const res = await fetch(fullUrl, {
        ...options,
        headers: sanitizedHeaders,
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeoutId);

      if (res.ok || (res.status >= 200 && res.status < 500)) {
        // Sucesso: fecha o circuito e memoriza o host
        cachedWorkingBase = base;
        lastWorkingBaseTime = Date.now();
        circuit.state = 'CLOSED';
        circuit.failures = 0;
        return res;
      }

      lastResponse = res;
    } catch (err: any) {
      lastError = err;
      if (cachedWorkingBase === base) {
        cachedWorkingBase = null;
      }
    }
  }

  // Se todas as tentativas falharem, incrementa contador de falhas
  circuit.failures += 1;
  circuit.lastFailureTime = Date.now();

  if (circuit.failures >= MAX_FAILURES) {
    circuit.state = 'OPEN';
    circuit.openedAt = Date.now();
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError || new Error(`Falha ao conectar com o backend no endpoint: ${endpoint}`);
}

