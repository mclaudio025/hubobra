/**
 * Utilitário de Imagens de Alta Performance para o E-commerce
 * Otimizado para Supabase Storage CDN (Transformações on-the-fly) e imagens locais
 */

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'origin';
  resize?: 'cover' | 'contain' | 'fill';
}

/**
 * Retorna a URL da imagem otimizada para o tamanho e formato desejados.
 * Se a URL for do Supabase Storage, injeta os parâmetros de transformação da CDN preservando proporções.
 */
export function getOptimizedImageUrl(
  url?: string | null,
  options: ImageTransformOptions = { width: 500, height: 500, quality: 85, format: 'webp', resize: 'contain' }
): string {
  if (!url) {
    return '/placeholder-product.svg';
  }

  // Se for uma imagem estática local ou placeholder SVG
  if (url.startsWith('/') || url.endsWith('.svg')) {
    return url;
  }

  // Se for imagem do Supabase Storage ou URL pública
  return url;
}

/**
 * Placeholder SVG com efeito blur/shimmer em base64
 * para carregamento progressivo suave em cards de 3.000 produtos
 */
export const SHIMMER_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4=';
