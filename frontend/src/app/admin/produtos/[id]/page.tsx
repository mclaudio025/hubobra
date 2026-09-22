'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Package, DollarSign, BarChart3, Eye, Barcode } from 'lucide-react';
import AdminBreadcrumb from '@/app/components/admin/AdminBreadcrumb';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  unit?: string;
  sku: string;
  barcode?: string;
  category: {
    id: string;
    name: string;
  } | string;
  images: string[];
  active: boolean;
  brand?: string;
  weight?: number;
  dimensions?: string;
  specifications?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBase}/products/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Produto não encontrado');
      }

      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      setError('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBase}/products/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        router.push('/admin/produtos');
      } else {
        alert('Erro ao excluir produto');
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Erro ao excluir produto');
    }
  };

  const toggleStatus = async () => {
    if (!product) return;

    try {
      const token = localStorage.getItem('token');
      
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBase}/products/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: !product.active
        }),
      });

      if (response.ok) {
        setProduct(prev => prev ? { ...prev, active: !prev.active } : null);
      } else {
        alert('Erro ao alterar status do produto');
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status do produto');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Produto não encontrado</h1>
            <p className="text-gray-600 mb-6">{error || 'O produto solicitado não existe.'}</p>
            <Link
              href="/admin/produtos"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Produtos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Produtos', href: '/admin/produtos' },
    { label: product.name }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <AdminBreadcrumb items={breadcrumbItems} />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/produtos"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-gray-600">SKU: {product.sku}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleStatus}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                product.active
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
              }`}
            >
              {product.active ? 'Ativo' : 'Inativo'}
            </button>
            
            <Link
              href={`/admin/produtos/${product.id}/editar`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>

            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Preço</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {product.price.toFixed(2)}
                  {product.unit && product.unit !== 'UN' && (
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      /{product.unit === 'M2' ? 'm²' : product.unit.toLowerCase()}
                    </span>
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estoque</p>
                <p className="text-2xl font-bold text-gray-900">
                  {product.stock}
                  {product.unit && (
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      {product.unit.toLowerCase()}
                    </span>
                  )}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categoria</p>
                <p className="text-lg font-semibold text-gray-900">
                  {typeof product.category === 'object' ? product.category.name : product.category}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className={`text-lg font-semibold ${product.active ? 'text-green-600' : 'text-red-600'}`}>
                  {product.active ? 'Ativo' : 'Inativo'}
                </p>
              </div>
              <Eye className="h-8 w-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações do Produto */}
          <div className="lg:col-span-2 space-y-6">
            {/* Descrição */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Descrição</h2>
              <p className="text-gray-700 leading-relaxed">
                {product.description || 'Nenhuma descrição disponível.'}
              </p>
            </div>

            {/* Especificações */}
            {product.specifications && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Especificações</h2>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-700">
                    {product.specifications}
                  </pre>
                </div>
              </div>
            )}

            {/* Detalhes Técnicos */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalhes Técnicos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.brand && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Marca</label>
                    <p className="text-gray-900">{product.brand}</p>
                  </div>
                )}

                {product.barcode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Barcode className="w-3.5 h-3.5 text-blue-600" />
                      Código de Barras (EAN-13)
                    </label>
                    <p className="text-gray-900 font-mono font-semibold">{product.barcode}</p>
                  </div>
                )}
                
                {product.weight && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Peso</label>
                    <p className="text-gray-900">{product.weight} kg</p>
                  </div>
                )}
                
                {product.dimensions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Dimensões</label>
                    <p className="text-gray-900">{product.dimensions}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-600">Criado em</label>
                  <p className="text-gray-900">
                    {new Date(product.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">Atualizado em</label>
                  <p className="text-gray-900">
                    {new Date(product.updatedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Imagens */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Imagens</h2>
                <Link
                  href={`/admin/produtos/${product.id}/imagens`}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Gerenciar
                </Link>
              </div>
              
              {product.images && product.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {product.images.slice(0, 4).map((image: any, index) => {
                    const imgUrl = typeof image === 'string' ? image : image?.url || '/placeholder-product.svg';
                    return (
                      <img
                        key={index}
                        src={imgUrl}
                        alt={`${product.name} - Imagem ${index + 1}`}
                        className="w-full h-20 object-contain bg-white rounded border p-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                        }}
                      />
                    );
                  })}
                  {product.images.length > 4 && (
                    <div className="w-full h-20 bg-gray-100 rounded border flex items-center justify-center">
                      <span className="text-gray-500 text-sm">
                        +{product.images.length - 4} mais
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Nenhuma imagem</p>
                </div>
              )}
            </div>

            {/* Ações Rápidas */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
              <div className="space-y-3">
                <Link
                  href={`/admin/produtos/${product.id}/editar`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Produto
                </Link>
                
                <Link
                  href={`/admin/produtos/${product.id}/imagens`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Gerenciar Imagens
                </Link>

                <button
                  onClick={toggleStatus}
                  className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-lg transition ${
                    product.active
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {product.active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}