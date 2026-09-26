'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  Truck,
  PackageCheck,
  RotateCw,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  LogOut,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Phone,
  FileText,
  SlidersHorizontal,
  Send,
  ShieldAlert,
} from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  total: number;
  product: {
    id: string;
    name: string;
    sku: string;
    unit?: string;
    unitMultiplier?: number;
    images?: Array<{ url: string }>;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  notes?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  shippingAddress?: {
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    zipCode: string;
  };
  payment?: {
    method: string;
    status: string;
    amount: number;
  };
  items: OrderItem[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export default function ExpedicaoPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isExpedition, logout, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Checklist local de conferência por pedido { [orderId]: { [itemId]: boolean } }
  const [checkedItems, setCheckedItems] = useState<Record<string, Record<string, boolean>>>({});
  
  // Estado do modal/ação de despacho
  const [dispatchModalOrder, setDispatchModalOrder] = useState<Order | null>(null);
  const [driverName, setDriverName] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('MOTOBOY');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [dispatching, setDispatching] = useState(false);
  
  // Feedback toast
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Redirecionamento de segurança
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isExpedition)) {
      router.push('/expedicao/login');
    }
  }, [isAuthenticated, isExpedition, authLoading, router]);

  // Busca fila de pedidos
  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!token) return;
    if (!isSilent) setRefreshing(true);

    try {
      let url = `${API_URL}/orders/expedition?`;
      if (statusFilter && statusFilter !== 'ALL') {
        url += `status=${statusFilter}&`;
      }
      if (searchTerm) {
        url += `search=${encodeURIComponent(searchTerm)}&`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push('/expedicao/login');
          return;
        }
        throw new Error('Falha ao consultar fila de expedição');
      }

      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err: any) {
      console.error('Erro ao buscar pedidos:', err);
      if (!isSilent) {
        setErrorToast('Não foi possível atualizar os pedidos da expedição.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, statusFilter, searchTerm, router]);

  // Polling automático a cada 20 segundos
  useEffect(() => {
    if (isAuthenticated && isExpedition) {
      fetchOrders();
      const interval = setInterval(() => {
        fetchOrders(true);
      }, 20000);
      return () => clearInterval(interval);
    }
  }, [fetchOrders, isAuthenticated, isExpedition]);

  // Alterna checklist de conferência de um item
  const toggleItemCheck = (orderId: string, itemId: string) => {
    setCheckedItems((prev) => {
      const orderChecks = prev[orderId] || {};
      const isCurrentlyChecked = !!orderChecks[itemId];
      const updated = {
        ...prev,
        [orderId]: {
          ...orderChecks,
          [itemId]: !isCurrentlyChecked,
        },
      };

      // Feedback tátil leve no celular
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(25);
      }

      return updated;
    });
  };

  // Abre modal de despacho
  const handleOpenDispatch = (order: Order) => {
    setDispatchModalOrder(order);
    setDriverName('');
    setDeliveryMethod('MOTOBOY');
    setVehiclePlate('');
    setDispatchNotes('');
  };

  // Executa liberação do pedido
  const handleConfirmDispatch = async () => {
    if (!dispatchModalOrder || !token) return;

    setDispatching(true);
    try {
      const res = await fetch(`${API_URL}/orders/${dispatchModalOrder.id}/dispatch`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverName: driverName.trim() || undefined,
          deliveryMethod,
          vehiclePlate: vehiclePlate.trim() || undefined,
          notes: dispatchNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao liberar pedido.');
      }

      // Vibração de sucesso no celular
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([60, 40, 100]);
      }

      // Atualiza lista removendo o pedido despachado
      setOrders((prev) => prev.filter((o) => o.id !== dispatchModalOrder.id));
      setSuccessToast(`🚀 Pedido #${dispatchModalOrder.orderNumber} liberado para entrega!`);
      setDispatchModalOrder(null);

      setTimeout(() => {
        setSuccessToast(null);
      }, 4000);
    } catch (err: any) {
      console.error('Falha ao despachar:', err);
      setErrorToast(err?.message || 'Falha ao despachar pedido.');
      setTimeout(() => {
        setErrorToast(null);
      }, 4000);
    } finally {
      setDispatching(false);
    }
  };

  if (authLoading || (loading && orders.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4">
        <div className="w-16 h-16 rounded-2xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center animate-pulse mb-4">
          <Truck className="w-8 h-8 text-orange-500 animate-bounce" />
        </div>
        <p className="text-slate-300 font-medium tracking-wide">Carregando Fila de Expedição...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-slate-950 text-slate-100 flex flex-col">
      {/* Topo / Header Fixo da Expedição */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center shadow-md shadow-orange-600/30">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white leading-tight flex items-center gap-2">
                Hub<span className="text-orange-500">Expedição</span>
                <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full font-mono font-bold border border-orange-500/30">
                  {orders.length} na fila
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Operador: <span className="text-slate-200 font-medium">{user?.name || user?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchOrders()}
              disabled={refreshing}
              title="Atualizar lista"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <RotateCw className={`w-5 h-5 ${refreshing ? 'animate-spin text-orange-400' : ''}`} />
            </button>
            <button
              onClick={() => {
                logout();
                router.push('/expedicao/login');
              }}
              title="Sair do Galpão"
              className="p-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 transition cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Busca & Filtros Rápidos */}
        <div className="max-w-4xl mx-auto mt-3 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nº do pedido, cliente ou bairro..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'PROCESSING', label: 'Em Separação' },
              { id: 'CONFIRMED', label: 'Confirmados' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-750'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Toast de Sucesso */}
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-900/90 border border-emerald-500 text-emerald-100 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-lg animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Toast de Erro */}
      {errorToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-950/90 border border-red-500 text-red-100 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-lg animate-in fade-in slide-in-from-top-4">
          <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
          <span className="text-sm font-semibold">{errorToast}</span>
        </div>
      )}

      {/* Lista Principal de Pedidos */}
      <main className="max-w-4xl mx-auto w-full p-4 space-y-4 flex-1">
        {orders.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center my-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-4">
              <PackageCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Tudo Pronto na Expedição!</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Nenhum pedido aguardando liberação no momento. Assim que um novo pedido for confirmado na loja, ele aparecerá aqui automaticamente.
            </p>
            <button
              onClick={() => fetchOrders()}
              className="mt-6 inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-xl border border-slate-700 text-sm transition cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              <span>Verificar Agora</span>
            </button>
          </div>
        ) : (
          orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const orderChecklist = checkedItems[order.id] || {};
            const totalItemsCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
            const checkedCount = order.items.filter((i) => orderChecklist[i.id]).length;
            const allChecked = order.items.length > 0 && checkedCount === order.items.length;

            return (
              <div
                key={order.id}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl transition-all duration-200 hover:border-slate-700"
              >
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg sm:text-xl font-black text-orange-400 tracking-tight">
                        #{order.orderNumber}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          order.status === 'PROCESSING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {order.status === 'PROCESSING' ? 'Em Separação' : 'Confirmado'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(order.createdAt).toLocaleString('pt-BR')}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Total da Carga</span>
                    <p className="text-base sm:text-lg font-black text-emerald-400">
                      R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Dados de Entrega e Cliente */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-850 mb-3 text-xs">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-400 font-medium">Cliente</p>
                      <p className="text-slate-200 font-bold text-sm truncate">{order.user?.name || 'Cliente'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-400 font-medium">Endereço de Entrega</p>
                      <p className="text-slate-200 font-semibold leading-tight">
                        {order.shippingAddress
                          ? `${order.shippingAddress.street}, ${order.shippingAddress.number} - ${order.shippingAddress.district}, ${order.shippingAddress.city}`
                          : 'Retirada no Depósito'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Observações do Pedido (se houver) */}
                {order.notes && (
                  <div className="bg-amber-950/30 border border-amber-900/40 rounded-xl p-2.5 mb-3 text-xs text-amber-200/90 flex items-start gap-2">
                    <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300">Observações: </span>
                      <span>{order.notes}</span>
                    </div>
                  </div>
                )}

                {/* Resumo & Checklist de Itens */}
                <div className="border-t border-slate-800/80 pt-3">
                  <button
                    type="button"
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white font-semibold py-1 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <PackageCheck className="w-4 h-4 text-orange-400" />
                      <span>
                        Itens do Pedido ({order.items.length} produtos / {totalItemsCount} volumes)
                      </span>
                      {checkedCount > 0 && (
                        <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {checkedCount}/{order.items.length} conferidos
                        </span>
                      )}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Lista detalhada ao expandir */}
                  {isExpanded && (
                    <div className="mt-3 space-y-2 animate-in fade-in duration-200">
                      <div className="text-[11px] text-slate-400 mb-1 flex justify-between">
                        <span>Toque no item para marcar como conferido/embalado:</span>
                        {allChecked && <span className="text-emerald-400 font-bold">✓ Carga 100% Conferida!</span>}
                      </div>

                      {order.items.map((item) => {
                        const isChecked = !!orderChecklist[item.id];
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleItemCheck(order.id, item.id)}
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition select-none ${
                              isChecked
                                ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                                : 'bg-slate-950/90 border-slate-800 text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-6 h-6 rounded-lg border flex items-center justify-center transition ${
                                  isChecked
                                    ? 'bg-emerald-500 border-emerald-400 text-white'
                                    : 'border-slate-600 bg-slate-900'
                                }`}
                              >
                                {isChecked && <CheckCircle2 className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className={`text-xs sm:text-sm font-bold ${isChecked ? 'line-through opacity-80' : ''}`}>
                                  {item.product?.name || 'Produto sem nome'}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  SKU: {item.product?.sku || 'S/N'} {item.product?.unit ? `| Un: ${item.product.unit}` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-sm font-black text-orange-400">
                                {item.quantity} {item.product?.unit || 'UN'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* BOTÃO DE AÇÃO PRINCIPAL: LIBERAR SAÍDA */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDispatch(order)}
                    className="w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm sm:text-base transition cursor-pointer"
                  >
                    <Send className="w-5 h-5" />
                    <span>🚀 LIBERAR - SAIU PARA ENTREGA</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* MODAL DE CONFIRMAÇÃO DE DESPACHO */}
      {dispatchModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-750 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-6 sm:fade-in duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    Confirmar Saída #{dispatchModalOrder.orderNumber}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cliente: {dispatchModalOrder.user?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDispatchModalOrder(null)}
                className="text-slate-400 hover:text-white text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Modalidade / Tipo de Transporte
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'MOTOBOY', label: '🛵 Motoboy Express' },
                    { id: 'CAMINHAO', label: '🚛 Caminhão de Carga' },
                    { id: 'UTILITARIO', label: '🚗 Fiorino / Utilitário' },
                    { id: 'RETIRADA', label: '📦 Retirada no Local' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setDeliveryMethod(m.id)}
                      className={`p-2.5 rounded-xl border text-left font-medium transition cursor-pointer ${
                        deliveryMethod === m.id
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nome do Entregador / Motorista (Opcional)
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Ex: Carlos (Motoboy 02) ou Transportadora"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Placa do Veículo / Identificação (Opcional)
                </label>
                <input
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="Ex: BRA2E19"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Observações da Expedição (Opcional)
                </label>
                <input
                  type="text"
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  placeholder="Ex: Volume frágil amarrado com fita reforçada"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex gap-3">
              <button
                type="button"
                onClick={() => setDispatchModalOrder(null)}
                disabled={dispatching}
                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                disabled={dispatching}
                className="w-2/3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {dispatching ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirmar Despacho</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
