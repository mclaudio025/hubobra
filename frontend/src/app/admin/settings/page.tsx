'use client';

import { useEffect, useState } from 'react';
import {
  Sliders,
  Layers,
  MessageSquare,
  Store,
  Save,
  CheckCircle2,
  Clock,
  ShieldCheck,
  HelpCircle,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  ShoppingBag,
  Image as ImageIcon,
  Grid,
  Truck,
  RotateCcw,
  Sparkles,
  ExternalLink,
  MapPin,
  Search,
  PackageCheck,
} from 'lucide-react';
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb';
import HomeSectionModal from '../../components/admin/HomeSectionModal';
import { useHomeSections, HomeSection } from '../../hooks/useHomeSections';
import { useSettings } from '../../hooks/useSettings';
import { useApi } from '../../hooks/useApi';
import { STORE_CONFIG } from '@/config/store.config';

import { SHIPPING_CONFIG, DEFAULT_FREE_NEIGHBORHOODS } from '@/config/shipping.config';

export default function AdminSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'home_builder' | 'system' | 'marketplace' | 'whatsapp' | 'shipping'>('home_builder');

  // Hooks para Camadas da Home
  const {
    sections,
    setSections,
    loading: sectionsLoading,
    saving: sectionsSaving,
    fetchAdminSections,
    saveSections,
    addSection,
    updateSection,
    deleteSection,
    resetDefaultSections,
  } = useHomeSections();

  // Modal de Criação / Edição de Seção
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);

  // Configurações do Sistema
  const [carouselInterval, setCarouselInterval] = useState<number>(5);
  const [partnerCommission, setPartnerCommission] = useState<number>(10);
  const [whatsappNumber, setWhatsappNumber] = useState<string>(STORE_CONFIG.contact.whatsapp);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Configurações de Frete & Entregas Regionais (Fortaleza & RMF)
  const [standardFee, setStandardFee] = useState<number>(SHIPPING_CONFIG.rates.standardDeliveryFee);
  const [rmfFee, setRmfFee] = useState<number>(SHIPPING_CONFIG.rates.rmfDeliveryFee);
  const [interiorFee, setInteriorFee] = useState<number>(SHIPPING_CONFIG.rates.interiorDeliveryFee);
  const [pickupEnabled, setPickupEnabled] = useState<boolean>(SHIPPING_CONFIG.pickup.enabled);
  const [pickupAddress, setPickupAddress] = useState<string>(SHIPPING_CONFIG.pickup.address);
  const [pickupInstructions, setPickupInstructions] = useState<string>(SHIPPING_CONFIG.pickup.instructions);
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>('');

  const { getSetting, loading: settingsLoading } = useSettings();
  const { apiCall } = useApi();

  const handleSaveShippingSettings = () => {
    setSavingSettings(true);
    setTimeout(() => {
      setSavingSettings(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }, 400);
  };

  useEffect(() => {
    setMounted(true);
    fetchAdminSections();
  }, []);

  useEffect(() => {
    if (!settingsLoading) {
      const intervalMs = getSetting('carousel_autoplay_interval', 5000);
      setCarouselInterval(intervalMs / 1000);
    }
  }, [settingsLoading, getSetting]);

  // Reordenação manual
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);

    const reordered = newSections.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSections(reordered);
  };

  const toggleSectionEnabled = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleOpenAddModal = () => {
    setEditingSection(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sec: HomeSection) => {
    setEditingSection(sec);
    setIsModalOpen(true);
  };

  const handleSaveModalSection = async (sectionData: Partial<HomeSection>) => {
    if (editingSection) {
      await updateSection(editingSection.id, sectionData);
    } else {
      await addSection(sectionData);
    }
    await fetchAdminSections();
  };

  const handleDeleteSection = async (id: string, title?: string) => {
    if (confirm(`Deseja realmente remover a camada "${title || id}"?`)) {
      await deleteSection(id);
    }
  };

  const handleResetDefault = async () => {
    if (
      confirm(
        'Deseja restaurar a estrutura padrão inspirada na Acal Home Center? Suas alterações serão substituídas pelo modelo padrão.'
      )
    ) {
      await resetDefaultSections();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleSaveAllSections = async () => {
    try {
      await saveSections(sections);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Erro ao salvar as camadas da home.');
    }
  };

  const handleSaveSystemSettings = async () => {
    try {
      setSavingSettings(true);
      const intervalMs = carouselInterval * 1000;

      await apiCall('/api/settings/carousel_autoplay_interval', {
        method: 'PUT',
        requireAuth: true,
        body: { value: intervalMs },
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações do sistema.');
    } finally {
      setSavingSettings(false);
    }
  };

  if (!mounted || sectionsLoading) {
    return (
      <div className="space-y-6" suppressHydrationWarning>
        <AdminBreadcrumb />
        <div className="h-40 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center justify-center" suppressHydrationWarning>
          <div className="flex items-center gap-3 text-slate-500 font-medium" suppressHydrationWarning>
            <div className="w-5 h-5 border-2 border-[#009de0] border-t-transparent rounded-full animate-spin" />
            Carregando configurações...
          </div>
        </div>
      </div>
    );
  }

  const getSectionIcon = (type: HomeSection['type']) => {
    switch (type) {
      case 'product_carousel':
        return <ShoppingBag className="w-5 h-5 text-[#009de0]" />;
      case 'banner':
        return <ImageIcon className="w-5 h-5 text-emerald-500" />;
      case 'department_shortcuts':
        return <Grid className="w-5 h-5 text-amber-500" />;
      case 'partner_bar':
        return <Truck className="w-5 h-5 text-indigo-500" />;
      default:
        return <Layers className="w-5 h-5 text-slate-500" />;
    }
  };

  const getSectionSourceBadge = (section: HomeSection) => {
    if (section.type === 'banner') {
      return (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          Banner Intercalado
        </span>
      );
    }
    if (section.type === 'department_shortcuts') {
      return (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          Carrossel de Departamentos
        </span>
      );
    }
    if (section.type === 'product_carousel') {
      switch (section.productSource) {
        case 'category':
          return (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Categoria: {section.categoryName || section.categorySlug || 'Todas'}
            </span>
          );
        case 'discount':
          return (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800">
              Desconto ≥ {section.minDiscountPercent || 10}% OFF
            </span>
          );
        case 'manual':
          return (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Manual ({section.manualProductIds?.length || 0} produtos)
            </span>
          );
        case 'bestsellers':
          return (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Mais Vendidos
            </span>
          );
        default:
          return (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Destaques
            </span>
          );
      }
    }
    return null;
  };

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <AdminBreadcrumb />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Construtor da Home & Configurações
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Personalize a ordem das camadas, crie vitrines temáticas e intercale banners no padrão da Acal Home Center
          </p>
        </div>
        {saveSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-xl text-sm font-medium animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Configurações salvas com sucesso!
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 rounded-t-xl gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('home_builder')}
          className={`py-4 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'home_builder'
              ? 'border-[#009de0] text-[#009de0]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-gray-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          Construtor da Home (Camadas & Vitrines)
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`py-4 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'system'
              ? 'border-[#009de0] text-[#009de0]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-gray-300'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Sistema & Carrosséis
        </button>
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`py-4 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'marketplace'
              ? 'border-[#009de0] text-[#009de0]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-gray-300'
          }`}
        >
          <Store className="w-4 h-4" />
          Rede de Lojistas Parceiros
        </button>
        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`py-4 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'whatsapp'
              ? 'border-[#009de0] text-[#009de0]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-gray-300'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          WhatsApp & Cotações
        </button>
        <button
          onClick={() => setActiveTab('shipping')}
          className={`py-4 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'shipping'
              ? 'border-[#009de0] text-[#009de0]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-gray-300'
          }`}
        >
          <Truck className="w-4 h-4 text-[#009de0]" />
          Frete & Entregas (Fortaleza & RMF)
        </button>
      </div>

      {/* Tab: Construtor da Home */}
      {activeTab === 'home_builder' && (
        <div className="space-y-6">
          {/* Top Actions Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 bg-[#009de0] hover:bg-[#0088c6] text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                Adicionar Nova Camada
              </button>
              <button
                onClick={handleResetDefault}
                className="inline-flex items-center gap-1.5 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs px-3 py-2.5 rounded-xl transition"
                title="Restaura a sequência padrão estilo Acal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar Padrão Acal
              </button>
            </div>

            <button
              onClick={handleSaveAllSections}
              disabled={sectionsSaving}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {sectionsSaving ? 'Salvando...' : 'Salvar Ordem & Alterações'}
            </button>
          </div>

          {/* Lista de Camadas / Blocos */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Sequência de Camadas da Home ({sections.length} blocos)
              </span>
              <span className="text-xs text-slate-400">
                Use as setas ▲/▼ para mudar a ordem ou clique em Editar
              </span>
            </div>

            <div className="space-y-3">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
                    sec.enabled
                      ? 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/60 shadow-xs'
                      : 'bg-gray-50 dark:bg-slate-900/40 border-dashed border-gray-300 dark:border-slate-800 opacity-60'
                  }`}
                >
                  {/* Left: Position Number & Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 flex-shrink-0">
                      {getSectionIcon(sec.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className="font-bold text-sm truncate"
                          style={{ color: sec.titleColor || undefined }}
                        >
                          {sec.title || sec.id}
                        </h4>
                        {getSectionSourceBadge(sec)}
                        {!sec.enabled && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-gray-400 uppercase">
                            Oculto
                          </span>
                        )}
                      </div>
                      {sec.subtitle && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {sec.subtitle}
                        </p>
                      )}
                      {sec.bannerImageUrl && (
                        <p className="text-[11px] text-blue-500 truncate mt-0.5">
                          Banner: {sec.bannerImageUrl}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    {/* Move Up */}
                    <button
                      onClick={() => moveSection(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition"
                      title="Mover para cima"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => moveSection(idx, 'down')}
                      disabled={idx === sections.length - 1}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition"
                      title="Mover para baixo"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Toggle Active */}
                    <button
                      onClick={() => toggleSectionEnabled(sec.id)}
                      className={`p-1.5 rounded-lg border transition ${
                        sec.enabled
                          ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                          : 'border-gray-200 dark:border-slate-700 text-gray-400'
                      }`}
                      title={sec.enabled ? 'Ocultar camada' : 'Exibir camada'}
                    >
                      {sec.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEditModal(sec)}
                      className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/60 text-blue-600 hover:bg-blue-100 transition"
                      title="Editar configurações da camada"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteSection(sec.id, sec.title)}
                      className="p-1.5 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/60 text-red-600 hover:bg-red-100 transition"
                      title="Excluir camada"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Sistema & Carrosséis */}
      {activeTab === 'system' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Velocidade de Transição do Carrossel Hero
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              Tempo de permanência automática em cada slide do banner principal (em segundos)
            </p>
            <div className="flex items-center gap-4 mt-3">
              <input
                type="range"
                min="3"
                max="15"
                step="1"
                value={carouselInterval}
                onChange={(e) => setCarouselInterval(Number(e.target.value))}
                className="w-64 accent-[#009de0]"
              />
              <span className="font-bold text-sm text-[#009de0]">{carouselInterval}s</span>
            </div>
          </div>

          <button
            onClick={handleSaveSystemSettings}
            disabled={savingSettings}
            className="inline-flex items-center gap-2 bg-[#009de0] hover:bg-[#0088c6] text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {savingSettings ? 'Salvando...' : 'Salvar Ajustes do Sistema'}
          </button>
        </div>
      )}

      {/* Tab: Marketplace */}
      {activeTab === 'marketplace' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-orange-600" />
                Rede de Lojas Parceiras & Marketplace
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Configure as taxas de comissão e a exibição da barra de depósitos parceiros na Home
              </p>
            </div>

            <button
              onClick={() => {
                setSavingSettings(true);
                setTimeout(() => {
                  setSavingSettings(false);
                  setSaveSuccess(true);
                  setTimeout(() => setSaveSuccess(false), 3000);
                }, 300);
              }}
              disabled={savingSettings}
              className="inline-flex items-center gap-2 bg-[#009de0] hover:bg-[#0088c6] text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingSettings ? 'Salvando...' : 'Salvar Ajustes de Parceiros'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Comissão da HubConstruções sobre Lojistas Parceiros
              </label>
              <p className="text-slate-500 text-xs mb-2">
                Taxa percentual retida nas vendas intermediadas pela plataforma
              </p>
              <div className="flex items-center gap-2 max-w-xs">
                <input
                  type="number"
                  value={partnerCommission}
                  onChange={(e) => setPartnerCommission(Number(e.target.value))}
                  className="px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold w-24"
                />
                <span className="font-bold text-slate-600 dark:text-slate-300">%</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Região / Cidade de Operação Principal
              </label>
              <p className="text-slate-500 text-xs mb-2">
                Exibida como praça padrão para os clientes no banner da Home
              </p>
              <input
                type="text"
                defaultValue="Fortaleza e Região Metropolitana (CE)"
                className="w-full max-w-sm px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: WhatsApp */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Número Central de Atendimento & Cotações
          </h3>
          <p className="text-slate-500 text-xs">
            Número no formato internacional com DDD (ex: 5585999999999) para orçamentos rápidos
          </p>
          <input
            type="text"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm max-w-sm"
          />
        </div>
      )}

      {/* Tab: Frete & Entregas Regionais (Fortaleza & RMF) */}
      {activeTab === 'shipping' && (
        <div className="space-y-6">
          {/* Top Status Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-6 rounded-2xl text-white shadow-sm border border-blue-800/60 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Hub Base: Fortaleza - Ceará
                </div>
                <h2 className="text-xl font-black tracking-tight">
                  Regras de Frete Regional Inteligente
                </h2>
                <p className="text-blue-200 text-xs mt-1 max-w-2xl leading-relaxed">
                  O sistema identifica o CEP e o Bairro digitados pelo cliente no Carrinho e no Checkout, aplicando automaticamente a isenção de frete para bairros centrais ou calculando as taxas por zona regional.
                </p>
              </div>

              <button
                onClick={handleSaveShippingSettings}
                disabled={savingSettings}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl shadow-lg transition disabled:opacity-50 self-start md:self-auto"
              >
                <Save className="w-4 h-4" />
                {savingSettings ? 'Salvando...' : 'Salvar Regras de Frete'}
              </button>
            </div>
          </div>

          {/* Grid de Taxas de Frete */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Fortaleza - Demais Bairros */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Zona 1 • Fortaleza
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Demais Bairros
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Taxa Padrão Fortaleza
              </h3>
              <p className="text-xs text-slate-500">
                Aplicada a bairros de Fortaleza fora da lista de isenção gratuita.
              </p>
              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Valor da Taxa (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.50"
                    value={standardFee}
                    onChange={(e) => setStandardFee(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Região Metropolitana de Fortaleza */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Zona 2 • RMF
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Região Metropolitana
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Taxa RMF (Caucaia, Eusébio...)
              </h3>
              <p className="text-xs text-slate-500">
                Aplicada a Caucaia, Maracanaú, Eusébio, Aquiraz, Maranguape e cidades vizinhas.
              </p>
              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Valor da Taxa (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.50"
                    value={rmfFee}
                    onChange={(e) => setRmfFee(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Interior do Ceará */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Zona 3 • Interior
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Interior CE
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Taxa Interior do Ceará
              </h3>
              <p className="text-xs text-slate-500">
                Aplicada aos municípios do interior do estado (Sobral, Juazeiro, etc.).
              </p>
              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Valor da Taxa (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.50"
                    value={interiorFee}
                    onChange={(e) => setInteriorFee(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Configuração de Ponto de Retirada */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Retirada no Ponto de Coleta / Galpão Parceiro
                  </h3>
                  <p className="text-xs text-slate-500">
                    Permite ao cliente retirar o material diretamente no CD sem custo de frete (R$ 0,00)
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pickupEnabled}
                  onChange={(e) => setPickupEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Localização / Identificação do Ponto
                </label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Ex: Ponto de Coleta Central - Fortaleza, CE"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Instruções de Retirada (exibidas no Checkout)
                </label>
                <input
                  type="text"
                  value={pickupInstructions}
                  onChange={(e) => setPickupInstructions(e.target.value)}
                  placeholder="Ex: Após a confirmação, enviaremos o código e localização exata via WhatsApp."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Bairros de Fortaleza com Frete Grátis */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Bairros de Fortaleza com Frete Grátis
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {DEFAULT_FREE_NEIGHBORHOODS.length} Bairros Cadastrados
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Qualquer CEP ou bairro correspondente abaixo recebe 100% de isenção de taxa de entrega automaticamente.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar bairro..."
                  value={neighborhoodFilter}
                  onChange={(e) => setNeighborhoodFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Lista de tags de bairros */}
            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-gray-100 dark:border-slate-800">
              {DEFAULT_FREE_NEIGHBORHOODS.filter((bairro) =>
                bairro.toLowerCase().includes(neighborhoodFilter.toLowerCase())
              ).map((bairro, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-xs capitalize"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {bairro}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <HomeSectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModalSection}
        initialSection={editingSection}
      />
    </div>
  );
}
