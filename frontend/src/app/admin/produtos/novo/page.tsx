'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProducts, useCategories } from '../../../hooks/useApi';
import AdminBreadcrumb from '../../../components/admin/AdminBreadcrumb';
import AdvancedImageUpload from '../../../components/ui/AdvancedImageUpload';
import ProductImageSearchModal, { UploadedImage } from '../../../components/admin/ProductImageSearchModal';
import { getImageUrl } from '../../../utils/imageUrl';
import { ArrowLeft, Save, Upload, X, Plus, Trash2, Sparkles, Barcode } from 'lucide-react';
import Link from 'next/link';

interface ProductForm {
  name: string;
  description: string;
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

export default function NovoProductPage() {
  const router = useRouter();
  const { createProduct } = useProducts();
  const { getCategories } = useCategories();
  
  const [product, setProduct] = useState<ProductForm>(defaultProduct);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories(true);
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
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
        images: product.images && product.images.length > 0 ? product.images.map(img => ({
          url: img.url,
          alt: img.originalName || product.name.trim()
        })) : undefined,
        tags: product.tags && product.tags.length > 0 ? product.tags : undefined,
      };

      await createProduct(productData);
      
      setMessage({ type: 'success', text: 'Produto criado com sucesso!' });
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/admin/produtos');
      }, 2000);
      
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
    <div className="min-h-screen bg-gray-50">
      <AdminBreadcrumb />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/produtos"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Adicionar Produto</h1>
              <p className="text-gray-600">Cadastre um novo produto no catálogo</p>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'error' 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações Básicas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Informações Básicas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Tijolo Cerâmico 6 Furos"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={product.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descreva as características e benefícios do produto..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <select
                  value={product.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca
                </label>
                <input
                  type="text"
                  value={product.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Cerâmica São João"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU *
                </label>
                <input
                  type="text"
                  value={product.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 001435"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Barcode className="w-4 h-4 text-blue-600" />
                  Código de Barras (EAN-13)
                </label>
                <input
                  type="text"
                  value={product.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="Ex: 7891435043761"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={product.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidade de Venda *
                </label>
                <select
                  value={product.unit || 'UN'}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="UN">Unidade (UN)</option>
                  <option value="SACO">Saco (ex: Cimento, Argamassa)</option>
                  <option value="MILHEIRO">Milheiro (ex: Tijolos, Blocos)</option>
                  <option value="M2">m² - Metro Quadrado (ex: Pisos, Porcelanato)</option>
                  <option value="LATA">Lata / Galão (ex: Tintas, Verniz)</option>
                  <option value="KG">Quilo (KG) (ex: Pregos, Granel)</option>
                  <option value="METRO">Metro Linear (M) (ex: Canos, Cabos)</option>
                  <option value="BARRA">Barra (ex: Ferragens, Perfis)</option>
                  <option value="CX">Caixa (CX) (ex: Revestimentos)</option>
                  <option value="ROLO">Rolo (ex: Telas, Mangueiras)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estoque
                </label>
                <input
                  type="number"
                  min="0"
                  value={product.stock}
                  onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={product.weight}
                  onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dimensões
                </label>
                <input
                  type="text"
                  value={product.dimensions}
                  onChange={(e) => handleInputChange('dimensions', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 20x10x6 cm"
                />
              </div>
            </div>
          </div>

          {/* Imagens */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Imagens do Produto</h2>
                <p className="text-xs text-gray-500 mt-0.5">Faça upload manual ou busque fotos oficiais automaticamente na internet</p>
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Tags</h2>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nova tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Configurações */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Configurações</h2>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={product.featured}
                  onChange={(e) => handleInputChange('featured', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Produto em destaque</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={product.active}
                  onChange={(e) => handleInputChange('active', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Produto ativo</span>
              </label>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-4">
            <Link
              href="/admin/produtos"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
