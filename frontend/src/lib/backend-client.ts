/**
 * Cliente de Conexão Resiliente com o Backend NestJS
 * Tenta automaticamente as URLs configuradas e os aliases internos do Docker no Easypanel
 */

export async function fetchBackend(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const candidateBases = [
    process.env.API_URL,
    process.env.NEXT_PUBLIC_API_URL,
    'http://api:8081',
    'http://backend:8081',
    'http://backend-nestjs:8081',
    'http://nest:8081',
    'http://server:8081',
    'http://172.17.0.1:8081',
    'http://host.docker.internal:8081',
    'http://127.0.0.1:8081',
    'http://localhost:8081',
  ].filter((u): u is string => Boolean(u && typeof u === 'string' && u.trim().length > 0));

  let lastError: any = null;
  let lastResponse: Response | null = null;

  for (const base of candidateBases) {
    try {
      const cleanBase = base.replace(/\/+$/, '');
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const fullUrl = `${cleanBase}${cleanEndpoint}`;

      const res = await fetch(fullUrl, {
        ...options,
        cache: 'no-store',
      });

      if (res.ok || res.status < 500) {
        return res;
      }
      lastResponse = res;
    } catch (err) {
      lastError = err;
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError || new Error(`Falha ao conectar com o backend NestJS no endpoint: ${endpoint}`);
}
