import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.hubobra.com.br';

function decodeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&atilde;/gi, 'ã')
    .replace(/&otilde;/gi, 'õ')
    .replace(/&eacute;/gi, 'é')
    .replace(/&aacute;/gi, 'á')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&acirc;/gi, 'â')
    .replace(/&ecirc;/gi, 'ê')
    .replace(/&ocirc;/gi, 'ô')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
}

function cleanProductName(name: string): string {
  if (!name) return '';
  return name
    .replace(/\|\s*(Normatel|Acal|Carajás|Obramax|Telhanorte|Leroy Merlin|C&C|JC Materiais)/gi, '')
    .replace(/Exclusivo\s+(Acal|Normatel|Carajás|Obramax|Telhanorte|Leroy\s*Merlin|JC\s*Materiais)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function searchJCMateriaisDirect(query: string) {
  try {
    const res = await fetch(`https://www.jcmateriais.com.br/search/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    if (!res.ok) return [];
    const html = await res.text();
    const products: any[] = [];
    const jsonLdRegex = /<script\s+type=["']application\/ld\+json["']\s+data-component=['"]structured-data\.item['"]>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const item = JSON.parse(match[1].trim());
        if (item['@type'] === 'Product') {
          const offer = item.offers || {};
          const brand = typeof item.brand === 'object' ? item.brand.name : (item.brand || 'JC Materiais');
          const price = parseFloat(offer.price) || 0;
          const urlProduct = offer.url || item.mainEntityOfPage?.['@id'] || '';
          let image = Array.isArray(item.image) ? item.image[0] : (item.image || '');
          if (image && image.startsWith('//')) image = 'https:' + image;

          const name = cleanProductName(decodeHtml(item.name || ''));
          const description = decodeHtml(item.description || '');

          if (price > 0 && name.length > 0) {
            products.push({
              store: 'JC Materiais',
              storeLogo: 'https://www.jcmateriais.com.br/favicon.ico',
              productId: `jc-${item.sku || Math.random().toString(36).slice(2, 8)}`,
              name,
              brand,
              ean: item.sku || '',
              price,
              listPrice: price,
              available: offer.availability ? offer.availability.includes('InStock') : true,
              url: urlProduct,
              image,
              categories: [],
              description,
            });
          }
        }
      } catch (e) {}
    }
    return products;
  } catch (e) {
    return [];
  }
}

async function searchCarajasDirect(query: string) {
  try {
    const res = await fetch(`https://carajas.vtexcommercestable.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.carajas.com.br/',
        'Accept': 'application/json'
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => {
      const sku = item.items?.[0] || {};
      const seller = sku.sellers?.[0]?.commertialOffer || {};
      const image = sku.images?.[0]?.imageUrl || item.items?.[0]?.images?.[0]?.imageUrl || '';
      return {
        store: 'Carajás',
        storeLogo: 'https://www.carajas.com.br/arquivos/logo-carajas.png',
        productId: `carajas-${item.productId}`,
        name: cleanProductName(item.productName || item.name),
        brand: item.brand || 'Carajás',
        ean: sku.ean || item.productReference || '',
        price: Number(seller.Price) || Number(seller.ListPrice) || 0,
        listPrice: Number(seller.ListPrice) || Number(seller.Price) || 0,
        available: seller.AvailableQuantity > 0,
        url: item.link || `https://www.carajas.com.br/${item.linkText}/p`,
        image,
        categories: item.categories || [],
        description: item.description || '',
      };
    }).filter((i: any) => i.price > 0 && i.name.length > 0);
  } catch (e) {
    return [];
  }
}

async function searchAcalDirect(query: string) {
  try {
    const res = await fetch(`https://www.acalhomecenter.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://www.acalhomecenter.com.br/',
        'Accept': 'application/json'
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => {
      const sku = item.items?.[0] || {};
      const seller = sku.sellers?.[0]?.commertialOffer || {};
      const image = sku.images?.[0]?.imageUrl || item.items?.[0]?.images?.[0]?.imageUrl || '';
      return {
        store: 'Acal',
        storeLogo: 'https://www.acalhomecenter.com.br/arquivos/logo-acal.png',
        productId: `acal-${item.productId}`,
        name: cleanProductName(item.productName || item.name),
        brand: item.brand || 'Acal',
        ean: sku.ean || item.productReference || '',
        price: Number(seller.Price) || Number(seller.ListPrice) || 0,
        listPrice: Number(seller.ListPrice) || Number(seller.Price) || 0,
        available: seller.AvailableQuantity > 0,
        url: item.link || `https://www.acalhomecenter.com.br/${item.linkText}/p`,
        image,
        categories: item.categories || [],
        description: item.description || '',
      };
    }).filter((i: any) => i.price > 0 && i.name.length > 0);
  } catch (e) {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const authHeader = request.headers.get('authorization');

    if (!query.trim()) {
      return NextResponse.json({ query: '', total: 0, stores: {}, products: [] });
    }

    // Tentar backend principal se disponível
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authHeader) headers['Authorization'] = authHeader;

      const res = await fetch(
        `${API_BASE_URL}/products/extractor/search?query=${encodeURIComponent(query)}`,
        { headers, next: { revalidate: 0 } }
      );

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Falha de conexão com backend principal -> usa motor direto abaixo
    }

    // Fallback motor direto integrado (JC Materiais, Carajás, Acal)
    const [jc, carajas, acal] = await Promise.all([
      searchJCMateriaisDirect(query),
      searchCarajasDirect(query),
      searchAcalDirect(query),
    ]);

    const all = [...jc, ...carajas, ...acal];

    return NextResponse.json({
      query,
      total: all.length,
      stores: {
        jc: jc.length,
        carajas: carajas.length,
        acal: acal.length,
        telhanorte: 0,
        obramax: 0,
      },
      products: all,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro interno no proxy do extrator' },
      { status: 500 }
    );
  }
}
