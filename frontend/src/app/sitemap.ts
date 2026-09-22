import type { MetadataRoute } from 'next';

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hubconstrucoes.com.br';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/produtos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/calculadora`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/builder3d`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/parceiros`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/sobre`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/termos-de-uso`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/privacidade`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/trocas-e-devolucoes`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];

  try {
    const productsRes = await fetch(`${API_BASE}/products?limit=1000`, {
      next: { revalidate: 3600 },
    });
    if (productsRes.ok) {
      const data = await productsRes.json();
      const products = Array.isArray(data) ? data : data?.products || [];
      productRoutes = products
        .filter((p: any) => p && p.id)
        .map((product: any) => ({
          url: `${SITE_URL}/produtos/${product.id}`,
          lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }));
    }
  } catch (err) {
    console.warn('Sitemap: Não foi possível obter produtos da API no momento.', err);
  }

  try {
    const categoriesRes = await fetch(`${API_BASE}/categories`, {
      next: { revalidate: 3600 },
    });
    if (categoriesRes.ok) {
      const categories = await categoriesRes.json();
      if (Array.isArray(categories)) {
        categoryRoutes = categories
          .filter((cat: any) => cat && cat.slug)
          .map((cat: any) => ({
            url: `${SITE_URL}/categoria/${cat.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
          }));
      }
    }
  } catch (err) {
    console.warn('Sitemap: Não foi possível obter categorias da API no momento.', err);
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
