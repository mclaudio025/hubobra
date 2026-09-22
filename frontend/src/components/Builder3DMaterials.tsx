'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Search,
  Filter,
  Star,
  ShoppingCart,
  Palette,
  Layers,
  Ruler,
  DollarSign,
  Info,
  Plus,
  Minus,
  Calculator,
  Download,
  Heart,
  Eye,
  Grid3X3
} from 'lucide-react';

interface Material {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  color: string;
  texture: string;
  price: number;
  unit: string;
  coverage: number; // m² por unidade
  thickness?: number; // mm
  weight?: number; // kg/m²
  durability: number; // 1-5 estrelas
  waterproof: boolean;
  fireResistant: boolean;
  ecoFriendly: boolean;
  image: string;
  description: string;
  specifications: Record<string, any>;
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviews: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  weight: number;
  material: string;
  color: string;
  style: string;
  image: string;
  description: string;
  specifications: Record<string, any>;
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviews: number;
  installation: {
    difficulty: 'easy' | 'medium' | 'hard';
    timeRequired: number; // horas
    toolsRequired: string[];
    instructions: string;
  };
}

interface CalculationItem {
  id: string;
  type: 'material' | 'product';
  item: Material | Product;
  quantity: number;
  area?: number;
  waste: number; // percentual
  totalCost: number;
}

interface Builder3DMaterialsProps {
  onMaterialSelect?: (material: Material) => void;
  onProductSelect?: (product: Product) => void;
  onCalculationUpdate?: (items: CalculationItem[]) => void;
  className?: string;
}

const Builder3DMaterials: React.FC<Builder3DMaterialsProps> = ({
  onMaterialSelect,
  onProductSelect,
  onCalculationUpdate,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating'>('name');
  const [calculationItems, setCalculationItems] = useState<CalculationItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Mock data - em produção viria de uma API
  const materials: Material[] = [
    {
      id: 'mat-001',
      name: 'Porcelanato Polido Carrara',
      category: 'revestimentos',
      subcategory: 'porcelanato',
      brand: 'Portobello',
      color: '#f8f8ff',
      texture: 'polido',
      price: 89.90,
      unit: 'm²',
      coverage: 1,
      thickness: 10,
      weight: 23,
      durability: 5,
      waterproof: true,
      fireResistant: true,
      ecoFriendly: false,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=white%20marble%20porcelain%20tile%20texture%20carrara%20pattern&image_size=square',
      description: 'Porcelanato polido com padrão Carrara, ideal para ambientes sofisticados.',
      specifications: {
        'Absorção de água': '< 0,5%',
        'Resistência ao gelo': 'Sim',
        'Resistência química': 'Classe A',
        'Formato': '60x60cm'
      },
      inStock: true,
      stockQuantity: 150,
      rating: 4.8,
      reviews: 234
    },
    {
      id: 'mat-002',
      name: 'Tinta Acrílica Premium Branca',
      category: 'tintas',
      subcategory: 'acrilica',
      brand: 'Suvinil',
      color: '#ffffff',
      texture: 'fosco',
      price: 45.90,
      unit: 'L',
      coverage: 12,
      durability: 4,
      waterproof: false,
      fireResistant: false,
      ecoFriendly: true,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=white%20acrylic%20paint%20can%20premium%20quality&image_size=square',
      description: 'Tinta acrílica premium com excelente cobertura e durabilidade.',
      specifications: {
        'Rendimento': '12 m²/L',
        'Secagem': '30 minutos',
        'Repintura': '4 horas',
        'Diluição': 'Água'
      },
      inStock: true,
      stockQuantity: 89,
      rating: 4.6,
      reviews: 156
    },
    {
      id: 'mat-003',
      name: 'Laminado Melamínico Carvalho',
      category: 'madeiras',
      subcategory: 'laminado',
      brand: 'Duratex',
      color: '#8b4513',
      texture: 'madeira',
      price: 125.00,
      unit: 'm²',
      coverage: 1,
      thickness: 15,
      weight: 12,
      durability: 4,
      waterproof: false,
      fireResistant: false,
      ecoFriendly: true,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=oak%20wood%20laminate%20flooring%20texture%20brown&image_size=square',
      description: 'Laminado melamínico com padrão carvalho, resistente e elegante.',
      specifications: {
        'Espessura': '15mm',
        'Classe de uso': 'AC4',
        'Garantia': '15 anos',
        'Instalação': 'Click'
      },
      inStock: true,
      stockQuantity: 67,
      rating: 4.7,
      reviews: 89
    }
  ];

  const products: Product[] = [
    {
      id: 'prod-001',
      name: 'Vaso Sanitário com Caixa Acoplada',
      category: 'sanitarios',
      subcategory: 'vaso',
      brand: 'Deca',
      price: 289.90,
      dimensions: { width: 36, height: 78, depth: 65 },
      weight: 35,
      material: 'Louça',
      color: 'Branco',
      style: 'Moderno',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20white%20toilet%20with%20tank%20bathroom%20fixture&image_size=square',
      description: 'Vaso sanitário moderno com caixa acoplada, design elegante e funcional.',
      specifications: {
        'Consumo de água': '3/6 litros',
        'Altura do assento': '40cm',
        'Saída': 'Horizontal',
        'Garantia': '5 anos'
      },
      inStock: true,
      stockQuantity: 25,
      rating: 4.5,
      reviews: 78,
      installation: {
        difficulty: 'medium',
        timeRequired: 2,
        toolsRequired: ['Furadeira', 'Chaves', 'Nível'],
        instructions: 'Instalação requer conhecimento básico de hidráulica.'
      }
    },
    {
      id: 'prod-002',
      name: 'Pia de Cozinha Inox Dupla',
      category: 'cozinha',
      subcategory: 'pia',
      brand: 'Tramontina',
      price: 189.90,
      dimensions: { width: 120, height: 20, depth: 50 },
      weight: 8,
      material: 'Aço Inox',
      color: 'Inox',
      style: 'Industrial',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=stainless%20steel%20double%20kitchen%20sink%20modern&image_size=square',
      description: 'Pia dupla em aço inox, resistente e fácil de limpar.',
      specifications: {
        'Material': 'Aço Inox 304',
        'Espessura': '1.2mm',
        'Cubas': '2 cubas',
        'Escorredor': 'Sim'
      },
      inStock: true,
      stockQuantity: 15,
      rating: 4.4,
      reviews: 45,
      installation: {
        difficulty: 'easy',
        timeRequired: 1,
        toolsRequired: ['Furadeira', 'Serra copo'],
        instructions: 'Instalação simples, requer apenas corte no tampo.'
      }
    }
  ];

  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'revestimentos', name: 'Revestimentos' },
    { id: 'tintas', name: 'Tintas' },
    { id: 'madeiras', name: 'Madeiras' },
    { id: 'sanitarios', name: 'Sanitários' },
    { id: 'cozinha', name: 'Cozinha' },
    { id: 'eletricos', name: 'Elétricos' },
    { id: 'ferragens', name: 'Ferragens' }
  ];

  // Filtrar materiais
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    const matchesSubcategory = selectedSubcategory === 'all' || material.subcategory === selectedSubcategory;
    const matchesPrice = material.price >= priceRange.min && material.price <= priceRange.max;
    const matchesStock = !showOnlyInStock || material.inStock;
    
    return matchesSearch && matchesCategory && matchesSubcategory && matchesPrice && matchesStock;
  });

  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max;
    const matchesStock = !showOnlyInStock || product.inStock;
    
    return matchesSearch && matchesCategory && matchesPrice && matchesStock;
  });

  // Adicionar item ao cálculo
  const addToCalculation = useCallback((item: Material | Product, type: 'material' | 'product', quantity: number = 1, area?: number) => {
    const waste = type === 'material' ? 10 : 0; // 10% de desperdício para materiais
    const finalQuantity = type === 'material' && area ? 
      Math.ceil((area * (1 + waste / 100)) / (item as Material).coverage) : 
      quantity;
    
    const totalCost = finalQuantity * item.price;
    
    const calculationItem: CalculationItem = {
      id: `calc-${item.id}-${Date.now()}`,
      type,
      item,
      quantity: finalQuantity,
      area,
      waste,
      totalCost
    };
    
    setCalculationItems(prev => {
      const updated = [...prev, calculationItem];
      onCalculationUpdate?.(updated);
      return updated;
    });
  }, [onCalculationUpdate]);

  // Remover item do cálculo
  const removeFromCalculation = useCallback((id: string) => {
    setCalculationItems(prev => {
      const updated = prev.filter(item => item.id !== id);
      onCalculationUpdate?.(updated);
      return updated;
    });
  }, [onCalculationUpdate]);

  // Toggle favorito
  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? 
        prev.filter(fav => fav !== id) : 
        [...prev, id]
    );
  }, []);

  // Calcular total
  const totalCost = calculationItems.reduce((sum, item) => sum + item.totalCost, 0);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filtros e Busca */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar e Filtrar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Buscar materiais e produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Categoria</Label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-8 px-2 border rounded text-sm"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label className="text-xs">Ordenar por</Label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full h-8 px-2 border rounded text-sm"
              >
                <option value="name">Nome</option>
                <option value="price">Preço</option>
                <option value="rating">Avaliação</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="inStock"
              checked={showOnlyInStock}
              onChange={(e) => setShowOnlyInStock(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="inStock" className="text-sm">Apenas em estoque</Label>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Materiais e Produtos */}
      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Materiais ({filteredMaterials.length})
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produtos ({filteredProducts.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="materials" className="mt-4">
          <ScrollArea className="h-96">
            <div className="grid gap-3">
              {filteredMaterials.map((material) => (
                <Card key={material.id} className="p-3">
                  <div className="flex gap-3">
                    <img
                      src={material.image}
                      alt={material.name}
                      className="w-16 h-16 object-cover rounded border"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{material.name}</h4>
                          <p className="text-xs text-gray-600">{material.brand}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(material.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Heart 
                            className={`h-3 w-3 ${
                              favorites.includes(material.id) ? 'fill-red-500 text-red-500' : ''
                            }`} 
                          />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {material.category}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{material.rating}</span>
                        </div>
                        {!material.inStock && (
                          <Badge variant="destructive" className="text-xs">Fora de estoque</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">R$ {material.price.toFixed(2)}</span>
                          <span className="text-xs text-gray-500">/{material.unit}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onMaterialSelect?.(material)}
                            className="h-6 px-2 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => addToCalculation(material, 'material')}
                            disabled={!material.inStock}
                            className="h-6 px-2 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="products" className="mt-4">
          <ScrollArea className="h-96">
            <div className="grid gap-3">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="p-3">
                  <div className="flex gap-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded border"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{product.name}</h4>
                          <p className="text-xs text-gray-600">{product.brand}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(product.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Heart 
                            className={`h-3 w-3 ${
                              favorites.includes(product.id) ? 'fill-red-500 text-red-500' : ''
                            }`} 
                          />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{product.rating}</span>
                        </div>
                        {!product.inStock && (
                          <Badge variant="destructive" className="text-xs">Fora de estoque</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">R$ {product.price.toFixed(2)}</span>
                          <span className="text-xs text-gray-500">unidade</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onProductSelect?.(product)}
                            className="h-6 px-2 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => addToCalculation(product, 'product')}
                            disabled={!product.inStock}
                            className="h-6 px-2 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Calculadora de Materiais */}
      {calculationItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calculadora de Materiais ({calculationItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32 mb-3">
              <div className="space-y-2">
                {calculationItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 border rounded text-sm"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.item.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>Qtd: {item.quantity}</span>
                        {item.area && <span>Área: {item.area}m²</span>}
                        {item.waste > 0 && <span>Desperdício: {item.waste}%</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">R$ {item.totalCost.toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCalculation(item.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <Separator className="my-3" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                <span className="font-bold text-lg">Total: R$ {totalCost.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Exportar
                </Button>
                <Button variant="default" size="sm">
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Orçar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Builder3DMaterials;