import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend-client';

// Cache em memória no servidor Next.js (TTL 120 segundos)
const serverCategoriesCache = new Map<string, { data: any; expiresAt: number }>();
const CATEGORIES_CACHE_TTL = 120 * 1000;

let lastKnownGoodCategoriesSnapshot: any[] = [];

const SEED_FALLBACK_CATEGORIES = [
  {
    id: 'cat-construcao-alvenaria',
    name: 'Construção e Alvenaria',
    slug: 'construcao-e-alvenaria',
    description: 'Cimento, argamassa, tijolos, blocos, areia e brita.',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    displayOrder: 1,
  },
  {
    id: 'cat-pisos-revestimentos',
    name: 'Pisos e Revestimentos',
    slug: 'pisos-e-revestimentos',
    description: 'Porcelanatos, cerâmicas, pisos vinílicos e laminados.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    displayOrder: 2,
  },
  {
    id: 'cat-tintas-acessorios',
    name: 'Tintas e Acessórios',
    slug: 'tintas-e-acessorios',
    description: 'Tintas acrílicas, esmaltes, vernizes, rolos e pincéis.',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    displayOrder: 3,
  },
  {
    id: 'cat-material-eletrico',
    name: 'Material Elétrico',
    slug: 'material-eletrico',
    description: 'Fios, cabos, disjuntores, interruptores e tomadas.',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    displayOrder: 4,
  },
  {
    id: 'cat-hidraulica-encanamento',
    name: 'Hidráulica e Encanamento',
    slug: 'hidraulica-e-encanamento',
    description: 'Tubos, conexões, registros, caixas dágua e ralos.',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    displayOrder: 5,
  },
  {
    id: 'cat-ferramentas-maquinas',
    name: 'Ferramentas e Máquinas',
    slug: 'ferramentas-e-maquinas',
    description: 'Furadeiras, serras, ferramentas manuais e EPIs.',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    displayOrder: 6,
  },
  {
    id: 'cat-iluminacao',
    name: 'Iluminação',
    slug: 'iluminacao',
    description: 'Lâmpadas LED, painéis, refletores e lustres.',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    displayOrder: 7,
  },
  {
    id: 'cat-portas-janelas',
    name: 'Portas e Janelas',
    slug: 'portas-e-janelas',
    description: 'Portas de madeira, alumínio, janelas e fechaduras.',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    displayOrder: 8,
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const active = searchParams.get('active');
  const endpoint = active ? `/categories?active=${active}` : '/categories';

  const auth = request.headers.get('Authorization') || request.headers.get('authorization');
  const isCacheable = !auth || auth.trim().length === 0;

  if (isCacheable) {
    const cached = serverCategoriesCache.get(endpoint);
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
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
      throw new Error(`Backend categories returned status ${response.status}`);
    }

    const data = await response.json();
    const categoriesArray = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

    if (isCacheable && categoriesArray.length > 0) {
      serverCategoriesCache.set(endpoint, {
        data: categoriesArray,
        expiresAt: Date.now() + CATEGORIES_CACHE_TTL,
      });
      lastKnownGoodCategoriesSnapshot = categoriesArray;
    }

    return NextResponse.json(categoriesArray, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.warn('[Fallback Resiliente] Erro ao buscar categorias, usando snapshot offline:', error);

    // Stale-While-Revalidate
    if (isCacheable) {
      const staleCached = serverCategoriesCache.get(endpoint);
      if (staleCached && Array.isArray(staleCached.data) && staleCached.data.length > 0) {
        return NextResponse.json(staleCached.data, {
          headers: {
            'Cache-Control': 'public, max-age=10, stale-while-revalidate=600',
            'X-Cache': 'STALE-FALLBACK',
          },
        });
      }
    }

    const fallbackList = lastKnownGoodCategoriesSnapshot.length > 0
      ? lastKnownGoodCategoriesSnapshot
      : SEED_FALLBACK_CATEGORIES;

    return NextResponse.json(fallbackList, {
      headers: {
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=600',
        'X-Cache': 'OFFLINE-SNAPSHOT',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetchBackend('/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao criar categoria' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetchBackend('/categories', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao atualizar categoria' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da categoria é obrigatório' },
        { status: 400 }
      );
    }
    
    const response = await fetchBackend(`/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao deletar categoria' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
