'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sliders, 
  Star, 
  Tag, 
  Palette, 
  Ruler, 
  Zap, 
  Brain, 
  TrendingUp,
  Filter,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { designTokens } from '../../styles/design-tokens';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  brand: string;
  rating: number;
  specifications: Record<string, string>;
  tags: string[];
}

interface FilterState {
  priceRange: [number, number];
  brands: string[];
  categories: string[];
  rating: number;
  specifications: Record<string, string[]>;
}

interface ProductFilter3DProps {
  products: Product[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

interface AIFilterSuggestion {
  type: 'price' | 'brand' | 'category' | 'specification';
  label: string;
  value: any;
  confidence: number;
  reason: string;
}

const ProductFilter3D: React.FC<ProductFilter3DProps> = ({
  products,
  filters,
  onFiltersChange
}) => {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    brands: true,
    categories: false,
    rating: true,
    specifications: false,
    aiSuggestions: true
  });
  const [aiSuggestions, setAiSuggestions] = useState<AIFilterSuggestion[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Extrair dados únicos dos produtos
  const productData = useMemo(() => {
    const brands = [...new Set(products.map(p => p.brand))].sort();
    const categories = [...new Set(products.map(p => p.category))].sort();
    const priceRange: [number, number] = [
      Math.min(...products.map(p => p.price)),
      Math.max(...products.map(p => p.price))
    ];
    
    // Extrair especificações únicas
    const specifications: Record<string, string[]> = {};
    products.forEach(product => {
      Object.entries(product.specifications).forEach(([key, value]) => {
        if (!specifications[key]) {
          specifications[key] = [];
        }
        if (!specifications[key].includes(value)) {
          specifications[key].push(value);
        }
      });
    });
    
    return { brands, categories, priceRange, specifications };
  }, [products]);

  // Gerar sugestões inteligentes baseadas em IA
  const generateAISuggestions = async () => {
    setIsGeneratingAI(true);
    
    // Simulação de processamento IA
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const suggestions: AIFilterSuggestion[] = [];
    
    // Análise de tendências de preço
    const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
    const popularPriceRange = Math.round(avgPrice * 0.8);
    
    suggestions.push({
      type: 'price',
      label: `Faixa Popular: R$ ${popularPriceRange} - R$ ${Math.round(avgPrice * 1.2)}`,
      value: [popularPriceRange, Math.round(avgPrice * 1.2)],
      confidence: 0.85,
      reason: 'Baseado na análise de vendas e preferências dos usuários'
    });
    
    // Marcas mais bem avaliadas
    const brandRatings = productData.brands.map(brand => {
      const brandProducts = products.filter(p => p.brand === brand);
      const avgRating = brandProducts.reduce((sum, p) => sum + p.rating, 0) / brandProducts.length;
      return { brand, rating: avgRating, count: brandProducts.length };
    }).sort((a, b) => b.rating - a.rating);
    
    if (brandRatings.length > 0) {
      suggestions.push({
        type: 'brand',
        label: `Marca Recomendada: ${brandRatings[0].brand}`,
        value: brandRatings[0].brand,
        confidence: 0.9,
        reason: `Melhor avaliação média (${brandRatings[0].rating.toFixed(1)} estrelas)`
      });
    }
    
    // Categoria em alta
    const categoryPopularity = productData.categories.map(category => {
      const categoryProducts = products.filter(p => p.category === category);
      const avgRating = categoryProducts.reduce((sum, p) => sum + p.rating, 0) / categoryProducts.length;
      return { category, rating: avgRating, count: categoryProducts.length };
    }).sort((a, b) => b.count - a.count);
    
    if (categoryPopularity.length > 0) {
      suggestions.push({
        type: 'category',
        label: `Categoria em Alta: ${categoryPopularity[0].category}`,
        value: categoryPopularity[0].category,
        confidence: 0.75,
        reason: `${categoryPopularity[0].count} produtos disponíveis`
      });
    }
    
    // Especificação recomendada
    const specKeys = Object.keys(productData.specifications);
    if (specKeys.length > 0) {
      // Usar primeira especificação disponível para consistência
      const firstSpec = specKeys[0];
      const specValues = productData.specifications[firstSpec];
      const recommendedValue = specValues[0];
      
      suggestions.push({
        type: 'specification',
        label: `${firstSpec}: ${recommendedValue}`,
        value: { [firstSpec]: [recommendedValue] },
        confidence: 0.7,
        reason: 'Especificação popular entre os usuários'
      });
    }
    
    setAiSuggestions(suggestions);
    setIsGeneratingAI(false);
  };

  useEffect(() => {
    generateAISuggestions();
  }, [products]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const applySuggestion = (suggestion: AIFilterSuggestion) => {
    switch (suggestion.type) {
      case 'price':
        updateFilters({ priceRange: suggestion.value });
        break;
      case 'brand':
        updateFilters({ brands: [suggestion.value] });
        break;
      case 'category':
        updateFilters({ categories: [suggestion.value] });
        break;
      case 'specification':
        updateFilters({ specifications: { ...filters.specifications, ...suggestion.value } });
        break;
    }
  };

  const clearAllFilters = () => {
    updateFilters({
      priceRange: productData.priceRange,
      brands: [],
      categories: [],
      rating: 0,
      specifications: {}
    });
  };

  const FilterSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    sectionKey: keyof typeof expandedSections;
    children: React.ReactNode;
  }> = ({ title, icon, sectionKey, children }) => (
    <div 
      className="mb-6"
      style={{
        background: designTokens.effects.glassmorphism.subtle.background,
        backdropFilter: designTokens.effects.glassmorphism.subtle.backdropFilter,
        borderRadius: designTokens.borderRadius.lg,
        border: designTokens.effects.glassmorphism.subtle.border
      }}
    >
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium text-gray-800">{title}</span>
        </div>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-600" />
        )}
      </button>
      
      <AnimatePresence>
        {expandedSections[sectionKey] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="w-80 h-fit">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-800">Filtros Inteligentes</h3>
        </div>
        <button
          onClick={clearAllFilters}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          Limpar Tudo
        </button>
      </div>

      {/* Sugestões da IA */}
      <FilterSection
        title="Sugestões IA"
        icon={<Brain className="w-4 h-4 text-purple-600" />}
        sectionKey="aiSuggestions"
      >
        {isGeneratingAI ? (
          <div className="flex items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-6 h-6 text-purple-500" />
            </motion.div>
            <span className="ml-2 text-sm text-gray-600">Analisando produtos...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {aiSuggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100/50 transition-colors cursor-pointer"
                onClick={() => applySuggestion(suggestion)}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800">
                    {suggestion.label}
                  </span>
                  <div className="flex items-center">
                    <div 
                      className="w-2 h-2 rounded-full mr-1"
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
                <p className="text-xs text-gray-600">{suggestion.reason}</p>
              </motion.div>
            ))}
            
            <button
              onClick={generateAISuggestions}
              className="w-full mt-3 py-2 px-4 text-sm text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Gerar Novas Sugestões
            </button>
          </div>
        )}
      </FilterSection>

      {/* Filtro de Preço */}
      <FilterSection
        title="Faixa de Preço"
        icon={<Tag className="w-4 h-4 text-green-600" />}
        sectionKey="price"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>R$ {filters.priceRange[0]}</span>
            <span>R$ {filters.priceRange[1]}</span>
          </div>
          
          <div className="relative">
            <input
              type="range"
              min={productData.priceRange[0]}
              max={productData.priceRange[1]}
              value={filters.priceRange[0]}
              onChange={(e) => updateFilters({
                priceRange: [Number(e.target.value), filters.priceRange[1]]
              })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <input
              type="range"
              min={productData.priceRange[0]}
              max={productData.priceRange[1]}
              value={filters.priceRange[1]}
              onChange={(e) => updateFilters({
                priceRange: [filters.priceRange[0], Number(e.target.value)]
              })}
              className="absolute top-0 w-full h-2 bg-transparent appearance-none cursor-pointer"
            />
          </div>
          
          <div className="flex gap-2">
            <input
              type="number"
              value={filters.priceRange[0]}
              onChange={(e) => updateFilters({
                priceRange: [Number(e.target.value), filters.priceRange[1]]
              })}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
              placeholder="Mín"
            />
            <input
              type="number"
              value={filters.priceRange[1]}
              onChange={(e) => updateFilters({
                priceRange: [filters.priceRange[0], Number(e.target.value)]
              })}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
              placeholder="Máx"
            />
          </div>
        </div>
      </FilterSection>

      {/* Filtro de Marcas */}
      <FilterSection
        title="Marcas"
        icon={<Palette className="w-4 h-4 text-blue-600" />}
        sectionKey="brands"
      >
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {productData.brands.map(brand => (
            <label key={brand} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={filters.brands.includes(brand)}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateFilters({ brands: [...filters.brands, brand] });
                  } else {
                    updateFilters({ brands: filters.brands.filter(b => b !== brand) });
                  }
                }}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">{brand}</span>
              <span className="text-xs text-gray-500 ml-auto">
                ({products.filter(p => p.brand === brand).length})
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Filtro de Avaliação */}
      <FilterSection
        title="Avaliação Mínima"
        icon={<Star className="w-4 h-4 text-yellow-600" />}
        sectionKey="rating"
      >
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map(rating => (
            <label key={rating} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="radio"
                name="rating"
                checked={filters.rating === rating}
                onChange={() => updateFilters({ rating })}
                className="border-gray-300"
              />
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-700">e acima</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Filtro de Especificações */}
      <FilterSection
        title="Especificações"
        icon={<Ruler className="w-4 h-4 text-indigo-600" />}
        sectionKey="specifications"
      >
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {Object.entries(productData.specifications).map(([specKey, specValues]) => (
            <div key={specKey}>
              <h4 className="text-sm font-medium text-gray-700 mb-2">{specKey}</h4>
              <div className="space-y-1">
                {specValues.map(value => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={filters.specifications[specKey]?.includes(value) || false}
                      onChange={(e) => {
                        const currentSpecs = filters.specifications[specKey] || [];
                        if (e.target.checked) {
                          updateFilters({
                            specifications: {
                              ...filters.specifications,
                              [specKey]: [...currentSpecs, value]
                            }
                          });
                        } else {
                          updateFilters({
                            specifications: {
                              ...filters.specifications,
                              [specKey]: currentSpecs.filter(v => v !== value)
                            }
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{value}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </FilterSection>
    </div>
  );
};

export default ProductFilter3D;