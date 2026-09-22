'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Grid3X3 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function MobileCategoryNav() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Categorias mockadas - em produção, buscar da API
  const mockCategories: Category[] = [
    { id: '1', name: 'Ferramentas', slug: 'ferramentas', description: 'Ferramentas manuais e elétricas' },
    { id: '2', name: 'Materiais de Construção', slug: 'materiais-construcao', description: 'Cimento, areia, brita' },
    { id: '3', name: 'Elétricos', slug: 'eletricos', description: 'Fios, tomadas, disjuntores' },
    { id: '4', name: 'Hidráulicos', slug: 'hidraulicos', description: 'Tubos, conexões, registros' },
    { id: '5', name: 'Tintas e Vernizes', slug: 'tintas-vernizes', description: 'Tintas, pincéis, rolos' },
    { id: '6', name: 'Parafusos e Fixadores', slug: 'parafusos-fixadores', description: 'Parafusos, buchas, pregos' },
    { id: '7', name: 'Segurança', slug: 'seguranca', description: 'EPIs, equipamentos de proteção' },
    { id: '8', name: 'Jardim e Limpeza', slug: 'jardim-limpeza', description: 'Ferramentas de jardim, produtos de limpeza' }
  ];

  useEffect(() => {
    setCategories(mockCategories);
  }, []);

  return (
    <>
      {/* Category Button - Visible only on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 text-gray-600 hover:text-orange-500 transition-colors"
        aria-label="Ver categorias"
      >
        <Grid3X3 className="h-6 w-6" />
      </button>

      {/* Mobile Category Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Category Panel */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Categorias</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-1 bg-gray-300 rounded-full"
                  aria-label="Fechar categorias"
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">Encontre produtos por categoria</p>
            </div>

            {/* Categories List */}
            <div className="overflow-y-auto max-h-[calc(80vh-100px)]">
              <div className="p-4 space-y-2">
                {/* Ver Todos os Produtos */}
                <Link
                  href="/produtos"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-orange-900">Todos os Produtos</h4>
                    <p className="text-sm text-orange-700">Ver catálogo completo</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-orange-600" />
                </Link>

                {/* Categories */}
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categoria/${category.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </Link>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="p-4 border-t bg-gray-50">
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/ofertas"
                    onClick={() => setIsOpen(false)}
                    className="flex flex-col items-center p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <span className="text-2xl mb-1">🔥</span>
                    <span className="text-sm font-medium text-red-900">Ofertas</span>
                  </Link>
                  
                  <Link
                    href="/lancamentos"
                    onClick={() => setIsOpen(false)}
                    className="flex flex-col items-center p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <span className="text-2xl mb-1">✨</span>
                    <span className="text-sm font-medium text-blue-900">Novidades</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
