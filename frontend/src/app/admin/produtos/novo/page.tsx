'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProducts, useCategories } from '../../../hooks/useApi';
import AdminBreadcrumb from '../../../components/admin/AdminBreadcrumb';
import AdvancedImageUpload from '../../../components/ui/AdvancedImageUpload';
import ProductImageSearchModal, { UploadedImage } from '../../../components/admin/ProductImageSearchModal';
import { getImageUrl } from '../../../utils/imageUrl';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  X, 
  Plus, 
  Trash2, 
  Sparkles, 
  Barcode, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Layers
} from 'lucide-react';
import Link from 'next/link';

interface ProductForm {
  name: string;
  description: string;
  specifications: string;
  price: number;
  stock: number;
  sku: string;
  barcode: string;
  categoryId: string;
  brand: string;
  unit: string;
  weight: number;
  dimensions: string;
  featured: boolean;
  active: boolean;
  images: UploadedImage[];
  tags: string[];
}

const defaultProduct: ProductForm = {
  name: '',
  description: '',
  specifications: '',
  price: 0,
  stock: 0,
  sku: '',
  barcode: '',
  categoryId: '',
  brand: '',
  unit: 'UN',
  weight: 0,
  dimensions: '',
  featured: false,
  active: true,
  images: [],
  tags: []
};

function NovoProductPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cloneFromId = searchParams.get('cloneFrom');

  const { createProduct, getProduct } = useProducts();
  const { getCategories } = useCategories();
  
  const [product, setProduct] = useState<ProductForm>(defaultProduct);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cloningLoading, setCloningLoading] = useState(false);
  const [clonedSource, setClonedSource] = useState<{ id: string; name: string; sku: string } | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (cloneFromId) {
      loadProductToClone(cloneFromId);
    }
  }, [cloneFromId]);

  const loadCategories = async () => {
    try {
      const data = await getCategories(true);
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadProductToClone = async (id: string) => {
    try {
      setCloningLoading(true);
      setMessage({
        type: 'info',
        text: 'Carregando fotos e informações do produto original para clonagem...'
      });

      const sourceProduct = await getProduct(id);

      if (!sourceProduct) {
        throw new Error('Produto original não encontrado para clonagem.');
      }

      // Sugerir SKU para evitar colisão imediata (ex: SKU-COPIA ou SKU-2)
      let suggestedSku = sourceProduct.sku ? `${sourceProduct.sku}-COPIA` : '';
      if (sourceProduct.sku && sourceProduct.sku.includes('-COPIA')) {
        suggestedSku = `${sourceProduct.sku}-2`;
      }

      // Mapear imagens do produto original
      const mappedImages: UploadedImage[] = (sourceProduct.images || []).map((img: any, idx: number) => {
        const rawUrl = typeof img === 'string' ? img : img.url;
        return {
          id: `clone-img-${idx}-${Date.now()}`,
          url: getImageUrl(rawUrl),
          thumbnailUrl: getImageUrl(img.thumbnailUrl || rawUrl),
          originalName: img.alt || `${sourceProduct.name} (Imagem ${idx + 1})`,
          size: 0,
          type: 'image/jpeg'
        };
      });

      // Mapear tags
      const mappedTags = Array.isArray(sourceProduct.tags)
        ? sourceProduct.tags
            .map((t: any) => (typeof t === 'string' ? t : t?.tag?.name || t?.name))
            .filter(Boolean)
        : [];

      // Identificar categoryId
      const sourceCategoryId = sourceProduct.categoryId || 
        (typeof sourceProduct.category === 'object' ? sourceProduct.category?.id : sourceProduct.category) || '';

      setProduct({
        name: sourceProduct.name || '',
        description: sourceProduct.description || '',
        specifications: sourceProduct.specifications || '',
        price: Number(sourceProduct.price) || 0,
        stock: Number(sourceProduct.stock) || 0,
        sku: suggestedSku,
        barcode: '', // Limpo para evitar duplicidade de EAN se for outra variação
        categoryId: sourceCategoryId,
        brand: sourceProduct.brand || '',
        unit: sourceProduct.unit || 'UN',
        weight: Number(sourceProduct.weight) || 0,
        dimensions: sourceProduct.dimensions || '',
        featured: Boolean(sourceProduct.featured),
        active: true,
        images: mappedImages,
        tags: mappedTags
      });

      setClonedSource({
        id: sourceProduct.id,
        name: sourceProduct.name,
        sku: sourceProduct.sku || ''
      });

      setMessage({
        type: 'success',
        text: `Produto "${sourceProduct.name}" clonado com sucesso! Altere os campos desejados (como Unidade ou SKU) e salve.`
      });
    } catch (error: any) {
      console.error('Erro ao clonar produto:', error);
      setMessage({
        type: 'error',
        text: error?.message || 'Falha ao carregar dados do produto para clonagem.'
      });
    } finally {
      setCloningLoading(false);
    }
  };

  const handleResetToBlank = () => {
    setProduct(defaultProduct);
    setClonedSource(null);
    setMessage({
      type: 'info',
      text: 'Formulário limpo para cadastro do zero.'
    });
    router.replace('/admin/produtos/novo');
  };

  const handleInputChange = (field: keyof ProductForm, value: any) => {
    setProduct(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !product.tags.includes(newTag.trim())) {
      setProduct(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setProduct(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleImageUploaded = (image: UploadedImage) => {
    const normalized = {
      ...image,
      url: getImageUrl(image.url),
      thumbnailUrl: getImageUrl(image.thumbnailUrl || image.url),
    };
    setProduct(prev => ({
      ...prev,
      images: [...prev.images, normalized]
    }));
  };

  const handleImageRemove = (imageId: string) => {
    setProduct(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Validações básicas
      if (!product.name.trim()) {
        throw new Error('Nome do produto é obrigatório');
      }
      if (!product.categoryId) {
        throw new Error('Categoria é obrigatória');
      }
      if (product.price <= 0) {
        throw new Error('Preço deve ser maior que zero');
      }
      if (!product.sku.trim()) {
        throw new Error('SKU é obrigatório');
      }

      const productData: any = {
        name: product.name.trim(),
        description: product.description?.trim() || undefined,
        specifications: product.specifications?.trim() || undefined,
        price: Number(product.price),
        stock: Number(product.stock) || 0,
        sku: product.sku.trim(),
        barcode: product.barcode?.trim() || undefined,
        categoryId: product.categoryId,
        brand: product.brand?.trim() || undefined,
        unit: product.unit || 'UN',
        weight: product.weight ? Number(product.weight) : undefined,
        dimensions: product.dimensions?.trim() || undefined,
        featured: Boolean(product.featured),
        active: Boolean(product.active),
        images: product.images && product.images.length > 0 ? product.images.map((img, idx) => ({
          url: img.url,
          alt: img.originalName || product.name.trim(),
          order: idx
        })) : undefined,
        tags: product.tags && product.tags.length > 0 ? product.tags : undefined,
      };

      await createProduct(productData);
      
      setMessage({ type: 'success', text: 'Produto cadastrado com sucesso!' });
      
      // Redirecionar após 1.5 segundos
      setTimeout(() => {
        router.push('/admin/produtos');
      }, 1500);
      
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Erro ao criar produto' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <AdminBreadcrumb />
      
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/produtos"
              className="p-2 hover:bg-gray-200/70 rounded-xl text-gray-600 transition-colors"
              title="Voltar para Produtos"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {clonedSource ? 'Clonar & Cadastrar Produto' : 'Adicionar Produto'}
                </h1>
                {clonedSource && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Copy className="w-3.5 h-3.5" />
                    Clonando
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {clonedSource 
                  ? `Novo cadastro criado a partir de "${clonedSource.name}". Fotos e dados pré-preenchidos.`
                  : 'Cadastre um novo produto no catálogo da loja'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Banner Informativo de Clonagem */}
        {clonedSource && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 text-emerald-950 shadow-sm flex flex-col sm:flex-row items-start justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-emerald-950 text-sm">
                    Modo de Clonagem Ativo
                  </h3>
                  <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-white text-emerald-800 rounded-md border border-emerald-200">
                    Origem: {clonedSource.sku || clonedSource.id}
                  </span>
                </div>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Fotos, categoria, marca, especificações e descrições foram importadas automaticamente. 
                  Você só precisa mudar a <strong>Unidade de Venda</strong>, ajustar o <strong>Preço</strong> ou o <strong>SKU</strong> e clicar em <strong>Salvar Produto</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetToBlank}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-100/50 px-3 py-1.5 rounded-xl border border-emerald-300 transition shadow-xs shrink-0 self-end sm:self-center"
            >
              Criar do Zero (Limpar)
            </button>
          </div>
        )}

        {/* Alertas / Mensagens */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm flex items-start justify-between gap-3 shadow-xs animate-in fade-in ${
            message.type === 'error' 
              ? 'bg-red-50 text-red-800 border border-red-200' 
              : message.type === 'info'
              ? 'bg-blue-50 text-blue-800 border border-blue-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            <div className="flex items-start gap-2.5">
              {message.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              ) : message.type === 'info' ? (
                <RefreshCw className="w-5 h-5 text-blue-500 shrink-0 mt-0.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setMessage(null)} 
              className="text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/90 p-5 sm:p-7">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
              <Layers className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Informações Básicas do Produto</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900"
                  placeholder="Ex: Tijolo Cerâmico 6 Furos"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Descrição Comercial
                </label>
                <textarea
                  value={product.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 leading-relaxed"
                  placeholder="Descreva as características, aplicações e benefícios do produto..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Especificações Técnicas (Detalhes / Ficha)
                </label>
                <textarea
                  value={product.specifications}
                  onChange={(e) => handleInputChange('specifications', e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs text-gray-800 leading-relaxed"
                  placeholder="Ex: Rendimento: 10m²/lata; Secagem ao toque: 2h; Acabamento: Fosco; Normas: ABNT NBR..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Categoria *
                </label>
                <select
                  value={product.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-900"
                  required
                >
                  <option value="">Selecione uma categoria...</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Marca / Fabricante
                </label>
                <input
                  type="text"
                  value={product.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Ex: Coral, Tigre, Votoran, Tramontina"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    SKU / Código / Referência *
                  </label>
                  {clonedSource && (
                    <span className="text-[11px] text-emerald-700 font-medium">Sugerido para clonagem</span>
                  )}
                </div>
                <input
                  type="text"
                  value={product.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold ${
                    clonedSource ? 'border-emerald-400 bg-emerald-50/30 text-emerald-950' : 'border-gray-300 text-gray-900'
                  }`}
                  placeholder="Ex: 001435 ou COD-CX"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Barcode className="w-4 h-4 text-blue-600" />
                  Código de Barras (EAN-13)
                </label>
                <input
                  type="text"
                  value={product.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900"
                  placeholder="Ex: 7891435043761 (opcional)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Preço de Venda (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={product.price || ''}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-900"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Seletor Especial de Unidade */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Unidade de Venda *
                  </label>
                  {clonedSource && (
                    <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                      Principal campo a alterar
                    </span>
                  )}
                </div>
                <select
                  value={product.unit || 'UN'}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border-2 border-orange-300 focus:border-orange-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 bg-orange-50/20 font-bold text-slate-900"
                >
                  <option value="UN">Unidade (UN)</option>
                  <option value="M2">m² - Metro Quadrado (ex: Pisos, Porcelanato, Telhas)</option>
                  <option value="CX">Caixa (CX) (ex: Revestimentos, Parafusos)</option>
                  <option value="SACO">Saco (ex: Cimento, Argamassa, Cal)</option>
                  <option value="MILHEIRO">Milheiro (ex: Tijolos, Blocos)</option>
                  <option value="LATA">Lata / Galão (ex: Tintas, Verniz)</option>
                  <option value="KG">Quilo (KG) (ex: Pregos, Granel)</option>
                  <option value="METRO">Metro Linear (M) (ex: Canos, Fios, Cabos)</option>
                  <option value="BARRA">Barra (ex: Ferragens, Perfis)</option>
                  <option value="ROLO">Rolo (ex: Telas, Mangueiras)</option>
                  <option value="PAR">Par (ex: Luvas, Botas)</option>
                  <option value="PCT">Pacote (PCT)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Estoque Inicial
                </label>
                <input
                  type="number"
                  min="0"
                  value={product.stock || ''}
                  onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Peso Estimado (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={product.weight || ''}
                  onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="0.00"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Dimensões / Medidas
                </label>
                <input
                  type="text"
                  value={product.dimensions}
                  onChange={(e) => handleInputChange('dimensions', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Ex: 60x60 cm ou 3/4 polegadas"
                />
              </div>
            </div>
          </div>

          {/* Imagens */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/90 p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">Galeria de Imagens</h2>
                  {product.images.length > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
                      {product.images.length} foto(s)
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {clonedSource 
                    ? 'As fotos do produto original já foram carregadas. Você pode adicionar novas ou remover se necessário.'
                    : 'Faça upload manual ou busque fotos oficiais automaticamente na internet'
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Buscar Fotos na Web / EAN
              </button>
            </div>
            
            <AdvancedImageUpload
              onImageUploaded={handleImageUploaded}
              onImageRemove={handleImageRemove}
              currentImages={product.images}
              multiple={true}
              maxFiles={8}
              maxSize={10}
              variants={['thumbnail', 'medium', 'large']}
              showPreview={true}
            />

            <ProductImageSearchModal
              isOpen={isImageModalOpen}
              onClose={() => setIsImageModalOpen(false)}
              onSelectImages={(importedImages) => {
                setProduct((prev) => ({
                  ...prev,
                  images: [...prev.images, ...importedImages],
                }));
              }}
              initialQuery={product.name}
              initialEan={product.barcode}
              initialBrand={product.brand}
            />
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/90 p-5 sm:p-7">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Palavras-chave (Tags)</h2>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Adicionar nova tag (ex: impermeabilizante, promo, lançamento)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold text-sm flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar</span>
                </button>
              </div>

              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="text-blue-500 hover:text-blue-800 p-0.5"
                        aria-label={`Remover tag ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Configurações de Publicação */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/90 p-5 sm:p-7">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Visibilidade & Destaque</h2>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={product.active}
                  onChange={(e) => handleInputChange('active', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-bold text-gray-800">Produto Ativo na Loja</span>
                  <p className="text-xs text-gray-500">Disponível imediatamente para compras e orçamentos com a Lia</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={product.featured}
                  onChange={(e) => handleInputChange('featured', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-bold text-gray-800">Produto em Destaque</span>
                  <p className="text-xs text-gray-500">Exibir em carrosséis e vitrines principais da página inicial</p>
                </div>
              </label>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3">
            <Link
              href="/admin/produtos"
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition font-semibold text-sm text-center"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading || cloningLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-blue-500/25 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] cursor-pointer"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Cadastrando Produto...' : clonedSource ? 'Salvar Produto Clonado' : 'Salvar Novo Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NovoProductPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent"></div>
          <p className="text-sm font-semibold text-gray-600">Carregando formulário...</p>
        </div>
      </div>
    }>
      <NovoProductPageContent />
    </Suspense>
  );
}
