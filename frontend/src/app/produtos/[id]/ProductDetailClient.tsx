'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Heart, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Truck, 
  Shield, 
  ChevronRight, 
  X, 
  MapPin, 
  Clock, 
  Package, 
  Maximize, 
  RotateCcw, 
  Box, 
  MessageCircle 
} from 'lucide-react';
import { useProducts } from '../../hooks/useApi';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { getWhatsAppProductQuoteLink } from '@/config/store.config';
import { useToast } from '../../components/ui/Toaster';
import Loading from '../../components/ui/Loading';
import Product360Gallery from '@/components/Product360Gallery';
import ARSimulator from '@/components/ARSimulator';
import ProductSpecsAdvanced from '@/components/ProductSpecsAdvanced';
import ProductRecommendations from '@/components/ProductRecommendations';
import ProductAIAssistants from '@/app/components/ProductAIAssistants';
import ProductReviews from '@/app/components/ProductReviews';
import ProductShippingTab from '@/app/components/ProductShippingTab';

interface Product {
  id: string;
  name: string;
  description: string;
  specifications: string;
  price: number;
  stock: number;
  unit?: string;
  sku: string;
  barcode: string;
  brand: string;
  weight: number;
  dimensions: string;
  active: boolean;
  featured: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: Array<{
    id: string;
    url: string;
    alt: string;
    order: number;
  }>;
  tags: Array<{
    tag: {
      name: string;
      slug: string;
    };
  }>;
}

export default function ProductDetailClient({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [show360Gallery, setShow360Gallery] = useState(false);
  const [showARSimulator, setShowARSimulator] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const [shippingInfo, setShippingInfo] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const productsApi = useProducts();
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (productId) {
      loadProduct();
      loadRelatedProducts();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productData = await productsApi.getProduct(productId);
      setProduct(productData);
    } catch (error: any) {
      console.error('Erro ao carregar produto:', error);
      addToast({
        type: 'error',
        title: 'Produto não encontrado',
        message: 'O produto solicitado não existe ou foi removido'
      });
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedProducts = async () => {
    try {
      const response = await productsApi.getProducts(1, 4);
      setRelatedProducts(response.data?.slice(0, 4) || []);
    } catch (error) {
      console.error('Erro ao carregar produtos relacionados:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      await addToCart(product.id, quantity);
      addToast({
        type: 'success',
        title: 'Produto adicionado',
        message: `${product.name} foi adicionado ao carrinho`
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível adicionar o produto ao carrinho'
      });
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (product && newQuantity > product.stock) {
      addToast({
        type: 'error',
        title: 'Estoque insuficiente',
        message: `Apenas ${product.stock} unidades disponíveis`
      });
      return;
    }
    setQuantity(newQuantity);
  };

  const calculateShipping = async () => {
    if (!zipCode || zipCode.length !== 8) {
      addToast({
        type: 'error',
        title: 'CEP inválido',
        message: 'Digite um CEP válido com 8 dígitos'
      });
      return;
    }

    setShippingInfo({
      normal: { days: '5-7', price: 15.90 },
      express: { days: '2-3', price: 25.90 },
      pickup: { days: '1', price: 0 }
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Produto não encontrado</h1>
          <p className="text-gray-600 mb-4">O produto que você está procurando não existe</p>
          <Link
            href="/"
            className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 transition"
          >
            Voltar à Loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Início
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Link 
              href={`/categoria/${product.category?.slug || 'geral'}`}
              className="text-gray-600 hover:text-gray-900"
            >
              {product.category?.name || 'Categoria'}
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900 font-medium truncate">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
              {product.images && product.images.length > 0 ? (
                <>
                  <img
                    src={product.images[selectedImageIndex]?.url}
                    alt={product.images[selectedImageIndex]?.alt || product.name}
                    className="w-full h-full object-contain p-4 cursor-zoom-in"
                    onClick={() => setShowImageModal(true)}
                  />
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setShowImageModal(true)}
                      className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition"
                      title="Ampliar imagem"
                    >
                      <Maximize className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setShow360Gallery(true)}
                      className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition"
                      title="Visualização 360°"
                    >
                      <RotateCcw className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setShowARSimulator(true)}
                      className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition"
                      title="Realidade Aumentada"
                    >
                      <Box className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={image.id || index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                      selectedImageIndex === index
                        ? 'border-orange-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.alt || product.name}
                      className="w-full h-full object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and Brand */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">Marca:</span>
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">{product.brand || 'Geral'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">{product.name}</h1>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500">SKU: {product.sku || 'N/A'}</span>
                {product.barcode && (
                  <span className="text-xs text-slate-500">Código: {product.barcode}</span>
                )}
              </div>
            </div>

            {/* Marketplace Partner Guarantee Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-200">
                    Vendido por: <strong className="text-orange-400">Depósito Parceiro Oficial HubConstruções</strong>
                  </span>
                </div>
                <span className="text-[10px] bg-slate-800 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                  ★ 4.9 Verificado
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                📦 Estoque físico garantido para entrega rápida na obra ou retirada imediata.
              </p>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-br from-slate-50 to-orange-50/40 dark:from-slate-900 dark:to-slate-800/80 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800">
              <div className="text-3xl font-black text-slate-950 dark:text-white mb-1 flex items-baseline gap-1.5 flex-wrap">
                <span>{formatCurrency(product.price)}</span>
                {product.unit && product.unit !== 'UN' && product.unit !== 'un' && (
                  <span className="text-base font-semibold text-slate-500 dark:text-slate-400">
                    /{product.unit === 'M2' || product.unit === 'm2' ? 'm²' : product.unit.toLowerCase()}
                  </span>
                )}
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                no PIX com 5% de desconto ou em até 12x no cartão
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                    {product.stock > 10 ? 'Pronta-Entrega na Região' : `Últimas ${product.stock} ${product.unit ? (product.unit === 'M2' ? 'm²' : product.unit.toLowerCase()) : 'unidades'} no estoque do parceiro`}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
                  <span className="text-amber-600 text-sm font-bold">Disponível sob encomenda para entrega direta</span>
                </>
              )}
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Quantidade {product.unit && product.unit !== 'UN' ? `(${product.unit === 'M2' ? 'em m²' : `em ${product.unit.toLowerCase()}`})` : ''}:
                </span>
                <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 font-black text-sm">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-slate-950 font-black py-3.5 px-6 rounded-xl hover:from-orange-600 hover:to-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Adicionar ao Carrinho</span>
                </button>
                
                {/* Wholesale WhatsApp Quote Button */}
                <a
                  href={getWhatsAppProductQuoteLink(product.name, quantity)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Cotar Grande Quantidade</span>
                </a>
              </div>
            </div>

            {/* Shipping Calculator */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900/60">
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-orange-500" />
                Calcular Frete na sua Obra
              </h3>
              
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Digite seu CEP da obra"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="flex-1 border border-slate-300 dark:border-slate-700 bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={calculateShipping}
                  className="bg-slate-900 dark:bg-orange-500 text-white dark:text-slate-950 font-bold px-4 py-2 rounded-xl hover:opacity-90 transition text-xs"
                >
                  Calcular
                </button>
              </div>

              {shippingInfo && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Entrega Normal</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatCurrency(shippingInfo.normal.price)}</div>
                      <div className="text-xs text-gray-500">{shippingInfo.normal.days} dias úteis</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Entrega Expressa</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatCurrency(shippingInfo.express.price)}</div>
                      <div className="text-xs text-gray-500">{shippingInfo.express.days} dias úteis</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Retirar na Loja</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">Grátis</div>
                      <div className="text-xs text-gray-500">Disponível hoje</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
                <div>
                  <div className="text-sm font-medium text-green-900">Garantia</div>
                  <div className="text-xs text-green-700">12 meses</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Truck className="h-6 w-6 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-blue-900">Entrega Rápida</div>
                  <div className="text-xs text-blue-700">Todo Brasil</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-2 md:space-x-8 overflow-x-auto pb-px">
              {[
                { id: 'description', label: 'Descrição' },
                { id: 'specifications', label: 'Especificações Técnicas' },
                { id: 'reviews', label: 'Avaliações' },
                { id: 'shipping', label: 'Entrega e Frete na Obra' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-3 border-b-2 font-bold text-sm whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600 bg-orange-50/30 rounded-t-lg'
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm leading-relaxed text-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Sobre o Produto</h3>
                  <p className="text-sm md:text-base leading-relaxed text-gray-700 whitespace-pre-line">
                    {product.description || 'Descrição detalhada não informada pelo fabricante.'}
                  </p>
                  
                  {product.tags && product.tags.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2.5">
                        Categorias e Tags Relacionadas:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tagItem, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs font-medium border border-gray-200"
                          >
                            #{tagItem.tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'specifications' && (
              <ProductSpecsAdvanced 
                product={product} 
                onSpecsUpdated={(updated) => setProduct(updated)}
              />
            )}

            {activeTab === 'reviews' && (
              <ProductReviews 
                productId={product.id} 
                productName={product.name} 
              />
            )}

            {activeTab === 'shipping' && (
              <ProductShippingTab 
                productPrice={product.price} 
                productWeight={product.weight}
                productName={product.name}
              />
            )}
          </div>
        </div>

        {/* Product Recommendations */}
        <div className="mt-16">
          <ProductRecommendations 
            currentProduct={product} 
            relatedProducts={relatedProducts}
          />
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 bg-white p-2 rounded-full hover:bg-gray-100 transition z-10"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
            
            <img
              src={product.images[selectedImageIndex]?.url}
              alt={product.images[selectedImageIndex]?.alt || product.name}
              className="max-w-full max-h-full object-contain"
            />
            
            {product.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition ${
                      selectedImageIndex === index ? 'bg-white' : 'bg-white bg-opacity-50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 360° Gallery Modal */}
      {show360Gallery && (
        <Product360Gallery
          product={product}
          isOpen={show360Gallery}
          onClose={() => setShow360Gallery(false)}
        />
      )}

      {/* AR Simulator Modal */}
      {showARSimulator && (
        <ARSimulator
          product={product}
          isOpen={showARSimulator}
          onClose={() => setShowARSimulator(false)}
        />
      )}

      {/* Assistentes IA contextuais para o produto */}
      <ProductAIAssistants product={product} />
    </div>
  );
}
