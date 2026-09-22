'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, Maximize2, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { designTokens } from '../../styles/design-tokens';
import Product3DModel, { useProduct3D } from './Product3DModel';
import ARViewer, { useARSupport } from './ARViewer';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  brand: string;
  rating: number;
  reviews: number;
  specifications: Record<string, string>;
  tags: string[];
  isNew?: boolean;
  isOnSale?: boolean;
  model3D?: string;
}

interface ProductCard3DProps {
  product: Product;
  onSelect?: () => void;
  enableAR?: boolean;
  compact?: boolean;
}



// Componente de loading 3D
const Loading3D: React.FC = () => (
  <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <RotateCcw className="w-8 h-8 text-gray-400" />
    </motion.div>
  </div>
);

const ProductCard3D: React.FC<ProductCard3DProps> = ({
  product,
  onSelect,
  enableAR = true,
  compact = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [is3DView, setIs3DView] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showARPreview, setShowARPreview] = useState(false);
  
  const { isSupported: arSupported } = useARSupport();
  const { isSupported: model3DSupported, isLoading: modelLoading } = useProduct3D(product.category);

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleARView = () => {
    setShowARPreview(true);
    // Aqui seria integrado com uma biblioteca AR real como AR.js ou 8th Wall
    setTimeout(() => {
      alert('Funcionalidade AR em desenvolvimento! Em breve você poderá visualizar produtos em sua casa.');
      setShowARPreview(false);
    }, 1000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative group cursor-pointer ${compact ? 'max-w-sm' : 'max-w-md'}`}
      style={{
        background: designTokens.effects.glassmorphism.base.background,
        backdropFilter: designTokens.effects.glassmorphism.base.backdropFilter,
        borderRadius: designTokens.borderRadius.xl,
        border: designTokens.effects.glassmorphism.base.border,
        boxShadow: isHovered ? designTokens.shadows.colored.blue : designTokens.shadows.lg
      }}
      onClick={onSelect}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
        {product.isNew && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1"
          >
            <Zap className="w-3 h-3" />
            NOVO
          </motion.div>
        )}
        {product.isOnSale && discount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full"
          >
            -{discount}%
          </motion.div>
        )}
        {product.rating >= 4.5 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center gap-1"
          >
            <Award className="w-3 h-3" />
            TOP
          </motion.div>
        )}
      </div>

      {/* Controles 3D */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className={`p-2 rounded-full transition-colors ${
            isLiked ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-red-50'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            setIs3DView(!is3DView);
          }}
          className={`p-2 rounded-full transition-colors ${
            is3DView ? 'bg-blue-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-blue-50'
          }`}
        >
          <Eye className="w-4 h-4" />
        </motion.button>
        
        {arSupported && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowARPreview(true);
            }}
            className="p-2 rounded-full transition-colors bg-white/80 text-gray-600 hover:bg-purple-50"
          >
            <Maximize2 className="w-4 h-4" />
          </motion.button>
        )}
        
        {enableAR && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              handleARView();
            }}
            className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
            disabled={showARPreview}
          >
            {showARPreview ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RotateCcw className="w-4 h-4" />
              </motion.div>
            ) : (
              <Smartphone className="w-4 h-4" />
            )}
          </motion.button>
        )}
      </div>

      {/* Área da imagem/3D */}
      <div className={`relative overflow-hidden ${compact ? 'h-48' : 'h-64'}`} style={{ borderRadius: `${designTokens.borderRadius.xl} ${designTokens.borderRadius.xl} 0 0` }}>
        <AnimatePresence mode="wait">
          {is3DView && model3DSupported ? (
            <motion.div
              key="3d-view"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-full h-full"
            >
              <Product3DModel
                category={product.category}
                isHovered={isHovered}
                size="medium"
                enableControls={true}
                color={designTokens.colors.primary[500]}
              />
            </motion.div>
          ) : (
            <motion.div
              key="image-view"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="relative w-full h-full"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Overlay gradiente */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Conteúdo do card */}
      <div className="p-4">
        {/* Categoria e marca */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {product.category}
          </span>
          <span className="text-xs text-gray-400">{product.brand}</span>
        </div>

        {/* Nome do produto */}
        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>

        {/* Avaliação */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating) 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {product.rating} ({product.reviews})
          </span>
        </div>

        {/* Preço */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl font-bold text-gray-900">
            R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-500 line-through">
              R$ {product.originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>

        {/* Especificações (expandível) */}
        <AnimatePresence>
          {showSpecs && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Especificações:</h4>
                <div className="space-y-1">
                  {Object.entries(product.specifications).slice(0, 3).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-gray-600">{key}:</span>
                      <span className="text-gray-800 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botões de ação */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowSpecs(!showSpecs);
            }}
            className="flex-1 py-2 px-3 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
          >
            <Info className="w-4 h-4" />
            {showSpecs ? 'Ocultar' : 'Detalhes'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              // Adicionar ao carrinho
            }}
            className="flex-1 py-2 px-3 text-sm text-white rounded-lg transition-colors flex items-center justify-center gap-1"
            style={{ background: designTokens.colors.primary.gradient }}
          >
            <ShoppingCart className="w-4 h-4" />
            Comprar
          </motion.button>
        </div>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {product.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Efeito de hover */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: isHovered ? 1 : 0,
          background: isHovered ? 'linear-gradient(45deg, rgba(79, 70, 229, 0.1), rgba(255, 107, 53, 0.1))' : 'transparent'
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* AR Viewer */}
      <ARViewer
        isOpen={showARPreview}
        onClose={() => setShowARPreview(false)}
        product={product}
      />
    </motion.div>
  );
};

export default ProductCard3D;