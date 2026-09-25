'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Eye, 
  Filter, 
  Download, 
  Calendar,
  CreditCard,
  User,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  X,
  MessageSquare,
  FileText,
  Search,
  ExternalLink,
  MapPin,
  Send,
  Sparkles,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { useOrders } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toaster';
import Loading from '../../components/ui/Loading';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal?: number;
  shipping?: number;
  notes?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
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
  items: Array<{
    id: string;
    quantity: number;
    price?: number;
    product: {
      name: string;
      sku: string;
    };
  }>;
  payment?: {
    method: string;
    status: string;
    amount: number;
  };
}

interface OrderStats {
  totalOrders: number;
  ordersByStatus: {
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  revenue: {
    total: number;
    monthly: number;
  };
}

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  // WhatsApp notification modal state
  const [selectedOrderForNotification, setSelectedOrderForNotification] = useState<Order | null>(null);
  const [customPhone, setCustomPhone] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  const ordersApi = useOrders();
  const { addToast } = useToast();

  useEffect(() => {
    loadOrders();
    loadStats();
  }, [page, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getAllOrders(page, 50, statusFilter || undefined);
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

  const loadStats = async () => {
    try {
      const statsData = await ordersApi.getOrderStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string, openNotificationModal = false) => {
    try {
      setUpdating(orderId);
      await ordersApi.updateOrderStatus(orderId, newStatus);
      addToast({
        type: 'success',
        title: 'Status atualizado',
        message: `Pedido atualizado para ${getStatusInfo(newStatus).label}`
      });

      // Atualiza localmente o status
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

      if (openNotificationModal || newStatus === 'SHIPPED') {
        const targetOrder = orders.find(o => o.id === orderId);
        if (targetOrder) {
          openWhatsAppModal({ ...targetOrder, status: newStatus }, newStatus);
        }
      }

      loadOrders();
      loadStats();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erro ao atualizar status',
        message: error.message || 'Tente novamente'
      });
    } finally {
      setUpdating(null);
    }
  };

  const openWhatsAppModal = (order: Order, statusType = 'SHIPPED') => {
    const customerName = order.user?.name || 'Cliente';
    const orderNum = order.orderNumber || order.id.slice(0, 8);
    const trackingUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/pedidos/${order.id}/recibo`
      : `https://hubobra.com.br/pedidos/${order.id}/recibo`;
    
    const itemsList = order.items?.map(i => `• ${i.quantity}x ${i.product?.name || 'Item'}`).join('\n') || '';
    
    let defaultMsg = '';
    if (statusType === 'SHIPPED') {
      defaultMsg = `🚚 *Aviso de Entrega - HubObra*\n\n` +
        `Olá, *${customerName}*!\n` +
        `Seu pedido *#${orderNum}* já foi separado e *ACABOU DE SAIR PARA ENTREGA!* 🚛💨\n\n` +
        `📦 *Itens em rota:*\n${itemsList}\n\n` +
        `💰 *Total:* ${formatCurrency(order.total)}\n` +
        (order.shippingAddress ? `📍 *Entrega:* ${order.shippingAddress.street}, ${order.shippingAddress.number} - ${order.shippingAddress.district || ''}\n\n` : `\n`) +
        `📄 *Acompanhe seu Comprovante e Rastreio:*\n${trackingUrl}\n\n` +
        `Fique atento ao recebimento. Qualquer dúvida, a Lia e nossa equipe estão à disposição! 🤝🛠️`;
    } else if (statusType === 'DELIVERED') {
      defaultMsg = `✅ *Pedido Entregue com Sucesso - HubObra*\n\n` +
        `Olá, *${customerName}*!\n` +
        `Confirmamos a entrega do seu pedido *#${orderNum}*. 🎉\n\n` +
        `📄 *Comprovante Digital:* ${trackingUrl}\n\n` +
        `Agradecemos pela preferência e boa obra! Conte sempre com a HubObra. 🏗️`;
    } else {
      defaultMsg = `📦 *Atualização do seu Pedido - HubObra*\n\n` +
        `Olá, *${customerName}*! Seu pedido *#${orderNum}* teve o status atualizado para: *${getStatusInfo(order.status).label}*.\n\n` +
        `📄 *Acesse os detalhes:* ${trackingUrl}`;
    }

    setCustomPhone(order.user?.phone || '');
    setCustomMessage(defaultMsg);
    setSelectedOrderForNotification(order);
  };

  const handleSendWhatsApp = () => {
    let cleanPhone = customPhone.replace(/\D/g, '');
    if (cleanPhone.length > 0 && !cleanPhone.startsWith('55') && cleanPhone.length <= 11) {
      cleanPhone = `55${cleanPhone}`;
    }

    const encodedText = encodeURIComponent(customMessage);
    const whatsappUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
    setSelectedOrderForNotification(null);
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      'PENDING': { label: 'Pendente', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
      'CONFIRMED': { label: 'Confirmado', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle },
      'PROCESSING': { label: 'Em Separação', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: Package },
      'SHIPPED': { label: 'Saiu p/ Entrega', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: Truck },
      'DELIVERED': { label: 'Entregue', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle },
      'CANCELLED': { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-300', icon: X },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap['PENDING'];
  };

  const getPaymentMethodLabel = (method?: string) => {
    if (!method) return 'A Combinar';
    const methods: Record<string, string> = {
      'CREDIT_CARD': 'Cartão de Crédito',
      'DEBIT_CARD': 'Cartão de Débito',
      'PIX': 'PIX Instantâneo',
      'BANK_SLIP': 'Boleto Bancário',
      'CASH': 'Dinheiro / Na Entrega'
    };
    return methods[method] || method;
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

  const statusOptions = [
    { value: '', label: 'Todos os Status' },
    { value: 'PENDING', label: 'Pendente' },
    { value: 'CONFIRMED', label: 'Confirmado' },
    { value: 'PROCESSING', label: 'Em Separação' },
    { value: 'SHIPPED', label: 'Saiu para Entrega 🚚' },
    { value: 'DELIVERED', label: 'Entregue' },
    { value: 'CANCELLED', label: 'Cancelado' },
  ];

  const allStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  // Filtered orders with search term
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(order => 
      order.orderNumber?.toLowerCase().includes(term) ||
      order.user?.name?.toLowerCase().includes(term) ||
      order.user?.email?.toLowerCase().includes(term) ||
      order.items?.some(i => i.product?.name?.toLowerCase().includes(term))
    );
  }, [orders, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50/80 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-tr from-orange-500 to-amber-500 text-white rounded-xl shadow-md shadow-orange-500/20">
              <Package className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gerenciador de Pedidos & Entregas</h1>
              <p className="text-sm text-slate-500">Despache pedidos, avise clientes via WhatsApp e acompanhe o status em tempo real</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                const csvData = orders.map(o => `"${o.orderNumber}","${o.user?.name}","${o.status}","${o.total}","${o.createdAt}"`).join('\n');
                const blob = new Blob([`Número,Cliente,Status,Total,Data\n${csvData}`], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pedidos-hubobra-${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
              }}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Pedidos</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalOrders}</p>
                </div>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Package className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Pendentes / Preparo</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{stats.ordersByStatus.pending + (stats.ordersByStatus.confirmed || 0)}</p>
                </div>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Saiu p/ Entrega</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{stats.ordersByStatus.shipped}</p>
                </div>
                <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                  <Truck className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Faturamento Total</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(stats.revenue.total)}</p>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Nº pedido, cliente ou produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {statusOptions.map((opt) => {
              const active = statusFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    active
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loading size="lg" text="Carregando pedidos..." />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-slate-800 mb-1">Nenhum pedido encontrado</h2>
              <p className="text-sm text-slate-500">
                {searchTerm || statusFilter ? 'Tente mudar os filtros de busca' : 'Nenhum pedido registrado no momento'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/75">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Pedido & Itens
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Cliente & Destino
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status Atual
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Pagamento & Total
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Ações de Entrega & WhatsApp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredOrders.map((order) => {
                    const statusInfo = getStatusInfo(order.status);
                    const StatusIcon = statusInfo.icon;
                    const isShipped = order.status === 'SHIPPED';
                    const isDelivered = order.status === 'DELIVERED';

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Pedido & Itens */}
                        <td className="px-5 py-4 align-top">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                #{order.orderNumber}
                              </span>
                              <span className="text-xs text-slate-400">
                                {formatDate(order.createdAt)}
                              </span>
                            </div>
                            
                            <div className="text-xs text-slate-600 max-w-xs line-clamp-2">
                              {order.items.map((item, idx) => (
                                <span key={item.id}>
                                  {item.quantity}x {item.product?.name}
                                  {idx < order.items.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                            
                            <div className="pt-1 flex items-center gap-2 text-xs">
                              <Link
                                href={`/pedidos/${order.id}/recibo`}
                                target="_blank"
                                className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium"
                              >
                                <FileText className="h-3 w-3" />
                                Ver Comprovante/Recibo
                                <ExternalLink className="h-2.5 w-2.5" />
                              </Link>
                            </div>
                          </div>
                        </td>
                        
                        {/* Cliente & Destino */}
                        <td className="px-5 py-4 align-top">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-sm">
                              <User className="h-3.5 w-3.5 text-slate-400" />
                              {order.user?.name || 'Cliente'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {order.user?.email}
                            </div>
                            {order.shippingAddress && (
                              <div className="flex items-start gap-1 text-xs text-slate-600 pt-0.5">
                                <MapPin className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                                <span className="line-clamp-1">
                                  {order.shippingAddress.street}, {order.shippingAddress.number} - {order.shippingAddress.district || order.shippingAddress.city}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {/* Status Atual e Seletor Direto */}
                        <td className="px-5 py-4 align-top">
                          <div className="space-y-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
                              <StatusIcon className="h-3.5 w-3.5" />
                              {statusInfo.label}
                            </span>
                            
                            <div>
                              <select
                                value={order.status}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleStatusChange(order.id, e.target.value);
                                  }
                                }}
                                disabled={updating === order.id}
                                className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer shadow-xs"
                              >
                                {allStatuses.map((st) => (
                                  <option key={st} value={st}>
                                    {getStatusInfo(st).label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </td>
                        
                        {/* Pagamento e Total */}
                        <td className="px-5 py-4 align-top whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="text-base font-bold text-slate-900">
                              {formatCurrency(order.total)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                              {getPaymentMethodLabel(order.payment?.method)}
                            </div>
                            <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${
                              order.payment?.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                              order.payment?.status === 'FAILED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {order.payment?.status === 'PAID' ? '✓ Pago' : order.payment?.status === 'FAILED' ? 'Falhou' : 'Aguardando Pagamento'}
                            </span>
                          </div>
                        </td>
                        
                        {/* Ações de Entrega & WhatsApp */}
                        <td className="px-5 py-4 align-top text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            
                            {/* Botão rápido: Saiu para Entrega */}
                            {!isShipped && !isDelivered && order.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleStatusChange(order.id, 'SHIPPED', true)}
                                disabled={updating === order.id}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition hover:shadow"
                              >
                                <Truck className="h-3.5 w-3.5" />
                                🚚 Despachar / Saiu p/ Entrega
                              </button>
                            )}

                            {/* Botão rápido: Marcar Entregue */}
                            {isShipped && (
                              <button
                                onClick={() => handleStatusChange(order.id, 'DELIVERED', true)}
                                disabled={updating === order.id}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition hover:shadow"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                ✅ Marcar Entregue
                              </button>
                            )}

                            {/* Botão de WhatsApp */}
                            <button
                              onClick={() => openWhatsAppModal(order, isShipped ? 'SHIPPED' : isDelivered ? 'DELIVERED' : 'UPDATE')}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl transition"
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                              📲 Avisar no WhatsApp
                            </button>

                            <Link
                              href={`/pedidos/${order.id}`}
                              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-medium pt-1"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Ver Detalhes
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Dispatch Notification Modal */}
      {selectedOrderForNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-emerald-700">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Avisar Cliente no WhatsApp</h3>
                  <p className="text-xs text-slate-500">Pedido #{selectedOrderForNotification.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForNotification(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Número de WhatsApp do Cliente:
                </label>
                <input
                  type="text"
                  placeholder="Ex: 85999999999 (com DDD)"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Se deixar em branco, o WhatsApp abrirá para você escolher o contato manualmente.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mensagem Formatada:
                </label>
                <textarea
                  rows={8}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedOrderForNotification(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendWhatsApp}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition hover:shadow-lg"
              >
                <Send className="h-4 w-4" />
                Abrir WhatsApp & Enviar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
