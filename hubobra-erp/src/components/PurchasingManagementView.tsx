import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  Factory,
  FileSpreadsheet,
  Plus,
  Search,
  ShoppingCart,
  Phone,
  MessageSquare,
  CheckCircle2,
  DollarSign,
  Filter,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Share2,
  Printer,
  Download,
  ShieldCheck,
  Building,
  Clock,
  Award,
  BarChart3,
  Percent,
  RefreshCw,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import { db, LocalProduct, Supplier, PurchaseQuotation, PurchaseOrder, PurchaseQuotationItem } from '../db/db';

export const PurchasingManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'REPOSICAO_ALTO_GIRO' | 'MAPA_COTACOES' | 'FORNECEDORES' | 'RELATORIOS_ABC'>('REPOSICAO_ALTO_GIRO');
  
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [quotations, setQuotations] = useState<PurchaseQuotation[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('TODOS');
  
  // Modais
  const [isNewQuotationModalOpen, setIsNewQuotationModalOpen] = useState<boolean>(false);
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState<boolean>(false);
  const [selectedQuotation, setSelectedQuotation] = useState<PurchaseQuotation | null>(null);
  const [newSupplierForm, setNewSupplierForm] = useState<Partial<Supplier>>({
    tradeName: '',
    corporateName: '',
    cnpj: '',
    representativeName: '',
    phone: '',
    whatsapp: '',
    email: '',
    category: 'Cimentos & Argamassas',
    leadTimeDays: 3,
    standardPaymentTerms: 'Boleto 28 dias',
    minOrderValue: 3000,
    rating: 4.8,
  });

  const loadData = async () => {
    const allProducts = await db.products.toArray();
    const allSuppliers = await db.suppliers.toArray();
    const allQuotations = await db.quotations.orderBy('createdAt').reverse().toArray();
    const allOrders = await db.purchaseOrders.orderBy('createdAt').reverse().toArray();
    
    setProducts(allProducts);
    setSuppliers(allSuppliers);
    setQuotations(allQuotations);
    setOrders(allOrders);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Produtos que necessitam de reposição (Estoque <= Estoque Mínimo ou Estoque < 15)
  const replenishmentProducts = products.filter((p) => {
    const isCritical = p.stock <= (p.minStock || 5) || p.stock <= 10;
    const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'TODOS' || p.category === categoryFilter;
    return isCritical && matchesSearch && matchesCat;
  });

  // Categorias únicas
  const categories = ['TODOS', ...Array.from(new Set(products.map((p) => p.category)))];

  // Ação: Criar Cotação Automática com todos os itens em falta
  const handleGenerateAutoQuotation = async () => {
    if (replenishmentProducts.length === 0) {
      alert('Não há produtos com estoque crítico para repor no momento!');
      return;
    }

    const itemsToQuote: PurchaseQuotationItem[] = replenishmentProducts.slice(0, 8).map((p) => {
      // Sugestão de compra: meta de 30 dias de giro (mínimo 30 un ou 5x o estoque mínimo)
      const suggestedQty = Math.max(20, (p.minStock || 10) * 4 - p.stock);
      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        quantity: suggestedQty,
        unit: p.unit,
        currentCost: p.cost,
        lastPurchasePrice: p.cost,
        targetPrice: Number((p.cost * 0.95).toFixed(2)), // Meta de 5% de desconto na negociação
      };
    });

    const newQuot: PurchaseQuotation = {
      id: `cot-${Date.now()}`,
      quotationNumber: `COT-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: `Cotação de Reposição Automática (${itemsToQuote.length} Itens em Ruptura)`,
      createdAt: new Date().toISOString(),
      buyerName: 'Juliana Mendes (Gestora de Compras)',
      status: 'EM_ANALISE',
      items: itemsToQuote,
      suppliersQuoted: suppliers.slice(0, 2).map((s, idx) => {
        const factor = idx === 0 ? 0.96 : 0.99; // Fornecedor 1 mais barato
        const quoted: Record<string, number> = {};
        let total = 0;
        itemsToQuote.forEach((it) => {
          const p = Number((it.currentCost * factor).toFixed(2));
          quoted[it.sku] = p;
          total += p * it.quantity;
        });

        return {
          supplierId: s.id,
          supplierName: s.tradeName,
          representative: s.representativeName,
          whatsapp: s.whatsapp,
          quotedPrices: quoted,
          freight: idx === 0 ? 0 : 120,
          paymentTerms: s.standardPaymentTerms,
          deliveryDays: s.leadTimeDays,
          totalQuotation: total + (idx === 0 ? 0 : 120),
          isWinner: idx === 0,
        };
      }),
      winningSupplierId: suppliers[0]?.id,
      savingsAmount: itemsToQuote.reduce((acc, it) => acc + (it.currentCost * 0.04 * it.quantity), 0),
      savingsPercent: 4.0,
      notes: 'Cotação gerada automaticamente pelo algoritmo de sugestão de compras de alto giro.',
    };

    await db.quotations.add(newQuot);
    await loadData();
    setSelectedQuotation(newQuot);
    setActiveTab('MAPA_COTACOES');
  };

  // Ação: Salvar novo fornecedor
  const handleSaveNewSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierForm.tradeName?.trim()) {
      alert('Informe o Nome Fantasia do Fornecedor!');
      return;
    }

    const supplier: Supplier = {
      id: `for-${Date.now()}`,
      code: `FOR-${Math.floor(100 + Math.random() * 900)}`,
      tradeName: newSupplierForm.tradeName.trim(),
      corporateName: newSupplierForm.corporateName || newSupplierForm.tradeName,
      cnpj: newSupplierForm.cnpj || '00.000.000/0001-00',
      representativeName: newSupplierForm.representativeName || 'Representante Comercial',
      phone: newSupplierForm.phone || '(85) 3000-0000',
      whatsapp: newSupplierForm.whatsapp || '(85) 99000-0000',
      email: newSupplierForm.email || 'comercial@fornecedor.com.br',
      category: newSupplierForm.category || 'Geral',
      leadTimeDays: Number(newSupplierForm.leadTimeDays) || 3,
      minOrderValue: Number(newSupplierForm.minOrderValue) || 2000,
      standardPaymentTerms: newSupplierForm.standardPaymentTerms || 'Boleto 28 dias',
      rating: 4.8,
      suppliedProductsCount: 10,
      notes: newSupplierForm.notes || '',
      createdAt: new Date().toISOString(),
    };

    await db.suppliers.add(supplier);
    await loadData();
    setIsNewSupplierModalOpen(false);
    alert(`Fornecedor ${supplier.tradeName} cadastrado com sucesso!`);
  };

  // Enviar Cotação para WhatsApp do Representante
  const handleSendQuotationWhatsApp = (quot: PurchaseQuotation, supName: string, supWhats: string) => {
    const itemsList = quot.items
      .map((it, idx) => `• ${idx + 1}. *${it.quantity} ${it.unit}* x ${it.productName} (SKU: ${it.sku})`)
      .join('\n');

    const msg =
      `*SOLICITAÇÃO DE COTAÇÃO HUBOBRA MATERIAIS* 🏬\n\n` +
      `Olá ${supName}, segue nossa lista de reposição *#${quot.quotationNumber}* para o Depósito São José:\n\n` +
      `${itemsList}\n\n` +
      `📦 *Condição Requerida:* Faturado 28/56 dias com entrega em Fortaleza.\n` +
      `Por favor, nos envie os melhores preços e prazo de entrega até as 17h para emissão do Pedido de Compra!`;

    const encoded = encodeURIComponent(msg);
    const cleanPhone = supWhats.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}?text=${encoded}`, '_blank');
  };

  // Aprovar Cotação e Gerar Ordem de Compra
  const handleApproveQuotation = async (quot: PurchaseQuotation) => {
    const winner = quot.suppliersQuoted.find((s) => s.isWinner) || quot.suppliersQuoted[0];
    if (!winner) return;

    const poItems = quot.items.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      sku: it.sku,
      quantity: it.quantity,
      unit: it.unit,
      unitCost: winner.quotedPrices[it.sku] || it.currentCost,
      total: (winner.quotedPrices[it.sku] || it.currentCost) * it.quantity,
    }));

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      orderNumber: `OC-${Math.floor(5000 + Math.random() * 5000)}`,
      quotationId: quot.id,
      supplierId: winner.supplierId,
      supplierName: winner.supplierName,
      representativeName: winner.representative,
      whatsapp: winner.whatsapp,
      createdAt: new Date().toISOString(),
      expectedDeliveryDate: new Date(Date.now() + winner.deliveryDays * 86400000).toLocaleDateString('pt-BR'),
      status: 'EMITIDA',
      items: poItems,
      subtotal: winner.totalQuotation - winner.freight,
      freight: winner.freight,
      discount: 0,
      total: winner.totalQuotation,
      paymentTerms: winner.paymentTerms,
      deliveryAddress: 'HubObra Depósito São José - Av. Central 1000, Fortaleza/CE',
      notes: 'Ordem de compra gerada a partir da cotação com menor preço garantido.',
      sentViaWhatsApp: false,
    };

    await db.purchaseOrders.add(newPO);
    await db.quotations.update(quot.id, { status: 'PEDIDO_GERADO' });
    await loadData();
    alert(`🎉 Ordem de Compra #${newPO.orderNumber} emitida para ${winner.supplierName} no valor de R$ ${newPO.total.toFixed(2)}!`);
  };

  // Métricas do Comprador
  const totalStockCost = products.reduce((acc, p) => acc + (p.cost * p.stock), 0);
  const totalStockSale = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
  const avgGrossMargin = totalStockSale > 0 ? ((totalStockSale - totalStockCost) / totalStockSale) * 100 : 0;
  const criticalItemsCount = products.filter((p) => p.stock <= (p.minStock || 5)).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none font-sans text-slate-100">
      {/* 1. TOP HEADER DO COMPRADOR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">Central de Compras & Gestão de Suprimentos</h1>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 font-mono px-2 py-0.5 rounded-full border border-blue-500/30">
                Setor de Lucratividade
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Compradora Responsável: <strong className="text-amber-400">Juliana Mendes</strong> • Otimização de Custos & Prevenção de Ruptura
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleGenerateAutoQuotation}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Gerar Cotação de Reposição Automática ({criticalItemsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewSupplierModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Novo Fornecedor</span>
          </button>
        </div>
      </div>

      {/* 2. CARDS DE INDICADORES CHAVE (KPIs DE COMPRAS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Itens em Ruptura / Críticos</span>
            <span className="text-2xl font-black text-red-400 font-mono">{criticalItemsCount} materiais</span>
            <span className="text-[10px] text-red-300/80 block mt-0.5">Abaixo do estoque de segurança</span>
          </div>
          <div className="p-3 bg-red-500/15 text-red-400 rounded-2xl border border-red-500/30">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estoque a Preço de Custo</span>
            <span className="text-2xl font-black text-white font-mono">R$ {(totalStockCost / 1000).toFixed(1)}k</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{products.length} itens cadastrados</span>
          </div>
          <div className="p-3 bg-blue-500/15 text-blue-400 rounded-2xl border border-blue-500/30">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Margem Bruta Média</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">{avgGrossMargin.toFixed(1)}%</span>
            <span className="text-[10px] text-emerald-300/80 block mt-0.5">Markup médio da loja</span>
          </div>
          <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Economia em Cotações</span>
            <span className="text-2xl font-black text-amber-400 font-mono">R$ 14.850</span>
            <span className="text-[10px] text-amber-300/80 block mt-0.5">Gerada nas negociações deste mês</span>
          </div>
          <div className="p-3 bg-amber-500/15 text-amber-400 rounded-2xl border border-amber-500/30">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. SELETOR DE ABAS PRINCIPAIS */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('REPOSICAO_ALTO_GIRO')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'REPOSICAO_ALTO_GIRO'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Sugestão de Reposição & Alto Giro</span>
          <span className="bg-slate-950/40 px-1.5 py-0.2 rounded font-mono text-[10px]">
            {criticalItemsCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('MAPA_COTACOES')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'MAPA_COTACOES'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Mapa de Cotações Multi-Fornecedor</span>
          <span className="bg-slate-950/40 px-1.5 py-0.2 rounded font-mono text-[10px]">
            {quotations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('FORNECEDORES')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'FORNECEDORES'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Factory className="w-4 h-4" />
          <span>Central de Fornecedores & WhatsApp</span>
          <span className="bg-slate-950/40 px-1.5 py-0.2 rounded font-mono text-[10px]">
            {suppliers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('RELATORIOS_ABC')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'RELATORIOS_ABC'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Curva ABC & Histórico de Compras</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: SUGESTÃO DE REPOSIÇÃO & PRODUTOS DE ALTO GIRO */}
      {/* ========================================================================= */}
      {activeTab === 'REPOSICAO_ALTO_GIRO' && (
        <div className="space-y-4">
          {/* Barra de Filtro e Pesquisa */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar material em ruptura..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none text-[10px]">
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    categoryFilter === cat ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tabela de Produtos com Alerta de Ruptura */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Código / SKU</th>
                  <th className="p-3.5">Descrição do Material</th>
                  <th className="p-3.5">Local Galpão</th>
                  <th className="p-3.5 text-center">Estoque Atual</th>
                  <th className="p-3.5 text-center">Mínimo</th>
                  <th className="p-3.5 text-center">Giro Estimado</th>
                  <th className="p-3.5 text-center">Sugestão Compra</th>
                  <th className="p-3.5 text-right">Custo Atual</th>
                  <th className="p-3.5 text-right">Preço Venda</th>
                  <th className="p-3.5 text-center">Status Ruptura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {replenishmentProducts.map((prod) => {
                  const isZero = prod.stock === 0;
                  const suggestedBuy = Math.max(20, (prod.minStock || 10) * 4 - prod.stock);

                  return (
                    <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-amber-400">{prod.sku}</td>
                      <td className="p-3.5">
                        <p className="font-bold text-white">{prod.name}</p>
                        <span className="text-[10px] text-slate-400">{prod.category}</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-300 text-[11px]">{prod.location || 'Pátio Central'}</td>
                      <td className="p-3.5 text-center font-mono font-bold text-red-400">
                        {prod.stock} {prod.unit}
                      </td>
                      <td className="p-3.5 text-center font-mono text-slate-400">
                        {prod.minStock || 5} {prod.unit}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          Alto Giro (A)
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono font-black text-emerald-400 bg-emerald-500/5">
                        +{suggestedBuy} {prod.unit}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-300">R$ {prod.cost.toFixed(2)}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-white">R$ {prod.price.toFixed(2)}</td>
                      <td className="p-3.5 text-center">
                        {isZero ? (
                          <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-red-600 text-white animate-pulse">
                            ZERADO ⚠️
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            Crítico ({prod.stock} un)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: MAPA DE COTAÇÕES MULTI-FORNECEDOR */}
      {/* ========================================================================= */}
      {activeTab === 'MAPA_COTACOES' && (
        <div className="space-y-6">
          {/* Seletor de Cotações Existentes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quotations.map((quot) => {
              const isSelected = selectedQuotation?.id === quot.id;
              const totalItems = quot.items.length;
              const winnerSup = quot.suppliersQuoted.find((s) => s.isWinner) || quot.suppliersQuoted[0];

              return (
                <div
                  key={quot.id}
                  onClick={() => setSelectedQuotation(quot)}
                  className={`p-4 rounded-3xl border cursor-pointer transition-all shadow-xl flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500 shadow-amber-500/10 scale-[1.01]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-black text-amber-400">{quot.quotationNumber}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        quot.status === 'PEDIDO_GERADO'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {quot.status === 'PEDIDO_GERADO' ? 'Pedido Gerado' : 'Em Análise'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mb-2 leading-snug">{quot.title}</h3>

                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-1 mb-3 font-mono">
                      <div className="flex justify-between text-slate-400">
                        <span>Itens Cotados:</span>
                        <strong className="text-slate-200">{totalItems} materiais</strong>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Melhor Proposta:</span>
                        <strong className="text-emerald-400">{winnerSup?.supplierName}</strong>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Valor Fechado:</span>
                        <strong className="text-white">R$ {winnerSup?.totalQuotation.toFixed(2)}</strong>
                      </div>
                      {quot.savingsAmount && quot.savingsAmount > 0 && (
                        <div className="flex justify-between text-amber-400 pt-1 border-t border-slate-800 font-bold">
                          <span>Economia Obtida:</span>
                          <span>R$ {quot.savingsAmount.toFixed(2)} ({quot.savingsPercent?.toFixed(1)}%)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                    <span>{new Date(quot.createdAt).toLocaleDateString('pt-BR')}</span>
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      Ver Planilha Comparativa <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PLANILHA COMPARATIVA DETALHADA DA COTAÇÃO SELECIONADA */}
          {selectedQuotation && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      {selectedQuotation.quotationNumber}
                    </span>
                    <span className="text-xs text-slate-400">
                      Comprador: <strong className="text-slate-200">{selectedQuotation.buyerName}</strong>
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-white">{selectedQuotation.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApproveQuotation(selectedQuotation)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprovar Melhor Proposta & Emitir Pedido de Compra</span>
                  </button>
                </div>
              </div>

              {/* Tabela Comparativa de Preços Lado a Lado */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-300 font-bold uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Material / SKU</th>
                      <th className="p-3 text-center">Qtd Cotada</th>
                      <th className="p-3 text-right">Custo Atual</th>
                      {selectedQuotation.suppliersQuoted.map((sup, sIdx) => (
                        <th key={sIdx} className="p-3 text-center bg-slate-900 border-l border-slate-800">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-white text-xs">{sup.supplierName}</span>
                            <span className="text-[9px] text-slate-400 font-normal">{sup.paymentTerms}</span>
                            {sup.isWinner && (
                              <span className="mt-0.5 text-[8px] bg-emerald-500 text-slate-950 font-black px-1.5 rounded">
                                MENOR PREÇO 🏆
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {selectedQuotation.items.map((it, idx) => {
                      // Descobre o menor preço ofertado para este item
                      const prices = selectedQuotation.suppliersQuoted.map((s) => s.quotedPrices[it.sku] || 9999);
                      const minPrice = Math.min(...prices);

                      return (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-3">
                            <p className="font-bold text-white">{it.productName}</p>
                            <span className="text-[10px] font-mono text-amber-400">{it.sku}</span>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-300">
                            {it.quantity} {it.unit}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-400">R$ {it.currentCost.toFixed(2)}</td>

                          {selectedQuotation.suppliersQuoted.map((sup, sIdx) => {
                            const quotedPrice = sup.quotedPrices[it.sku] || 0;
                            const isLowest = quotedPrice === minPrice && quotedPrice > 0;

                            return (
                              <td
                                key={sIdx}
                                className={`p-3 text-center font-mono border-l border-slate-800 ${
                                  isLowest ? 'bg-emerald-500/10 text-emerald-300 font-bold' : 'text-slate-300'
                                }`}
                              >
                                <span className="block text-xs">R$ {quotedPrice.toFixed(2)}</span>
                                <span className="text-[9px] text-slate-500 block">
                                  Subtotal: R$ {(quotedPrice * it.quantity).toFixed(2)}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    {/* Linha de Totais da Cotação */}
                    <tr className="bg-slate-950 font-black text-sm">
                      <td colSpan={3} className="p-4 text-right text-slate-400 uppercase text-xs">
                        TOTAL DA PROPOSTA (COM FRETE):
                      </td>
                      {selectedQuotation.suppliersQuoted.map((sup, sIdx) => (
                        <td
                          key={sIdx}
                          className={`p-4 text-center font-mono border-l border-slate-800 ${
                            sup.isWinner ? 'text-emerald-400 bg-emerald-500/15' : 'text-white'
                          }`}
                        >
                          <span className="text-base">R$ {sup.totalQuotation.toFixed(2)}</span>
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Frete: {sup.freight === 0 ? 'Grátis' : `R$ ${sup.freight.toFixed(2)}`} • {sup.deliveryDays} dias
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Botões de Ação Direta no WhatsApp para Cada Fornecedor */}
              <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-3 items-center justify-between">
                <div className="text-xs text-slate-400">
                  💡 <strong>Dica de Negociação:</strong> Envie a cotação diretamente no WhatsApp do representante para obter descontos por volume.
                </div>

                <div className="flex gap-2">
                  {selectedQuotation.suppliersQuoted.map((sup, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => handleSendQuotationWhatsApp(selectedQuotation, sup.representative, sup.whatsapp)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp {sup.supplierName.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: CENTRAL DE FORNECEDORES & WHATSAPP DIRETO */}
      {/* ========================================================================= */}
      {activeTab === 'FORNECEDORES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((sup) => (
              <div
                key={sup.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-xl space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                        {sup.code}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight">{sup.tradeName}</h3>
                        <p className="text-[10px] text-slate-400">{sup.category}</p>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg">
                      ⭐ {sup.rating}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Representante:</span>
                      <strong className="text-slate-200">{sup.representativeName}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>WhatsApp:</span>
                      <strong className="text-emerald-400">{sup.whatsapp}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Prazo de Entrega:</span>
                      <strong className="text-slate-200">{sup.leadTimeDays} dias úteis</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Condição Padrão:</span>
                      <strong className="text-slate-200">{sup.standardPaymentTerms}</strong>
                    </div>
                  </div>

                  {sup.notes && (
                    <p className="text-[10px] text-slate-400 mt-2 italic line-clamp-2">
                      "{sup.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const msg = `Olá ${sup.representativeName}, aqui é a Juliana de Compras da HubObra Materiais. Tudo bem? Gostaria de solicitar a tabela de preços atualizada.`;
                      const cleanPhone = sup.whatsapp.replace(/\D/g, '');
                      window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp Direto</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: CURVA ABC & HISTÓRICO DE COMPRAS */}
      {/* ========================================================================= */}
      {activeTab === 'RELATORIOS_ABC' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Classe A (Alto Giro • 80% da Receita)
              </span>
              <p className="text-xs text-slate-400">
                Materiais pesados básicos: Cimento Poty, Vergalhões CA-50 Gerdau, Argamassa AC-III, Areia e Brita.
              </p>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1 mt-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Giro Médio:</span>
                  <strong className="text-emerald-400">4,2 dias</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Margem Média:</span>
                  <strong className="text-amber-400">24,5%</strong>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                Classe B (Médio Giro • 15% da Receita)
              </span>
              <p className="text-xs text-slate-400">
                Tubos e Conexões PVC Krona, Adesivos Tekbond, Caixas d'água e Impermeabilizantes Bianco.
              </p>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1 mt-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Giro Médio:</span>
                  <strong className="text-emerald-400">14 dias</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Margem Média:</span>
                  <strong className="text-amber-400">38,0%</strong>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">
                Classe C (Acabamento & Especialidades)
              </span>
              <p className="text-xs text-slate-400">
                Porcelanatos Delta 84x84, Louças, Metais e Acessórios Elétricos especiais.
              </p>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1 mt-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Giro Médio:</span>
                  <strong className="text-emerald-400">32 dias</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Margem Média:</span>
                  <strong className="text-amber-400">45,2%</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Histórico de Ordens de Compra Emitidas */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Ordens de Compra Emitidas para Fornecedores ({orders.length})</span>
            </h3>

            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Nº Ordem</th>
                      <th className="p-3">Fornecedor</th>
                      <th className="p-3">Data Emissão</th>
                      <th className="p-3">Previsão Entrega</th>
                      <th className="p-3 text-right">Valor Total</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {orders.map((po) => (
                      <tr key={po.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-amber-400">{po.orderNumber}</td>
                        <td className="p-3 font-bold text-white">{po.supplierName}</td>
                        <td className="p-3 text-slate-400">{new Date(po.createdAt).toLocaleDateString('pt-BR')}</td>
                        <td className="p-3 text-slate-300 font-mono">{po.expectedDeliveryDate}</td>
                        <td className="p-3 text-right font-mono font-black text-emerald-400">
                          R$ {po.total.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {po.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">
                Nenhuma ordem de compra emitida ainda. Aprove uma cotação na aba "Mapa de Cotações" para gerar a primeira ordem!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVO FORNECEDOR */}
      {/* ========================================================================= */}
      {isNewSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Factory className="w-5 h-5 text-emerald-400" />
                <span>Cadastrar Novo Fornecedor</span>
              </h3>
              <button
                onClick={() => setIsNewSupplierModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewSupplier} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-bold">Nome Fantasia *</label>
                  <input
                    type="text"
                    required
                    value={newSupplierForm.tradeName}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, tradeName: e.target.value })}
                    placeholder="Ex: Votorantim, Krona, Tigre..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-bold">Razão Social</label>
                  <input
                    type="text"
                    value={newSupplierForm.corporateName}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, corporateName: e.target.value })}
                    placeholder="Razão Social completa"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-bold">CNPJ</label>
                  <input
                    type="text"
                    value={newSupplierForm.cnpj}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, cnpj: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-bold">Categoria de Fornecimento</label>
                  <select
                    value={newSupplierForm.category}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                  >
                    <option value="Cimentos & Argamassas">Cimentos & Argamassas</option>
                    <option value="Aços, Vergalhões & Telas">Aços, Vergalhões & Telas</option>
                    <option value="Tubos e Conexões PVC">Tubos e Conexões PVC</option>
                    <option value="Argamassas & Rejuntes">Argamassas & Rejuntes</option>
                    <option value="Massas, Seladores e Solventes">Massas, Seladores e Solventes</option>
                    <option value="Pisos e Revestimentos">Pisos e Revestimentos</option>
                    <option value="Tintas e Pintura">Tintas e Pintura</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-bold">Nome do Representante Comercial</label>
                  <input
                    type="text"
                    value={newSupplierForm.representativeName}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, representativeName: e.target.value })}
                    placeholder="Ex: Carlos Representante"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-bold">WhatsApp do Representante</label>
                  <input
                    type="text"
                    value={newSupplierForm.whatsapp}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, whatsapp: e.target.value })}
                    placeholder="(85) 99999-8888"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-bold">Prazo de Entrega (Lead Time em Dias)</label>
                  <input
                    type="number"
                    value={newSupplierForm.leadTimeDays}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, leadTimeDays: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-bold">Condição de Pagamento Padrão</label>
                  <input
                    type="text"
                    value={newSupplierForm.standardPaymentTerms}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, standardPaymentTerms: e.target.value })}
                    placeholder="Ex: Boleto 28/56 dias faturado"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewSupplierModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
