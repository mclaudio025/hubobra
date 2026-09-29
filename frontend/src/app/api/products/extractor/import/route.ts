import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.hubobra.com.br';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zeywqzkmevytzkdbzwni.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    const items = body.items || [];

    // Tentar backend principal se disponível
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authHeader) headers['Authorization'] = authHeader;

      const res = await fetch(`${API_BASE_URL}/products/extractor/import`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Falha no backend principal -> prossegue para inserção direta no Supabase
    }

    // Inserção direta no Supabase
    let imported = 0;
    let skipped = 0;

    for (const item of items) {
      try {
        const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/products?name=eq.${encodeURIComponent(item.name)}&select=id`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        });
        const existing = await checkRes.json();
        if (Array.isArray(existing) && existing.length > 0) {
          skipped++;
          continue;
        }

        const productId = crypto.randomUUID();
        const price = Number(item.price) || 0;
        const comparePrice = item.comparePrice || Math.round(price * 1.15 * 100) / 100;
        const cost = item.cost || Math.round(price * 0.70 * 100) / 100;

        const productPayload = {
          id: productId,
          name: item.name,
          sku: item.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          barcode: item.ean || null,
          brand: item.brand || 'Marca Referência',
          price,
          comparePrice,
          cost,
          stock: item.stock || 50,
          unit: item.unit || 'UN',
          description: item.description || `Produto ${item.name} com alta qualidade para sua obra.`,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(productPayload)
        });

        if (insertRes.ok) {
          if (item.image) {
            await fetch(`${SUPABASE_URL}/rest/v1/product_images`, {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                id: crypto.randomUUID(),
                productId,
                url: item.image,
                alt: item.name,
                order: 0,
                createdAt: new Date().toISOString()
              })
            });
          }
          imported++;
        }
      } catch (err) {
        // Ignora erro individual
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: items.length
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro interno no proxy de importação' },
      { status: 500 }
    );
  }
}
