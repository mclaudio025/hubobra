'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, 
  MapPin, 
  CreditCard, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Truck, 
  X, 
  ArrowLeft,
  FileText,
  User,
  Mail,
  Phone,
  QrCode,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrders } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toaster';
import Loading from '../../components/ui/Loading';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  total: number;
  product: {
    id: string;
    name: string;
    description?: string;
    sku: string;
    images?: Array<{ url: string; alt?: string }>;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  notes?: string;
  deliveryMethod?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  shippingAddress?: {
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  payment?: {
    method: string;
    status: string;
    amount: number;
    transactionId?: string;
    paidAt?: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export default function PedidoDetalhesPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const { isAuthenticated } = useAuth();
  const ordersApi = useOrders();
  const { addToast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (orderId) {
      loadOrder();
    }
  }, [orderId, isAuthenticated]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getOrder(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
      addToast({
        type: 'error',
        title: 'Erro ao carregar pedido',
        message: 'Pedido não encontrado ou sem permissão de acesso'
      });
      router.push('/pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    if (!confirm(`Tem certeza que deseja cancelar o pedido #${order.orderNumber}?`)) {
      return;
    }

    try {
      await ordersApi.cancelOrder(order.id, 'Cancelado pelo cliente');
      addToast({
        type: 'success',
        title: 'Pedido cancelado',
        message: `Pedido #${order.orderNumber} foi cancelado com sucesso`
      });
      loadOrder();
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
        color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
        badgeBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
        icon: Clock,
        description: 'Aguardando confirmação do pagamento para liberação dos materiais'
      },
      'CONFIRMED': { 
        label: 'Confirmado', 
        color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
        badgeBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300',
        icon: CheckCircle,
        description: 'Pedido confirmado e enviado para o centro de distribuição'
      },
      'PROCESSING': { 
        label: 'Em Separação', 
        color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30',
        badgeBg: 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300',
        icon: Package,
        description: 'Materiais estão sendo separados e conferidos no estoque'
      },
      'SHIPPED': { 
        label: 'A Caminho da Obra', 
        color: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30',
        badgeBg: 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300',
        icon: Truck,
        description: 'Carga em transporte regional com previsão de entrega'
      },
      'DELIVERED': { 
        label: 'Entregue na Obra', 
        color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
        icon: CheckCircle,
        description: 'Materiais entregues e conferidos com sucesso'
      },
      'CANCELLED': { 
        label: 'Cancelado', 
        color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30',
        badgeBg: 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300',
        icon: AlertCircle,
        description: 'Este pedido foi cancelado'
      },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap['PENDING'];
  };

  const getPaymentMethodLabel = (method?: string) => {
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
          <Package className="h-12 w-12 text-orange-600 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Acesso Restrito</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">Você precisa estar logado para ver este pedido.</p>
          <Link
            href="/login"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-xl transition inline-block text-sm"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loading size="lg" text="Carregando detalhes do pedido..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-md w-full">
          <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Pedido não encontrado</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">O pedido solicitado não existe ou você não possui acesso a ele.</p>
          <Link
            href="/pedidos"
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-xl transition inline-block text-sm"
          >
            Ver Meus Pedidos
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left Info */}
            <div className="flex items-center gap-3">
              <Link
                href="/pedidos"
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition flex-shrink-0"
                title="Voltar para Meus Pedidos"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    Pedido #{order.orderNumber}
                  </h1>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  Realizado em {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              <Link
                href={`/pedidos/${order.id}/recibo`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm text-xs sm:text-sm transition"
              >
                <FileText className="h-4 w-4" />
                <span>Ver Recibo Oficial</span>
              </Link>

              {canCancelOrder(order.status) && (
                <button
                  onClick={handleCancelOrder}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs font-semibold transition"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Cancelar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Status Banner */}
          <div className={`rounded-2xl p-5 border ${statusInfo.color} flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm bg-white dark:bg-slate-900`}>
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`p-3 rounded-2xl ${statusInfo.badgeBg} flex-shrink-0`}>
                <StatusIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 dark:text-white">{statusInfo.label}</h2>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusInfo.badgeBg}`}>
                    Status
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  {statusInfo.description}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Última atualização: {formatDate(order.updatedAt || order.createdAt)}
                </p>
              </div>
            </div>

            {order.payment?.method === 'PIX' && order.payment?.status === 'PENDING' && (
              <div className="flex-shrink-0">
                <Link
                  href={`/pagamento/pix/${order.payment.transactionId || order.id}`}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Pagar PIX Agora</span>
                </Link>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (Items + Address) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-5">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-600" />
                    Itens do Pedido ({order.items.length})
                  </h3>
                  <span className="text-xs text-slate-500">
                    {order.items.reduce((acc, i) => acc + (i.quantity || 1), 0)} unidades
                  </span>
                </div>
                
                <div className="space-y-3.5">
                  {order.items.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800"
                    >
                      <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-lg p-1 flex items-center justify-center border border-slate-200 dark:border-slate-700 flex-shrink-0 overflow-hidden">
                        {item.product?.images && item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0].url}
                            alt={item.product.images[0].alt || item.product.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                          {item.product?.name || 'Produto'}
                        </h4>
                        {item.product?.sku && (
                          <p className="text-[11px] text-slate-400 font-mono">
                            SKU: {item.product.sku}
                          </p>
                        )}
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          Quantidade: <span className="font-bold text-slate-900 dark:text-white">{item.quantity}</span> × {formatCurrency(item.price)}
                        </p>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-slate-900 dark:text-white text-sm">
                          {formatCurrency(item.total || item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-5">
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  Entrega e Logística
                </h3>
                
                {order.shippingAddress ? (
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {order.shippingAddress.street}, {order.shippingAddress.number}
                      {order.shippingAddress.complement && ` (${order.shippingAddress.complement})`}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Bairro: {order.shippingAddress.district}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      {order.shippingAddress.city} - {order.shippingAddress.state} | CEP: {order.shippingAddress.zipCode}
                    </p>
                    <p className="text-xs text-slate-400 pt-1">
                      País: {order.shippingAddress.country || 'Brasil'}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Retirada no Centro de Distribuição Parceiro</p>
                )}

                {order.notes && (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs">
                    <span className="font-bold text-amber-800 dark:text-amber-400 block mb-0.5">Observações da Entrega / Contato da Obra:</span>
                    <p className="text-slate-700 dark:text-slate-300">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (Sidebar Summary + Payment + Customer) */}
            <div className="space-y-6">
              {/* Order Financial Summary */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-5">
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Resumo Financeiro
                </h3>
                
                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal Materiais</span>
                    <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Frete para Obra</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {order.shipping === 0 ? (
                        <span className="text-emerald-600 font-bold">GRÁTIS</span>
                      ) : (
                        formatCurrency(order.shipping)
                      )}
                    </span>
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Taxas / Impostos</span>
                      <span>{formatCurrency(order.tax)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">Total do Pedido</span>
                      <span className="text-lg font-black text-orange-600">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-5">
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                  Pagamento
                </h3>
                
                <div className="space-y-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block">Forma Escolhida</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {getPaymentMethodLabel(order.payment?.method)}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-xs text-slate-400 block">Status do Pagamento</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mt-0.5 ${
                      order.payment?.status === 'PAID' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                        : order.payment?.status === 'FAILED'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {order.payment?.status === 'PAID' ? 'Pago' : order.payment?.status === 'FAILED' ? 'Falhou' : 'Pendente'}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-xs text-slate-400 block">Valor Cobrado</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {formatCurrency(order.payment?.amount || order.total)}
                    </span>
                  </div>

                  {order.payment?.transactionId && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 block">ID Transação</span>
                      <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate block">
                        {order.payment.transactionId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-5">
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <User className="h-5 w-5 text-orange-600" />
                  Dados do Comprador
                </h3>
                
                <div className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  {order.user?.name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className="font-medium truncate">{order.user.name}</span>
                    </div>
                  )}
                  {order.user?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{order.user.email}</span>
                    </div>
                  )}
                  {order.user?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span>{order.user.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}