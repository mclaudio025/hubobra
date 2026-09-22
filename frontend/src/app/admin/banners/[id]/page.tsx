'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Eye, EyeOff, Trash2, Calendar, Link as LinkIcon } from 'lucide-react';
import { useBanners } from '../../../hooks/useApi';
import { useToast } from '../../../components/ui/Toaster';
import BannerPreview from '../../../components/ui/BannerPreview';
import Loading from '../../../components/ui/Loading';

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

export default function BannerDetails() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  const bannersApi = useBanners();
  const { addToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const bannerId = params.id as string;

  useEffect(() => {
    if (bannerId) {
      loadBanner();
    }
  }, [bannerId]);

  const loadBanner = async () => {
    try {
      setLoading(true);
      const bannerData = await bannersApi.getBanner(bannerId);
      setBanner(bannerData);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao carregar banner',
        message: 'Banner não encontrado',
      });
      router.push('/admin/banners');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!banner) return;

    try {
      await bannersApi.toggleBannerActive(banner.id);
      setBanner({ ...banner, active: !banner.active });
      addToast({
        type: 'success',
        title: 'Status alterado',
        message: `Banner ${banner.active ? 'desativado' : 'ativado'} com sucesso`,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao alterar status',
        message: 'Tente novamente',
      });
    }
  };

  const handleDelete = async () => {
    if (!banner) return;
    
    if (!confirm(`Tem certeza que deseja excluir o banner "${banner.title}"?`)) return;

    try {
      await bannersApi.deleteBanner(banner.id);
      addToast({
        type: 'success',
        title: 'Banner excluído',
        message: 'Banner removido com sucesso',
      });
      router.push('/admin/banners');
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
      'HERO': 'Hero Banner',
      'PROMOTIONAL': 'Banner Promocional',
      'DEPARTMENT': 'Banner de Departamento',
    };
    return types[type as keyof typeof types] || type;
  };

  const getTypeBadgeColor = (type: string) => {
    const colors = {
      'HERO': 'bg-blue-100 text-blue-800',
      'PROMOTIONAL': 'bg-green-100 text-green-800',
      'DEPARTMENT': 'bg-purple-100 text-purple-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="Carregando banner..." />
      </div>
    );
  }

  if (!banner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Banner não encontrado</h1>
          <Link
            href="/admin/banners"
            className="text-blue-600 hover:text-blue-800"
          >
            Voltar para lista de banners
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/banners"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{banner.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(banner.type)}`}>
                  {getTypeLabel(banner.type)}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  banner.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {banner.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleToggleActive}
              className={`flex items-center gap-2 px-4 py-2 rounded transition ${
                banner.active 
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {banner.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {banner.active ? 'Desativar' : 'Ativar'}
            </button>
            <Link
              href={`/admin/banners/${banner.id}/editar`}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informações do Banner */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Informações do Banner</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <p className="text-gray-900">{banner.title}</p>
              </div>

              {banner.subtitle && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                  <p className="text-gray-900">{banner.subtitle}</p>
                </div>
              )}

              {banner.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <p className="text-gray-900">{banner.description}</p>
                </div>
              )}

              {banner.buttonText && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Texto do Botão</label>
                    <p className="text-gray-900">{banner.buttonText}</p>
                  </div>
                  {banner.buttonLink && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Link do Botão</label>
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-gray-500" />
                        <a 
                          href={banner.buttonLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {banner.buttonLink}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <p className="text-gray-900">{getTypeLabel(banner.type)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Posição</label>
                  <p className="text-gray-900">{banner.position}</p>
                </div>
              </div>

              {banner.imageUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imagem</label>
                  <img 
                    src={banner.imageUrl} 
                    alt={banner.title}
                    className="w-full max-w-xs h-32 object-cover rounded border"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor de Fundo</label>
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-6 h-6 rounded border bg-gradient-to-r ${banner.bgColor || 'from-gray-400 to-gray-500'}`}
                    ></div>
                    <span className="text-gray-900">{banner.bgColor || 'Não definida'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor do Texto</label>
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-6 h-6 rounded border ${banner.textColor}`}
                      style={{ backgroundColor: banner.textColor === 'text-white' ? '#ffffff' : '#000000' }}
                    ></div>
                    <span className="text-gray-900">{banner.textColor}</span>
                  </div>
                </div>
              </div>

              {(banner.startDate || banner.endDate) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {banner.startDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-900">
                          {new Date(banner.startDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  )}
                  {banner.endDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fim</label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-900">
                          {new Date(banner.endDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Criado em</label>
                  <p className="text-gray-600 text-sm">
                    {new Date(banner.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Atualizado em</label>
                  <p className="text-gray-600 text-sm">
                    {new Date(banner.updatedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview do Banner */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Preview do Banner</h2>
            <BannerPreview banner={banner} />
          </div>
        </div>
      </div>
    </div>
  );
}