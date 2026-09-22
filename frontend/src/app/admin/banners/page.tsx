'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, EyeOff, Image, BarChart3 } from 'lucide-react';
import { useBanners } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toaster';
import Loading from '../../components/ui/Loading';
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl?: string;
  bgColor?: string;
  textColor: string;
  type: string;
  position: number;
  active: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BannersAdmin() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const bannersApi = useBanners();
  const { addToast } = useToast();

  useEffect(() => {
    loadBanners();
  }, [typeFilter]);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const response = await bannersApi.getBanners({
        ...(typeFilter && { type: typeFilter }),
      });
      setBanners(response || []);
    } catch (error) {
      console.error('Erro ao carregar banners:', error);
      addToast({
        type: 'error',
        title: 'Erro ao carregar banners',
        message: 'Tente novamente mais tarde',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await bannersApi.toggleBannerActive(id);
      setBanners(banners.map(banner => 
        banner.id === id ? { ...banner, active: !banner.active } : banner
      ));
      addToast({
        type: 'success',
        title: 'Status alterado',
        message: 'Banner atualizado com sucesso',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao alterar status',
        message: 'Tente novamente',
      });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir o banner "${title}"?`)) return;

    try {
      await bannersApi.deleteBanner(id);
      setBanners(banners.filter(banner => banner.id !== id));
      addToast({
        type: 'success',
        title: 'Banner excluído',
        message: 'Banner removido com sucesso',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao excluir banner',
        message: 'Tente novamente',
      });
    }
  };

  const getTypeLabel = (type: string) => {
    const types = {
      'HERO': 'Hero',
      'PROMOTIONAL': 'Promocional',
      'DEPARTMENT': 'Departamento',
      'CATEGORY': 'Categoria',
      'FEATURED': 'Destaque',
      'SALE': 'Promoção',
      'DISCOUNT': 'Desconto',
      'NEWSLETTER': 'Newsletter',
      'TESTIMONIAL': 'Depoimento',
      'BRAND': 'Marca',
      'SEASONAL': 'Sazonal',
    };
    return types[type as keyof typeof types] || type;
  };

  const getTypeBadgeColor = (type: string) => {
    const colors = {
      'HERO': 'bg-blue-100 text-blue-800',
      'PROMOTIONAL': 'bg-green-100 text-green-800',
      'DEPARTMENT': 'bg-purple-100 text-purple-800',
      'CATEGORY': 'bg-indigo-100 text-indigo-800',
      'FEATURED': 'bg-yellow-100 text-yellow-800',
      'SALE': 'bg-red-100 text-red-800',
      'DISCOUNT': 'bg-orange-100 text-orange-800',
      'NEWSLETTER': 'bg-cyan-100 text-cyan-800',
      'TESTIMONIAL': 'bg-pink-100 text-pink-800',
      'BRAND': 'bg-slate-100 text-slate-800',
      'SEASONAL': 'bg-emerald-100 text-emerald-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredBanners = banners.filter(banner =>
    banner.title.toLowerCase().includes(filter.toLowerCase()) ||
    banner.subtitle?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <AdminBreadcrumb />
      
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Banners</h1>
            <p className="text-gray-600 mt-1">Gerencie os banners da homepage</p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/admin/banners/stats"
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
            >
              <BarChart3 className="h-4 w-4" />
              Estatísticas
            </Link>
            <Link
              href="/admin/banners/novo"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4" />
              Novo Banner
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Título ou subtítulo..."
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os tipos</option>
                <option value="HERO">Hero</option>
                <option value="PROMOTIONAL">Promocional</option>
                <option value="DEPARTMENT">Departamento</option>
                <option value="CATEGORY">Categoria</option>
                <option value="FEATURED">Destaque</option>
                <option value="SALE">Promoção</option>
                <option value="DISCOUNT">Desconto</option>
                <option value="NEWSLETTER">Newsletter</option>
                <option value="TESTIMONIAL">Depoimento</option>
                <option value="BRAND">Marca</option>
                <option value="SEASONAL">Sazonal</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilter('');
                  setTypeFilter('');
                }}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Banners */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loading size="lg" text="Carregando banners..." />
            </div>
          ) : filteredBanners.length === 0 ? (
            <div className="p-8 text-center">
              <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum banner encontrado</p>
              <Link
                href="/admin/banners/novo"
                className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Criar Primeiro Banner
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Banner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Período
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBanners.map((banner) => (
                    <tr key={banner.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-20">
                            {banner.imageUrl ? (
                              <img
                                className="h-12 w-20 rounded object-cover"
                                src={banner.imageUrl}
                                alt={banner.title}
                              />
                            ) : (
                              <div className={`h-12 w-20 rounded bg-gradient-to-r ${banner.bgColor || 'from-gray-400 to-gray-500'} flex items-center justify-center`}>
                                <Image className="h-6 w-6 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {banner.title}
                            </div>
                            {banner.subtitle && (
                              <div className="text-sm text-gray-500">
                                {banner.subtitle}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(banner.type)}`}>
                          {getTypeLabel(banner.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {banner.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(banner.id)}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            banner.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {banner.active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {banner.startDate || banner.endDate ? (
                          <div>
                            {banner.startDate && (
                              <div>Início: {new Date(banner.startDate).toLocaleDateString()}</div>
                            )}
                            {banner.endDate && (
                              <div>Fim: {new Date(banner.endDate).toLocaleDateString()}</div>
                            )}
                          </div>
                        ) : (
                          'Permanente'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/banners/${banner.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/admin/banners/${banner.id}/editar`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleToggleActive(banner.id)}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            {banner.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(banner.id, banner.title)}
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
          )}
        </div>
      </div>
    </div>
  );
}
