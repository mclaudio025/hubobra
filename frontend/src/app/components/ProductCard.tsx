'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useToast } from './ui/Toaster';
import { Heart, ShoppingCart, Check, Loader2 } from 'lucide-react';
import { getOptimizedImageUrl, SHIMMER_BLUR_DATA_URL } from '../../lib/image-loader';

export interface ProductItemProp {
  id: string;
  name: string;
  price?: number;
  comparePrice?: number;
  description?: string;
  images?: Array<{ url: string; alt?: string }>;
  sku?: string;
  barcode?: string;
  stock?: number;
  brand?: string;
  isFeatured?: boolean;
  featured?: boolean;
  category?: { name: string; slug?: string } | string;
  rating?: number;
  unit?: string;
}

export interface ProductCardProps {
  id?: string;
  name?: string;
  price?: number;
  comparePrice?: number;
  description?: string;
  images?: Array<{ url: string; alt?: string }>;
  sku?: string;
  barcode?: string;
  stock?: number;
  brand?: string;
  unit?: string;
  isFeatured?: boolean;
  featured?: boolean;
  showAddToCart?: boolean;
  product?: ProductItemProp;
  className?: string;
}

export default function ProductCard(props: ProductCardProps) {
  const {
    id: directId,
    name: directName,
    price: directPrice,
    comparePrice: directComparePrice,
    description: directDescription,
    images: directImages,
    sku: directSku,
    barcode: directBarcode,
    stock: directStock,
    brand: directBrand,
    unit: directUnit,
    isFeatured: directIsFeatured,
    featured: directFeatured,
    showAddToCart = true,
    product,
    className = ''
  } = props;

  // Resolve properties safely whether passed directly or via `product` prop
  const id = directId || product?.id || '';
  const name = directName || product?.name || 'Produto sem nome';
  const price = typeof directPrice === 'number' ? directPrice : (typeof product?.price === 'number' ? product.price : 0);
  const explicitComparePrice = directComparePrice ?? product?.comparePrice;
  const images = directImages || product?.images || [];
  const sku = directSku || product?.sku || directBarcode || product?.barcode || (id ? id.slice(-6).toUpperCase() : '000000');
  const stock = directStock !== undefined ? directStock : (product?.stock !== undefined ? product.stock : 10);
  const brand = directBrand || product?.brand;
  const unit = directUnit || product?.unit;
  const isFeatured = directIsFeatured || directFeatured || product?.isFeatured || product?.featured || false;

  const [loading, setLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { addToast } = useToast();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (stock <= 0) {
      addToast({
        type: 'warning',
        title: 'Produto sem estoque',
        message: 'Este produto não está disponível no momento',
      });
      return;
    }

    try {
      setLoading(true);
      await addToCart(id, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
      addToast({
        type: 'success',
        title: 'Produto adicionado!',
        message: `${name} foi adicionado ao seu carrinho`,
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erro ao adicionar',
        message: error.message || 'Tente novamente',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isFavorite(id)) {
      removeFromFavorites(id);
    } else {
      addToFavorites({
        id,
        name,
        price: price || 0,
        sku: sku || '',
        images: images?.map(img => ({ url: img.url, alt: img.alt || name })) || []
      });
    }
  };

  // Pricing calculations
  const pixPrice = price;
  const comparePrice = explicitComparePrice && explicitComparePrice > price
    ? explicitComparePrice
    : Number((price * 1.15).toFixed(2));
  
  const discountPercent = comparePrice > pixPrice && pixPrice > 0
    ? Math.round(((comparePrice - pixPrice) / comparePrice) * 100)
    : 0;

  // Installment calculation
  const getInstallmentsText = () => {
    if (price <= 0) return 'Consulte condições';
    if (comparePrice >= 300) {
      const perMonth = (comparePrice / 6).toFixed(2).replace('.', ',');
      return `6x de R$ ${perMonth} sem juros`;
    }
    if (comparePrice >= 120) {
      const perMonth = (comparePrice / 3).toFixed(2).replace('.', ',');
      return `3x de R$ ${perMonth} sem juros`;
    }
    if (comparePrice >= 50) {
      const perMonth = (comparePrice / 2).toFixed(2).replace('.', ',');
      return `2x de R$ ${perMonth} sem juros`;
    }
    return `1x de R$ ${comparePrice.toFixed(2).replace('.', ',')} sem juros`;
  };

  const rawImageUrl = images[0]?.url || '/placeholder-product.svg';
  const imageUrl = getOptimizedImageUrl(rawImageUrl, { width: 500, height: 500, resize: 'contain', quality: 85, format: 'webp' });
  const [imgSrc, setImgSrc] = useState(imageUrl);
  const imageAlt = images[0]?.alt || name;
  const isFav = isFavorite(id);

  return (
    <div 
      className={`group relative bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between h-full transition-all duration-300 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600/50 ${className}`}
    >
      {/* Top Section: Badges & Wishlist */}
      <div className="relative w-full mb-2">
        <div className="flex items-start justify-between gap-2 z-10">
          {/* Tag / Badge */}
          <div className="flex flex-col gap-1 items-start min-h-[22px]">
            {isFeatured && (
              <span className="bg-[#009de0] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider shadow-xs">
                OFERTA EXCLUSIVA
              </span>
            )}
            {!isFeatured && discountPercent >= 15 && (
              <span className="bg-[#009de0] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider shadow-xs">
                FRETE GRÁTIS
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleToggleFavorite}
            type="button"
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors focus:outline-none"
            title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            aria-label="Favoritar"
          >
            <Heart 
              className={`w-5 h-5 transition-transform active:scale-125 ${
                isFav ? 'fill-[#e52222] text-[#e52222]' : 'hover:text-red-400'
              }`} 
            />
          </button>
        </div>

        {/* Product Image */}
        <Link href={`/produtos/${id}`} className="block relative w-full h-44 sm:h-48 my-1 overflow-hidden bg-white dark:bg-slate-900 rounded-lg">
          <div className="relative w-full h-full flex items-center justify-center p-2.5">
            <Image
              src={imgSrc}
              alt={imageAlt}
              fill
              unoptimized={!imgSrc.includes('supabase.co')}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              placeholder="blur"
              blurDataURL={SHIMMER_BLUR_DATA_URL}
              className="object-contain transition-transform duration-300 ease-out group-hover:scale-105"
              onError={() => {
                setImgSrc('/placeholder-product.svg');
              }}
            />
          </div>

          {stock <= 0 && (
            <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded shadow">
                Esgotado
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Middle Section: Code, Brand & Title */}
      <div className="flex-1 flex flex-col justify-start">
        {/* Reference Code & Brand */}
        <div className="flex items-center justify-between gap-1 text-[11px] text-gray-400 dark:text-gray-400 font-medium uppercase mb-1">
          <span>Cód.Ref: {sku}</span>
          {brand && <span className="font-semibold text-gray-500 dark:text-gray-400 truncate max-w-[100px]">{brand}</span>}
        </div>

        {/* Product Title */}
        <h3 className="text-[13px] sm:text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-[#009de0] transition-colors min-h-[2.5rem]">
          <Link href={`/produtos/${id}`}>
            {name}
          </Link>
        </h3>
      </div>

      {/* Bottom Section: Price, PIX & CTA */}
      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-slate-800/80">
        {/* Comparison Strikethrough Price + Discount Pill */}
        <div className="flex items-center gap-2 min-h-[20px] mb-0.5">
          {discountPercent > 0 && comparePrice > pixPrice ? (
            <>
              <span className="line-through text-xs font-semibold text-gray-400 dark:text-gray-400">
                R$ {comparePrice.toFixed(2).replace('.', ',')}
              </span>
              <span className="bg-[#e52222] text-white text-[10px] font-black px-1.5 py-0.2 rounded uppercase tracking-wider">
                {discountPercent}% OFF
              </span>
            </>
          ) : (
            <span className="text-xs text-transparent select-none">-</span>
          )}
        </div>

        {/* PIX Price (Prominent Bold Red) */}
        <div className="flex items-baseline gap-1 flex-wrap">
          <span className="text-xl sm:text-2xl font-black text-[#e52222] dark:text-[#ff4b4b] tracking-tight leading-none">
            R$ {pixPrice > 0 ? pixPrice.toFixed(2).replace('.', ',') : '0,00'}
          </span>
          {unit && unit !== 'UN' && unit !== 'un' && (
            <span className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400">
              /{unit === 'M2' || unit === 'm2' ? 'm²' : unit.toLowerCase()}
            </span>
          )}
          <span className="text-[11px] sm:text-xs font-black text-[#e52222] dark:text-[#ff4b4b] uppercase tracking-wide ml-0.5">
            NO PIX
          </span>
        </div>

        {/* Installments info */}
        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-normal mt-1 leading-tight">
          {getInstallmentsText()}
        </p>

        {/* Action Button */}
        {showAddToCart && (
          <button
            onClick={handleAddToCart}
            disabled={loading || stock <= 0}
            type="button"
            className={`w-full mt-3 py-2.5 sm:py-3 px-3 rounded-lg font-black text-xs sm:text-[13px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-sm active:scale-[0.98] ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : stock <= 0
                ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'bg-[#009de0] hover:bg-[#0088c6] active:bg-[#0074a6] text-white hover:shadow-md'
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : justAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Adicionado!</span>
              </>
            ) : stock <= 0 ? (
              <span>Indisponível</span>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>ADICIONAR AO CARRINHO</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
