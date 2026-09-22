import type { Metadata } from 'next';
import CategoryClient from './CategoryClient';

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hubconstrucoes.com.br';

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

async function fetchCategory(slug: string): Promise<CategoryData | null> {
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const categories: CategoryData[] = await res.json();
    if (!Array.isArray(categories)) return null;

    const found = categories.find((c) => c.slug === slug);
    if (found) return found;

    const formattedSlug = slug.replace(/-/g, ' ').toLowerCase();
    return categories.find((c) => c.name?.toLowerCase() === formattedSlug) || null;
  } catch (err) {
    console.warn(`Erro ao carregar categoria ${slug}:`, err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategory(slug);

  const formattedName =
    category?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const title = `${formattedName} | HubConstruções`;
  const description =
    category?.description ||
    `Confira as melhores ofertas e variedades em ${formattedName} para sua obra com pronta-entrega no HubConstruções.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/categoria/${slug}`,
    },
    openGraph: {
      type: 'website',
      title: `${formattedName} - Materiais de Construção`,
      description,
      url: `${SITE_URL}/categoria/${slug}`,
      siteName: 'HubConstruções',
      images: [
        {
          url: category?.image || `${SITE_URL}/icons/icon-512x512.png`,
          width: 800,
          height: 600,
          alt: formattedName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${formattedName} - Materiais de Construção`,
      description,
      images: [category?.image || `${SITE_URL}/icons/icon-512x512.png`],
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await fetchCategory(slug);

  const categoryTitle =
    category?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Início',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: categoryTitle,
        item: `${SITE_URL}/categoria/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <CategoryClient slug={slug} />
    </>
  );
}