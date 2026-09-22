'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  Eye, 
  Compare,
  Badge,
  Truck,
  Shield,
  Zap,
  Package,
  Sparkles
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useToast } from './ui/Toaster';

interface ProductAttribute {
  id: string;
  attribute: {
    name: string;
    type: string;
  };
  option?: {
    value: string;
    color?: string;
  };
  value?: string;
}

interface ProductVariation {
  id: string;
  option: {
    name: string;
    color?: string;
  };
}

interface ProductCardAdvancedProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  comparePrice?: number;
  stock: number;
  minStock: number;
  sku: string;
  brand?: string;
  model?: string;
  warranty?: string;
  rating?: number;
  reviewCount?: number;
  saleCount?: number;
  images?: Array<{ url: string; alt?: string }>;
  category: {
    name: string;
    slug: string;
  };
  attributes?: ProductAttribute[];
  variations?: ProductVariation[];
  hasVariations?: boolean;
  featured?: boolean;
  isNew?: boolean;
  onCompare?: (product: any) => void;
  showAddToCart?: boolean;
  viewMode?: 'grid' | 'list';
}

export default function ProductCardAdvanced({
  id,
  name,
  description,
  price,
  comparePrice,
  stock,
  minStock,
  sku,
  brand,
  model,
  warranty,
  rating = 0,
  reviewCount = 0,
  saleCount = 0,
  images = [],
  category,
  attributes = [],
  variations = [],
  hasVariations = false,
  featured = false,
  isNew = false,
  onCompare,
  showAddToCart = true,
  viewMode = 'grid'
}: ProductCardAdvancedProps) {
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { addToast } = useToast();

  const handleAddToCart = async () => {
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

  const handleToggleFavorite = () => {
    if (isFavorite(id)) {
      removeFromFavorites(id);
    } else {
      addToFavorites({
        id,
        name,
        price,
        sku,
        images: images || []
      });
    }
  };

  const handleCompare = () => {
    if (onCompare) {
      onCompare({
        id,
        name,
        price,
        brand,
        sku,
        images,
        category,
        attributes
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getDiscountPercentage = () => {
    if (!comparePrice || comparePrice <= price) return 0;
    return Math.round(((comparePrice - price) / comparePrice) * 100);
  };

  const getStockStatus = () => {
    if (stock <= 0) return { status: 'out', label: 'Sem estoque', color: 'text-red-600' };
    if (stock <= minStock) return { status: 'low', label: 'Últimas unidades', color: 'text-yellow-600' };
    return { status: 'available', label: 'Em estoque', color: 'text-green-600' };
  };

  const stockStatus = getStockStatus();
  const discountPercentage = getDiscountPercentage();
  const imageUrl = images[selectedImage]?.url || images[0]?.url || '/placeholder-product.svg';
  const imageAlt = images[selectedImage]?.alt || images[0]?.alt || name;

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 group">
        <div className="flex gap-4">
          {/* Image */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <img 
              src={imageUrl} 
              alt={imageAlt} 
              className="w-full h-full object-cover rounded"
            />
            
            {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {featured && (
            <motion.span 
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-sm"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="h-3 w-3" />
              Destaque
            </motion.span>
          )}
          {isNew && (
            <motion.span 
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-3 py-1 rounded-full shadow-lg backdrop-blur-sm"
              initial={{ scale: 0, x: -10 }}
              animate={{ scale: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
            >
              Novo
            </motion.span>
          )}
          {discountPercentage > 0 && (
            <motion.span 
              className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs px-3 py-1 rounded-full shadow-lg font-semibold backdrop-blur-sm"
              initial={{ scale: 0, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              whileHover={{ scale: 1.1 }}
            >
              -{discountPercentage}%
            </motion.span>
          )}
        </div>

            {/* Favorite Button */}
            <motion.button
              onClick={handleToggleFavorite}
              className={`absolute top-2 right-2 p-2 rounded-full transition shadow-md backdrop-blur-sm ${
                isFavorite(id)
                  ? 'bg-gradient-to-r from-red-400/90 to-pink-500/90 text-white'
                  : 'bg-white/90 text-gray-600 hover:bg-orange-50/90 hover:text-orange-600'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Heart className={`h-4 w-4 ${isFavorite(id) ? 'fill-current' : ''}`} />
            </motion.button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                {brand && (
                  <p className="text-sm text-gray-500 mb-1">{brand}</p>
                )}
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-1">
                  <Link href={`/produtos/${id}`} className="hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600 hover:bg-clip-text hover:text-transparent transition-all duration-300">
                    {name}
                  </Link>
                </h3>
                {model && (
                  <p className="text-sm text-gray-600 mb-2">Modelo: {model}</p>
                )}
                {description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                {onCompare && (
                  <motion.button
                    onClick={handleCompare}
                    className="p-2 text-gray-600 hover:text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 rounded-lg transition-all duration-300"
                    title="Comparar"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Compare className="h-4 w-4" />
                  </motion.button>
                )}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={`/produtos/${id}`}
                    className="p-2 text-gray-600 hover:text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 rounded-lg transition-all duration-300 inline-block"
                    title="Ver detalhes"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </motion.div>
              </div>
            </div>

            {/* Attributes */}
            {attributes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attributes.slice(0, 3).map((attr) => (
                  <span
                    key={attr.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {attr.attribute.name}: {attr.option?.value || attr.value}
                  </span>
                ))}
                {attributes.length > 3 && (
                  <span className="text-xs text-gray-500">+{attributes.length - 3} mais</span>
                )}
              </div>
            )}

            {/* Rating and Reviews */}
            {rating > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  ({reviewCount} avaliações)
                </span>
              </div>
            )}

            {/* Price and Stock */}
            <div className="flex items-center justify-between">
              <div>
                {comparePrice && comparePrice > price && (
                  <p className="text-sm text-gray-500 line-through">
                    {formatCurrency(comparePrice)}
                  </p>
                )}
                <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {formatCurrency(price)}
                </p>
                <p className="text-xs text-gray-500">SKU: {sku}</p>
              </div>

              <div className="text-right">
                <p className={`text-sm font-medium ${stockStatus.color}`}>
                  {stockStatus.label}
                </p>
                {warranty && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Shield className="h-3 w-3" />
                    <span>{warranty}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {showAddToCart && (
              <div className="flex gap-2 mt-4">
                <motion.button
                  onClick={handleAddToCart}
                  disabled={loading || stock <= 0}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {loading ? 'Adicionando...' : 'Adicionar ao Carrinho'}
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <motion.div 
      className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group relative"
      whileHover={{ y: -4, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-gray-100">
        <img 
          src={imageUrl} 
          alt={imageAlt} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {featured && (
            <motion.span 
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs px-2 py-1 rounded-full shadow-lg flex items-center gap-1"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="h-3 w-3" />
              Destaque
            </motion.span>
          )}
          {isNew && (
            <motion.span 
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-2 py-1 rounded-full shadow-lg"
              initial={{ scale: 0, x: -10 }}
              animate={{ scale: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
            >
              Novo
            </motion.span>
          )}
          {discountPercentage > 0 && (
            <motion.span 
              className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs px-2 py-1 rounded-full shadow-lg font-semibold"
              initial={{ scale: 0, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              whileHover={{ scale: 1.1 }}
            >
              -{discountPercentage}%
            </motion.span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <motion.button
            onClick={handleToggleFavorite}
            className={`p-2 rounded-full shadow-lg transition-all backdrop-blur-sm ${
              isFavorite(id)
                ? 'bg-gradient-to-r from-red-400/90 to-pink-500/90 text-white'
                : 'bg-white/90 text-gray-600 hover:bg-gradient-to-r hover:from-orange-50/90 hover:to-orange-100/90 hover:text-orange-600'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Heart className={`h-4 w-4 ${isFavorite(id) ? 'fill-current' : ''}`} />
          </motion.button>
          
          {onCompare && (
            <motion.button
              onClick={handleCompare}
              className="p-2 bg-white/90 text-gray-600 rounded-full shadow-lg hover:bg-gradient-to-r hover:from-orange-50/90 hover:to-orange-100/90 hover:text-orange-600 transition-all backdrop-blur-sm"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0, rotate: 90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Compare className="h-4 w-4" />
            </motion.button>
          )}
          
          <Link
            href={`/produtos/${id}`}
            className="p-2 bg-white text-gray-600 rounded-full shadow-md hover:bg-gray-50 transition"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>

        {/* Multiple Images Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {images.slice(0, 3).map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-2 h-2 rounded-full transition ${
                  selectedImage === index ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {brand && (
          <p className="text-sm text-gray-500 mb-1">{brand}</p>
        )}
        
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          <Link href={`/produtos/${id}`} className="hover:text-orange-600 transition">
            {name}
          </Link>
        </h3>

        {model && (
          <p className="text-sm text-gray-600 mb-2">Modelo: {model}</p>
        )}

        {/* Attributes */}
        {attributes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {attributes.slice(0, 2).map((attr) => (
              <span
                key={attr.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {attr.option?.value || attr.value}
              </span>
            ))}
          </div>
        )}

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="mb-3">
          {comparePrice && comparePrice > price && (
            <p className="text-sm text-gray-500 line-through">
              {formatCurrency(comparePrice)}
            </p>
          )}
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(price)}
          </p>
        </div>

        {/* Stock Status */}
        <div className="flex items-center justify-between mb-3">
          <p className={`text-sm font-medium ${stockStatus.color}`}>
            {stockStatus.label}
          </p>
          {warranty && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Shield className="h-3 w-3" />
              <span>{warranty}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {showAddToCart && (
          <button
            onClick={handleAddToCart}
            disabled={loading || stock <= 0}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            {loading ? 'Adicionando...' : 'Adicionar ao Carrinho'}
          </button>
        )}

        {/* Additional Info */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <span>SKU: {sku}</span>
          {saleCount > 0 && (
            <span>{saleCount} vendidos</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
