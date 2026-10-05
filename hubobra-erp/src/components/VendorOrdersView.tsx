import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  User,
  Plus,
  Trash2,
  Send,
  Printer,
  Share2,
  Search,
  Layers,
  Calculator,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Package,
  MapPin,
  Barcode,
  Truck,
  Building2,
  Clock,
  Sparkles,
  Users,
  Mic,
  Headphones,
} from 'lucide-react';
import { db, LocalProduct, LocalCustomer, SaleItem, LocalOrder, SellerUser, DEFAULT_SELLERS } from '../db/db';
import { MaterialsCalculatorModal } from './MaterialsCalculatorModal';
import { VoiceOrderModal } from './VoiceOrderModal';

interface VendorOrdersViewProps {
  onOrderSentToCashier: (order: LocalOrder) => void;
  importedItemsFromChatwoot?: Array<{
    productName: string;
    sku: string;
    quantity: number;
    unit: string;
    customerName?: string;
    customerPhone?: string;
    companyName?: string;
  }> | null;
  onClearImportedItems?: () => void;
  onActiveOrderChange?: (order: LocalOrder | null) => void;
}

export const VendorOrdersView: React.FC<VendorOrdersViewProps> = ({
  onOrderSentToCashier,
  importedItemsFromChatwoot,
  onClearImportedItems,
  onActiveOrderChange,
}) => {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [customers, setCustomers] = useState<LocalCustomer[]>([]);
  const [activeSeller, setActiveSeller] = useState<SellerUser>(DEFAULT_SELLERS[0]);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Estado do Pedido Atual
  const [orderType, setOrderType] = useState<'PEDIDO_VENDA' | 'ORCAMENTO'>('PEDIDO_VENDA');
  const [orderNumber, setOrderNumber] = useState<string>('PED-' + Math.floor(4000 + Math.random() * 5000));
  const [selectedCustomer, setSelectedCustomer] = useState<LocalCustomer | null>(null);
  const [orderItems, setOrderItems] = useState<SaleItem[]>([]);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [generalDiscount, setGeneralDiscount] = useState<number>(0);
  const [paymentCondition, setPaymentCondition] = useState<string>('A Vista no Caixa (PIX / Dinheiro)');
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Linha de Digitação de Produto Rápido
  const [searchProductTerm, setSearchProductTerm] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<LocalProduct | null>(null);
  const [inputQty, setInputQty] = useState<number>(1);
  const [inputDiscount, setInputDiscount] = useState<number>(0);
  const [inputUnitPrice, setInputUnitPrice] = useState<number>(0);
  const [productSearchResults, setProductSearchResults] = useState<LocalProduct[]>([]);

  // Modais
  const [isCalcOpen, setIsCalcOpen] = useState<boolean>(false);
  const [isDuplicatasOpen, setIsDuplicatasOpen] = useState<boolean>(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [isSellerSwitcherOpen, setIsSellerSwitcherOpen] = useState<boolean>(false);
  const [isVoiceOrderModalOpen, setIsVoiceOrderModalOpen] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // Carregar dados locais
  useEffect(() => {
    const load = async () => {
      const prods = await db.products.toArray();
      const custs = await db.customers.toArray();
      setProducts(prods);
      setCustomers(custs);
      if (custs.length > 0 && !selectedCustomer) {
        setSelectedCustomer(custs[0]);
      }
    };
    load();
  }, []);

  // Importador Automático de Itens Vindos do Chatwoot / WhatsApp
  useEffect(() => {
    if (importedItemsFromChatwoot && importedItemsFromChatwoot.length > 0 && products.length > 0) {
      const newItems: SaleItem[] = [];

      importedItemsFromChatwoot.forEach((imp) => {
        const matchedProd = products.find(
          (p) =>
            p.sku.toLowerCase() === imp.sku.toLowerCase() ||
            p.name.toLowerCase().includes(imp.productName.toLowerCase()) ||
            imp.productName.toLowerCase().includes(p.name.toLowerCase())
        );

        if (matchedProd) {
          newItems.push({
            productId: matchedProd.id,
            name: matchedProd.name,
            sku: matchedProd.sku,
            unit: imp.unit || matchedProd.unit,
            unitPrice: matchedProd.price,
            cost: matchedProd.cost,
            quantity: imp.quantity,
            discount: 0,
            total: matchedProd.price * imp.quantity,
            location: matchedProd.location || 'Pátio Central',
            packaging: matchedProd.packaging,
          });
        } else {
          newItems.push({
            productId: `prod-imp-${Date.now()}-${Math.random()}`,
            name: imp.productName,
            sku: imp.sku,
            unit: imp.unit || 'UN',
            unitPrice: 53.90,
            cost: 38.00,
            quantity: imp.quantity,
            discount: 0,
            total: 53.90 * imp.quantity,
            location: 'Galpão 01 - Baia A',
          });
        }
      });

      // Adiciona itens ao pedido
      setOrderItems((prev) => [...prev, ...newItems]);

      // Vincular cliente da conversa de forma inteligente
      const firstImp = importedItemsFromChatwoot[0];
      const custName = firstImp?.customerName;
      const compName = firstImp?.companyName;

      if (customers.length > 0 && (custName || compName)) {
        const found = customers.find(
          (c) =>
            (custName && c.name.toLowerCase().includes(custName.toLowerCase())) ||
            (compName && c.name.toLowerCase().includes(compName.toLowerCase())) ||
            (custName && custName.toLowerCase().includes(c.name.toLowerCase())) ||
            (compName && compName.toLowerCase().includes(c.name.toLowerCase())) ||
            (c.name.toLowerCase().includes('silva') && (custName?.toLowerCase().includes('rocha') || compName?.toLowerCase().includes('silva')))
        );

        if (found) {
          setSelectedCustomer(found);
        } else {
          setSelectedCustomer({
            id: `c-imp-${Date.now()}`,
            code: 'CLI-WPP',
            name: compName ? `${compName} (${custName})` : (custName || 'Cliente WhatsApp'),
            cpfCnpj: '12.345.678/0001-90',
            phone: firstImp?.customerPhone || '(85) 99888-7766',
            creditLimit: 25000.00,
            creditUsed: 3450.00,
            notes: 'Cliente importado via Chatwoot / WhatsApp',
            createdAt: new Date().toISOString(),
            synced: true,
          });
        }
      }

      setOrderNotes('💬 Materiais solicitados pelo cliente via WhatsApp (Chatwoot)');
      setImportNotification(
        `✨ ${importedItemsFromChatwoot.length} item(ns) puxados automaticamente da conversa do WhatsApp!`
      );

      // Efeito sonoro sutil de sucesso via Web Audio API
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {
        // AudioContext ignored if blocked
      }

      setTimeout(() => {
        setImportNotification(null);
      }, 7000);

      if (onClearImportedItems) {
        onClearImportedItems();
      }
    }
  }, [importedItemsFromChatwoot, products, customers]);

  // Sincronizar o pedido atual com o estado global (para envio de orçamento no WhatsApp/Chatwoot)
  useEffect(() => {
    if (onActiveOrderChange) {
      if (orderItems.length === 0) {
        onActiveOrderChange(null);
      } else {
        const sub = orderItems.reduce((acc, i) => acc + i.total, 0);
        const tot = Math.max(0, sub - generalDiscount + shippingCost);
        const activeOrder: LocalOrder = {
          id: 'active-' + orderNumber,
          orderNumber,
          type: orderType,
          createdAt: new Date().toISOString(),
          sellerId: activeSeller.id,
          sellerName: activeSeller.name,
          customerId: selectedCustomer?.id,
          customerName: selectedCustomer?.name || 'Consumidor Balcão',
          customerPhone: selectedCustomer?.phone,
          customerCpfCnpj: selectedCustomer?.cpfCnpj,
          items: orderItems,
          subtotal: sub,
          discount: generalDiscount,
          shipping: shippingCost,
          total: tot,
          paymentCondition,
          status: 'AGUARDANDO_PAGAMENTO',
          fiscalStatus: 'NOT_EMITTED',
          notes: orderNotes,
          syncedToCloud: false,
          syncedToGestaoClick: false,
        };
        onActiveOrderChange(activeOrder);
      }
    }
  }, [
    orderItems,
    orderNumber,
    orderType,
    activeSeller,
    selectedCustomer,
    generalDiscount,
    shippingCost,
    paymentCondition,
    orderNotes,
    onActiveOrderChange,
  ]);

  // Atalhos de Teclado Profissionais do Legado (F4, F5, F6, F8, F9, INS, DEL)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        handleNewOrder();
      } else if (e.key === 'F5') {
        e.preventDefault();
        handleSendToCashier();
      } else if (e.key === 'F6') {
        e.preventDefault();
        setIsDuplicatasOpen(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F9') {
        e.preventDefault();
        setIsCustomerModalOpen(true);
      } else if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        setIsVoiceOrderModalOpen(true);
      } else if (e.key === 'Insert') {
        e.preventDefault();
        handleInsertCurrentItem();
      } else if (e.key === 'Escape') {
        setIsCalcOpen(false);
        setIsDuplicatasOpen(false);
        setIsCustomerModalOpen(false);
        setIsSellerSwitcherOpen(false);
        setIsVoiceOrderModalOpen(false);
        setProductSearchResults([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Busca rápida de produtos ao digitar
  useEffect(() => {
    if (!searchProductTerm.trim()) {
      setProductSearchResults([]);
      return;
    }
    const term = searchProductTerm.toLowerCase();
    const results = products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.reference && p.reference.toLowerCase().includes(term)) ||
        (p.barcode && p.barcode.includes(term))
    );
    setProductSearchResults(results.slice(0, 8));
  }, [searchProductTerm, products]);

  const handleSelectProduct = (prod: LocalProduct) => {
    setSelectedProduct(prod);
    setInputUnitPrice(prod.price);
    setInputQty(1);
    setInputDiscount(0);
    setSearchProductTerm(prod.name);
    setProductSearchResults([]);
    setTimeout(() => {
      qtyInputRef.current?.focus();
      qtyInputRef.current?.select();
    }, 50);
  };

  const handleInsertCurrentItem = () => {
    if (!selectedProduct) {
      alert('Selecione um produto primeiro!');
      return;
    }

    if (inputQty <= 0) {
      alert('Quantidade inválida!');
      return;
    }

    const priceAfterDiscount = inputUnitPrice * (1 - inputDiscount / 100);
    const lineTotal = inputQty * priceAfterDiscount;

    const newItem: SaleItem = {
      productId: selectedProduct.id,
      name: selectedProduct.name,
      sku: selectedProduct.sku,
      reference: selectedProduct.reference,
      unit: selectedProduct.unit,
      unitPrice: inputUnitPrice,
      cost: selectedProduct.cost,
      quantity: inputQty,
      discount: (inputUnitPrice * inputDiscount) / 100,
      total: lineTotal,
      location: selectedProduct.location,
      packaging: selectedProduct.packaging,
    };

    setOrderItems([...orderItems, newItem]);

    // Limpar campos de digitação
    setSelectedProduct(null);
    setSearchProductTerm('');
    setInputQty(1);
    setInputDiscount(0);
    setInputUnitPrice(0);
    searchInputRef.current?.focus();
  };

  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setOrderItems((prev) =>
      prev.map((it, idx) => {
        if (idx === index) {
          const netPrice = Math.max(0, it.unitPrice - it.discount);
          return {
            ...it,
            quantity: newQty,
            total: netPrice * newQty,
          };
        }
        return it;
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleNewOrder = () => {
    setOrderNumber('PED-' + Math.floor(4000 + Math.random() * 5000));
    setOrderItems([]);
    setGeneralDiscount(0);
    setShippingCost(0);
    setOrderNotes('');
    searchInputRef.current?.focus();
  };

  // Enviar Pedido para o Caixa Central (Status: AGUARDANDO_PAGAMENTO)
  const handleSendToCashier = async () => {
    if (orderItems.length === 0) {
      alert('Adicione pelo menos um item no pedido antes de enviar ao caixa!');
      return;
    }

    const subtotal = orderItems.reduce((acc, i) => acc + i.total, 0);
    const finalTotal = Math.max(0, subtotal - generalDiscount + shippingCost);

    const newOrder: LocalOrder = {
      id: 'ord-' + Date.now(),
      orderNumber,
      type: orderType,
      createdAt: new Date().toISOString(),
      sellerId: activeSeller.id,
      sellerName: activeSeller.name,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name || 'Consumidor Balcão',
      customerPhone: selectedCustomer?.phone,
      customerCpfCnpj: selectedCustomer?.cpfCnpj,
      items: orderItems,
      subtotal,
      discount: generalDiscount,
      shipping: shippingCost,
      total: finalTotal,
      paymentCondition,
      status: 'AGUARDANDO_PAGAMENTO',
      fiscalStatus: 'NOT_EMITTED',
      notes: orderNotes,
      syncedToCloud: true,
      syncedToGestaoClick: false,
    };

    // Salvar no IndexedDB local
    await db.orders.add(newOrder);

    // Notificar callback e limpar tela
    onOrderSentToCashier(newOrder);
    alert(`🎉 Pedido #${orderNumber} enviado com sucesso para a fila do Caixa Central!`);
    handleNewOrder();
  };

  // Cálculos de Totais
  const subtotal = orderItems.reduce((acc, i) => acc + i.total, 0);
  const totalGeral = Math.max(0, subtotal - generalDiscount + shippingCost);
  const totalItensQtd = orderItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="h-[calc(100vh-85px)] flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP HEADER DO VENDEDOR & FILIAL */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-black text-slate-200">1 - DEPÓSITO SÃO JOSÉ</span>
          </div>

          {/* Vendedor Ativo Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsSellerSwitcherOpen(!isSellerSwitcherOpen)}
              className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Vendedor: {activeSeller.name}</span>
              <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 rounded font-black">
                {activeSeller.code}
              </span>
            </button>

            {isSellerSwitcherOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">Alternar Vendedor</p>
                {DEFAULT_SELLERS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveSeller(s);
                      setIsSellerSwitcherOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                      activeSeller.id === s.id
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] opacity-75">Cód {s.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Toggle Pedido / Orçamento */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setOrderType('PEDIDO_VENDA')}
              className={`px-3 py-1 rounded-lg transition-all ${
                orderType === 'PEDIDO_VENDA' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pedido de Venda
            </button>
            <button
              onClick={() => setOrderType('ORCAMENTO')}
              className={`px-3 py-1 rounded-lg transition-all ${
                orderType === 'ORCAMENTO' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Orçamento
            </button>
          </div>
        </div>

        {/* Status do Pedido & Ações */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-mono">Número do Pedido</span>
            <span className="text-sm font-black text-amber-400 font-mono">{orderNumber}</span>
          </div>

          <button
            onClick={handleNewOrder}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> [F4] Novo
          </button>
        </div>
      </div>

      {/* BANNER DE NOTIFICAÇÃO DE IMPORTAÇÃO CHATWOOT */}
      {importNotification && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold shadow-xl border-y border-emerald-400/30 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5">
            <div className="p-1 bg-white/20 rounded-lg">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            </div>
            <span>{importNotification}</span>
          </div>
          <button
            onClick={() => setImportNotification(null)}
            className="px-2 py-0.5 bg-black/20 hover:bg-black/40 rounded-lg text-xs transition-colors"
          >
            Fechar ✕
          </button>
        </div>
      )}

      {/* 2. DADOS DO CLIENTE & LIMITE DE CRÉDITO */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-5 flex items-center gap-2">
          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="flex-1 bg-slate-950 border border-slate-700 hover:border-amber-500 rounded-xl px-3 py-2 text-left flex items-center justify-between transition-colors group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <User className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-slate-400 block font-mono">
                  [F9] Cliente: {selectedCustomer?.code || 'CLI-001'}
                </span>
                <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate block">
                  {selectedCustomer?.name || 'Selecione o Cliente...'}
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold shrink-0">
              Trocar [F9]
            </span>
          </button>

          <button
            onClick={() => setIsDuplicatasOpen(true)}
            className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
            title="Ver Duplicatas / Contas em Aberto do Cliente [F6]"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>[F6] Contas</span>
          </button>
        </div>

        {/* Informações de Limite e Contato do Cliente */}
        <div className="md:col-span-7 flex items-center justify-end gap-4 text-xs">
          {selectedCustomer && (
            <>
              <div>
                <span className="text-[10px] text-slate-400 block">CPF / CNPJ</span>
                <span className="font-mono text-slate-200">{selectedCustomer.cpfCnpj || 'Não informado'}</span>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <span className="text-[10px] text-slate-400 block">Telefone / WhatsApp</span>
                <span className="font-mono text-slate-200">{selectedCustomer.phone || 'Não informado'}</span>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <span className="text-[10px] text-slate-400 block">Limite de Crédito Disponível</span>
                <span className="font-mono font-black text-emerald-400">
                  R$ {(selectedCustomer.creditLimit - selectedCustomer.creditUsed).toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. BARRA DE DIGITAÇÃO RÁPIDA DE ITENS (ESTILO SISTEMA LEGADO APERFEIÇOADO) */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
          {/* Campo Pesquisar Produto */}
          <div className="md:col-span-4 relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Pesquisar Produto [F8]
              </label>

              {/* Botão Microfone / Fone de Ouvido */}
              <button
                type="button"
                onClick={() => setIsVoiceOrderModalOpen(true)}
                className="px-2 py-0.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                title="Lançar materiais falando no fone de ouvido / microfone (Alt + V)"
              >
                <Headphones className="w-3 h-3 text-amber-400" />
                <Mic className="w-2.5 h-2.5 text-amber-400" />
                <span>Fone / Voz [Alt+V]</span>
              </button>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Ex: Cimento Poty, Joelho 25mm, Tijolo..."
                value={searchProductTerm}
                onChange={(e) => setSearchProductTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Dropdown de Autocomplete Rápido */}
            {productSearchResults.length > 0 && (
              <div className="absolute left-0 top-full mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-800">
                {productSearchResults.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod)}
                    className="p-2.5 hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-1.5 rounded">
                          {prod.sku}
                        </span>
                        <span className="font-bold text-white">{prod.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {prod.location || 'Sem localização'} • Un: {prod.unit}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-400">R$ {prod.price.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400 block">Estoque: {prod.stock}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quantidade */}
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Quantidade
            </label>
            <div className="flex">
              <input
                ref={qtyInputRef}
                type="number"
                step="any"
                value={inputQty}
                onChange={(e) => setInputQty(Number(e.target.value))}
                className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-l-xl text-xs font-black text-white focus:border-amber-500 focus:outline-none"
              />
              <span className="bg-slate-800 border border-l-0 border-slate-700 rounded-r-xl px-2.5 py-2 text-xs font-bold text-slate-300 flex items-center">
                {selectedProduct?.unit || 'UN'}
              </span>
            </div>
          </div>

          {/* Desconto % */}
          <div className="md:col-span-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Desc (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={inputDiscount || ''}
              onChange={(e) => setInputDiscount(Number(e.target.value))}
              placeholder="0"
              className="w-full py-2 px-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-amber-400 text-center focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Valor Unitário */}
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Valor Unitário [F2]
            </label>
            <input
              type="number"
              step="0.01"
              value={inputUnitPrice || ''}
              onChange={(e) => setInputUnitPrice(Number(e.target.value))}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-400 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Total da Linha Calculado */}
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Total Item
            </label>
            <div className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-black text-emerald-400 flex items-center justify-between">
              <span>R$</span>
              <span>{(inputQty * inputUnitPrice * (1 - inputDiscount / 100)).toFixed(2)}</span>
            </div>
          </div>

          {/* Botão Inserir [INS] */}
          <div className="md:col-span-1">
            <button
              onClick={handleInsertCurrentItem}
              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-emerald-600/20 transition-all"
              title="Inserir Item no Pedido [Tecla INSERT]"
            >
              <Plus className="w-4 h-4" />
              <span>[INS]</span>
            </button>
          </div>
        </div>

        {/* Faixa de Informações Avançadas do Produto Selecionado (Localização, Estoque Físico e Reservado) */}
        {selectedProduct && (
          <div className="mt-2.5 pt-2 border-t border-slate-800 grid grid-cols-2 md:grid-cols-6 gap-2 text-[11px] items-center bg-slate-950/80 p-2 rounded-xl">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Estoque Físico</span>
              <span className="font-mono font-bold text-cyan-400">{selectedProduct.stock} {selectedProduct.unit}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Estoque Reservado</span>
              <span className="font-mono font-bold text-amber-400">{selectedProduct.reservedStock} {selectedProduct.unit}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Saldo Disponível</span>
              <span className="font-mono font-black text-emerald-400">
                {selectedProduct.stock - selectedProduct.reservedStock} {selectedProduct.unit}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Localização Galpão</span>
              <span className="text-slate-200 font-semibold truncate block flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                {selectedProduct.location || 'Pátio Principal'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Embalagem</span>
              <span className="text-slate-300 font-medium truncate block">{selectedProduct.packaging || 'Avulso'}</span>
            </div>
            <div className="text-right">
              <button
                onClick={() => setIsCalcOpen(true)}
                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-bold rounded-lg text-[10px] transition-colors inline-flex items-center gap-1"
              >
                <Calculator className="w-3 h-3" /> Calcular M² / Traço
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. GRADE DE ITENS DO PEDIDO (TABELA PRINCIPAL) */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Código/SKU</th>
                <th className="p-3">Referência</th>
                <th className="p-3">Descrição do Material</th>
                <th className="p-3">Local no Depósito</th>
                <th className="p-3 text-center">Un.</th>
                <th className="p-3 text-center">Qtd.</th>
                <th className="p-3 text-right">Vl. Tabela</th>
                <th className="p-3 text-right">Desc.</th>
                <th className="p-3 text-right">Preço Praticado</th>
                <th className="p-3 text-right">Total Líquido</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {orderItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono text-slate-500">{idx + 1}</td>
                  <td className="p-3 font-mono font-bold text-amber-400">{item.sku}</td>
                  <td className="p-3 font-mono text-slate-400">{item.reference || '-'}</td>
                  <td className="p-3 font-bold text-white">{item.name}</td>
                  <td className="p-3 text-slate-400 text-[11px]">{item.location || 'Pátio Central'}</td>
                  <td className="p-3 text-center font-bold text-slate-300">{item.unit}</td>
                  <td className="p-2 text-center">
                    <div className="inline-flex items-center gap-1 bg-slate-950 border border-slate-700/80 rounded-xl p-0.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQuantity(idx, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs active:scale-95 transition-all"
                        title="Diminuir quantidade"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItemQuantity(idx, Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="w-10 text-center bg-transparent text-xs font-black text-amber-400 focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQuantity(idx, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs active:scale-95 transition-all"
                        title="Aumentar quantidade"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono text-slate-400">R$ {item.unitPrice.toFixed(2)}</td>
                  <td className="p-3 text-right font-mono text-amber-400">
                    {item.discount > 0 ? `- R$ ${item.discount.toFixed(2)}` : '-'}
                  </td>
                  <td className="p-3 text-right font-mono font-semibold text-slate-200">
                    R$ {(item.unitPrice - item.discount).toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-mono font-black text-emerald-400">
                    R$ {item.total.toFixed(2)}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      title="Excluir item [DEL]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {orderItems.length === 0 && (
                <tr>
                  <td colSpan={12} className="text-center py-16 text-slate-500">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">Nenhum item adicionado ao pedido ainda.</p>
                    <p className="text-xs">Pressione <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-300">F8</kbd> para buscar materiais ou <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-300">INS</kbd> para inserir.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. FOOTER COM RESUMO, CONDIÇÃO DE PAGAMENTO & ENVIO AO CAIXA [F5] */}
      <div className="bg-slate-900 border-t border-slate-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Observações e Condição de Pagamento */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Condição de Pagamento Negociada
            </label>
            <select
              value={paymentCondition}
              onChange={(e) => setPaymentCondition(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="A Vista no Caixa (PIX / Dinheiro)">À Vista no Caixa (PIX / Dinheiro)</option>
              <option value="Cartão Débito / Crédito 1x">Cartão Débito / Crédito no Balcão</option>
              <option value="Cartão de Crédito 3x Sem Juros">Cartão de Crédito em 3x</option>
              <option value="Pagar na Entrega (Maquininha de Cartão)">🚚 Pagar na Entrega (Maquininha de Cartão)</option>
              <option value="Pagar na Entrega (Dinheiro / Troco)">🚚 Pagar na Entrega (Dinheiro com Troco)</option>
              <option value="Pagar na Entrega (PIX na Obra)">🚚 Pagar na Entrega (PIX na Obra)</option>
              <option value="Boleto 30 Dias / Faturado">Boleto 30 Dias (Faturado / Crediário)</option>
              <option value="Boleto 30/60/90 Dias">Boleto 30/60/90 Dias</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Observações da Obra / Entrega
            </label>
            <input
              type="text"
              placeholder="Ex: Entregar até 16h, descarregar no piso térreo..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Painel Financeiro e Botão de Envio [F5] */}
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right">
            <div className="flex items-center justify-end gap-3 text-xs text-slate-400">
              <span>{orderItems.length} itens ({totalItensQtd} un)</span>
              <span>•</span>
              <span>Subtotal: R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              R$ {totalGeral.toFixed(2)}
            </div>
          </div>

          <button
            onClick={handleSendToCashier}
            disabled={orderItems.length === 0}
            className="py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl flex items-center gap-2 shadow-xl shadow-emerald-600/25 transition-all active:scale-[0.98]"
          >
            <Send className="w-5 h-5" />
            <span>[F5] ENVIAR AO CAIXA CENTRAL</span>
          </button>
        </div>
      </div>

      {/* MODAL DUPLICATAS / CONTAS DO CLIENTE [F6] */}
      {isDuplicatasOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">Duplicatas & Histórico [F6]</span>
                <h3 className="text-base font-bold text-white">{selectedCustomer.name}</h3>
              </div>
              <button onClick={() => setIsDuplicatasOpen(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase">Títulos / Boletos em Aberto</h4>
              {selectedCustomer.pendingInvoices && selectedCustomer.pendingInvoices.length > 0 ? (
                selectedCustomer.pendingInvoices.map((inv, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-mono font-bold text-white">{inv.number}</span>
                      <span className="text-slate-400 block text-[10px]">Vencimento: {inv.dueDate}</span>
                    </div>
                    <span className="font-mono font-black text-amber-400">R$ {inv.amount.toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 p-3 rounded-xl">
                  Nenhuma pendência financeira ou duplicata vencida. Cliente com crédito 100% livre!
                </p>
              )}
            </div>

            <button
              onClick={() => setIsDuplicatasOpen(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
            >
              Fechar (ESC)
            </button>
          </div>
        </div>
      )}

      {/* MODAL SELEÇÃO DE CLIENTE [F9] */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Selecionar Cliente [F9]</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {customers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCustomer(c);
                    setIsCustomerModalOpen(false);
                  }}
                  className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer flex justify-between items-center transition-colors"
                >
                  <div>
                    <span className="text-[10px] font-mono text-amber-400">{c.code || 'CLI'}</span>
                    <p className="text-xs font-bold text-white">{c.name}</p>
                    <p className="text-[10px] text-slate-400">{c.cpfCnpj || c.phone}</p>
                  </div>
                  <div className="text-right text-[10px]">
                    <span className="text-slate-400">Limite:</span>
                    <p className="font-bold text-emerald-400">R$ {(c.creditLimit - c.creditUsed).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setIsCustomerModalOpen(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
            >
              Fechar (ESC)
            </button>
          </div>
        </div>
      )}

      {/* MODAL CALCULADORA DE OBRAS */}
      <MaterialsCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        onApplyMaterials={(items) => {
          const formatted: SaleItem[] = items.map((i) => ({
            productId: 'calc-' + Date.now() + Math.random(),
            sku: 'CALC-' + i.unit,
            name: i.name,
            unit: i.unit,
            unitPrice: i.price,
            cost: i.price * 0.7,
            quantity: i.quantity,
            discount: 0,
            total: i.price * i.quantity,
          }));
          setOrderItems([...orderItems, ...formatted]);
          setIsCalcOpen(false);
        }}
        availableProducts={products}
      />

      {/* MODAL LANÇAMENTO POR COMANDO DE VOZ / FONE DE OUVIDO */}
      <VoiceOrderModal
        isOpen={isVoiceOrderModalOpen}
        onClose={() => setIsVoiceOrderModalOpen(false)}
        availableProducts={products}
        onAddItemsToOrder={(items) => {
          setOrderItems((prev) => [...prev, ...items]);
          setImportNotification(`🎙️ ${items.length} material(is) inseridos por comando de voz no fone!`);
          setTimeout(() => setImportNotification(null), 6000);
        }}
      />
    </div>
  );
};
