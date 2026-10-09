import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend-client';

// Cache em memória de alta performance no servidor Next.js (TTL 60 segundos)
const serverProductsCache = new Map<string, { data: any; expiresAt: number; cachedAt: number }>();
const PRODUCTS_CACHE_TTL = 60 * 1000;

// Snapshot de resiliência: memoriza o último catálogo bem-sucedido
let lastKnownGoodCatalogSnapshot: any[] = [];

// Seed fallback de emergência caso o backend esteja frio ou inacessível no 1º acesso
const SEED_FALLBACK_PRODUCTS = [
  {
    id: 'seed-cimento-cp2-50kg',
    name: 'Cimento CP II-Z-32 50kg Todas as Obras',
    price: 34.90,
    comparePrice: 39.90,
    description: 'Cimento de alta qualidade para fundações, reboco, vigas e alvenaria.',
    sku: 'CIM-001',
    stock: 250,
    brand: 'Votoran',
    unit: 'un',
    isFeatured: true,
    category: { name: 'Construção e Alvenaria', slug: 'construcao-e-alvenaria' },
    images: [{ url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80', alt: 'Cimento CP II 50kg' }]
  },
  {
    id: 'seed-argamassa-aci-20kg',
    name: 'Argamassa AC-I Cerâmica Interna 20kg',
    price: 16.50,
    comparePrice: 19.90,
    description: 'Ideal para assentamento de pisos cerâmicos em áreas internas secas.',
    sku: 'ARG-002',
    stock: 180,
    brand: 'Quartzolit',
    unit: 'un',
    isFeatured: false,
    category: { name: 'Construção e Alvenaria', slug: 'construcao-e-alvenaria' },
    images: [{ url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&auto=format&fit=crop&q=80', alt: 'Argamassa 20kg' }]
  },
  {
    id: 'seed-porcelanato-84x84',
    name: 'Porcelanato Polido Retificado 84x84cm Esmaltado',
    price: 89.90,
    comparePrice: 109.90,
    description: 'Design sofisticado e acabamento brilhante para salas, quartos e corredores.',
    sku: 'PIS-003',
    stock: 95,
    brand: 'Portinari',
    unit: 'm²',
    isFeatured: true,
    category: { name: 'Pisos e Revestimentos', slug: 'pisos-e-revestimentos' },
    images: [{ url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80', alt: 'Porcelanato Polido' }]
  },
  {
    id: 'seed-tinta-acrilica-18l',
    name: 'Tinta Acrílica Fosca Premium 18L Branco Neve',
    price: 289.00,
    comparePrice: 349.00,
    description: 'Altíssimo rendimento e cobertura total para paredes internas e externas.',
    sku: 'TIN-004',
    stock: 60,
    brand: 'Suvinil',
    unit: 'lata',
    isFeatured: true,
    category: { name: 'Tintas e Acessórios', slug: 'tintas-e-acessorios' },
    images: [{ url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80', alt: 'Tinta Acrílica 18L' }]
  },
  {
    id: 'seed-furadeira-impacto-750w',
    name: 'Furadeira e Parafusadeira de Impacto 750W com Maleta',
    price: 319.90,
    comparePrice: 389.90,
    description: 'Potência profissional para perfurações em concreto, madeira e aço.',
    sku: 'FER-005',
    stock: 45,
    brand: 'Bosch',
    unit: 'un',
    isFeatured: true,
    category: { name: 'Ferramentas e Máquinas', slug: 'ferramentas-e-maquinas' },
    images: [{ url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80', alt: 'Furadeira de Impacto' }]
  },
  {
    id: 'seed-tubo-pvc-100mm-6m',
    name: 'Tubo de Esgoto PVC 100mm Barra com 6 Metros',
    price: 49.90,
    comparePrice: 58.00,
    description: 'Linha predial para esgoto sanitário e águas pluviais.',
    sku: 'HID-006',
    stock: 120,
    brand: 'Tigre',
    unit: 'barra',
    isFeatured: false,
    category: { name: 'Hidráulica e Encanamento', slug: 'hidraulica-e-encanamento' },
    images: [{ url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80', alt: 'Tubo PVC 100mm' }]
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  const endpoint = queryString ? `/products?${queryString}` : '/products';

  const auth = request.headers.get('Authorization') || request.headers.get('authorization');
  const isCacheable = !auth || auth.trim().length === 0;

  // 1. Resposta instantânea (0ms) do cache em memória se disponível e fresco
  if (isCacheable) {
    const cached = serverProductsCache.get(endpoint);
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'X-Cache': 'HIT-MEMORY',
        },
      });
    }
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (auth && auth.trim().length > 0) {
      headers['Authorization'] = auth;
    }

    const response = await fetchBackend(endpoint, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Backend retornou HTTP status ${response.status}`);
    }

    const data = await response.json();
    const productsArray = Array.isArray(data?.products)
      ? data.products
      : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
      ? data
      : [];
    const totalCount = data?.total ?? data?.totalProducts ?? productsArray.length;

    const payload = {
      ...data,
      products: productsArray,
      total: totalCount,
      totalProducts: totalCount,
    };

    // Salva no cache em memória e atualiza snapshot global
    if (isCacheable && productsArray.length > 0) {
      serverProductsCache.set(endpoint, {
        data: payload,
        expiresAt: Date.now() + PRODUCTS_CACHE_TTL,
        cachedAt: Date.now(),
      });
      lastKnownGoodCatalogSnapshot = productsArray;
    }

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Cache': 'MISS',
      },
    });
  } catch (error: any) {
    console.warn(`[Fallback Resiliente] Erro ao buscar produtos para '${endpoint}':`, error?.message || error);

    // 2. Resiliência: Stale-While-Revalidate (retorna cache expirado se existir)
    if (isCacheable) {
      const staleCached = serverProductsCache.get(endpoint);
      if (staleCached && staleCached.data?.products?.length > 0) {
        return NextResponse.json(staleCached.data, {
          headers: {
            'Cache-Control': 'public, max-age=10, stale-while-revalidate=300',
            'X-Cache': 'STALE-FALLBACK',
          },
        });
      }
    }

    // 3. Resiliência: Snapshot global ou Seed offline de emergência
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : 24;
    const fallbackList = lastKnownGoodCatalogSnapshot.length > 0
      ? lastKnownGoodCatalogSnapshot
      : SEED_FALLBACK_PRODUCTS;

    const safeProducts = fallbackList.slice(0, limit);
    return NextResponse.json(
      {
        products: safeProducts,
        total: fallbackList.length,
        totalProducts: fallbackList.length,
        isFallback: true,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=10, stale-while-revalidate=300',
          'X-Cache': 'OFFLINE-SNAPSHOT',
        },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetchBackend('/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao processar produto' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na rota POST /api/products:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor ao criar produto' },
      { status: 500 }
    );
  }
}
