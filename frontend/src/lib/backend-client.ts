/**
 * Cliente de Conexão Resiliente de Alta Performance com o Backend NestJS
 * Descobre rapidamente o alias interno do Docker no Easypanel (n8n_api, api, etc.)
 * e memoriza o endereço em memória para respostas instantâneas (0ms de overhead).
 */

let cachedWorkingBase: string | null = null;
let lastWorkingBaseTime: number = 0;
const CACHE_TTL_MS = 60 * 1000; // Revalida o host a cada 1 minuto se necessário

export async function fetchBackend(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const isCacheValid = cachedWorkingBase && (Date.now() - lastWorkingBaseTime < CACHE_TTL_MS);

  // Lista ordenada de candidatos para conexão interna e externa
  const rawCandidateBases = [
    isCacheValid ? cachedWorkingBase : null,
    process.env.BACKEND_URL,
    process.env.API_URL,
    process.env.NEXT_PUBLIC_API_URL,
    'http://n8n_api:8081',
    'http://n8n-api:8081',
    'http://n8n_backend:8081',
    'http://api:8081',
    'http://backend:8081',
    'http://backend-nestjs:8081',
    'https://api.hubobra.com.br',
    'http://172.17.0.1:8081',
    'http://host.docker.internal:8081',
    'http://127.0.0.1:8081',
    'http://localhost:8081',
  ];

  // Remove nulos e duplicados mantendo a ordem de prioridade
  const candidateBases = Array.from(
    new Set(
      rawCandidateBases
        .filter((u): u is string => Boolean(u && typeof u === 'string' && u.trim().length > 0))
        .map((u) => u.trim().replace(/\/+$/, ''))
    )
  );

  let lastError: any = null;
  let lastResponse: Response | null = null;

  for (const base of candidateBases) {
    try {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const fullUrl = `${base}${cleanEndpoint}`;

      // Timeout agressivo de 2 segundos por tentativa para evitar travamentos de SSR
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      // Se o chamador já passou um signal, combina com o timeout
      if (options.signal) {
        options.signal.addEventListener('abort', () => controller.abort(), { once: true });
      }

      const res = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeoutId);

      if (res.ok || (res.status >= 200 && res.status < 500)) {
        // Salva a base que funcionou com sucesso no cache em memória
        cachedWorkingBase = base;
        lastWorkingBaseTime = Date.now();
        return res;
      }

      lastResponse = res;
    } catch (err: any) {
      lastError = err;
      // Se a base em cache falhou, invalida imediatamente
      if (cachedWorkingBase === base) {
        cachedWorkingBase = null;
      }
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError || new Error(`Falha ao conectar com o backend NestJS no endpoint: ${endpoint}`);
}

