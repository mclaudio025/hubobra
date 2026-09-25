'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Eye, 
  X, 
  Calendar, 
  CreditCard, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../hooks/useApi';
import { useToast } from '../components/ui/Toaster';
import Loading from '../components/ui/Loading';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    sku: string;
    images?: Array<{ url: string }>;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  createdAt: string;
  deliveryMethod?: string;
  items: OrderItem[];
  payment: {
    method: string;
    status: string;
    amount: number;
  };
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { isAuthenticated } = useAuth();
  const ordersApi = useOrders();
  const { addToast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated, page]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getMyOrders(page, 10);
      setOrders(response.data || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      addToast({
        type: 'error',
        title: 'Erro ao carregar pedidos',
        message: 'Tente novamente mais tarde'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Tem certeza que deseja cancelar o pedido #${orderNumber}?`)) {
      return;
    }

    try {
      await ordersApi.cancelOrder(orderId, 'Cancelado pelo cliente');
      addToast({
        type: 'success',
        title: 'Pedido cancelado',
        message: `Pedido #${orderNumber} foi cancelado com sucesso`
      });
      loadOrders();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erro ao cancelar pedido',
        message: error.message || 'Tente novamente'
      });
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      'PENDING': { 
        label: 'Pendente', 
        color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60', 
        icon: Clock 
      },
      'CONFIRMED': { 
        label: 'Confirmado', 
        color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60', 
        icon: CheckCircle 
      },
      'PROCESSING': { 
        label: 'Em Separação', 
        color: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60', 
        icon: Package 
      },
      'SHIPPED': { 
        label: 'A Caminho da Obra', 
        color: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60', 
        icon: Truck 
      },
      'DELIVERED': { 
        label: 'Entregue na Obra', 
        color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60', 
        icon: CheckCircle 
      },
      'CANCELLED': { 
        label: 'Cancelado', 
        color: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60', 
        icon: AlertCircle 
      },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap['PENDING'];
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      'CREDIT_CARD': 'Cartão de Crédito',
      'DEBIT_CARD': 'Cartão de Débito',
      'PIX': 'PIX Instantâneo',
      'BANK_SLIP': 'Boleto Bancário',
      'CASH': 'Pagar no Recebimento / Maquininha',
      'STORE_PICKUP': 'Pagar na Retirada',
      'CASH_ON_DELIVERY': 'Pagar no Recebimento / Maquininha'
    };
    return methods[method as keyof typeof methods] || method || 'Dinheiro';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canCancelOrder = (status: string) => {
    return ['PENDING', 'CONFIRMED'].includes(status);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-md w-full">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Acesso aos Pedidos</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
            Faça login na sua conta para acompanhar seus pedidos e comprovantes de compra.
          </p>
          <Link
            href="/login?redirect=/pedidos"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg shadow-orange-600/20 inline-block"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Meus Pedidos</h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Acompanhe status, notas fiscais, separação e recibos de entrega
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 rounded-xl transition"
            >
              <span>Novo Pedido</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loading size="lg" text="Carregando seus pedidos..." />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Nenhum pedido encontrado</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Você ainda não finalizou nenhum pedido de materiais na HubObra.
            </p>
            <Link
              href="/"
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg shadow-orange-600/20 inline-block text-sm"
            >
              Explorar Materiais de Construção
            </Link>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const StatusIcon = statusInfo.icon;
              const itemCount = order.items.reduce((acc, i) => acc + (i.quantity || 1), 0);

              return (
                <div 
                  key={order.id} 
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-black text-slate-900 dark:text-white text-base">
                            Pedido #{order.orderNumber}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${statusInfo.color}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Realizado em {formatDate(order.createdAt)}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                        <Link
                          href={`/pedidos/${order.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Ver Detalhes</span>
                        </Link>
                        
                        <Link
                          href={`/pedidos/${order.id}/recibo`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
                          title="Ver comprovante e recibo oficial"
                        >
                          <FileText className="h-3.5 w-3.5 text-orange-600" />
                          <span>Recibo</span>
                        </Link>

                        {canCancelOrder(order.status) && (
                          <button
                            onClick={() => handleCancelOrder(order.id, order.orderNumber)}
                            className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
                            title="Cancelar pedido"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Cancelar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 sm:p-5">
                    {/* Items Preview */}
                    <div className="space-y-2.5 mb-4">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs sm:text-sm gap-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded text-xs flex-shrink-0">
                              {item.quantity}x
                            </span>
                            <span className="text-slate-800 dark:text-slate-200 truncate font-medium">
                              {item.product?.name || 'Material de Construção'}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white flex-shrink-0">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}

                      {order.items.length > 3 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic pt-1">
                          + {order.items.length - 3} outro(s) item(ns) neste pedido
                        </p>
                      )}
                    </div>

                    {/* Footer Info Row */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          {getPaymentMethodLabel(order.payment?.method)}
                        </span>
                        <span>•</span>
                        <span>{itemCount} {itemCount === 1 ? 'material' : 'materiais'}</span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Total do Pedido:</span>
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
