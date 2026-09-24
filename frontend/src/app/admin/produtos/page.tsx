'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Eye, 
  Upload, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb';
import { useApi, useProducts } from '../../hooks/useApi';
import { getImageUrl } from '../../utils/imageUrl';

interface Product {
  id: string;
  name: string;
  price: number;
  category: any;
  brand: string;
  stock: number;
  sku: string;
  active: boolean;
  images: Array<{ id?: string; url: string; alt?: string; order?: number }> | string[];
  createdAt: string;
}

const getProductImage = (images: any): string => {
  if (!images || (Array.isArray(images) && images.length === 0)) {
    return '/placeholder-product.svg';
  }
  const first = Array.isArray(images) ? images[0] : images;
  if (typeof first === 'string') return getImageUrl(first);
  if (first && typeof first === 'object' && first.url) return getImageUrl(first.url);
  return '/placeholder-product.svg';
};

export default function AdminProdutos() {
  const { apiCall } = useApi();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, categoryFilter, statusFilter]);

  const fetchCategories = async () => {
    try {
      const data = await apiCall('/categories');
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      if (searchTerm && searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (categoryFilter) {
        params.append('categoryId', categoryFilter);
      }
      if (statusFilter === 'active') {
        params.append('active', 'true');
      } else if (statusFilter === 'inactive') {
        params.append('active', 'false');
      }
      
      const data = await apiCall(`/products?${params.toString()}`, { requireAuth: true });
      
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      setTotalProducts(data.total || 0);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await apiCall(`/products/${id}`, { 
          method: 'DELETE',
          requireAuth: true 
        });
        
        setProducts(products.filter(product => product.id !== id));
        alert('Produto excluído com sucesso!');
      } catch (error: any) {
        console.error('Erro ao excluir produto:', error);
        const errorMessage = error.message || 'Erro ao excluir produto';
        alert(errorMessage);
      }
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const product = products.find(p => p.id === id);
      if (!product) return;

      await apiCall(`/products/${id}`, {
        method: 'PATCH',
        body: { active: !product.active },
        requireAuth: true
      });
      
      setProducts(products.map(p => 
        p.id === id 
          ? { ...p, active: !p.active }
          : p
      ));
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status do produto');
    }
  };

  const filteredProducts = products;



  const { bulkFetchMissingImages } = useProducts();
  const [isBulkFetching, setIsBulkFetching] = useState(false);
  const [bulkFetchMessage, setBulkFetchMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const handleBulkFetchImages = async () => {
    if (!confirm('Deseja iniciar a busca automática de fotos na internet para os produtos que estão sem imagem?')) {
      return;
    }

    try {
      setIsBulkFetching(true);
      setBulkFetchMessage({
        type: 'info',
        text: 'Buscando fotos oficiais na internet e otimizando imagens em segundo plano...'
      });

      const res = await bulkFetchMissingImages({ limit: 50 });

      if (res) {
        setBulkFetchMessage({
          type: 'success',
          text: `Varredura concluída! ${res.success} produto(s) atualizado(s) com fotos oficiais.`
        });
        fetchProducts();
      }
    } catch (err: any) {
      setBulkFetchMessage({
        type: 'error',
        text: err.message || 'Erro ao realizar varredura de imagens.'
      });
    } finally {
      setIsBulkFetching(false);
    }
  };

  return (
    <div>
      <AdminBreadcrumb />
      
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Produtos</h1>
            <p className="text-xs text-gray-500 mt-1">Gerencie catálogo, preços, estoque e fotos</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleBulkFetchImages}
              disabled={isBulkFetching}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
              title="Busca fotos automaticamente para produtos sem imagem"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              {isBulkFetching ? 'Buscando fotos...' : 'Auto-Preencher Fotos'}
            </button>
            <Link
              href="/admin/produtos/importar"
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition"
            >
              <Upload className="h-4 w-4" />
              Importar Planilha
            </Link>
            <Link
              href="/admin/produtos/novo"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition"
            >
              <Plus className="h-4 w-4" />
              Novo Produto
            </Link>
          </div>
        </div>

        {bulkFetchMessage && (
          <div className={`mb-6 p-4 rounded-xl text-sm flex items-center justify-between ${
            bulkFetchMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : bulkFetchMessage.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            <span>{bulkFetchMessage.text}</span>
            <button onClick={() => setBulkFetchMessage(null)} className="text-gray-400 hover:text-gray-600 ml-4 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nome ou SKU..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas as categorias</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                  setStatusFilter('');
                  setCurrentPage(1);
                }}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Produtos */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando produtos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Nenhum produto encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preço
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estoque
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12 bg-gray-50 rounded-lg p-1 border border-gray-100 flex items-center justify-center">
                              <img
                                className="h-10 w-10 rounded object-contain"
                                src={getProductImage(product.images)}
                                alt={product.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                SKU: {product.sku}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {typeof product.category === 'object' ? product.category?.name || 'Sem categoria' : product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          R$ {product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.stock > 10 
                              ? 'bg-green-100 text-green-800' 
                              : product.stock > 0 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {product.stock} unidades
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleStatus(product.id)}
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              product.active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.active ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <Link
                              href={`/admin/produtos/${product.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/admin/produtos/${product.id}/editar`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação Completa Dinâmica */}
              {totalPages > 1 && (
                <div className="bg-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      Mostrando <span className="font-semibold text-gray-900">{Math.min((currentPage - 1) * itemsPerPage + 1, totalProducts)}</span> até{' '}
                      <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, totalProducts)}</span> de{' '}
                      <span className="font-semibold text-gray-900">{totalProducts}</span> produtos — Página{' '}
                      <span className="font-semibold text-blue-600">{currentPage}</span> de{' '}
                      <span className="font-semibold">{totalPages}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    {/* Botão Primeira Página */}
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      title="Primeira Página"
                      className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </button>

                    {/* Botão Anterior */}
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      title="Página Anterior"
                      className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Anterior</span>
                    </button>

                    {/* Páginas Numeradas Dinâmicas */}
                    <div className="flex items-center gap-1 mx-1">
                      {(() => {
                        const getPages = () => {
                          if (totalPages <= 7) {
                            return Array.from({ length: totalPages }, (_, i) => i + 1);
                          }
                          if (currentPage <= 4) {
                            return [1, 2, 3, 4, 5, '...', totalPages];
                          }
                          if (currentPage >= totalPages - 3) {
                            return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                          }
                          return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
                        };

                        return getPages().map((p, idx) => {
                          if (p === '...') {
                            return (
                              <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-400 text-sm select-none">
                                ...
                              </span>
                            );
                          }

                          const pageNum = Number(p);
                          const isCurrent = currentPage === pageNum;

                          return (
                            <button
                              key={`page-${pageNum}`}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`min-w-[36px] h-9 px-3 flex items-center justify-center rounded-lg text-sm font-semibold transition ${
                                isCurrent
                                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                                  : 'text-gray-700 hover:bg-gray-100 border border-gray-200 bg-white'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        });
                      })()}
                    </div>

                    {/* Botão Próximo */}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      title="Próxima Página"
                      className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition"
                    >
                      <span className="hidden sm:inline">Próximo</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    {/* Botão Última Página */}
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      title="Última Página"
                      className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
