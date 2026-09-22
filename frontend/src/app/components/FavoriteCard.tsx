'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Trash2, Package, Sparkles } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';
import { useCart } from '../contexts/CartContext';
import { useToast } from './ui/Toaster';

interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  images: Array<{
    url: string;
    alt: string;
  }>;
}

interface FavoriteCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
}

export default function FavoriteCard({ product, viewMode }: FavoriteCardProps) {
  const { removeFromFavorites } = useFavorites();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, 1);
      addToast({
        type: 'success',
        title: 'Produto adicionado',
        message: `${product.name} foi adicionado ao carrinho`
      });
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível adicionar o produto ao carrinho'
      });
    }
  };

  const handleRemoveFromFavorites = () => {
    removeFromFavorites(product.id);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (viewMode === 'grid') {
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300 relative"
        whileHover={{ y: -4, scale: 1.02 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative">
          <div className="aspect-square bg-gray-100">
            {product.images.length > 0 ? (
              <img
                src={product.images[0].url}
                alt={product.images[0].alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Remove from favorites button */}
          <motion.button
            onClick={handleRemoveFromFavorites}
            className="absolute top-3 right-3 p-2 bg-gradient-to-r from-red-400/90 to-pink-500/90 text-white rounded-full shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"
            title="Remover dos favoritos"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Heart className="h-4 w-4 fill-current" />
          </motion.button>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            <Link 
              href={`/produtos/${product.id}`}
              className="hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600 hover:bg-clip-text hover:text-transparent transition-all duration-300"
            >
              {product.name}
            </Link>
          </h3>
          
          <p className="text-sm text-gray-600 mb-3">SKU: {product.sku}</p>
          
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {formatCurrency(product.price)}
            </p>
            
            <motion.button
              onClick={handleAddToCart}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              title="Adicionar ao carrinho"
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingCart className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
      whileHover={{ scale: 1.01 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex">
        <div className="w-32 h-32 bg-gray-100 flex-shrink-0">
          {product.images.length > 0 ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].alt}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                <Link 
                  href={`/produtos/${product.id}`}
                  className="hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600 hover:bg-clip-text hover:text-transparent transition-all duration-300"
                >
                  {product.name}
                </Link>
              </h3>
              <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>
              <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {formatCurrency(product.price)}
              </p>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <motion.button
                onClick={handleAddToCart}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 text-sm shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                Adicionar ao Carrinho
              </motion.button>
              
              <motion.button
                onClick={handleRemoveFromFavorites}
                className="p-2 text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 rounded-lg transition-all duration-300"
                title="Remover dos favoritos"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Trash2 className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
