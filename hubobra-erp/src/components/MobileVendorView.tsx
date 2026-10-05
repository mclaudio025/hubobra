import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Search,
  ShoppingCart,
  Calculator,
  Send,
  Share2,
  CheckCircle2,
  MapPin,
  Package,
  Layers,
  Sparkles,
  QrCode,
  User,
  Plus,
  Minus,
  Trash2,
  Phone,
  FileText,
  BadgePercent,
  Check,
  Building,
  RefreshCw,
  Mic,
  Headphones,
} from 'lucide-react';
import { db, LocalProduct, LocalOrder, SaleItem, LocalCustomer, DEFAULT_SELLERS, SellerUser } from '../db/db';
import { MaterialsCalculatorModal } from './MaterialsCalculatorModal';
import { VoiceOrderModal } from './VoiceOrderModal';

interface MobileVendorViewProps {
  onOrderSentToCashier?: (order: LocalOrder) => void;
}

export const MobileVendorView: React.FC<MobileVendorViewProps> = ({ onOrderSentToCashier }) => {
  const [sellers, setSellers] = useState<SellerUser[]>(DEFAULT_SELLERS);
  const [currentSeller, setCurrentSeller] = useState<SellerUser>(DEFAULT_SELLERS[0]);
  const [sellerPin, setSellerPin] = useState<string>('01');
  const [isLogged, setIsLogged] = useState<boolean>(true);

  // Produtos & Busca
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');

  // Carrinho Mobile
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('Cliente Balcão');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [paymentCondition, setPaymentCondition] = useState<string>('A Vista / PIX');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Modais
  const [activeTab, setActiveTab] = useState<'PRODUTOS' | 'CARRINHO' | 'CALCULADORA' | 'CONSULTA'>('PRODUTOS');
  const [isCalcOpen, setIsCalcOpen] = useState<boolean>(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [orderSuccessModal, setOrderSuccessModal] = useState<LocalOrder | null>(null);

  // Carregar produtos do IndexedDB
  useEffect(() => {
    const loadData = async () => {
      const prods = await db.products.toArray();
      setProducts(prods);
    };
    loadData();
  }, []);

  // Categorias únicas
  const categories = ['TODOS', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filtro de produtos
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'TODOS' || p.category === selectedCategory;
    const matchesQuery =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    return matchesCategory && matchesQuery;
  });

  // Totais do carrinho
  const subtotal = cart.reduce((sum, it) => sum + it.total, 0);
  const discountVal = (subtotal * discountPercent) / 100;
  const grandTotal = Math.max(0, subtotal - discountVal);

  const handleAddToCart = (product: LocalProduct) => {
    const existingIndex = cart.findIndex((item) => item.productId === product.id);
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      newCart[existingIndex].total = newCart[existingIndex].quantity * newCart[existingIndex].unitPrice;
      setCart(newCart);
    } else {
      const newItem: SaleItem = {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        unitPrice: product.price,
        cost: product.cost,
        quantity: 1,
        discount: 0,
        total: product.price,
        location: product.location || 'Pátio Central',
        packaging: product.packaging,
      };
      setCart([...cart, newItem]);
    }
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    const newQty = newCart[index].quantity + delta;
    if (newQty <= 0) {
      newCart.splice(index, 1);
    } else {
      newCart[index].quantity = newQty;
      newCart[index].total = newQty * newCart[index].unitPrice;
    }
    setCart(newCart);
  };

  const handleSendOrderToCashier = async () => {
    if (cart.length === 0) {
      alert('Adicione produtos ao carrinho antes de emitir!');
      return;
    }

    const orderNumber = `PED-M${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: LocalOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      type: 'PEDIDO_VENDA',
      createdAt: new Date().toISOString(),
      sellerId: currentSeller.id,
      sellerName: currentSeller.name,
      customerName: customerName.trim() || 'Cliente Balcão',
      customerPhone: customerPhone.trim() || undefined,
      items: cart,
      subtotal,
      discount: discountVal,
      shipping: 0,
      total: grandTotal,
      paymentCondition,
      status: 'AGUARDANDO_PAGAMENTO',
      fiscalStatus: 'NOT_EMITTED',
      notes: notes.trim() || undefined,
      syncedToCloud: false,
      syncedToGestaoClick: false,
    };

    await db.orders.add(newOrder);

    // Abater estoque reservado
    for (const item of cart) {
      const prod = await db.products.get(item.productId);
      if (prod) {
        await db.products.update(prod.id, {
          reservedStock: (prod.reservedStock || 0) + item.quantity,
        });
      }
    }

    if (onOrderSentToCashier) {
      onOrderSentToCashier(newOrder);
    }

    setOrderSuccessModal(newOrder);
    setCart([]);
    setNotes('');
    setDiscountPercent(0);
  };

  const handleShareWhatsApp = (order: LocalOrder) => {
    const itemsList = order.items
      .map((it, idx) => `${idx + 1}. *${it.quantity} ${it.unit}* x ${it.name} = R$ ${it.total.toFixed(2)}`)
      .join('\n');

    const msg = `*HUBOBRA MATERIAIS DE CONSTRUÇÃO*\n\n` +
      `Olá, *${order.customerName}*!\n` +
      `Aqui está o resumo do seu pedido *#${order.orderNumber}* emitido pelo vendedor *${order.sellerName}*:\n\n` +
      `${itemsList}\n\n` +
      `💰 *VALOR TOTAL: R$ ${order.total.toFixed(2)}*\n` +
      `💳 *Condição:* ${order.paymentCondition}\n\n` +
      `📍 *Status:* Enviado ao Caixa Central para pagamento e liberação da expedição.\n` +
      `Agradecemos pela preferência!`;

    const encoded = encodeURIComponent(msg);
    const phoneClean = (order.customerPhone || '').replace(/\D/g, '');
    const url = phoneClean
      ? `https://wa.me/55${phoneClean}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-md mx-auto bg-slate-950 text-slate-100 border-x border-slate-800 shadow-2xl relative select-none">
      {/* Top Header Mobile com Vendedor Ativo */}
      <header className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black border border-amber-500/30 text-xs">
            {currentSeller.code}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-bold text-white truncate max-w-[170px]">{currentSeller.name}</h1>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                Online
              </span>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-amber-500" />
              <span>Balcão Móvel & Showroom</span>
            </p>
          </div>
        </div>

        {/* Seletor Rápido de Vendedor (Gerenciado pelo Admin) */}
        <select
          value={currentSeller.id}
          onChange={(e) => {
            const found = sellers.find((s) => s.id === e.target.value);
            if (found) setCurrentSeller(found);
          }}
          className="bg-slate-950 border border-slate-700 text-[11px] font-bold text-amber-400 rounded-lg px-2 py-1 focus:outline-none"
        >
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              Vendedor {s.code}
            </option>
          ))}
        </select>
      </header>

      {/* Navegação Mobile Inferior / Superior */}
      <div className="grid grid-cols-4 bg-slate-900/90 border-b border-slate-800 text-xs font-bold text-slate-400 p-1">
        <button
          onClick={() => setActiveTab('PRODUTOS')}
          className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
            activeTab === 'PRODUTOS' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          <span className="text-[10px]">Catálogo</span>
        </button>

        <button
          onClick={() => setActiveTab('CARRINHO')}
          className={`py-2 rounded-lg flex flex-col items-center gap-1 relative transition-all ${
            activeTab === 'CARRINHO' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'hover:text-white'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="text-[10px]">Carrinho</span>
          {cart.length > 0 && (
            <span className="absolute top-1 right-3 bg-red-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.2 animate-pulse">
              {cart.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setIsCalcOpen(true)}
          className="py-2 rounded-lg flex flex-col items-center gap-1 hover:text-white transition-all text-cyan-400"
        >
          <Calculator className="w-4 h-4" />
          <span className="text-[10px]">Calculadora</span>
        </button>

        <button
          onClick={() => setActiveTab('CONSULTA')}
          className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
            activeTab === 'CONSULTA' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span className="text-[10px]">Local/Estoque</span>
        </button>
      </div>

      {/* Conteúdo da Aba Ativa */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* ABA 1: CATÁLOGO DE PRODUTOS */}
        {activeTab === 'PRODUTOS' && (
          <div className="space-y-3">
            {/* Barra de Busca com Leitor e Microfone */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar cimento, tubo, piso..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Botão Fone / Microfone */}
              <button
                type="button"
                onClick={() => setIsVoiceOpen(true)}
                className="p-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl font-bold flex items-center gap-1 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                title="Falar produtos no microfone / fone de ouvido"
              >
                <Headphones className="w-4 h-4" />
                <Mic className="w-3 h-3" />
              </button>
            </div>

            {/* Categorias em Pílulas Roláveis */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full whitespace-nowrap font-bold transition-all ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Lista de Produtos */}
            <div className="space-y-2 pb-16">
              {filteredProducts.map((p) => {
                const inCart = cart.find((it) => it.productId === p.id);
                return (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-lg active:scale-[0.99] transition-transform"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-bold">
                          {p.sku}
                        </span>
                        <span className="text-[9px] text-slate-500 truncate">{p.category}</span>
                      </div>
                      <h2 className="text-xs font-bold text-white truncate">{p.name}</h2>
                      
                      <div className="flex items-center gap-2 mt-1 text-[10px]">
                        <span className="text-emerald-400 font-black text-sm">
                          R$ {p.price.toFixed(2)}
                          <span className="text-[9px] font-normal text-slate-400">/{p.unit}</span>
                        </span>
                        <span className="text-slate-500">|</span>
                        <span className="text-slate-400 flex items-center gap-0.5 text-[9px]">
                          <MapPin className="w-2.5 h-2.5 text-amber-500" />
                          <span className="truncate max-w-[90px]">{p.location || 'Pátio'}</span>
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          p.stock > 10 ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                        }`}>
                          Estoque: {p.stock}
                        </span>
                      </div>
                    </div>

                    {/* Botão de Adicionar ao Carrinho */}
                    <button
                      onClick={() => handleAddToCart(p)}
                      className={`p-2.5 rounded-xl font-bold transition-all shrink-0 flex items-center justify-center ${
                        inCart
                          ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 scale-105'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {inCart ? (
                        <div className="flex items-center gap-1 text-xs">
                          <span>{inCart.quantity}</span>
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ABA 2: CARRINHO & EMISSÃO DO PEDIDO */}
        {activeTab === 'CARRINHO' && (
          <div className="space-y-4 pb-20">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Dados do Atendimento</span>
                <span className="text-amber-400 font-mono text-[10px]">{cart.length} itens</span>
              </h2>

              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Nome do Cliente / Construtora</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Construtora Silva ou João da Obra"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">WhatsApp / Fone</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(85) 99999-8888"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Condição Pagamento</label>
                    <select
                      value={paymentCondition}
                      onChange={(e) => setPaymentCondition(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                    >
                      <option value="A Vista / PIX">A Vista / PIX (Caixa)</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Boleto Faturado 30 Dias">Boleto 30 Dias</option>
                      <option value="Crediário da Loja">Crediário da Loja</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Observação / Endereço de Entrega</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Entregar na Rua 15, Bairro Centro (Descarregar na calçada)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Itens do Carrinho */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Itens no Pedido</h2>
              {cart.length === 0 ? (
                <div className="text-center py-8 bg-slate-900/40 border border-slate-800 rounded-2xl">
                  <ShoppingCart className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Carrinho vazio</p>
                  <button
                    onClick={() => setActiveTab('PRODUTOS')}
                    className="mt-2 text-xs text-amber-400 font-bold underline"
                  >
                    Adicionar materiais do catálogo
                  </button>
                </div>
              ) : (
                cart.map((it, idx) => (
                  <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <h4 className="text-xs font-bold text-white leading-tight">{it.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Local: <span className="text-amber-400 font-mono">{it.location}</span>
                        </p>
                      </div>
                      <span className="text-xs font-black text-emerald-400 font-mono">
                        R$ {it.total.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-xs">
                      <span className="text-[10px] text-slate-500">
                        R$ {it.unitPrice.toFixed(2)} / {it.unit}
                      </span>
                      <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl p-1">
                        <button
                          onClick={() => handleUpdateQuantity(idx, -1)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs px-2 font-mono">{it.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(idx, 1)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Resumo Financeiro */}
            {cart.length > 0 && (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal:</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Desconto Comercial (%):</span>
                  <div className="flex items-center gap-1 w-20">
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1 text-right text-xs text-amber-400 font-bold"
                    />
                    <span>%</span>
                  </div>
                </div>

                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                  <span>TOTAL A PAGAR:</span>
                  <span className="text-emerald-400 text-base">R$ {grandTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA 4: CONSULTA RÁPIDA DE ESTOQUE & LOCALIZAÇÃO */}
        {activeTab === 'CONSULTA' && (
          <div className="space-y-3 pb-16">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>Localização no Pátio / Galpão</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Consulte em qual baia, prateleira ou corredor o material está guardado sem sair do lado do cliente.
              </p>
            </div>

            <div className="space-y-2">
              {products.map((p) => (
                <div key={p.id} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{p.name}</h4>
                    <p className="text-[10px] text-amber-400 font-mono flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span>{p.location || 'Pátio Central'}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-400">{p.stock} {p.unit}</span>
                    <p className="text-[9px] text-slate-500">disp. imediata</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Barra Fixa Inferior de Ação ao estar no Carrinho */}
      {activeTab === 'CARRINHO' && cart.length > 0 && (
        <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex gap-2">
          <button
            onClick={handleSendOrderToCashier}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Enviar ao Caixa Central</span>
          </button>
        </div>
      )}

      {/* Modal de Sucesso com Compartilhamento WhatsApp */}
      {orderSuccessModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Pedido Enviado ao Caixa!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Número: <strong className="text-amber-400 font-mono">{orderSuccessModal.orderNumber}</strong>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Já disponível no monitor do Caixa Central para pagamento e liberação da expedição.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Cliente:</span>
                <span className="font-bold text-white">{orderSuccessModal.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total:</span>
                <span className="font-bold text-emerald-400 font-mono">R$ {orderSuccessModal.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleShareWhatsApp(orderSuccessModal)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Compartilhar via WhatsApp</span>
              </button>

              <button
                onClick={() => setOrderSuccessModal(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
              >
                Novo Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal da Calculadora de Obras embutida */}
      <MaterialsCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        onApplyMaterials={(items) => {
          items.forEach((it) => {
            const newItem: SaleItem = {
              productId: `calc-${Date.now()}-${Math.random()}`,
              name: it.productName,
              sku: 'CALC',
              unit: it.unit,
              unitPrice: it.estimatedPrice,
              cost: it.estimatedPrice * 0.7,
              quantity: it.quantity,
              discount: 0,
              total: it.quantity * it.estimatedPrice,
              location: 'Depósito Central',
            };
            setCart((prev) => [...prev, newItem]);
          });
          setIsCalcOpen(false);
          setActiveTab('CARRINHO');
        }}
        availableProducts={products}
      />

      {/* Modal de Comando de Voz */}
      <VoiceOrderModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        availableProducts={products}
        onAddItemsToOrder={(items) => {
          setCart((prev) => [...prev, ...items]);
          setIsVoiceOpen(false);
          setActiveTab('CARRINHO');
        }}
      />
    </div>
  );
};
