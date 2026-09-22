'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Eye, 
  Edit, 
  Filter, 
  Download, 
  Calendar,
  CreditCard,
  User,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  X
} from 'lucide-react';
import { useOrders } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toaster';
import Loading from '../../components/ui/Loading';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    product: {
      name: string;
      sku: string;
    };
  }>;
  payment: {
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
  const [updating, setUpdating] = useState<string | null>(null);

  const ordersApi = useOrders();
  const { addToast } = useToast();

  useEffect(() => {
    loadOrders();
    loadStats();
  }, [page, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getAllOrders(page, 20, statusFilter || undefined);
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

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdating(orderId);
      await ordersApi.updateOrderStatus(orderId, newStatus);
      addToast({
        type: 'success',
        title: 'Status atualizado',
        message: 'Status do pedido foi atualizado com sucesso'
      });
      loadOrders();
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

  const getStatusInfo = (status: string) => {
    const statusMap = {
      'PENDING': { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'CONFIRMED': { label: 'Confirmado', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      'PROCESSING': { label: 'Processando', color: 'bg-purple-100 text-purple-800', icon: Package },
      'SHIPPED': { label: 'Enviado', color: 'bg-orange-100 text-orange-800', icon: Truck },
      'DELIVERED': { label: 'Entregue', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'CANCELLED': { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: X },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap['PENDING'];
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      'CREDIT_CARD': 'Cartão de Crédito',
      'DEBIT_CARD': 'Cartão de Débito',
      'PIX': 'PIX',
      'BANK_SLIP': 'Boleto',
      'CASH': 'Dinheiro'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
    { value: 'PROCESSING', label: 'Processando' },
    { value: 'SHIPPED', label: 'Enviado' },
    { value: 'DELIVERED', label: 'Entregue' },
    { value: 'CANCELLED', label: 'Cancelado' },
  ];

  const nextStatusMap: Record<string, string[]> = {
    'PENDING': ['CONFIRMED', 'CANCELLED'],
    'CONFIRMED': ['PROCESSING', 'CANCELLED'],
    'PROCESSING': ['SHIPPED', 'CANCELLED'],
    'SHIPPED': ['DELIVERED'],
    'DELIVERED': [],
    'CANCELLED': []
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-orange-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Pedidos</h1>
              <p className="text-gray-600">Acompanhe e gerencie todos os pedidos</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.ordersByStatus.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Receita Total</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.revenue.total)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.revenue.monthly)}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loading size="lg" text="Carregando pedidos..." />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum pedido encontrado</h2>
              <p className="text-gray-600">Não há pedidos com os filtros selecionados</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pedido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pagamento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => {
                      const statusInfo = getStatusInfo(order.status);
                      const StatusIcon = statusInfo.icon;
                      const nextStatuses = nextStatusMap[order.status] || [];

                      return (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                #{order.orderNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.items.length} item(s)
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {order.user.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {order.user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {statusInfo.label}
                              </span>
                              {nextStatuses.length > 0 && (
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleStatusChange(order.id, e.target.value);
                                    }
                                  }}
                                  disabled={updating === order.id}
                                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                >
                                  <option value="">Alterar</option>
                                  {nextStatuses.map((status) => (
                                    <option key={status} value={status}>
                                      {getStatusInfo(status).label}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="text-sm text-gray-900">
                                  {getPaymentMethodLabel(order.payment.method)}
                                </div>
                                <div className={`text-xs ${
                                  order.payment.status === 'PAID' ? 'text-green-600' : 
                                  order.payment.status === 'FAILED' ? 'text-red-600' : 'text-yellow-600'
                                }`}>
                                  {order.payment.status === 'PAID' ? 'Pago' : 
                                   order.payment.status === 'FAILED' ? 'Falhou' : 'Pendente'}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(order.total)}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(order.createdAt)}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/pedidos/${order.id}`}
                                className="text-orange-600 hover:text-orange-900 flex items-center gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                Ver
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm text-gray-700">
                        Página {page} de {totalPages}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
