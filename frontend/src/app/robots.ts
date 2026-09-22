import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hubconstrucoes.com.br';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/produtos',
          '/produtos/*',
          '/categoria/*',
          '/calculadora',
          '/builder3d',
          '/parceiros',
          '/busca',
          '/sobre',
          '/termos-de-uso',
          '/privacidade',
          '/trocas-e-devolucoes',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/carrinho',
          '/checkout',
          '/checkout/*',
          '/dashboard',
          '/dashboard/*',
          '/pedidos',
          '/pedidos/*',
          '/api/*',
          '/debug',
          '/debug/*',
          '/login',
          '/profile',
          '/profile/*',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
