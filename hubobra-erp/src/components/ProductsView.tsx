import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit,
  RefreshCw,
  AlertTriangle,
  Check,
  Layers,
  Globe,
  Sparkles,
  DownloadCloud,
  CheckCircle2,
  Tag,
  Percent,
  Sliders,
  Store,
  ExternalLink,
} from 'lucide-react';
import { db, LocalProduct } from '../db/db';
import { MASTER_CATALOG_PRESET } from '../db/masterCatalogSeed';
import { syncService } from '../services/syncService';

export const ProductsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LOCAL_STORE' | 'MASTER_CATALOG'>('LOCAL_STORE');
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<LocalProduct | null>(null);

  // Estados do Catálogo Mestre
  const [masterProducts, setMasterProducts] = useState<LocalProduct[]>(MASTER_CATALOG_PRESET);
  const [masterSearch, setMasterSearch] = useState<string>('');
  const [masterCategory, setMasterCategory] = useState<string>('TODOS');
  const [selectedMasterIds, setSelectedMasterIds] = useState<string[]>([]);
  const [defaultMarginPercent, setDefaultMarginPercent] = useState<number>(35);
  const [defaultInitialStock, setDefaultInitialStock] = useState<number>(10);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 4000);
  };

  const loadProducts = async () => {
    const list = await db.products.toArray();
    setProducts(list);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleImportRemote = async () => {
    setIsImporting(true);
    const res = await syncService.importCatalogFromNest();
    if (res.success) {
      showToast(`🎉 Catálogo atualizado com a nuvem! ${res.count} produtos sincronizados.`);
      await loadProducts();
    } else {
      showToast('⚠️ Sincronizado com a base local.');
    }
    setIsImporting(false);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    await db.products.put({
      ...editingProduct,
      updatedAt: new Date().toISOString(),
      synced: false,
    });

    setEditingProduct(null);
    showToast(`✅ Produto "${editingProduct.name}" salvo com sucesso!`);
    await loadProducts();
  };

  // Importar um único produto do Catálogo Mestre para a Loja
  const handleCloneSingleFromMaster = async (masterProd: LocalProduct) => {
    const cost = masterProd.cost || masterProd.price * 0.65;
    const finalPrice =
      defaultMarginPercent > 0
        ? Number((cost * (1 + defaultMarginPercent / 100)).toFixed(2))
        : masterProd.price;

    const newStoreProduct: LocalProduct = {
      ...masterProd,
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sku: `LOJA-${masterProd.sku.replace('MST-', '')}`,
      price: finalPrice,
      cost: cost,
      stock: defaultInitialStock,
      reservedStock: 0,
      isMaster: false,
      masterProductId: masterProd.id,
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    await db.products.put(newStoreProduct);
    await loadProducts();
    showToast(`✨ "${masterProd.name}" importado para a sua loja por R$ ${finalPrice.toFixed(2)}!`);
  };

  // Importar múltiplos produtos selecionados em lote com margem aplicada
  const handleCloneBatchFromMaster = async () => {
    if (selectedMasterIds.length === 0) return;

    const toClone = masterProducts.filter((p) => selectedMasterIds.includes(p.id));
    const newItems: LocalProduct[] = toClone.map((masterProd) => {
      const cost = masterProd.cost || masterProd.price * 0.65;
      const finalPrice =
        defaultMarginPercent > 0
          ? Number((cost * (1 + defaultMarginPercent / 100)).toFixed(2))
          : masterProd.price;

      return {
        ...masterProd,
        id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        sku: `LOJA-${masterProd.sku.replace('MST-', '')}`,
        price: finalPrice,
        cost: cost,
        stock: defaultInitialStock,
        reservedStock: 0,
        isMaster: false,
        masterProductId: masterProd.id,
        updatedAt: new Date().toISOString(),
        synced: false,
      };
    });

    await db.products.bulkPut(newItems);
    await loadProducts();
    setSelectedMasterIds([]);
    showToast(
      `🎉 ${newItems.length} produto(s) importados com sucesso com margem de +${defaultMarginPercent}%!`
    );
  };

  // Categorias da Loja Local
  const localCategories = ['TODOS', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredLocal = products.filter((p) => {
    const matchCat = selectedCategory === 'TODOS' || p.category === selectedCategory;
    const matchSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));
    return matchCat && matchSearch;
  });

  // Categorias do Catálogo Mestre
  const masterCategories = ['TODOS', ...Array.from(new Set(masterProducts.map((p) => p.category)))];

  const filteredMaster = masterProducts.filter((p) => {
    const matchCat = masterCategory === 'TODOS' || p.category === masterCategory;
    const matchSearch =
      !masterSearch ||
      p.name.toLowerCase().includes(masterSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(masterSearch.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(masterSearch.toLowerCase())) ||
      (p.ncm && p.ncm.includes(masterSearch));
    return matchCat && matchSearch;
  });

  // IDs dos produtos mestres que a loja já importou
  const alreadyImportedMasterIds = new Set(
    products.map((p) => p.masterProductId).filter(Boolean)
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 font-sans">
      {/* TOAST FLUTUANTE DE NOTIFICAÇÃO */}
      {toastNotification && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold text-xs animate-in slide-in-from-top-3 border border-emerald-400/40">
          <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
          <span>{toastNotification}</span>
        </div>
      )}

      {/* TOP HEADER & TABS SWITCHER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-amber-500/20 text-amber-400 font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
              Gestão de Catálogo SaaS
            </span>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-400 font-mono px-2 py-0.5 rounded-full border border-cyan-500/30">
              Supabase Integrado
            </span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" />
            <span>Controle de Estoque & Catálogo de Materiais</span>
          </h2>
          <p className="text-xs text-slate-400">
            Gerencie o estoque local da sua loja ou importe centenas de produtos pré-cadastrados do Catálogo Mestre HubObra em 1 clique!
          </p>
        </div>

        {/* ABAS: ESTOQUE LOCAL vs CATÁLOGO MESTRE */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('LOCAL_STORE')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'LOCAL_STORE'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Estoque da Minha Loja ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MASTER_CATALOG')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'MASTER_CATALOG'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-black'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Catálogo Mestre HubObra (4.000+)</span>
            <span className="text-[9px] bg-slate-950/80 text-emerald-300 px-1.5 py-0.5 rounded-full">
              NOVO
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: ESTOQUE DA MINHA LOJA (LOCAL) */}
      {/* ========================================================================= */}
      {activeTab === 'LOCAL_STORE' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Ações Rápidas do Estoque Local */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex-1 w-full relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por descrição, SKU ou código de barras na sua loja..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-white text-xs focus:border-amber-500 focus:outline-none shadow-inner"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={handleImportRemote}
                disabled={isImporting}
                className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-2xl flex items-center gap-1.5 border border-slate-700 transition-colors"
                title="Sincronizar dados com o Supabase e Cloud"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isImporting ? 'animate-spin text-amber-400' : ''}`} />
                <span>Sincronizar Nuvem</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setEditingProduct({
                    id: 'p-' + Date.now(),
                    sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
                    name: '',
                    price: 0,
                    cost: 0,
                    stock: 0,
                    minStock: 5,
                    reservedStock: 0,
                    unit: 'UN',
                    category: 'Materiais Básicos',
                    updatedAt: new Date().toISOString(),
                    synced: false,
                  })
                }
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-2xl flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Cadastrar Produto Manual</span>
              </button>
            </div>
          </div>

          {/* Categorias da Loja */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {localCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tabela de Produtos da Loja */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">SKU / Código</th>
                    <th className="p-3.5">Descrição do Material</th>
                    <th className="p-3.5">Categoria / NCM</th>
                    <th className="p-3.5">Unidade</th>
                    <th className="p-3.5 text-right">Preço Custo</th>
                    <th className="p-3.5 text-right">Preço Venda</th>
                    <th className="p-3.5 text-right">Margem</th>
                    <th className="p-3.5 text-center">Estoque Local</th>
                    <th className="p-3.5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {filteredLocal.map((p) => {
                    const margin = p.price > 0 ? (((p.price - p.cost) / p.price) * 100).toFixed(1) : '0';
                    const isLowStock = p.stock <= p.minStock;

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/60 transition-colors">
                        <td className="p-3.5 font-mono text-amber-400 font-bold">{p.sku}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-white text-xs">{p.name}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            {p.brand && <span className="text-amber-300 font-medium">Marca: {p.brand}</span>}
                            <span>•</span>
                            <span>{p.location || 'Depósito Central'}</span>
                            {p.masterProductId && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                Catálogo Mestre
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-lg text-[10px] font-semibold">
                            {p.category}
                          </span>
                          {p.ncm && (
                            <span className="block text-[9px] font-mono text-slate-500 mt-0.5">
                              NCM: {p.ncm}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-bold">{p.unit}</td>
                        <td className="p-3.5 text-right font-mono text-slate-400">R$ {p.cost.toFixed(2)}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                          R$ {p.price.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-right font-mono text-amber-300 font-bold">{margin}%</td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black ${
                              isLowStock
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {p.stock} {p.unit}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="p-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 rounded-xl text-slate-300 transition-colors"
                            title="Editar Preço e Estoque"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: EXPLORADOR DO CATÁLOGO MESTRE HUBOBRA (4.000 PRODUTOS GLOBAIS) */}
      {/* ========================================================================= */}
      {activeTab === 'MASTER_CATALOG' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* BANNER DE BOAS-VINDAS DO CATÁLOGO MESTRE */}
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/40 p-4 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shrink-0">
                <Sparkles className="w-6 h-6 animate-pulse text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>Banco de Dados Mestre de Materiais de Construção</span>
                  <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                    Compartilhado p/ Todas as Lojas
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Selecione os produtos das grandes marcas (Krona, Tigre, Quartzolit, Poty, Tekbond, Starrett, Vedacit) e adicione à sua loja com sua margem de lucro personalizada!
                </p>
              </div>
            </div>

            {/* CONTROLES DE IMPORTAÇÃO EM LOTE */}
            <div className="flex flex-wrap items-center gap-2.5 bg-slate-950 p-2 rounded-2xl border border-slate-800 w-full md:w-auto shrink-0">
              <div className="flex items-center gap-1.5 px-2">
                <Percent className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-bold text-slate-300">Margem:</span>
                <select
                  value={defaultMarginPercent}
                  onChange={(e) => setDefaultMarginPercent(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 text-amber-400 font-mono font-bold text-xs rounded-lg px-2 py-1 focus:outline-none"
                >
                  <option value={20}>+20% s/ Custo</option>
                  <option value={30}>+30% s/ Custo</option>
                  <option value={35}>+35% s/ Custo</option>
                  <option value={40}>+40% s/ Custo</option>
                  <option value={50}>+50% s/ Custo</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 px-2 border-l border-slate-800">
                <Package className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-bold text-slate-300">Estoque:</span>
                <input
                  type="number"
                  value={defaultInitialStock}
                  onChange={(e) => setDefaultInitialStock(Math.max(1, Number(e.target.value)))}
                  className="w-14 bg-slate-900 border border-slate-700 text-cyan-400 font-mono font-bold text-xs rounded-lg px-2 py-1 text-center focus:outline-none"
                />
              </div>

              <button
                type="button"
                disabled={selectedMasterIds.length === 0}
                onClick={handleCloneBatchFromMaster}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                <DownloadCloud className="w-4 h-4 stroke-[2.5]" />
                <span>Importar {selectedMasterIds.length} Selecionados</span>
              </button>
            </div>
          </div>

          {/* BARRA DE PESQUISA & FILTRO DO CATÁLOGO MESTRE */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex-1 w-full relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar nos 4.000 produtos mestres (ex: Tekbond, Cimento, Krona, NCM 3506...)"
                value={masterSearch}
                onChange={(e) => setMasterSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-white text-xs focus:border-emerald-500 focus:outline-none shadow-inner"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (selectedMasterIds.length === filteredMaster.length) {
                    setSelectedMasterIds([]);
                  } else {
                    setSelectedMasterIds(filteredMaster.map((p) => p.id));
                  }
                }}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                {selectedMasterIds.length === filteredMaster.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
            </div>
          </div>

          {/* CATEGORIAS DO CATÁLOGO MESTRE */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {masterCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setMasterCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  masterCategory === cat
                    ? 'bg-emerald-500 text-slate-950 shadow font-black'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* GRID DE CARDS DO CATÁLOGO MESTRE */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredMaster.map((masterProd) => {
              const isSelected = selectedMasterIds.includes(masterProd.id);
              const isAlreadyInStore = alreadyImportedMasterIds.has(masterProd.id);
              const cost = masterProd.cost || masterProd.price * 0.65;
              const calculatedPrice =
                defaultMarginPercent > 0
                  ? Number((cost * (1 + defaultMarginPercent / 100)).toFixed(2))
                  : masterProd.price;

              return (
                <div
                  key={masterProd.id}
                  className={`p-4 rounded-3xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-xl ring-1 ring-emerald-500'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top Header do Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMasterIds((prev) => [...prev, masterProd.id]);
                            } else {
                              setSelectedMasterIds((prev) => prev.filter((id) => id !== masterProd.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="font-mono text-[10px] text-amber-400 font-bold">
                          {masterProd.sku}
                        </span>
                      </div>

                      {isAlreadyInStore ? (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          <span>Ativo na Loja</span>
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full">
                          Disponível
                        </span>
                      )}
                    </div>

                    {/* Descrição e Marca */}
                    <div>
                      <h4 className="text-xs font-bold text-white leading-snug">{masterProd.name}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                        {masterProd.description}
                      </p>
                    </div>

                    {/* Informações Técnicas & NCM */}
                    <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Marca: <strong className="text-slate-200">{masterProd.brand || masterProd.reference}</strong></span>
                      <span>NCM: <strong className="text-amber-400">{masterProd.ncm || '3506.10.90'}</strong></span>
                      <span>Un: <strong className="text-cyan-400">{masterProd.unit}</strong></span>
                    </div>

                    {/* Comparativo de Preços */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">Custo Sugerido</span>
                        <strong className="font-mono text-slate-300 font-bold">R$ {cost.toFixed(2)}</strong>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-emerald-400 block uppercase font-bold">Preço Loja (+{defaultMarginPercent}%)</span>
                        <strong className="font-mono text-emerald-400 font-black text-sm">R$ {calculatedPrice.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Botão de Importação 1-Clique */}
                  <button
                    type="button"
                    onClick={() => handleCloneSingleFromMaster(masterProd)}
                    className="mt-3.5 w-full py-2.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-slate-700 hover:border-emerald-500 shadow"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{isAlreadyInStore ? 'Atualizar / Clonar Mais' : 'Adicionar à Minha Loja (1 Clique)'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE PRODUTO LOCAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                <span>Editar Produto da Loja</span>
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-bold">Descrição do Material</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">SKU / Código</label>
                  <input
                    type="text"
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Código de Barras (EAN)</label>
                  <input
                    type="text"
                    value={editingProduct.barcode || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.cost}
                    onChange={(e) => setEditingProduct({ ...editingProduct, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Estoque Físico</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-cyan-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
