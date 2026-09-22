'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Image as ImageIcon, Star, Eye, Trash2, Sparkles, Loader2, Check } from 'lucide-react';
import { useProducts } from '../../../../hooks/useApi';
import { useToast } from '../../../../components/ui/Toaster';
import AdvancedImageUpload from '../../../../components/ui/AdvancedImageUpload';
import ProductImageSearchModal from '../../../../components/admin/ProductImageSearchModal';
import Loading from '../../../../components/ui/Loading';
import { getImageUrl } from '../../../../utils/imageUrl';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  brand?: string;
  images: Array<{
    id: string;
    url: string;
    alt: string;
    order: number;
  }>;
}

interface UploadedImage {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  size?: number;
  width?: number;
  height?: number;
}

export default function ProductImagesPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const productsApi = useProducts();
  const { addToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productData = await productsApi.getProduct(productId);
      setProduct(productData);
      
      // Converter imagens do produto para o formato do componente
      const convertedImages: UploadedImage[] = (productData.images || []).map((img: any) => ({
        id: img.id,
        filename: img.url.split('/').pop() || '',
        originalName: img.alt || productData.name || 'Imagem do produto',
        url: getImageUrl(img.url),
        thumbnailUrl: getImageUrl(img.url),
        size: 0,
        width: undefined,
        height: undefined
      }));
      
      setProductImages(convertedImages);
    } catch (error: any) {
      console.error('Erro ao carregar produto:', error);
      addToast({
        type: 'error',
        title: 'Erro ao carregar produto',
        message: error.message || 'Produto não encontrado'
      });
      router.push('/admin/produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploaded = async (uploadedImage: UploadedImage) => {
    try {
      setSaving(true);
      const normalizedUploaded = {
        ...uploadedImage,
        url: getImageUrl(uploadedImage.url),
        thumbnailUrl: getImageUrl(uploadedImage.thumbnailUrl || uploadedImage.url),
      };
      
      const newImageList = [...productImages, normalizedUploaded];
      setProductImages(newImageList);

      // Persistir imediatamente na API
      await productsApi.updateProduct(productId, {
        images: newImageList.map((img, idx) => ({
          url: img.url,
          alt: img.originalName || product?.name || 'Imagem do produto',
          order: idx
        }))
      });

      addToast({
        type: 'success',
        title: 'Imagem salva',
        message: 'Nova foto adicionada ao produto com sucesso'
      });

      // Recarregar dados para sincronizar IDs do banco
      await loadProduct();
    } catch (error: any) {
      console.error('Erro ao adicionar imagem:', error);
      addToast({
        type: 'error',
        title: 'Erro ao salvar imagem',
        message: error.message || 'Erro ao sincronizar imagem no produto'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAutoImagesSelected = async (importedImages: any[]) => {
    try {
      setSaving(true);
      addToast({
        type: 'success',
        title: 'Fotos importadas',
        message: `${importedImages.length} imagem(ns) baixada(s) e vinculada(s) com sucesso!`
      });
      // Recarregar produto do backend para obter os registros reais criados
      await loadProduct();
    } catch (err: any) {
      console.error('Erro ao atualizar produto pós busca:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleImageRemove = async (imageId: string) => {
    try {
      setSaving(true);
      const remainingImages = productImages.filter(img => img.id !== imageId);
      setProductImages(remainingImages);
      
      // Atualizar o produto no banco com a nova lista sem a imagem removida
      await productsApi.updateProduct(productId, {
        images: remainingImages.map((img, idx) => ({
          url: img.url,
          alt: img.originalName || product?.name || 'Imagem do produto',
          order: idx
        }))
      });
      
      addToast({
        type: 'success',
        title: 'Imagem removida',
        message: 'Imagem removida do produto com sucesso'
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erro ao remover imagem',
        message: error.message || 'Erro ao remover imagem do produto'
      });
      await loadProduct();
    } finally {
      setSaving(false);
    }
  };

  const handleSetMainImage = async (imageId: string) => {
    try {
      setSaving(true);
      
      const mainImage = productImages.find(img => img.id === imageId);
      const otherImages = productImages.filter(img => img.id !== imageId);
      const newOrder = mainImage ? [mainImage, ...otherImages] : productImages;
      
      setProductImages(newOrder);

      // Persistir a nova ordenação no backend
      await productsApi.updateProduct(productId, {
        images: newOrder.map((img, idx) => ({
          url: img.url,
          alt: img.originalName || product?.name || 'Imagem do produto',
          order: idx
        }))
      });
      
      addToast({
        type: 'success',
        title: 'Imagem principal definida',
        message: 'A foto principal do produto foi atualizada com sucesso'
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erro ao definir imagem principal',
        message: error.message || 'Erro ao atualizar ordem das fotos'
      });
      await loadProduct();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="Carregando produto..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Produto não encontrado</h1>
          <p className="text-gray-600 mb-4">O produto solicitado não existe</p>
          <Link
            href="/admin/produtos"
            className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 transition"
          >
            Voltar para Produtos
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
              href={`/admin/produtos/${productId}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar ao Produto
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Fotos do Produto</h1>
                <p className="text-sm text-gray-500">{product.name} (SKU: {product.sku})</p>
              </div>
            </div>
          </div>

          {saving && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Salvando alterações...
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Adicionar Fotos</h2>
              <p className="text-xs text-gray-500 mt-0.5">Faça upload manual ou pesquise automaticamente fotos oficiais na internet</p>
            </div>
            <button
              type="button"
              onClick={() => setIsImageModalOpen(true)}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Buscar Fotos na Web / EAN
            </button>
          </div>

          <AdvancedImageUpload
            onImageUploaded={handleImageUploaded}
            onImageRemove={handleImageRemove}
            currentImages={productImages}
            multiple={true}
            maxFiles={10}
            variants={['thumbnail', 'small', 'medium', 'large']}
            showPreview={false}
            className={saving ? 'opacity-60 pointer-events-none' : ''}
          />

          <ProductImageSearchModal
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
            onSelectImages={handleAutoImagesSelected}
            initialQuery={product.name}
            initialEan={product.barcode}
            initialBrand={product.brand}
            productId={product.id}
          />
        </div>

        {/* Current Images */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Galeria Atual ({productImages.length})</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                A primeira foto com estrela amarela é a capa principal do produto
              </p>
            </div>
            {productImages.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> {productImages.length} foto(s) salva(s)
              </span>
            )}
          </div>

          {productImages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ImageIcon className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Nenhuma imagem cadastrada</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                Use a busca automática na Web por EAN ou envie fotos do seu computador
              </p>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Buscar Fotos Automaticamente
              </button>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {productImages.map((image, index) => {
                  const displayUrl = getImageUrl(image.thumbnailUrl || image.url);
                  const isMain = index === 0;

                  return (
                    <div 
                      key={image.id || index} 
                      className={`relative group rounded-2xl border-2 overflow-hidden bg-white transition-all duration-200 hover:shadow-lg flex flex-col ${
                        isMain ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Thumbnail Container */}
                      <div className="w-full aspect-square bg-gray-50 flex items-center justify-center p-3 relative overflow-hidden">
                        <img
                          src={displayUrl}
                          alt={image.originalName}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                          }}
                        />

                        {/* Badge Principal */}
                        {isMain && (
                          <div className="absolute top-2 left-2 z-10">
                            <div className="bg-orange-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-md shadow-orange-600/30">
                              <Star className="h-3 w-3 fill-current" />
                              Principal
                            </div>
                          </div>
                        )}

                        {/* Actions overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 backdrop-blur-[2px]">
                          <button
                            type="button"
                            onClick={() => window.open(displayUrl, '_blank')}
                            className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-xl shadow hover:scale-105 transition"
                            title="Visualizar em tamanho real"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {!isMain && (
                            <button
                              type="button"
                              onClick={() => handleSetMainImage(image.id)}
                              disabled={saving}
                              className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-xl shadow hover:scale-105 transition disabled:opacity-50"
                              title="Definir como foto principal"
                            >
                              <Star className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Deseja realmente remover esta foto do produto?')) {
                                handleImageRemove(image.id);
                              }
                            }}
                            disabled={saving}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl shadow hover:scale-105 transition disabled:opacity-50"
                            title="Remover foto do produto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Image info footer */}
                      <div className="p-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-700 truncate pr-2" title={image.originalName}>
                          Posição {index + 1}
                        </span>
                        {!isMain && (
                          <button
                            type="button"
                            onClick={() => handleSetMainImage(image.id)}
                            disabled={saving}
                            className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline"
                          >
                            Tornar Principal
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-bold text-blue-950 text-sm mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Dicas para otimização de imagens:
          </h3>
          <ul className="text-xs text-blue-900 space-y-1.5">
            <li>• Use a ferramenta <strong>"Buscar Fotos na Web / EAN"</strong> para localizar fotos oficiais do fabricante com fundo limpo.</li>
            <li>• As imagens importadas são automaticamente convertidas para o padrão moderno <strong>WebP</strong> e otimizadas em múltiplos tamanhos (miniatura, catálogo e zoom).</li>
            <li>• A foto com o selo <strong>"Principal"</strong> será a capa exibida na vitrine da loja, nas buscas e nos carrosséis.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}