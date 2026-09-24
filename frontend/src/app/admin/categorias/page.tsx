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
  EyeOff,
  FolderOpen,
  Folder,
  ChevronRight,
  ChevronDown,
  Package
} from 'lucide-react';
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb';
import { useToast } from '../../components/ui/Toaster';
import { useCategories } from '../../hooks/useApi';

interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  image?: string;
  icon?: string;
  order: number;
  active: boolean;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  _count: {
    products: number;
    children: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminCategorias() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { addToast } = useToast();
  const categoriesApi = useCategories();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      
      const response = await categoriesApi.getCategories();
      const list: Category[] = response || [];
      setCategories(list);
      
      // Expandir automaticamente todas as categorias principais que possuem subcategorias
      const parentIdsWithChildren = new Set(
        list
          .filter(c => !c.parentId && c.children && c.children.length > 0)
          .map(c => c.id)
      );
      setExpandedCategories(parentIdsWithChildren);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível carregar as categorias'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleToggleActive = async (category: Category) => {
    try {
      await categoriesApi.updateCategory(category.id, { active: !category.active });
      
      setCategories(prev => prev.map(cat => 
        cat.id === category.id 
          ? { ...cat, active: !cat.active }
          : {
              ...cat,
              children: cat.children?.map(child =>
                child.id === category.id
                  ? { ...child, active: !child.active }
                  : child
              )
            }
      ));

      addToast({
        type: 'success',
        title: 'Status atualizado',
        message: `Categoria ${category.active ? 'desativada' : 'ativada'} com sucesso`
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível atualizar o status da categoria'
      });
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${category.name}"?`)) {
      return;
    }

    try {
      await categoriesApi.deleteCategory(category.id);
      
      loadCategories();
      
      addToast({
        type: 'success',
        title: 'Categoria excluída',
        message: 'Categoria excluída com sucesso'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível excluir a categoria'
      });
    }
  };

  const filteredCategories = categories.filter(category => {
    // Se não estiver pesquisando por termo, mostrar apenas categorias principais no nível raiz (subcategorias aparecem aninhadas dentro delas)
    if (!searchTerm && category.parentId) {
      return false;
    }

    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || 
      (statusFilter === 'active' && category.active) ||
      (statusFilter === 'inactive' && !category.active);
    
    return matchesSearch && matchesStatus;
  });

  const renderCategory = (category: Category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id}>
        <div 
          className={`flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 ${
            level > 0 ? 'ml-8 border-l-2 border-gray-200' : ''
          }`}
        >
          <div className="flex items-center gap-3 flex-1">
            {hasChildren && (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                )}
              </button>
            )}
            
            {!hasChildren && level > 0 && (
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              </div>
            )}

            <div className="flex items-center gap-3">
              {category.icon ? (
                <i className={`${category.icon} text-gray-600`}></i>
              ) : (
                hasChildren ? (
                  <FolderOpen className="h-5 w-5 text-gray-600" />
                ) : (
                  <Folder className="h-5 w-5 text-gray-600" />
                )
              )}
              
              <div>
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                {category.description && (
                  <p className="text-sm text-gray-600">{category.description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                <span>{category._count.products} produtos</span>
              </div>
              {hasChildren && (
                <div className="text-xs text-gray-500">
                  {category._count.children} subcategorias
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                category.active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {category.active ? 'Ativa' : 'Inativa'}
              </span>

              <button
                onClick={() => handleToggleActive(category)}
                className="p-2 hover:bg-gray-100 rounded transition"
                title={category.active ? 'Desativar' : 'Ativar'}
              >
                {category.active ? (
                  <EyeOff className="h-4 w-4 text-gray-600" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-600" />
                )}
              </button>

              <Link
                href={`/admin/categorias/${category.id}/editar`}
                className="p-2 hover:bg-gray-100 rounded transition"
                title="Editar"
              >
                <Edit className="h-4 w-4 text-blue-600" />
              </Link>

              <button
                onClick={() => handleDelete(category)}
                className={`p-2 rounded transition ${
                  category._count.products > 0 || category._count.children > 0
                    ? 'cursor-not-allowed opacity-40 hover:bg-transparent'
                    : 'hover:bg-red-50 text-red-600'
                }`}
                title={
                  category._count.products > 0
                    ? `Possui ${category._count.products} produto(s) vinculado(s). Mova os produtos para outra categoria antes de excluir.`
                    : category._count.children > 0
                    ? `Possui ${category._count.children} subcategoria(s). Exclua ou mova as subcategorias primeiro.`
                    : 'Excluir categoria'
                }
                disabled={category._count.products > 0 || category._count.children > 0}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {category.children?.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <AdminBreadcrumb />
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminBreadcrumb />
      
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Categorias</h1>
            <p className="text-gray-600">Gerencie as categorias e subcategorias dos produtos</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href="/admin/categorias/nova"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4" />
              Nova Categoria
            </Link>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar categorias
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Nome da categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os status</option>
              <option value="active">Ativas</option>
              <option value="inactive">Inativas</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Categorias */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Categorias ({filteredCategories.length})
          </h2>
        </div>

        {filteredCategories.length > 0 ? (
          <div>
            {filteredCategories.map(category => renderCategory(category))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma categoria encontrada
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando sua primeira categoria'
              }
            </p>
            {!searchTerm && !statusFilter && (
              <Link
                href="/admin/categorias/nova"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5" />
                Criar Primeira Categoria
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
