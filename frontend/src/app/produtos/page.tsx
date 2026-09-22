import type { Metadata } from 'next';
import Link from "next/link";
import ProductCard from "../components/ProductCard";
import { Package, Filter, Store, MessageSquare, ArrowUpDown, Sparkles } from "lucide-react";
import { getWhatsAppWholesaleLink } from "@/config/store.config";

export const metadata: Metadata = {
  title: 'Catálogo de Materiais de Construção',
  description: 'Confira todos os produtos e materiais para construção e reforma disponíveis para entrega rápida ou retirada na loja.',
  alternates: {
    canonical: '/produtos',
  },
  openGraph: {
    title: 'Catálogo Completo | HubConstruções',
    description: 'Encontre tudo para sua obra com os melhores preços e pronta entrega.',
    url: '/produtos',
  },
};

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  sku?: string;
  stock?: number;
  brand?: string;
  featured?: boolean;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  images?: Array<{ url: string; alt?: string }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

async function getProducts(): Promise<{ products: Product[]; total: number }> {
  try {
    const res = await fetch(`${API_BASE}/products?limit=100`, { 
      cache: 'no-store'
    });
    
    if (!res.ok) {
      console.warn('API de produtos respondeu com status:', res.status);
      return { products: [], total: 0 };
    }
    
    const data = await res.json();
    if (Array.isArray(data)) {
      return { products: data, total: data.length };
    }
    if (data && Array.isArray(data.products)) {
      return { products: data.products, total: data.total || data.products.length };
    }
    return { products: [], total: 0 };
  } catch (error) {
    console.error('Erro ao conectar com API de produtos:', error);
    return { products: [], total: 0 };
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function ProdutosPage() {
  const [{ products, total }, categories] = await Promise.all([
    getProducts(),
    getCategories()
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header da Página */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              Catálogo Oficial HubConstruções
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Todos os Produtos
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl">
              Estoque unificado de parceiros regionais para atender sua obra com agilidade, frete sob medida e os melhores preços.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={getWhatsAppWholesaleLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-xl transition shadow-lg shadow-emerald-950/40"
            >
              <MessageSquare className="w-4 h-4" />
              Cotação em Lote no WhatsApp
            </a>
          </div>
        </div>

        {/* Categorias em Pílulas */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <span className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap mr-2">
              Categorias:
            </span>
            <Link
              href="/produtos"
              className="text-xs font-bold px-4 py-2 rounded-xl bg-orange-600 text-white whitespace-nowrap transition"
            >
              Todos ({total})
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categoria/${cat.slug}`}
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 hover:border-orange-500 hover:text-white whitespace-nowrap transition"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Informações de Estoque & Total */}
        <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-orange-400" />
            <span>Exibindo <strong>{products.length}</strong> produtos disponíveis no catálogo</span>
          </div>
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-400" />
            <span>Rede de lojas parceiras ativas com entrega expressa</span>
          </div>
        </div>

        {/* Grid de Produtos */}
        {products.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Nenhum produto cadastrado ainda</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              Acesse o painel administrativo para cadastrar novos itens ou importar catálogos via planilha Excel.
            </p>
            <Link
              href="/admin/produtos/novo"
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm px-6 py-3 rounded-xl transition"
            >
              Cadastrar Primeiro Produto
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                description={product.description}
                sku={product.sku}
                stock={product.stock ?? 10}
                brand={product.brand}
                isFeatured={product.featured}
                images={product.images && product.images.length > 0 ? product.images : []}
                showAddToCart={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
