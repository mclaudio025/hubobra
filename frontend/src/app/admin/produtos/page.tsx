'use client';

import { useState, useEffect, useRef } from 'react';
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
  ChevronsRight,
  Check,
  Loader2,
  Tag,
  CheckSquare,
  Square,
  MinusSquare,
  X,
  ArrowRight,
  Layers,
  RefreshCw
} from 'lucide-react';
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb';
import { useApi, useProducts } from '../../hooks/useApi';
import { getImageUrl } from '../../utils/imageUrl';
import { useToast } from '../../components/ui/Toaster';
import AutoClassifyModal from './components/AutoClassifyModal';

interface Product {
  id: string;
  name: string;
  price: number;
  category: any;
  categoryId?: string;
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
  const { addToast } = useToast();
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

  // Estados de edição inline e em massa
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);
  const [updatedProductIds, setUpdatedProductIds] = useState<Set<string>>(new Set());
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isAutoClassifyOpen, setIsAutoClassifyOpen] = useState(false);

  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedProductIds([]);
  }, [searchTerm, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, categoryFilter, statusFilter]);

  // Atualizar estado indeterminate do checkbox master
  const isAllSelected = products.length > 0 && products.every(p => selectedProductIds.includes(p.id));
  const isSomeSelected = products.some(p => selectedProductIds.includes(p.id));

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = isSomeSelected && !isAllSelected;
    }
  }, [isSomeSelected, isAllSelected]);

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

  // Alteração inline de categoria com auto-save
  const handleInlineCategoryChange = async (productId: string, newCategoryId: string) => {
    if (!newCategoryId) return;

    const currentProduct = products.find(p => p.id === productId);
    const currentCatId = currentProduct?.categoryId || 
      (typeof currentProduct?.category === 'object' ? currentProduct?.category?.id : '');

    if (currentCatId === newCategoryId) return;

    const selectedCategory = categories.find(c => c.id === newCategoryId);
    if (!selectedCategory) return;

    setUpdatingProductId(productId);

    try {
      await apiCall(`/products/${productId}`, {
        method: 'PATCH',
        body: { categoryId: newCategoryId },
        requireAuth: false
      });

      // Atualizar no estado local sem remover o item da visualização (Opção B - retenção visual para auditoria contínua)
      setProducts(prev => prev.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            categoryId: selectedCategory.id,
            category: { id: selectedCategory.id, name: selectedCategory.name }
          };
        }
        return p;
      }));

      setUpdatedProductIds(prev => new Set(prev).add(productId));

      addToast({
        type: 'success',
        title: 'Categoria atualizada!',
        message: `"${(currentProduct?.name || 'Produto').substring(0, 32)}..." alterado para "${selectedCategory.name}".`
      });
    } catch (error: any) {
      console.error('Erro ao atualizar categoria:', error);
      addToast({
        type: 'error',
        title: 'Erro ao atualizar categoria',
        message: error?.message || 'Não foi possível salvar a nova categoria.'
      });
    } finally {
      setUpdatingProductId(null);
    }
  };

  // Seleção e Ação em Massa
  const toggleSelectAll = () => {
    if (isAllSelected) {
      // Desmarcar todos os produtos da página atual
      const currentPageIds = new Set(products.map(p => p.id));
      setSelectedProductIds(prev => prev.filter(id => !currentPageIds.has(id)));
    } else {
      // Marcar todos os produtos da página atual
      const newIds = Array.from(new Set([...selectedProductIds, ...products.map(p => p.id)]));
      setSelectedProductIds(newIds);
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkCategoryUpdate = async () => {
    if (!bulkCategoryId) {
      addToast({
        type: 'warning',
        title: 'Selecione uma categoria',
        message: 'Por favor, escolha uma categoria de destino no menu suspenso.'
      });
      return;
    }

    const targetCategory = categories.find(c => c.id === bulkCategoryId);
    if (!targetCategory) return;

    const count = selectedProductIds.length;
    if (!confirm(`Deseja alterar a categoria de ${count} produto(s) selecionado(s) para "${targetCategory.name}"?`)) {
      return;
    }

    try {
      setIsBulkUpdating(true);

      await apiCall('/products/bulk-category', {
        method: 'PATCH',
        body: {
          productIds: selectedProductIds,
          categoryId: bulkCategoryId
        },
        requireAuth: false
      });

      // Atualizar localmente
      setProducts(prev => prev.map(p => {
        if (selectedProductIds.includes(p.id)) {
          return {
            ...p,
            categoryId: targetCategory.id,
            category: { id: targetCategory.id, name: targetCategory.name }
          };
        }
        return p;
      }));

      setUpdatedProductIds(prev => {
        const next = new Set(prev);
        selectedProductIds.forEach(id => next.add(id));
        return next;
      });

      addToast({
        type: 'success',
        title: 'Atualização em massa concluída!',
        message: `${count} produto(s) movido(s) para "${targetCategory.name}".`
      });

      setSelectedProductIds([]);
      setBulkCategoryId('');
    } catch (error: any) {
      console.error('Erro na atualização em massa:', error);
      addToast({
        type: 'error',
        title: 'Erro na atualização em massa',
        message: error?.message || 'Falha ao atualizar categorias dos produtos selecionados.'
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await apiCall(`/products/${id}`, { 
          method: 'DELETE',
          requireAuth: false 
        });
        
        setProducts(products.filter(product => product.id !== id));
        setSelectedProductIds(prev => prev.filter(x => x !== id));
        addToast({
          type: 'success',
          title: 'Produto excluído',
          message: 'Produto removido com sucesso do catálogo.'
        });
      } catch (error: any) {
        console.error('Erro ao excluir produto:', error);
        addToast({
          type: 'error',
          title: 'Erro ao excluir produto',
          message: error.message || 'Erro ao excluir produto'
        });
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
        requireAuth: false
      });
      
      setProducts(products.map(p => 
        p.id === id 
          ? { ...p, active: !p.active }
          : p
      ));

      addToast({
        type: 'info',
        title: 'Status alterado',
        message: `Produto ${!product.active ? 'ativado' : 'desativado'} com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      addToast({
        type: 'error',
        title: 'Erro ao alterar status',
        message: 'Não foi possível alterar o status do produto.'
      });
    }
  };

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
    <div className="relative pb-24">
      <AdminBreadcrumb />
      
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestão de Produtos</h1>
            <p className="text-xs text-gray-500 mt-1">Gerencie catálogo, preços, estoque, categorias rápidas e fotos</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsAutoClassifyOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Organiza automaticamente produtos em suas respectivas categorias com base nas descrições"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              Auto-Classificar com IA
            </button>
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
          <div className={`mb-6 p-4 rounded-xl text-sm flex items-center justify-between shadow-sm ${
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nome ou SKU..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Filtrar por Categoria</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-medium"
              >
                <option value="">Todas as categorias</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-medium"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition border border-gray-300"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Produtos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-sm font-medium text-gray-600">Carregando catálogo de produtos...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
                <Search className="h-6 w-6" />
              </div>
              <p className="text-base font-semibold text-gray-900">Nenhum produto encontrado</p>
              <p className="text-xs text-gray-500 mt-1">Tente ajustar os filtros de busca ou cadastrar um novo produto.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-4 py-3.5 text-center w-10">
                        <input
                          type="checkbox"
                          ref={masterCheckboxRef}
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          title={isAllSelected ? "Desmarcar todos" : "Selecionar todos da página"}
                        />
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Produto
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[220px]">
                        <div className="flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-blue-600" />
                          <span>Categoria (Edição Direta)</span>
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Preço
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Estoque
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {products.map((product) => {
                      const isSelected = selectedProductIds.includes(product.id);
                      const isUpdatingThis = updatingProductId === product.id;
                      const isRecentlyUpdated = updatedProductIds.has(product.id);

                      // Obter o ID atual da categoria do produto
                      const currentProductCategoryId = 
                        product.categoryId || 
                        (typeof product.category === 'object' ? product.category?.id : '') || 
                        '';

                      // Verificar se a categoria difere do filtro ativo (indicador da Opção B)
                      const isDifferentFromFilter = categoryFilter && currentProductCategoryId && currentProductCategoryId !== categoryFilter;

                      return (
                        <tr 
                          key={product.id} 
                          className={`transition-colors duration-150 ${
                            isSelected 
                              ? 'bg-blue-50/60' 
                              : isRecentlyUpdated 
                              ? 'bg-emerald-50/40 hover:bg-emerald-50/60' 
                              : 'hover:bg-gray-50/80'
                          }`}
                        >
                          {/* Checkbox de Seleção */}
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectProduct(product.id)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>

                          {/* Foto e Nome do Produto */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 h-12 w-12 bg-gray-50 rounded-lg p-1 border border-gray-200/80 flex items-center justify-center overflow-hidden">
                                <img
                                  className="h-10 w-10 rounded object-contain"
                                  src={getProductImage(product.images)}
                                  alt={product.name}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                                  }}
                                />
                              </div>
                              <div className="min-w-0 max-w-sm sm:max-w-md">
                                <div className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2" title={product.name}>
                                  {product.name}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                  <span className="font-mono">SKU: {product.sku || 'N/A'}</span>
                                  {isDifferentFromFilter && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                      Categoria Alterada
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Dropdown Inline de Categoria */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1 max-w-[240px]">
                              <div className="relative flex items-center">
                                <select
                                  value={currentProductCategoryId}
                                  onChange={(e) => handleInlineCategoryChange(product.id, e.target.value)}
                                  disabled={isUpdatingThis || isBulkUpdating}
                                  className={`w-full py-1.5 pl-2.5 pr-7 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                                    isRecentlyUpdated
                                      ? 'border-emerald-400 bg-emerald-50/50 text-emerald-900 focus:ring-emerald-500'
                                      : 'border-gray-300 bg-white text-gray-800 hover:border-blue-400 focus:ring-blue-500 focus:border-blue-500'
                                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                                >
                                  <option value="" disabled>Selecione a categoria...</option>
                                  {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </option>
                                  ))}
                                </select>

                                {/* Indicador de salvando ou salvo */}
                                <div className="absolute right-2.5 pointer-events-none flex items-center">
                                  {isUpdatingThis ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                                  ) : isRecentlyUpdated ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                                  ) : null}
                                </div>
                              </div>

                              {isRecentlyUpdated && (
                                <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                                  <Check className="h-2.5 w-2.5 stroke-[3]" /> Salvo automaticamente
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Preço */}
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            R$ {Number(product.price || 0).toFixed(2)}
                          </td>

                          {/* Estoque */}
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                              product.stock > 10 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : product.stock > 0 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              {product.stock} un.
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => toggleStatus(product.id)}
                              className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full transition ${
                                product.active
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {product.active ? 'Ativo' : 'Inativo'}
                            </button>
                          </td>

                          {/* Ações */}
                          <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <div className="flex items-center justify-center gap-1.5">
                              <Link
                                href={`/admin/produtos/${product.id}`}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                                title="Visualizar Detalhes"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <Link
                                href={`/admin/produtos/${product.id}/editar`}
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                                title="Edição Completa"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDelete(product.id)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                                title="Excluir Produto"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

      {/* BARRA FLUTUANTE DE AÇÃO EM MASSA */}
      {selectedProductIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
                {selectedProductIds.length}
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {selectedProductIds.length} {selectedProductIds.length === 1 ? 'produto selecionado' : 'produtos selecionados'}
                </p>
                <p className="text-[11px] text-slate-400">Altere a categoria de todos em lote</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={bulkCategoryId}
                onChange={(e) => setBulkCategoryId(e.target.value)}
                disabled={isBulkUpdating}
                className="bg-slate-800 text-slate-100 text-xs rounded-xl border border-slate-600 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none flex-1 sm:w-48 font-medium"
              >
                <option value="">Nova Categoria...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleBulkCategoryUpdate}
                disabled={!bulkCategoryId || isBulkUpdating}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isBulkUpdating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Aplicando...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-3.5 w-3.5" />
                    <span>Aplicar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedProductIds([])}
                disabled={isBulkUpdating}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                title="Desmarcar todos"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Auto-Classificação Inteligente com IA / Regras */}
      <AutoClassifyModal
        isOpen={isAutoClassifyOpen}
        onClose={() => setIsAutoClassifyOpen(false)}
        onSuccess={() => {
          fetchProducts();
          fetchCategories();
        }}
      />
    </div>
  );
}
