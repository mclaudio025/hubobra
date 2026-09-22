'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import AdminBreadcrumb from '../../../components/admin/AdminBreadcrumb';
import { useToast } from '../../../components/ui/Toaster';
import { useCategories } from '../../../hooks/useApi';

interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
}

interface FormData {
  name: string;
  description: string;
  parentId: string;
  image: string;
  icon: string;
  order: number;
  active: boolean;
}

export default function NovaCategoriaPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    parentId: '',
    image: '',
    icon: '',
    order: 0,
    active: true
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const router = useRouter();
  const { addToast } = useToast();
  const categoriesApi = useCategories();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      
      const response = await categoriesApi.getCategories();
      setCategories(response || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível carregar as categorias'
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Nome deve ter no máximo 100 caracteres';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Descrição deve ter no máximo 500 caracteres';
    }

    if (formData.icon && formData.icon.length > 100) {
      newErrors.icon = 'Ícone deve ter no máximo 100 caracteres';
    }

    if (formData.order < 0) {
      newErrors.order = 'Ordem deve ser um número positivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        parentId: formData.parentId || undefined,
        description: formData.description || undefined,
        image: formData.image || undefined,
        icon: formData.icon || undefined
      };

      await categoriesApi.createCategory(submitData);

      addToast({
        type: 'success',
        title: 'Categoria criada',
        message: 'Categoria criada com sucesso'
      });

      router.push('/admin/categorias');
    } catch (error: any) {
      console.error('Erro ao criar categoria:', error);
      addToast({
        type: 'error',
        title: 'Erro ao criar categoria',
        message: error.message || 'Tente novamente'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Aqui você implementaria o upload da imagem
      // Por enquanto, vamos simular uma URL
      const mockUrl = URL.createObjectURL(file);
      handleInputChange('image', mockUrl);
    }
  };

  return (
    <div>
      <AdminBreadcrumb 
        items={[
          { label: 'Categorias', href: '/admin/categorias' },
          { label: 'Nova Categoria' }
        ]}
      />
      
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/admin/categorias"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nova Categoria</h1>
        <p className="text-gray-600">Crie uma nova categoria ou subcategoria</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário Principal */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Informações Básicas</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Categoria *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ex: Cimento e Argamassa"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Descrição da categoria (opcional)"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria Pai
                  </label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => handleInputChange('parentId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loadingCategories}
                  >
                    <option value="">Categoria Principal</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Deixe em branco para criar uma categoria principal
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Personalização</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ícone
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => handleInputChange('icon', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.icon ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ex: fas fa-hammer, lucide-hammer"
                  />
                  {errors.icon && (
                    <p className="mt-1 text-sm text-red-600">{errors.icon}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Use classes do Font Awesome ou Lucide Icons
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagem da Categoria
                  </label>
                  <div className="flex items-center gap-4">
                    {formData.image && (
                      <div className="relative">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleInputChange('image', '')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">Escolher Imagem</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.order ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.order && (
                    <p className="mt-1 text-sm text-red-600">{errors.order}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Menor número = maior prioridade na exibição
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => handleInputChange('active', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                    Categoria ativa
                  </label>
                </div>
                <p className="text-sm text-gray-500">
                  Categorias inativas não aparecem na loja
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações</h2>
              
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Categoria'}
                </button>
                
                <Link
                  href="/admin/categorias"
                  className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
