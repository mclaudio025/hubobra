import type { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';
import { fetchBackend } from '@/lib/backend-client';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hubobra.com.br';

interface ProductData {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  sku?: string;
  barcode?: string;
  brand?: string;
  weight?: number;
  dimensions?: string;
  specifications?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  images?: Array<{
    id: string;
    url: string;
    alt: string;
    order: number;
  }>;
  tags?: Array<{
    tag: {
      name: string;
      slug: string;
    };
  }>;
}

async function fetchProduct(id: string): Promise<ProductData | null> {
  try {
    const res = await fetchBackend(`/products/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn(`Erro ao carregar metadados do produto ${id}:`, err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(id);

  if (!product) {
    return {
      title: 'Produto não encontrado | HubObra',
      description: 'O produto solicitado não foi encontrado na plataforma HubObra.',
    };
  }

  const title = `${product.name} | HubObra`;
  const description =
    product.description && product.description.length > 0
      ? product.description.slice(0, 160).replace(/\r?\n|\r/g, ' ')
      : `Compre ${product.name} com entrega rápida para a sua obra e o melhor preço no HubObra.`;

  const primaryImage =
    product.images && product.images.length > 0 && product.images[0].url
      ? product.images[0].url
      : `${SITE_URL}/icons/icon-512x512.png`;

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(product.price || 0);

  return {
    title,
    description: `${description} Por apenas ${formattedPrice}.`,
    alternates: {
      canonical: `/produtos/${id}`,
    },
    openGraph: {
      type: 'website',
      title: `${product.name} - ${formattedPrice}`,
      description,
      url: `${SITE_URL}/produtos/${id}`,
      siteName: 'HubObra',
      images: [
        {
          url: primaryImage,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} - ${formattedPrice}`,
      description,
      images: [primaryImage],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await fetchProduct(id);

  const productSchema = product
    ? {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        image: product.images?.map((img) => img.url) || [],
        description: product.description || product.name,
        sku: product.sku || product.id,
        mpn: product.barcode || product.sku || product.id,
        brand: {
          '@type': 'Brand',
          name: product.brand || 'HubObra',
        },
        offers: {
          '@type': 'Offer',
          url: `${SITE_URL}/produtos/${id}`,
          priceCurrency: 'BRL',
          price: product.price || 0,
          priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          itemCondition: 'https://schema.org/NewCondition',
          availability:
            (product.stock ?? 1) > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: 'HubObra',
          },
        },
      }
    : null;

  return (
    <>
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      <ProductDetailClient productId={id} initialProduct={product} />
    </>
  );
}