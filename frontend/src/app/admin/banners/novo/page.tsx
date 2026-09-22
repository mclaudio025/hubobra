'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { useBanners } from '../../../hooks/useApi';
import { useToast } from '../../../components/ui/Toaster';
import ImageUpload from '../../../components/ui/ImageUpload';
import BannerPreview from '../../../components/ui/BannerPreview';
import Loading from '../../../components/ui/Loading';

interface BannerFormData {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string;
  bgColor: string;
  textColor: string;
  type: string;
  position: number;
  active: boolean;
  startDate: string;
  endDate: string;
}

const bannerTypes = [
  { value: 'HERO', label: 'Hero Banner', description: 'Banner principal da homepage (1920x500px)' },
  { value: 'PROMOTIONAL', label: 'Banner Promocional', description: 'Banner de promoções (800x400px)' },
  { value: 'DEPARTMENT', label: 'Banner de Departamento', description: 'Atalho para departamento (400x300px)' },
  { value: 'CATEGORY', label: 'Banner de Categoria', description: 'Destaque para categorias específicas (600x300px)' },
  { value: 'FEATURED', label: 'Banner de Destaque', description: 'Produtos em destaque (500x250px)' },
  { value: 'SALE', label: 'Banner de Promoção', description: 'Ofertas e liquidações (700x350px)' },
  { value: 'DISCOUNT', label: 'Banner de Desconto', description: 'Cupons e descontos especiais (400x200px)' },
  { value: 'NEWSLETTER', label: 'Banner Newsletter', description: 'Inscrição em newsletter (600x200px)' },
  { value: 'TESTIMONIAL', label: 'Banner de Depoimento', description: 'Avaliações de clientes (500x300px)' },
  { value: 'BRAND', label: 'Banner de Marca', description: 'Destaque para marcas parceiras (400x250px)' },
  { value: 'SEASONAL', label: 'Banner Sazonal', description: 'Campanhas sazonais e datas especiais (800x400px)' },
];

const bgColorOptions = [
  { value: 'from-orange-600 to-orange-700', label: 'Laranja', preview: 'bg-gradient-to-r from-orange-600 to-orange-700' },
  { value: 'from-blue-600 to-blue-700', label: 'Azul', preview: 'bg-gradient-to-r from-blue-600 to-blue-700' },
  { value: 'from-green-600 to-green-700', label: 'Verde', preview: 'bg-gradient-to-r from-green-600 to-green-700' },
  { value: 'from-purple-600 to-purple-700', label: 'Roxo', preview: 'bg-gradient-to-r from-purple-600 to-purple-700' },
  { value: 'from-red-600 to-red-700', label: 'Vermelho', preview: 'bg-gradient-to-r from-red-600 to-red-700' },
  { value: 'from-gray-600 to-gray-700', label: 'Cinza', preview: 'bg-gradient-to-r from-gray-600 to-gray-700' },
];

const textColorOptions = [
  { value: 'text-white', label: 'Branco', preview: 'bg-white text-black' },
  { value: 'text-black', label: 'Preto', preview: 'bg-black text-white' },
  { value: 'text-gray-900', label: 'Cinza Escuro', preview: 'bg-gray-900 text-white' },
];

export default function NovoBanner() {
  const [formData, setFormData] = useState<BannerFormData>({
    title: '',
    subtitle: '',
    description: '',
    buttonText: '',
    buttonLink: '',
    imageUrl: '',
    bgColor: 'from-orange-600 to-orange-700',
    textColor: 'text-white',
    type: 'HERO',
    position: 0,
    active: true,
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const bannersApi = useBanners();
  const { addToast } = useToast();
  const router = useRouter();

  const handleInputChange = (field: keyof BannerFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      addToast({
        type: 'error',
        title: 'Erro de validação',
        message: 'Título é obrigatório',
      });
      return;
    }

    setLoading(true);

    try {
      const bannerData = {
        ...formData,
        // Remover campos vazios opcionais
        subtitle: formData.subtitle || undefined,
        description: formData.description || undefined,
        buttonText: formData.buttonText || undefined,
        buttonLink: formData.buttonLink || undefined,
        imageUrl: formData.imageUrl || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      };

      await bannersApi.createBanner(bannerData);
      
      addToast({
        type: 'success',
        title: 'Banner criado!',
        message: 'Banner criado com sucesso',
      });
      
      router.push('/admin/banners');
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erro ao criar banner',
        message: error.message || 'Tente novamente',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
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
              <h1 className="text-3xl font-bold text-gray-900">Novo Banner</h1>
              <p className="text-gray-600">Crie um novo banner para a homepage</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? 'Ocultar' : 'Mostrar'} Preview
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo do Banner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo do Banner *
                </label>
                <div className="space-y-2">
                  {bannerTypes.map((type) => (
                    <label key={type.value} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{type.label}</div>
                        <div className="text-sm text-gray-600">{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Materiais de Construção"
                  required
                />
              </div>

              {/* Subtítulo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtítulo
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Tudo para sua obra com qualidade"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Encontre cimento, tijolos, telhas e muito mais"
                />
              </div>

              {/* Botão */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Texto do Botão
                  </label>
                  <input
                    type="text"
                    value={formData.buttonText}
                    onChange={(e) => handleInputChange('buttonText', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Ver Produtos"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link do Botão
                  </label>
                  <input
                    type="text"
                    value={formData.buttonLink}
                    onChange={(e) => handleInputChange('buttonLink', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: /produtos"
                  />
                </div>
              </div>

              {/* Upload de Imagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagem do Banner
                </label>
                <ImageUpload
                  value={formData.imageUrl}
                  onChange={(url) => handleInputChange('imageUrl', url)}
                  onRemove={() => handleInputChange('imageUrl', '')}
                  recommendedSize={
                    formData.type === 'HERO' ? '1920x500px' :
                    formData.type === 'PROMOTIONAL' ? '800x400px' : '400x300px'
                  }
                />
              </div>

              {/* Cores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor de Fundo
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {bgColorOptions.map((color) => (
                      <label key={color.value} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="bgColor"
                          value={color.value}
                          checked={formData.bgColor === color.value}
                          onChange={(e) => handleInputChange('bgColor', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-6 h-6 rounded ${color.preview} border-2 ${formData.bgColor === color.value ? 'border-blue-500' : 'border-gray-300'}`}></div>
                        <span className="text-sm">{color.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor do Texto
                  </label>
                  <div className="space-y-2">
                    {textColorOptions.map((color) => (
                      <label key={color.value} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="textColor"
                          value={color.value}
                          checked={formData.textColor === color.value}
                          onChange={(e) => handleInputChange('textColor', e.target.value)}
                        />
                        <div className={`w-6 h-6 rounded ${color.preview} border border-gray-300 flex items-center justify-center text-xs font-bold`}>
                          A
                        </div>
                        <span className="text-sm">{color.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Configurações */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Posição
                  </label>
                  <input
                    type="number"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Fim
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => handleInputChange('active', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Banner ativo</span>
                </label>
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-6 border-t">
                <Link
                  href="/admin/banners"
                  className="flex-1 bg-gray-600 text-white px-6 py-3 rounded text-center hover:bg-gray-700 transition"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loading size="sm" />
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Criar Banner
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <BannerPreview banner={formData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
