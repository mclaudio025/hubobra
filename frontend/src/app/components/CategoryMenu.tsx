'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Grid3X3, AlertCircle, RefreshCw } from 'lucide-react';
import { useCategories } from '../hooks/useApi';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  _count: {
    products: number;
  };
}

// Categorias padrão como fallback
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'default-1',
    name: 'Materiais de Construção',
    slug: 'materiais-construcao',
    description: 'Materiais básicos para construção',
    _count: { products: 0 }
  },
  {
    id: 'default-2',
    name: 'Ferramentas',
    slug: 'ferramentas',
    description: 'Ferramentas para construção e reforma',
    _count: { products: 0 }
  },
  {
    id: 'default-3',
    name: 'Elétrica',
    slug: 'eletrica',
    description: 'Materiais elétricos',
    _count: { products: 0 }
  },
  {
    id: 'default-4',
    name: 'Hidráulica',
    slug: 'hidraulica',
    description: 'Materiais hidráulicos',
    _count: { products: 0 }
  }
];

export default function CategoryMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const categoriesApi = useCategories();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async (isRetry = false) => {
    try {
      if (isRetry) {
        setIsRetrying(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await categoriesApi.getCategories(true);
      setCategories(response || []);
      setRetryCount(0);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar categorias');
      
      // Retry automático até 3 tentativas
      if (retryCount < 3 && !isRetry) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadCategories(true);
        }, 2000 * (retryCount + 1)); // Delay progressivo: 2s, 4s, 6s
      } else {
        // Usar categorias padrão como fallback
        setCategories(DEFAULT_CATEGORIES);
      }
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    loadCategories();
  };

  return (
    <div className="bg-orange-600 text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center">
          {/* Botão Todas as Categorias */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 bg-orange-700 hover:bg-orange-800 px-4 py-3 transition-colors"
            >
              <Grid3X3 className="h-5 w-5" />
              <span className="font-medium">Todas as Categorias</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown de Categorias */}
            {isOpen && (
              <div className="absolute top-full left-0 w-80 bg-white text-gray-900 shadow-xl z-50 rounded-b-lg">
                <div className="max-h-96 overflow-y-auto">
                  {loading || isRetrying ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">
                        {isRetrying ? `Tentando reconectar... (${retryCount + 1}/3)` : 'Carregando...'}
                      </p>
                    </div>
                  ) : error && categories.length === 0 ? (
                    <div className="p-4 text-center">
                      <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-red-600 mb-3">Erro ao carregar categorias</p>
                      <button
                        onClick={handleRetry}
                        className="flex items-center gap-2 mx-auto px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Tentar Novamente
                      </button>
                    </div>
                  ) : (
                    <div className="py-2">
                      {error && categories === DEFAULT_CATEGORIES && (
                        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
                          <div className="flex items-center gap-2 text-yellow-700">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-xs">Modo offline - Categorias limitadas</span>
                          </div>
                        </div>
                      )}
                      {categories.map((category) => (
                        <Link
                          key={category.id}
                          href={`/categoria/${category.slug}`}
                          className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium text-gray-900">{category.name}</h3>
                              {category.description && (
                                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {category._count.products}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Menu Horizontal de Categorias Principais */}
          <nav className="flex-1 ml-8">
            <ul className="flex items-center space-x-8">
              {/* Calculadora de Materiais */}
              <li>
                <Link
                  href="/calculadora"
                  className="text-white hover:text-orange-200 py-3 block transition-colors text-sm font-medium flex items-center gap-2"
                >
                  🧮 Calculadora
                </Link>
              </li>
              
              {categories.slice(0, 5).map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/categoria/${category.slug}`}
                    className="text-white hover:text-orange-200 py-3 block transition-colors text-sm font-medium"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              {categories.length > 5 && (
                <li>
                  <button
                    onClick={() => setIsOpen(true)}
                    className="text-white hover:text-orange-200 py-3 block transition-colors text-sm font-medium"
                  >
                    Ver Mais...
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>

      {/* Overlay para fechar dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
