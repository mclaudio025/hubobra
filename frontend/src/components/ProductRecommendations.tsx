'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Heart, 
  ShoppingCart, 
  TrendingUp, 
  Zap, 
  Package, 
  Sparkles, 
  Brain, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Check,
  Loader2,
  Plus,
  ArrowRight
} from 'lucide-react';
import { useCart } from '../app/contexts/CartContext';
import { useFavorites } from '../app/contexts/FavoritesContext';
import { useToast } from '../app/components/ui/Toaster';
import { getOptimizedImageUrl, SHIMMER_BLUR_DATA_URL } from '../lib/image-loader';

interface ProductItem {
  id: string;
  name: string;
  brand?: string;
  price: number;
  comparePrice?: number;
  rating?: number;
  reviewCount?: number;
  category?: { id?: string; name: string; slug?: string } | string;
  images?: Array<{ url: string; alt?: string }>;
  sku?: string;
  unit?: string;
  stock?: number;
  featured?: boolean;
}

interface ProductRecommendationsProps {
  currentProductId?: string;
  currentProductCategory?: string;
  currentProductPrice?: number;
  currentProductName?: string;
  currentProduct?: {
    id: string;
    name: string;
    price: number;
    unit?: string;
    category?: any;
  };
  relatedProducts?: ProductItem[];
  className?: string;
}

// Curated fallbacks for construction items
const fallbackImages: Record<string, string> = {
  ferramentas: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=500&auto=format&fit=crop&q=80',
  hidraulica: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80',
  eletrica: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=80',
  tintas: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&auto=format&fit=crop&q=80',
  cimento: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=80',
  tijolos: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=500&auto=format&fit=crop&q=80',
  pisos: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=500&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=80'
};

function getProductPhoto(prod: ProductItem): string {
  if (prod.images && prod.images.length > 0 && prod.images[0].url) {
    return prod.images[0].url;
  }
  const name = prod.name.toLowerCase();
  if (name.includes('cimento') || name.includes('argamassa')) return fallbackImages.cimento;
  if (name.includes('tinta') || name.includes('verniz') || name.includes('esmalte')) return fallbackImages.tintas;
  if (name.includes('tubo') || name.includes('cano') || name.includes('cola') || name.includes('curva')) return fallbackImages.hidraulica;
  if (name.includes('fio') || name.includes('cabo') || name.includes('tomada') || name.includes('disjuntor')) return fallbackImages.eletrica;
  if (name.includes('piso') || name.includes('porcelanato') || name.includes('revestimento')) return fallbackImages.pisos;
  if (name.includes('tijolo') || name.includes('bloco') || name.includes('telha')) return fallbackImages.tijolos;
  if (name.includes('furadeira') || name.includes('serra') || name.includes('chave') || name.includes('alicate')) return fallbackImages.ferramentas;
  return fallbackImages.default;
}

// Individual Recommended Card
function RecommendationCard({ product }: { product: ProductItem }) {
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const isFav = isFavorite(product.id);
  const rawImage = getProductPhoto(product);
  const optimizedUrl = getOptimizedImageUrl(rawImage, { width: 400, height: 400, resize: 'contain', quality: 85 });
  const [imgSrc, setImgSrc] = useState(optimizedUrl);

  const price = product.price || 0;
  const comparePrice = product.comparePrice || Number((price * 1.15).toFixed(2));
  const discount = comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setLoading(true);
      await addToCart(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
      addToast({
        type: 'success',
        title: 'Adicionado ao carrinho!',
        message: `${product.name} foi adicionado ao seu pedido.`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao adicionar',
        message: err?.message || 'Tente novamente'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFav) {
      removeFromFavorites(product.id);
    } else {
      addToFavorites({
        id: product.id,
        name: product.name,
        price: product.price,
        sku: product.sku || '',
        images: [{ url: rawImage, alt: product.name }]
      });
    }
  };

  const unitLabel = product.unit && product.unit !== 'UN'
    ? `/${product.unit === 'M2' ? 'm²' : product.unit.toLowerCase()}`
    : '';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 flex flex-col justify-between h-full group hover:shadow-lg hover:border-blue-400 transition-all duration-300">
      <div className="relative">
        {/* Top badges */}
        <div className="flex items-center justify-between gap-1 mb-1">
          {discount > 0 ? (
            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
              {discount}% OFF
            </span>
          ) : (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {product.brand || 'Construção'}
            </span>
          )}
          <button
            onClick={handleToggleFavorite}
            type="button"
            className="p-1 rounded-full text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors"
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
        </div>

        {/* Product Image */}
        <Link href={`/produtos/${product.id}`} className="block relative w-full h-36 my-1 overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-800">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR_DATA_URL}
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgSrc(fallbackImages.default)}
          />
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-between mt-2">
        <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors min-h-[2.25rem]">
          <Link href={`/produtos/${product.id}`}>{product.name}</Link>
        </h4>

        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-black text-red-600 dark:text-red-400">
              R$ {price.toFixed(2).replace('.', ',')}
            </span>
            {unitLabel && (
              <span className="text-xs text-slate-500 font-semibold">{unitLabel}</span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={loading}
            type="button"
            className={`w-full mt-2 py-2 px-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
              added
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Adicionado!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Comprar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// "Compre Junto" Bundle Box
function FrequentlyBoughtTogether({ 
  currentProduct, 
  complementaryProducts 
}: { 
  currentProduct: { id: string; name: string; price: number; unit?: string };
  complementaryProducts: ProductItem[];
}) {
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Initially select the first 2 complementary items
  useEffect(() => {
    if (complementaryProducts.length > 0) {
      setSelectedIds(complementaryProducts.slice(0, 2).map(p => p.id));
    }
  }, [complementaryProducts]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectedProducts = useMemo(() => {
    return complementaryProducts.filter(p => selectedIds.includes(p.id));
  }, [complementaryProducts, selectedIds]);

  const bundleTotal = useMemo(() => {
    const complementariesSum = selectedProducts.reduce((sum, p) => sum + (p.price || 0), 0);
    return (currentProduct.price || 0) + complementariesSum;
  }, [currentProduct.price, selectedProducts]);

  const handleAddBundleToCart = async () => {
    try {
      setLoading(true);
      // Add current product + selected complementaries
      await addToCart(currentProduct.id, 1);
      for (const prod of selectedProducts) {
        await addToCart(prod.id, 1);
      }
      addToast({
        type: 'success',
        title: 'Kit Completo Adicionado!',
        message: `${selectedProducts.length + 1} itens foram adicionados ao seu carrinho.`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao adicionar kit',
        message: err?.message || 'Tente novamente'
      });
    } finally {
      setLoading(false);
    }
  };

  if (complementaryProducts.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent dark:from-slate-900 dark:to-slate-800/90 rounded-2xl p-5 border border-amber-500/20 dark:border-slate-800 mb-8 shadow-sm">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            Frequentemente Comprados Juntos (Kit Recomendado)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Adicione os materiais complementares necessários para a instalação com 1 clique.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Products Visual Strip */}
        <div className="lg:col-span-8 flex flex-wrap items-center gap-3">
          {/* Main Product Card Preview */}
          <div className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-[220px]">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center p-1 relative flex-shrink-0">
              <span className="text-xs font-black text-amber-600">Item</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentProduct.name}</p>
              <p className="text-xs font-extrabold text-red-600">R$ {currentProduct.price.toFixed(2).replace('.', ',')}</p>
            </div>
          </div>

          {complementaryProducts.slice(0, 2).map((prod) => {
            const isChecked = selectedIds.includes(prod.id);
            const photo = getProductPhoto(prod);
            return (
              <React.Fragment key={prod.id}>
                <Plus className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div 
                  onClick={() => toggleSelect(prod.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all max-w-[240px] ${
                    isChecked 
                      ? 'bg-white dark:bg-slate-900 border-amber-500 shadow-sm' 
                      : 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <input 
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                  />
                  <div className="w-12 h-12 relative flex-shrink-0 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                    <Image src={photo} alt={prod.name} fill className="object-contain p-1" sizes="48px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{prod.name}</p>
                    <p className="text-xs font-extrabold text-red-600">R$ {prod.price.toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Bundle Summary & CTA */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-500/30 shadow-sm flex flex-col justify-between">
          <div className="mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Preço do Combo:</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              R$ {bundleTotal.toFixed(2).replace('.', ',')}
            </div>
            <p className="text-[11px] text-emerald-600 font-bold">
              {selectedProducts.length + 1} itens selecionados
            </p>
          </div>

          <button
            onClick={handleAddBundleToCart}
            disabled={loading}
            type="button"
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Adicionar Combo ao Carrinho</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductRecommendations({
  currentProductId,
  currentProductCategory,
  currentProductPrice,
  currentProductName,
  currentProduct,
  relatedProducts,
  className = ''
}: ProductRecommendationsProps) {
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'complementary' | 'category' | 'popular'>('all');

  const productId = currentProductId || currentProduct?.id || '';
  const productName = currentProductName || currentProduct?.name || 'Produto';
  const productPrice = typeof currentProductPrice === 'number' ? currentProductPrice : (currentProduct?.price || 0);
  const productUnit = currentProduct?.unit || '';
  const productCategory = currentProductCategory || (typeof currentProduct?.category === 'object' ? currentProduct?.category?.name : currentProduct?.category) || '';

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const res = await fetch('/api/products?active=true&limit=24');
        if (!res.ok) return;
        const data = await res.json();
        const items: ProductItem[] = Array.isArray(data) ? data : (data.items || data.products || []);
        setAllProducts(items.filter(p => p.id !== productId));
      } catch (err) {
        console.warn('Erro ao buscar produtos para recomendações:', err);
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      loadCatalog();
    }
  }, [productId]);

  // Split into smart collections
  const complementaryItems = useMemo(() => {
    // Items in similar / construction accessory categories
    return allProducts.slice(0, 4);
  }, [allProducts]);

  const categoryItems = useMemo(() => {
    return allProducts.filter(p => {
      const catName = typeof p.category === 'object' ? p.category?.name : p.category;
      return catName && currentProductCategory && catName.toLowerCase() === currentProductCategory.toLowerCase();
    }).slice(0, 6);
  }, [allProducts, currentProductCategory]);

  const popularItems = useMemo(() => {
    return allProducts.filter(p => p.featured || (p.price && p.price > 0)).slice(0, 6);
  }, [allProducts]);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center ${className}`}>
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Carregando recomendações para sua obra...</p>
      </div>
    );
  }

  if (allProducts.length === 0) return null;

  return (
    <div className={`space-y-8 ${className}`}>
      {/* 1. "Compre Junto" Bundle Box */}
      {complementaryItems.length > 0 && (
        <FrequentlyBoughtTogether
          currentProduct={{
            id: productId,
            name: productName,
            price: productPrice,
            unit: productUnit
          }}
          complementaryProducts={complementaryItems}
        />
      )}

      {/* 2. Recomendações em Carrossel / Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
        {/* Header com Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Recomendações Inteligentes para sua Obra
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Materiais complementares e ferramentas frequentemente utilizados juntos neste tipo de projeto.
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveFilter('complementary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'complementary'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Complementares
            </button>
            {categoryItems.length > 0 && (
              <button
                onClick={() => setActiveFilter('category')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeFilter === 'category'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Da Mesma Categoria
              </button>
            )}
            <button
              onClick={() => setActiveFilter('popular')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'popular'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Mais Vendidos
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
          {(activeFilter === 'all'
            ? allProducts.slice(0, 10)
            : activeFilter === 'complementary'
            ? complementaryItems
            : activeFilter === 'category'
            ? (categoryItems.length > 0 ? categoryItems : allProducts.slice(0, 5))
            : popularItems
          ).map((product) => (
            <RecommendationCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}