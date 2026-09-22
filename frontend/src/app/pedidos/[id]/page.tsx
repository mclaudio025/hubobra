'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  CreditCard, 
  Calendar, 
  User, 
  Phone, 
  Mail,
  CheckCircle,
  Clock,
  Truck,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrders } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toaster';
import Loading from '../../components/ui/Loading';

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    total: number;
    product: {
      id: string;
      name: string;
      sku: string;
      price: number;
      images: Array<{
        url: string;
        alt: string;
      }>;
    };
  }>;
  shippingAddress: {
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  payment: {
    method: string;
    status: string;
    amount: number;
    transactionId?: string;
    paidAt?: string;
  };
}

export default function OrderDetailsPage() {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const { isAuthenticated } = useAuth();
  const ordersApi = useOrders();
  const { addToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  useEffect(() => {
    if (isAuthenticated && orderId) {
      loadOrder();
    }
  }, [isAuthenticated, orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const orderData = await ordersApi.getOrder(orderId);
      setOrder(orderData);
    } catch (error: any) {
      console.error('Erro ao carregar pedido:', error);
      addToast({
        type: 'error',
        title: 'Erro ao carregar pedido',
        message: error.message || 'Pedido não encontrado'
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
      loadOrder(); // Recarregar dados
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
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: Clock,
        description: 'Aguardando confirmação do pagamento'
      },
      'CONFIRMED': { 
        label: 'Confirmado', 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        icon: CheckCircle,
        description: 'Pedido confirmado e sendo preparado'
      },
      'PROCESSING': { 
        label: 'Processando', 
        color: 'bg-purple-100 text-purple-800 border-purple-200', 
        icon: Package,
        description: 'Pedido sendo preparado para envio'
      },
      'SHIPPED': { 
        label: 'Enviado', 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        icon: Truck,
        description: 'Pedido enviado e a caminho'
      },
      'DELIVERED': { 
        label: 'Entregue', 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle,
        description: 'Pedido entregue com sucesso'
      },
      'CANCELLED': { 
        label: 'Cancelado', 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: X,
        description: 'Pedido cancelado'
      },
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
          <p className="text-gray-600 mb-4">Você precisa estar logado para ver este pedido</p>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="Carregando pedido..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pedido não encontrado</h1>
          <p className="text-gray-600 mb-4">O pedido solicitado não existe ou você não tem acesso a ele</p>
          <Link
            href="/pedidos"
            className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 transition"
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/pedidos"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="h-5 w-5" />
                Voltar
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Pedido #{order.orderNumber}
                </h1>
                <p className="text-gray-600">
                  Realizado em {formatDate(order.createdAt)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                href={`/pedidos/${order.id}/recibo`}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                <Package className="h-4 w-4" />
                Ver Recibo
              </Link>
              
              {canCancelOrder(order.status) && (
                <button
                  onClick={handleCancelOrder}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                >
                  <X className="h-4 w-4" />
                  Cancelar Pedido
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Status Card */}
          <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${statusInfo.color}`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${statusInfo.color}`}>
                <StatusIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{statusInfo.label}</h2>
                <p className="text-gray-600">{statusInfo.description}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Última atualização: {formatDate(order.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Items */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-600" />
                  Itens do Pedido
                </h3>
                
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded">
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                        {item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0].url}
                            alt={item.product.images[0].alt}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                        <p className="text-sm text-gray-600">SKU: {item.product.sku}</p>
                        <p className="text-sm text-gray-600">
                          Quantidade: {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  Endereço de Entrega
                </h3>
                
                <div className="text-gray-700">
                  <p>{order.shippingAddress.street}, {order.shippingAddress.number}</p>
                  {order.shippingAddress.complement && (
                    <p>{order.shippingAddress.complement}</p>
                  )}
                  <p>{order.shippingAddress.district}</p>
                  <p>{order.shippingAddress.city} - {order.shippingAddress.state}</p>
                  <p>CEP: {order.shippingAddress.zipCode}</p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </div>

              {/* Order Notes */}
              {order.notes && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Observações</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Frete</span>
                    <span>{formatCurrency(order.shipping)}</span>
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Impostos</span>
                      <span>{formatCurrency(order.tax)}</span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                  Pagamento
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Método</p>
                    <p className="font-medium">{getPaymentMethodLabel(order.payment.method)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className={`font-medium ${
                      order.payment.status === 'PAID' ? 'text-green-600' : 
                      order.payment.status === 'FAILED' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {order.payment.status === 'PAID' ? 'Pago' : 
                       order.payment.status === 'FAILED' ? 'Falhou' : 'Pendente'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Valor</p>
                    <p className="font-medium">{formatCurrency(order.payment.amount)}</p>
                  </div>
                  
                  {order.payment.transactionId && (
                    <div>
                      <p className="text-sm text-gray-600">ID da Transação</p>
                      <p className="font-mono text-sm">{order.payment.transactionId}</p>
                    </div>
                  )}
                  
                  {order.payment.paidAt && (
                    <div>
                      <p className="text-sm text-gray-600">Pago em</p>
                      <p className="text-sm">{formatDate(order.payment.paidAt)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-orange-600" />
                  Dados do Cliente
                </h3>
                
                <div className="space-y-3">
                  {order.user?.name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{order.user.name}</span>
                    </div>
                  )}
                  {order.user?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{order.user.email}</span>
                    </div>
                  )}
                  {order.user?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{order.user.phone}</span>
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