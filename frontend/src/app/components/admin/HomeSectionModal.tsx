'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Save,
  Layers,
  Image as ImageIcon,
  ShoppingBag,
  Sparkles,
  Percent,
  Check,
  Search,
  Grid,
  Truck,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { HomeSection } from '../../hooks/useHomeSections';
import { useCategories, useProducts } from '../../hooks/useApi';

interface HomeSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sectionData: Partial<HomeSection>) => Promise<void>;
  initialSection?: HomeSection | null;
}

const COLOR_PRESETS = [
  { name: 'Ciano Acal (Padrão)', value: '#009de0' },
  { name: 'Laranja Obra', value: '#ea580c' },
  { name: 'Azul Escuro', value: '#0284c7' },
  { name: 'Verde Oferta', value: '#059669' },
  { name: 'Vermelho Urgência', value: '#dc2626' },
  { name: 'Grafite Moderno', value: '#334155' },
];

export default function HomeSectionModal({
  isOpen,
  onClose,
  onSave,
  initialSection,
}: HomeSectionModalProps) {
  const [type, setType] = useState<HomeSection['type']>('product_carousel');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [titleColor, setTitleColor] = useState('#009de0');
  const [productSource, setProductSource] = useState<
    'category' | 'manual' | 'discount' | 'featured' | 'bestsellers' | 'newest'
  >('category');
  const [categorySlug, setCategorySlug] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [manualProductIds, setManualProductIds] = useState<string[]>([]);
  const [minDiscountPercent, setMinDiscountPercent] = useState<number>(10);
  const [limit, setLimit] = useState<number>(12);

  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerLinkUrl, setBannerLinkUrl] = useState('');
  const [bannerAlt, setBannerAlt] = useState('');

  const [saving, setSaving] = useState(false);

  // Categorias para o seletor
  const [categories, setCategories] = useState<any[]>([]);
  const categoriesApi = useCategories();

  // Produtos para a seleção manual
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const productsApi = useProducts();

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadProducts();

      if (initialSection) {
        setType(initialSection.type);
        setTitle(initialSection.title || '');
        setSubtitle(initialSection.subtitle || '');
        setTitleColor(initialSection.titleColor || '#009de0');
        setProductSource(initialSection.productSource || 'category');
        setCategorySlug(initialSection.categorySlug || '');
        setCategoryName(initialSection.categoryName || '');
        setManualProductIds(initialSection.manualProductIds || []);
        setMinDiscountPercent(initialSection.minDiscountPercent || 10);
        setLimit(initialSection.limit || 12);
        setBannerImageUrl(initialSection.bannerImageUrl || '');
        setBannerLinkUrl(initialSection.bannerLinkUrl || '');
        setBannerAlt(initialSection.bannerAlt || '');
      } else {
        // Padrão para nova seção
        setType('product_carousel');
        setTitle('');
        setSubtitle('');
        setTitleColor('#009de0');
        setProductSource('category');
        setCategorySlug('');
        setCategoryName('');
        setManualProductIds([]);
        setMinDiscountPercent(10);
        setLimit(12);
        setBannerImageUrl('');
        setBannerLinkUrl('/produtos');
        setBannerAlt('');
      }
    }
  }, [isOpen, initialSection]);

  const loadCategories = async () => {
    try {
      const res = await categoriesApi.getCategories(true);
      if (Array.isArray(res)) {
        setCategories(res);
        if (!categorySlug && res.length > 0) {
          setCategorySlug(res[0].slug);
          setCategoryName(res[0].name);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await productsApi.getProducts({ active: true, limit: 100 });
      if (res?.products && Array.isArray(res.products)) {
        setAllProducts(res.products);
      }
    } catch (err) {
      console.error('Erro ao carregar produtos para seleção manual:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  if (!isOpen) return null;

  const handleToggleProduct = (prodId: string) => {
    setManualProductIds((prev) =>
      prev.includes(prodId) ? prev.filter((id) => id !== prodId) : [...prev, prodId]
    );
  };

  const handleCategoryChange = (slug: string) => {
    setCategorySlug(slug);
    const found = categories.find((c) => c.slug === slug);
    if (found) {
      setCategoryName(found.name);
      if (!title || title === 'Nova Vitrine') {
        setTitle(`${found.name} em Oferta`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSave({
        type,
        title: title || (type === 'banner' ? 'Banner Promocional' : 'Vitrine de Produtos'),
        subtitle,
        titleColor,
        productSource,
        categorySlug,
        categoryName,
        manualProductIds,
        minDiscountPercent,
        limit,
        bannerImageUrl,
        bannerLinkUrl,
        bannerAlt: bannerAlt || title,
      });
      onClose();
    } catch (err) {
      console.error('Erro ao salvar camada:', err);
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = allProducts.filter(
    (p) =>
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.barcode?.includes(productSearch)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" suppressHydrationWarning>
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden" suppressHydrationWarning>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#009de0]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {initialSection ? 'Editar Camada da Home' : 'Adicionar Nova Camada'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize os carrosséis e banners modulares da vitrine principal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tipo de Camada */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Tipo de Camada
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setType('product_carousel')}
                className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition ${
                  type === 'product_carousel'
                    ? 'border-[#009de0] bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-[#009de0]/20'
                    : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                }`}
              >
                <ShoppingBag className="w-5 h-5 text-[#009de0]" />
                <span className="text-xs font-bold">Vitrine de Produtos</span>
                <span className="text-[10px] text-slate-500">Carrossel temático</span>
              </button>

              <button
                type="button"
                onClick={() => setType('banner')}
                className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition ${
                  type === 'banner'
                    ? 'border-[#009de0] bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-[#009de0]/20'
                    : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                }`}
              >
                <ImageIcon className="w-5 h-5 text-emerald-500" />
                <span className="text-xs font-bold">Banner Intercalado</span>
                <span className="text-[10px] text-slate-500">Destaque visual</span>
              </button>

              <button
                type="button"
                onClick={() => setType('department_shortcuts')}
                className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition ${
                  type === 'department_shortcuts'
                    ? 'border-[#009de0] bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-[#009de0]/20'
                    : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Grid className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-bold">Departamentos</span>
                <span className="text-[10px] text-slate-500">Atalhos compactos</span>
              </button>

              <button
                type="button"
                onClick={() => setType('partner_bar')}
                className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition ${
                  type === 'partner_bar'
                    ? 'border-[#009de0] bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-[#009de0]/20'
                    : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Truck className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-bold">Lojas & CEP</span>
                <span className="text-[10px] text-slate-500">Barra de parceiros</span>
              </button>
            </div>
          </div>

          {/* Configurações para Vitrine de Produtos */}
          {type === 'product_carousel' && (
            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-slate-800">
              {/* Título & Cor */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Título / Tema da Vitrine *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Ofertas Por Tempo Limitado!, Tintas em Oferta, Mais Vendidos"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#009de0] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cor do Título
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={titleColor}
                      onChange={(e) => setTitleColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0.5"
                    />
                    <select
                      value={titleColor}
                      onChange={(e) => setTitleColor(e.target.value)}
                      className="flex-1 px-2.5 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      {COLOR_PRESETS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Subtítulo Opcional */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subtítulo / Descrição Rápida (Opcional)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ex: Descontos válidos por tempo limitado com faturamento direto"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#009de0] focus:outline-none"
                />
              </div>

              {/* Fonte de Produtos */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Como selecionar os produtos para esta vitrine?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setProductSource('category')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      productSource === 'category'
                        ? 'border-[#009de0] bg-blue-50 dark:bg-blue-950/60 text-[#009de0]'
                        : 'border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    Por Categoria
                  </button>

                  <button
                    type="button"
                    onClick={() => setProductSource('discount')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      productSource === 'discount'
                        ? 'border-[#009de0] bg-blue-50 dark:bg-blue-950/60 text-[#009de0]'
                        : 'border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    Regra de Desconto
                  </button>

                  <button
                    type="button"
                    onClick={() => setProductSource('manual')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      productSource === 'manual'
                        ? 'border-[#009de0] bg-blue-50 dark:bg-blue-950/60 text-[#009de0]'
                        : 'border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Seleção Manual ({manualProductIds.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setProductSource('bestsellers')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      productSource === 'bestsellers'
                        ? 'border-[#009de0] bg-blue-50 dark:bg-blue-950/60 text-[#009de0]'
                        : 'border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Mais Vendidos
                  </button>
                </div>

                {/* Detalhe: Por Categoria */}
                {productSource === 'category' && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-200 dark:border-slate-800 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Selecione a Categoria
                    </label>
                    <select
                      value={categorySlug}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Detalhe: Regra de Desconto */}
                {productSource === 'discount' && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Desconto Mínimo: {minDiscountPercent}% OFF
                      </label>
                      <span className="text-[11px] text-emerald-600 font-bold">
                        Produtos com comparePrice &gt; price
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={minDiscountPercent}
                      onChange={(e) => setMinDiscountPercent(Number(e.target.value))}
                      className="w-full accent-[#009de0]"
                    />
                  </div>
                )}

                {/* Detalhe: Seleção Manual */}
                {productSource === 'manual' && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Escolha os produtos ({manualProductIds.length} selecionados)
                      </span>
                      {manualProductIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setManualProductIds([])}
                          className="text-[11px] text-red-500 hover:underline"
                        >
                          Limpar seleção
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Buscar por nome, SKU ou código..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-200 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-900">
                      {filteredProducts.map((p) => {
                        const isSelected = manualProductIds.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleToggleProduct(p.id)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition ${
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800'
                                : 'hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center border ${
                                  isSelected
                                    ? 'bg-[#009de0] border-[#009de0] text-white'
                                    : 'border-gray-300 dark:border-slate-600'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                              </div>
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                {p.name}
                              </span>
                            </div>
                            <span className="text-slate-500 font-bold ml-2 whitespace-nowrap">
                              R$ {p.price?.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Limite de Produtos */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Quantidade Máxima de Produtos no Carrossel: {limit}
                </label>
                <input
                  type="range"
                  min="4"
                  max="24"
                  step="2"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-full accent-[#009de0]"
                />
              </div>
            </div>
          )}

          {/* Configurações para Banner Intercalado */}
          {type === 'banner' && (
            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome / Título do Banner *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Banner Comunicação e Segurança até 50% OFF"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#009de0] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  URL da Imagem do Banner *
                </label>
                <input
                  type="url"
                  value={bannerImageUrl}
                  onChange={(e) => setBannerImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/banner-promocional.jpg ou /uploads/..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#009de0] focus:outline-none"
                />
              </div>

              {/* Prévia da Imagem do Banner */}
              {bannerImageUrl && (
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 max-h-36 flex items-center justify-center">
                  <img
                    src={bannerImageUrl}
                    alt={title || 'Prévia'}
                    className="w-full h-36 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Link de Destino ao Clicar
                </label>
                <input
                  type="text"
                  value={bannerLinkUrl}
                  onChange={(e) => setBannerLinkUrl(e.target.value)}
                  placeholder="Ex: /produtos, /busca?q=seguranca, /categoria/tintas"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#009de0] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Configurações para Departamentos / Parceiros */}
          {(type === 'department_shortcuts' || type === 'partner_bar') && (
            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título de Referência Interna
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Atalhos de Departamentos (Carrossel)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                Este bloco utiliza o layout automático integrado sincronizado com as categorias cadastradas na loja.
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-gray-50 dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#009de0] hover:bg-[#0088c6] text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : initialSection ? 'Salvar Alterações' : 'Criar Camada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
