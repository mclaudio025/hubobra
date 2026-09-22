'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Eye, X, Calendar, CreditCard, Truck, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../hooks/useApi';
import { useToast } from '../components/ui/Toaster';
import Loading from '../components/ui/Loading';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
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
      loadOrders(); // Recarregar lista
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
      'PENDING': { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Calendar },
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
      'BANK_SLIP': 'Boleto Bancário',
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

  const canCancelOrder = (status: string) => {
    return ['PENDING', 'CONFIRMED'].includes(status);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
          <p className="text-gray-600 mb-4">Você precisa estar logado para ver seus pedidos</p>
          <Link
            href="/login"
            className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 transition"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-orange-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meus Pedidos</h1>
              <p className="text-gray-600">Acompanhe o status dos seus pedidos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" text="Carregando pedidos..." />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum pedido encontrado</h2>
            <p className="text-gray-600 mb-6">Você ainda não fez nenhum pedido</p>
            <Link
              href="/"
              className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 transition"
            >
              Começar a Comprar
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const StatusIcon = statusInfo.icon;

              return (
                <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Order Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Pedido #{order.orderNumber}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Realizado em {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                          <StatusIcon className="h-4 w-4" />
                          {statusInfo.label}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/pedidos/${order.id}`}
                          className="flex items-center gap-1 text-orange-600 hover:text-orange-700 text-sm font-medium"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Detalhes
                        </Link>
                        {canCancelOrder(order.status) && (
                          <button
                            onClick={() => handleCancelOrder(order.id, order.orderNumber)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            <X className="h-4 w-4" />
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Items */}
                      <div className="lg:col-span-2">
                        <h4 className="font-medium text-gray-900 mb-3">Itens do Pedido</h4>
                        <div className="space-y-3">
                          {order.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                <span className="text-xs font-medium">{item.quantity}x</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                                <p className="text-xs text-gray-600">SKU: {item.product.sku}</p>
                              </div>
                              <p className="text-sm font-medium text-gray-900">
                                {formatCurrency(item.price * item.quantity)}
                              </p>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-sm text-gray-600">
                              E mais {order.items.length - 3} item(s)...
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Summary */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Resumo</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Total do Pedido</span>
                            <span className="font-semibold">{formatCurrency(order.total)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CreditCard className="h-4 w-4" />
                            <span>{getPaymentMethodLabel(order.payment.method)}</span>
                          </div>
                          <div className={`text-sm ${
                            order.payment.status === 'PAID' ? 'text-green-600' : 
                            order.payment.status === 'FAILED' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            Pagamento: {order.payment.status === 'PAID' ? 'Pago' : 
                                      order.payment.status === 'FAILED' ? 'Falhou' : 'Pendente'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                
                <span className="px-4 py-2 text-sm text-gray-600">
                  Página {page} de {totalPages}
                </span>
                
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
