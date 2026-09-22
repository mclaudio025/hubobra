'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  Store, 
  Link, 
  Truck, 
  Settings, 
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  processingTime: string;
  fee: string;
  popularity: number;
  totalTransactions: number;
  totalAmount: number;
  successRate: number;
}

interface PaymentStats {
  totalTransactions: number;
  totalAmount: number;
  averageAmount: number;
  successRate: number;
  byMethod: Record<string, number>;
  recentTransactions: any[];
}

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    loadPaymentMethods();
    loadStats();
  }, [selectedPeriod]);

  const loadPaymentMethods = async () => {
    try {
      // Simulando dados das formas de pagamento
      const methods: PaymentMethod[] = [
        {
          id: 'PIX',
          name: 'PIX',
          description: 'Pagamento instantâneo via PIX',
          icon: <Smartphone className="w-6 h-6" />,
          enabled: true,
          processingTime: 'Instantâneo',
          fee: 'Grátis',
          popularity: 85,
          totalTransactions: 1247,
          totalAmount: 45890.50,
          successRate: 98.5
        },
        {
          id: 'STORE_PICKUP',
          name: 'Retirar na Loja',
          description: 'Pagamento na retirada do produto',
          icon: <Store className="w-6 h-6" />,
          enabled: true,
          processingTime: 'Na retirada',
          fee: 'Grátis',
          popularity: 65,
          totalTransactions: 892,
          totalAmount: 32150.75,
          successRate: 95.2
        },
        {
          id: 'PAYMENT_LINK',
          name: 'Link de Pagamento',
          description: 'Cartão, PIX, boleto em link seguro',
          icon: <Link className="w-6 h-6" />,
          enabled: true,
          processingTime: '1-2 dias úteis',
          fee: 'Grátis',
          popularity: 45,
          totalTransactions: 567,
          totalAmount: 28940.25,
          successRate: 92.8
        },
        {
          id: 'CASH_ON_DELIVERY',
          name: 'Pagamento na Entrega',
          description: 'Pague quando receber o produto',
          icon: <Truck className="w-6 h-6" />,
          enabled: true,
          processingTime: 'Na entrega',
          fee: 'Grátis',
          popularity: 35,
          totalTransactions: 423,
          totalAmount: 18750.00,
          successRate: 88.9
        }
      ];

      setPaymentMethods(methods);
    } catch (error) {
      console.error('Erro ao carregar métodos de pagamento:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Simulando estatísticas
      const statsData: PaymentStats = {
        totalTransactions: 3129,
        totalAmount: 125731.50,
        averageAmount: 40.18,
        successRate: 94.1,
        byMethod: {
          PIX: 45.2,
          STORE_PICKUP: 28.5,
          PAYMENT_LINK: 18.1,
          CASH_ON_DELIVERY: 8.2
        },
        recentTransactions: []
      };

      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentMethod = async (methodId: string) => {
    try {
      setPaymentMethods(prev => 
        prev.map(method => 
          method.id === methodId 
            ? { ...method, enabled: !method.enabled }
            : method
        )
      );
      
      // Aqui faria a chamada para a API
      // await fetch(`/api/payment-methods/${methodId}/toggle`, { method: 'POST' });
      
    } catch (error) {
      console.error('Erro ao alterar método de pagamento:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Carregando formas de pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-orange-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Formas de Pagamento</h1>
              <p className="text-gray-600">Gerencie os métodos de pagamento disponíveis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
          </div>
        </div>

        {/* Estatísticas Gerais */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Transações</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions.toLocaleString()}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageAmount)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        )}

        {/* Métodos de Pagamento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {paymentMethods.map((method) => (
            <div key={method.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${method.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {method.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{method.name}</h3>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={method.enabled}
                    onChange={() => togglePaymentMethod(method.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Tempo de Processamento</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {method.processingTime}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Taxa</p>
                  <p className="text-sm font-medium">{method.fee}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-900">{method.totalTransactions}</p>
                  <p className="text-xs text-gray-500">Transações</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(method.totalAmount)}</p>
                  <p className="text-xs text-gray-500">Volume</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{method.successRate}%</p>
                  <p className="text-xs text-gray-500">Sucesso</p>
                </div>
              </div>

              {/* Barra de Popularidade */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Popularidade</span>
                  <span className="text-xs text-gray-700">{method.popularity}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${method.popularity}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Distribuição por Método */}
        {stats && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Distribuição por Método de Pagamento
            </h2>
            
            <div className="space-y-4">
              {Object.entries(stats.byMethod).map(([method, percentage]) => {
                const methodData = paymentMethods.find(m => m.id === method);
                return (
                  <div key={method} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {methodData?.icon}
                      <span className="font-medium">{methodData?.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
