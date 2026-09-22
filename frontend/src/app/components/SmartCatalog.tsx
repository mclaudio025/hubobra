'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Grid, List, Eye, Sparkles, Brain, Zap } from 'lucide-react';
import { designTokens } from '../../styles/design-tokens';
import ProductCard from './ProductCard';
import dynamic from 'next/dynamic';

// Importação dinâmica para componentes 3D (evita problemas de SSR)
const ProductFilter3D = dynamic(() => import('./ProductFilter3D'), { ssr: false });
const ProductCard3D = dynamic(() => import('./ProductCard3D'), { ssr: false });

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

interface SmartCatalogProps {
  products: Product[];
  category?: string;
  onProductSelect?: (product: Product) => void;
  enableAR?: boolean;
  enable3D?: boolean;
}

interface AISearchSuggestion {
  query: string;
  type: 'product' | 'category' | 'brand' | 'specification';
  confidence: number;
}

const SmartCatalog: React.FC<SmartCatalogProps> = ({
  products,
  category,
  onProductSelect,
  enableAR = true,
  enable3D = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | '3d'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: [0, 10000],
    brands: [] as string[],
    categories: [] as string[],
    rating: 0,
    specifications: {} as Record<string, string[]>
  });
  const [sortBy, setSortBy] = useState<'relevance' | 'price' | 'rating' | 'newest'>('relevance');
  const [aiSuggestions, setAiSuggestions] = useState<AISearchSuggestion[]>([]);
  const [isAISearching, setIsAISearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Simulação de busca com IA
  const performAISearch = async (query: string) => {
    if (!query.trim()) {
      setAiSuggestions([]);
      return;
    }

    setIsAISearching(true);
    
    // Simulação de delay da IA
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Gerar sugestões inteligentes baseadas na query
    const suggestions: AISearchSuggestion[] = [];
    
    // Buscar produtos similares
    const productMatches = products.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    
    if (productMatches.length > 0) {
      suggestions.push({
        query: `Produtos relacionados a "${query}"`,
        type: 'product',
        confidence: 0.9
      });
    }
    
    // Sugestões de categoria
    const categories = [...new Set(products.map(p => p.category))];
    const categoryMatch = categories.find(cat => 
      cat.toLowerCase().includes(query.toLowerCase())
    );
    
    if (categoryMatch) {
      suggestions.push({
        query: `Categoria: ${categoryMatch}`,
        type: 'category',
        confidence: 0.8
      });
    }
    
    // Sugestões de marca
    const brands = [...new Set(products.map(p => p.brand))];
    const brandMatch = brands.find(brand => 
      brand.toLowerCase().includes(query.toLowerCase())
    );
    
    if (brandMatch) {
      suggestions.push({
        query: `Marca: ${brandMatch}`,
        type: 'brand',
        confidence: 0.7
      });
    }
    
    setAiSuggestions(suggestions);
    setIsAISearching(false);
  };

  // Filtrar e ordenar produtos
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Filtro de busca
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Filtro de categoria
      const matchesCategory = !category || product.category === category;
      
      // Filtro de preço
      const matchesPrice = product.price >= filters.priceRange[0] && 
                          product.price <= filters.priceRange[1];
      
      // Filtro de marca
      const matchesBrand = filters.brands.length === 0 || 
                          filters.brands.includes(product.brand);
      
      // Filtro de avaliação
      const matchesRating = product.rating >= filters.rating;
      
      return matchesSearch && matchesCategory && matchesPrice && matchesBrand && matchesRating;
    });
    
    // Ordenação
    switch (sortBy) {
      case 'price':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      default:
        // Relevância (manter ordem original ou por popularidade)
        break;
    }
    
    return filtered;
  }, [products, searchQuery, category, filters, sortBy]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performAISearch(searchQuery);
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header com busca inteligente */}
      <div className="mb-8">
        <div className="relative mb-6">
          <div 
            className="relative"
            style={{
              background: designTokens.effects.glassmorphism.base.background,
              backdropFilter: designTokens.effects.glassmorphism.base.backdropFilter,
              borderRadius: designTokens.borderRadius.xl,
              border: designTokens.effects.glassmorphism.base.border
            }}
          >
            <div className="flex items-center p-4">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Busque por produtos, categorias ou especificações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-500"
              />
              {isAISearching && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Brain className="w-5 h-5 text-blue-500" />
                </motion.div>
              )}
              <Sparkles className="w-5 h-5 text-yellow-500 ml-2" />
            </div>
          </div>
          
          {/* Sugestões da IA */}
          <AnimatePresence>
            {aiSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 z-50"
                style={{
                  background: designTokens.effects.glassmorphism.intense.background,
                  backdropFilter: designTokens.effects.glassmorphism.intense.backdropFilter,
                  borderRadius: designTokens.borderRadius.lg,
                  border: designTokens.effects.glassmorphism.intense.border
                }}
              >
                <div className="p-4">
                  <div className="flex items-center mb-3">
                    <Zap className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Sugestões Inteligentes</span>
                  </div>
                  {aiSuggestions.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSearchQuery(suggestion.query)}
                      className="w-full text-left p-2 rounded-lg hover:bg-white/20 transition-colors mb-1 last:mb-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{suggestion.query}</span>
                        <div className="flex items-center">
                          <div 
                            className="w-2 h-2 rounded-full mr-2"
                            style={{
                              backgroundColor: suggestion.confidence > 0.8 ? '#10B981' : 
                                             suggestion.confidence > 0.6 ? '#F59E0B' : '#EF4444'
                            }}
                          />
                          <span className="text-xs text-gray-500">
                            {Math.round(suggestion.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Controles de visualização e filtros */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{
                background: showFilters ? designTokens.colors.primary.gradient : 'transparent',
                color: showFilters ? 'white' : designTokens.colors.text.primary,
                border: `1px solid ${designTokens.colors.primary[500]}`
              }}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white"
            >
              <option value="relevance">Relevância</option>
              <option value="price">Menor Preço</option>
              <option value="rating">Melhor Avaliação</option>
              <option value="newest">Mais Recentes</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            {enable3D && (
              <button
                onClick={() => setViewMode('3d')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === '3d' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex gap-6">
        {/* Filtros laterais */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex-shrink-0"
            >
              <ProductFilter3D
                products={products}
                filters={filters}
                onFiltersChange={setFilters}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Grid de produtos */}
        <div className="flex-1">
          <div className="mb-4">
            <span className="text-gray-600">
              {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <motion.div
            layout
            className={`grid gap-6 ${
              viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
              viewMode === 'list' ? 'grid-cols-1' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            <AnimatePresence>
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  {viewMode === '3d' && enable3D ? (
                    <ProductCard3D
                      product={product}
                      onSelect={() => {
                        setSelectedProduct(product);
                        onProductSelect?.(product);
                      }}
                      enableAR={enableAR}
                    />
                  ) : (
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      originalPrice={product.originalPrice}
                      image={product.image}
                      rating={product.rating}
                      reviews={product.reviews}
                      isNew={product.isNew}
                      isOnSale={product.isOnSale}
                      onClick={() => {
                        setSelectedProduct(product);
                        onProductSelect?.(product);
                      }}
                      layout={viewMode}
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          
          {filteredProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum produto encontrado</h3>
                <p>Tente ajustar os filtros ou buscar por outros termos.</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartCatalog;