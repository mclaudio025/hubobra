import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  User,
  ArrowRight,
  Receipt,
  FileCheck,
  AlertCircle,
  Package,
  Truck,
  Sparkles,
  CreditCard,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { db, LocalOrder } from '../db/db';
import { PaymentModal } from './PaymentModal';

interface CashierQueueViewProps {
  onPrintOrder: (order: LocalOrder) => void;
  isOnline: boolean;
}

export const CashierQueueView: React.FC<CashierQueueViewProps> = ({ onPrintOrder, isOnline }) => {
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<LocalOrder | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [activeQueueTab, setActiveQueueTab] = useState<'PENDING' | 'ON_DELIVERY' | 'COMPLETED'>('PENDING');

  const loadOrders = async () => {
    const all = await db.orders.orderBy('createdAt').reverse().toArray();
    setOrders(all);
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000); // Polling local leve
    return () => clearInterval(interval);
  }, []);

  const pendingOrders = orders.filter((o) => o.status === 'AGUARDANDO_PAGAMENTO');
  const onDeliveryOrders = orders.filter((o) => o.status === 'EM_ROTA_ENTREGA');
  const completedOrders = orders.filter((o) => o.status === 'PAGO');

  const filteredPending = pendingOrders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.sellerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOnDelivery = onDeliveryOrders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.sellerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenPayment = async (order: LocalOrder) => {
    setSelectedOrder(order);
    if (order.customerId) {
      const cust = await db.customers.get(order.customerId);
      setActiveCustomer(cust || null);
    } else if (order.customerName) {
      const allCust = await db.customers.toArray();
      const cust = allCust.find(
        (c) =>
          c.name.toLowerCase().includes(order.customerName.toLowerCase()) ||
          order.customerName.toLowerCase().includes(c.name.toLowerCase()) ||
          (c.name.toLowerCase().includes('silva') && order.customerName.toLowerCase().includes('silva'))
      );
      setActiveCustomer(cust || null);
    } else {
      setActiveCustomer(null);
    }
    setIsPaymentModalOpen(true);
  };

  // Liberar pedido para entrega na obra com maquininha (sem cobrar agora)
  const handleReleaseForDelivery = async (order: LocalOrder) => {
    const driver = prompt(
      'Informe o nome do Motorista ou Entregador que levará a maquininha:',
      order.deliveryDriver || 'Motorista João (Caminhão 02)'
    );
    if (!driver) return;

    await db.orders.update(order.id, {
      status: 'EM_ROTA_ENTREGA',
      deliveryDriver: driver,
      notes: `${order.notes || ''} | 🚚 Liberado para entrega com maquininha por ${driver}`.trim(),
    });

    alert(`Pedido #${order.orderNumber} liberado para entrega! Motorista ${driver} deve prestar contas no retorno.`);
    await loadOrders();
  };

  const handleConfirmPayment = async (paymentData: any) => {
    if (!selectedOrder) return;

    // Se usou crédito de haver na loja, abater do saldo do cliente
    if (paymentData.storeCreditUsed && paymentData.storeCreditUsed > 0 && activeCustomer) {
      const newStoreCredit = Math.max(0, (activeCustomer.storeCredit || 0) - paymentData.storeCreditUsed);
      await db.customers.update(activeCustomer.id, { storeCredit: newStoreCredit });
    }

    // Se usou crediário a prazo, atualizar creditUsed do cliente
    if (paymentData.creditUsed && paymentData.creditUsed > 0 && activeCustomer) {
      await db.customers.update(activeCustomer.id, {
        creditUsed: (activeCustomer.creditUsed || 0) + paymentData.creditUsed,
      });
    }

    const updatedOrderData: Partial<LocalOrder> = {
      status: 'PAGO',
      paidAt: new Date().toISOString(),
      cashierName: 'Operador Caixa Central',
      paymentCondition: paymentData.paymentSummary || paymentData.method,
      payments: paymentData.payments,
      change: paymentData.change || 0,
      storeCreditUsed: paymentData.storeCreditUsed || 0,
      fiscalStatus: paymentData.emitNfce ? (isOnline ? 'AUTHORIZED_SEFAZ' : 'CONTINGENCY_EMITTED') : 'NOT_EMITTED',
      fiscalKey: paymentData.emitNfce
        ? '2326' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 10)).join('')
        : undefined,
    };

    await db.orders.update(selectedOrder.id, updatedOrderData);

    const isFuturePickup = selectedOrder.deliveryMode === 'FUTURE_PICKUP' || selectedOrder.isFutureDelivery;

    // Baixa de estoque dos produtos SOMENTE se for entrega/retirada imediata
    // Se for Saldo de Materiais (FUTURE_PICKUP), o estoque físico permanece INTACTO no galpão
    if (!isFuturePickup) {
      for (const item of selectedOrder.items) {
        const prod = await db.products.get(item.productId);
        if (prod) {
          await db.products.update(item.productId, {
            stock: Math.max(0, prod.stock - item.quantity),
            reservedStock: Math.max(0, (prod.reservedStock || 0) - item.quantity),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } else {
      console.log(`📦 Venda #${selectedOrder.orderNumber} confirmada como SALDO DE MATERIAIS. Estoque físico mantido na loja.`);
    }

    setIsPaymentModalOpen(false);
    const updated = { ...selectedOrder, ...updatedOrderData } as LocalOrder;
    onPrintOrder(updated);
    await loadOrders();
    setSelectedOrder(null);
    setActiveCustomer(null);
  };

  // Função para injetar ordens de exemplo dinamicamente no Caixa
  const handleCreateSampleOrder = async (sampleType: 'SALDO_MATERIAIS' | 'BALCAO_IMEDIATO' | 'LIA_WHATSAPP') => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    let sampleOrder: LocalOrder;

    if (sampleType === 'SALDO_MATERIAIS') {
      sampleOrder = {
        id: `ord-sld-${Date.now()}`,
        orderNumber: `PED-SLD${randomSuffix}`,
        type: 'PEDIDO_VENDA',
        createdAt: new Date().toISOString(),
        sellerId: 'v-1',
        sellerName: 'Carlos Eduardo (Balcão 1)',
        origin: 'BALCAO',
        customerId: 'c-001',
        customerName: 'Engenheiro Roberto Albuquerque (Obra Jardins)',
        customerPhone: '(85) 98765-4321',
        deliveryMode: 'FUTURE_PICKUP',
        isFutureDelivery: true,
        items: [
          {
            productId: 'p-001',
            name: 'Cimento Poty Todas as Obras 50kg CP II-F',
            sku: '001100',
            unit: 'SACO',
            unitPrice: 53.90,
            cost: 39.50,
            quantity: 150,
            discount: 0,
            total: 8085.00,
            location: 'Galpão 01 - Baia A (Estoque Retido)',
          },
          {
            productId: 'p-007',
            name: 'Tijolo Cerâmico 8 Furos 9x19x19cm (Lote 10 Milheiro)',
            sku: 'TIJ001',
            unit: 'MILHEIRO',
            unitPrice: 890.00,
            cost: 650.00,
            quantity: 8,
            discount: 0,
            total: 7120.00,
            location: 'Pátio Aberto - Bloco 04',
          }
        ],
        subtotal: 15205.00,
        discount: 205.00,
        shipping: 0.00,
        total: 15000.00,
        paymentCondition: 'À Vista no Caixa (PIX / TED)',
        status: 'AGUARDANDO_PAGAMENTO',
        fiscalStatus: 'NOT_EMITTED',
        notes: '📦 SALDO DE MATERIAIS: Cliente comprou 150 sacos de cimento e 8 milheiros de tijolo para travar o preço. Material FICA no galpão e será retirado aos poucos.',
        syncedToCloud: true,
        syncedToGestaoClick: false,
      };
    } else if (sampleType === 'LIA_WHATSAPP') {
      sampleOrder = {
        id: `ord-lia-${Date.now()}`,
        orderNumber: `PED-IA${randomSuffix}`,
        type: 'PEDIDO_VENDA',
        createdAt: new Date().toISOString(),
        sellerId: 'v-lia-ai',
        sellerName: 'Lia (Consultora Virtual IA 🤖)',
        origin: 'LIA_AI',
        isAiGenerated: true,
        customerId: 'c-002',
        customerName: 'Mestre Raimundo Alves (WhatsApp)',
        customerPhone: '(85) 99123-4567',
        deliveryMode: 'IMMEDIATE',
        isFutureDelivery: false,
        items: [
          {
            productId: 'p-004',
            name: 'Tinta Acrílica Standard Fosco Coral 20L Branco',
            sku: 'TIN001',
            unit: 'LITRO',
            unitPrice: 299.90,
            cost: 210.00,
            quantity: 3,
            discount: 0,
            total: 899.70,
            location: 'Showroom - Gôndola Tintas 01',
          }
        ],
        subtotal: 899.70,
        discount: 19.70,
        shipping: 0,
        total: 880.00,
        paymentCondition: 'PIX WhatsApp / Caixa',
        status: 'AGUARDANDO_PAGAMENTO',
        fiscalStatus: 'NOT_EMITTED',
        notes: '✨ Pedido gerado via WhatsApp pela Lia IA. Retirada rápida no balcão.',
        syncedToCloud: true,
        syncedToGestaoClick: true,
      };
    } else {
      sampleOrder = {
        id: `ord-bal-${Date.now()}`,
        orderNumber: `PED-${randomSuffix}`,
        type: 'PEDIDO_VENDA',
        createdAt: new Date().toISOString(),
        sellerId: 'v-1',
        sellerName: 'Carlos Eduardo (Balcão 1)',
        origin: 'BALCAO',
        customerId: 'c-001',
        customerName: 'Construtora e Engenharia Silva Ltda',
        customerPhone: '(85) 98877-6655',
        deliveryMode: 'IMMEDIATE',
        isFutureDelivery: false,
        items: [
          {
            productId: 'p-001',
            name: 'Cimento Poty Todas as Obras 50kg CP II-F',
            sku: '001100',
            unit: 'SACO',
            unitPrice: 53.90,
            cost: 39.50,
            quantity: 20,
            discount: 0,
            total: 1078.00,
            location: 'Galpão 01 - Baia A',
          },
          {
            productId: 'p-008',
            name: 'Argamassa AC-III Cinza 20kg Quartzolit',
            sku: 'ARG001',
            unit: 'SACO',
            unitPrice: 36.90,
            cost: 24.50,
            quantity: 10,
            discount: 0,
            total: 369.00,
            location: 'Galpão 01 - Baia B',
          }
        ],
        subtotal: 1447.00,
        discount: 47.00,
        shipping: 0,
        total: 1400.00,
        paymentCondition: 'Cartão de Débito / Dinheiro',
        status: 'AGUARDANDO_PAGAMENTO',
        fiscalStatus: 'NOT_EMITTED',
        notes: 'Venda rápida de balcão para retirada imediata.',
        syncedToCloud: true,
        syncedToGestaoClick: false,
      };
    }

    await db.orders.put(sampleOrder);
    await loadOrders();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-500" />
            <span>Caixa Central • Fila de Pagamentos & Prestação de Contas</span>
          </h2>
          <p className="text-xs text-slate-400">
            {pendingOrders.length} pedido(s) no balcão/PIX • {onDeliveryOrders.length} pedido(s) em rota para acerto
          </p>
        </div>

        {/* Botões Rápidos de Inserção de Exemplo */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleCreateSampleOrder('SALDO_MATERIAIS')}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            title="Adiciona um pedido de Saldo de Materiais (Card Amarelo que não baixa estoque)"
          >
            <Package className="w-3.5 h-3.5" />
            <span>+ Exemplo Saldo Loja (Amarelo)</span>
          </button>

          <button
            onClick={() => handleCreateSampleOrder('BALCAO_IMEDIATO')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Adiciona um pedido normal de balcão para retirada imediata"
          >
            <span>+ Exemplo Balcão</span>
          </button>

          <button
            onClick={() => handleCreateSampleOrder('LIA_WHATSAPP')}
            className="px-3 py-1.5 bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-500/30 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Adiciona um pedido gerado pela IA Lia via WhatsApp"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>+ Exemplo Lia IA</span>
          </button>
        </div>

        <div className="w-full md:w-72 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar pedido, cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Seletor de Fila (Balcão / Rota / Histórico) */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveQueueTab('PENDING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeQueueTab === 'PENDING'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Fila Balcão & PIX ({pendingOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveQueueTab('ON_DELIVERY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeQueueTab === 'ON_DELIVERY'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>🚚 Pagar na Entrega / Acerto de Rota ({onDeliveryOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveQueueTab('COMPLETED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeQueueTab === 'COMPLETED'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Recebidos Hoje ({completedOrders.length})</span>
        </button>
      </div>

      {/* ABA 1: FILA DE PEDIDOS EM ESPERA NO BALCÃO / PIX / IA */}
      {activeQueueTab === 'PENDING' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPending.map((order) => {
            const isFuturePickup = order.deliveryMode === 'FUTURE_PICKUP' || order.isFutureDelivery;
            const isAiOrder = order.isAiGenerated || order.origin === 'LIA_AI' || order.sellerName.toLowerCase().includes('lia');
            const isDeliveryPayment = order.paymentCondition?.toLowerCase().includes('entrega');

            return (
              <div
                key={order.id}
                className={`bg-slate-900 rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all relative overflow-hidden group border ${
                  isFuturePickup
                    ? 'border-amber-400 shadow-amber-500/15 hover:border-amber-300 bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/40 ring-1 ring-amber-400/40'
                    : isAiOrder
                    ? 'border-purple-500/50 shadow-purple-500/10 hover:border-purple-400 bg-gradient-to-b from-slate-900 to-purple-950/20'
                    : isDeliveryPayment
                    ? 'border-cyan-500/40 hover:border-cyan-400'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Badge de Status / Origem */}
                <div
                  className={`absolute top-0 right-0 font-black text-[10px] px-3 py-1 rounded-bl-xl uppercase flex items-center gap-1 shadow-md ${
                    isFuturePickup
                      ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-slate-950 font-black shadow-amber-500/20'
                      : isAiOrder
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : isDeliveryPayment
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {isFuturePickup ? (
                    <span className="flex items-center gap-1">📦 SALDO NA LOJA (RETIRADA FUTURA)</span>
                  ) : isAiOrder ? (
                    <span>✨ FEITO POR IA (LIA)</span>
                  ) : isDeliveryPayment ? (
                    <span>🚚 PAGAR NA ENTREGA</span>
                  ) : (
                    <span>Aguardando Pagamento</span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-mono font-black text-sm ${isFuturePickup ? 'text-amber-400 font-bold' : isAiOrder ? 'text-purple-400' : 'text-slate-300'}`}>
                      {order.orderNumber}
                    </span>
                    <span className="text-[10px] text-slate-500">•</span>
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${isFuturePickup ? 'text-yellow-300' : isAiOrder ? 'text-pink-300' : 'text-slate-400'}`}>
                      {order.sellerName}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1 truncate">{order.customerName}</h4>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <span>Condição: <strong className="text-slate-300">{order.paymentCondition || 'A Vista'}</strong></span>
                    {order.customerPhone && (
                      <span className="text-[10px] text-emerald-400 font-mono">📱 {order.customerPhone}</span>
                    )}
                  </div>

                  {/* ALERTA VISUAL DE SALDO DE MATERIAL RETIDO */}
                  {isFuturePickup && (
                    <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-amber-300 text-[11px] font-bold">
                      <Package className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>⚠️ Material FICA na loja. NÃO carregar caminhão agora.</span>
                    </div>
                  )}

                  {/* Resumo de Itens */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1 max-h-32 overflow-y-auto">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] text-slate-300">
                        <span className="truncate pr-2">
                          {it.quantity} {it.unit} x {it.name}
                        </span>
                        <span className="font-mono font-bold text-slate-200 shrink-0">R$ {it.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <p className="text-[10px] text-slate-400 mt-2 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800 truncate">
                      {order.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total a Receber:</span>
                      <span className="text-xl font-black text-emerald-400 font-mono">R$ {order.total.toFixed(2)}</span>
                    </div>

                    <button
                      onClick={() => handleOpenPayment(order)}
                      className={`px-4 py-2.5 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg transition-all ${
                        isFuturePickup
                          ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/20'
                          : isAiOrder
                          ? 'bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white shadow-purple-600/20'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                      }`}
                    >
                      <span>{isFuturePickup ? 'Receber & Gerar Saldo [F10]' : 'Receber no Caixa [F10]'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Botão de Liberar para Entrega com Maquininha */}
                  {isDeliveryPayment && !isFuturePickup && (
                    <button
                      onClick={() => handleReleaseForDelivery(order)}
                      className="w-full py-2 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-xl text-xs font-bold border border-cyan-500/30 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Liberar p/ Entrega (Levar Maquininha) ➔</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredPending.length === 0 && (
            <div className="col-span-full bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl py-12 text-center text-slate-500">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-60" />
              <p className="text-sm font-bold text-slate-300">Fila Limpa! Nenhum pedido aguardando no balcão.</p>
            </div>
          )}
        </div>
      )}

      {/* ABA 2: PEDIDOS EM ROTA DE ENTREGA (AGUARDANDO ACERTO / PRESTAÇÃO DE CONTAS) */}
      {activeQueueTab === 'ON_DELIVERY' && (
        <div className="space-y-4">
          <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Controle de Entregas com Cobrança na Obra</h3>
                <p className="text-xs text-slate-400">
                  Estes pedidos foram liberados para entrega. Quando o motorista/vendedor retornar com o dinheiro ou comprovante do cartão, faça a prestação de contas aqui.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOnDelivery.map((order) => (
              <div
                key={order.id}
                className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 flex flex-col justify-between shadow-xl relative"
              >
                <div className="absolute top-0 right-0 bg-cyan-500 text-slate-950 font-black text-[10px] px-3 py-1 rounded-bl-xl uppercase flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" />
                  <span>EM ROTA • COBRAR NA OBRA</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono font-black text-sm text-cyan-400">{order.orderNumber}</span>
                    <span className="text-[10px] text-slate-500">•</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{order.sellerName}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1 truncate">{order.customerName}</h4>
                  
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1 my-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Responsável Cobrança:</span>
                      <strong className="text-cyan-300 font-semibold">{order.deliveryDriver || 'Motorista da Loja'}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Forma Combinada:</span>
                      <span className="text-white">{order.paymentCondition}</span>
                    </div>
                  </div>

                  {/* Resumo de Itens */}
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800 space-y-1 max-h-24 overflow-y-auto">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] text-slate-300">
                        <span className="truncate pr-2">{it.quantity} {it.unit} x {it.name}</span>
                        <span className="font-mono font-bold">R$ {it.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Valor a Prestar Contas:</span>
                    <span className="text-xl font-black text-cyan-400 font-mono">R$ {order.total.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={() => handleOpenPayment(order)}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Prestar Contas & Baixar</span>
                  </button>
                </div>
              </div>
            ))}

            {filteredOnDelivery.length === 0 && (
              <div className="col-span-full bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl py-12 text-center text-slate-500">
                <Truck className="w-10 h-10 mx-auto mb-2 text-cyan-500 opacity-60" />
                <p className="text-sm font-bold text-slate-300">Nenhum pedido em rota de entrega aguardando acerto.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 3: HISTÓRICO DE PEDIDOS RECEBIDOS HOJE */}
      {activeQueueTab === 'COMPLETED' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Nº Pedido</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Vendedor / Origem</th>
                <th className="p-3">Pago Em</th>
                <th className="p-3 text-right">Valor Total</th>
                <th className="p-3 text-center">NFC-e Fiscal</th>
                <th className="p-3 text-center">Comprovante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {completedOrders.slice(0, 15).map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-amber-400">{ord.orderNumber}</td>
                  <td className="p-3 font-semibold text-white">{ord.customerName}</td>
                  <td className="p-3">
                    <span className="text-slate-300 font-semibold">{ord.sellerName}</span>
                  </td>
                  <td className="p-3 text-slate-400">
                    {ord.paidAt ? new Date(ord.paidAt).toLocaleTimeString('pt-BR') : 'Hoje'}
                  </td>
                  <td className="p-3 text-right font-mono font-black text-emerald-400">
                    R$ {ord.total.toFixed(2)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      NFC-e Emitida
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => onPrintOrder(ord)}
                      className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                      title="Reimprimir Cupom Térmico"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Pagamento */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setActiveCustomer(null);
        }}
        order={selectedOrder}
        customer={activeCustomer}
        onConfirmPayment={handleConfirmPayment}
      />
    </div>
  );
};
