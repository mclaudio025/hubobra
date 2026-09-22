'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Check, Minus } from 'lucide-react';
import { useProducts } from '../hooks/useApi';
import { useToast } from './ui/Toaster';

interface Product {
  id: string;
  name: string;
  price: number;
  brand: string;
  sku: string;
  specifications: string;
  images: Array<{
    url: string;
    alt: string;
  }>;
  category: {
    name: string;
  };
}

interface ProductComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  initialProducts?: Product[];
}

export default function ProductComparison({ isOpen, onClose, initialProducts = [] }: ProductComparisonProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const productsApi = useProducts();
  const { addToast } = useToast();

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchProducts();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getProducts(1, 10, searchQuery);
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = (product: Product) => {
    if (products.length >= 4) {
      addToast({
        type: 'error',
        title: 'Limite atingido',
        message: 'Você pode comparar no máximo 4 produtos'
      });
      return;
    }

    if (products.find(p => p.id === product.id)) {
      addToast({
        type: 'error',
        title: 'Produto já adicionado',
        message: 'Este produto já está na comparação'
      });
      return;
    }

    setProducts(prev => [...prev, product]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const parseSpecifications = (specs: string) => {
    if (!specs) return {};
    const specObj: Record<string, string> = {};
    specs.split('\n').forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        specObj[key.trim()] = value.trim();
      }
    });
    return specObj;
  };

  const getAllSpecKeys = () => {
    const allKeys = new Set<string>();
    products.forEach(product => {
      const specs = parseSpecifications(product.specifications);
      Object.keys(specs).forEach(key => allKeys.add(key));
    });
    return Array.from(allKeys);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Comparar Produtos</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Add Product Section */}
          {products.length < 4 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Adicionar Produto ({products.length}/4)
              </h3>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar produtos para comparar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-10">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addProduct(product)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left"
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {product.images.length > 0 ? (
                            <img
                              src={product.images[0].url}
                              alt={product.images[0].alt}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Plus className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 line-clamp-1">{product.name}</h4>
                          <p className="text-sm text-gray-600">{product.brand}</p>
                          <p className="text-sm font-semibold text-green-600">
                            {formatCurrency(product.price)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comparison Table */}
          {products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-4 border-b border-gray-200 w-48">
                      <span className="text-sm font-medium text-gray-600">Características</span>
                    </th>
                    {products.map((product) => (
                      <th key={product.id} className="p-4 border-b border-gray-200 min-w-64">
                        <div className="relative">
                          <button
                            onClick={() => removeProduct(product.id)}
                            className="absolute top-0 right-0 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          
                          <div className="pr-8">
                            <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden mx-auto mb-3">
                              {product.images.length > 0 ? (
                                <img
                                  src={product.images[0].url}
                                  alt={product.images[0].alt}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Plus className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <h3 className="font-semibold text-gray-900 text-center mb-2 line-clamp-2">
                              {product.name}
                            </h3>
                            <p className="text-center text-sm text-gray-600 mb-2">{product.brand}</p>
                            <p className="text-center text-lg font-bold text-green-600">
                              {formatCurrency(product.price)}
                            </p>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                
                <tbody>
                  {/* Basic Info */}
                  <tr className="border-b border-gray-100">
                    <td className="p-4 font-medium text-gray-900">Categoria</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center">
                        {product.category.name}
                      </td>
                    ))}
                  </tr>
                  
                  <tr className="border-b border-gray-100">
                    <td className="p-4 font-medium text-gray-900">SKU</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center text-sm text-gray-600">
                        {product.sku}
                      </td>
                    ))}
                  </tr>

                  {/* Specifications */}
                  {getAllSpecKeys().map((specKey) => (
                    <tr key={specKey} className="border-b border-gray-100">
                      <td className="p-4 font-medium text-gray-900">{specKey}</td>
                      {products.map((product) => {
                        const specs = parseSpecifications(product.specifications);
                        const value = specs[specKey];
                        return (
                          <td key={product.id} className="p-4 text-center">
                            {value ? (
                              <span className="text-gray-900">{value}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Actions */}
                  <tr>
                    <td className="p-4 font-medium text-gray-900">Ações</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4">
                        <div className="space-y-2">
                          <button className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition text-sm">
                            Adicionar ao Carrinho
                          </button>
                          <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 transition text-sm">
                            Ver Detalhes
                          </button>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum produto para comparar
              </h3>
              <p className="text-gray-600">
                Use a busca acima para adicionar produtos à comparação
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {products.length > 0 && `${products.length} produto(s) selecionado(s)`}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setProducts([])}
                disabled={products.length === 0}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition disabled:opacity-50"
              >
                Limpar Tudo
              </button>
              <button
                onClick={onClose}
                className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
