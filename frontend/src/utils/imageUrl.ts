/**
 * Utilitário para tratamento e normalização de URLs de imagens
 */

export function getImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return '/placeholder-product.svg';
  }

  const trimmed = url.trim();

  // Se a URL contiver /uploads/, garantir que a porta/host aponte para o backend atual
  if (trimmed.includes('/uploads/')) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
    const cleanPath = trimmed.substring(trimmed.indexOf('/uploads/'));
    return `${apiBase.replace(/\/$/, '')}${cleanPath}`;
  }

  // Se começar com /, mas não for /uploads
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // Se contiver localhost:3001 ou localhost:3000 ou localhost:8080 trocando para 8081 se for upload
  if (trimmed.includes('localhost:') && trimmed.includes('/uploads/')) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
    const cleanPath = trimmed.substring(trimmed.indexOf('/uploads/'));
    return `${apiBase.replace(/\/$/, '')}${cleanPath}`;
  }

  return trimmed;
}
