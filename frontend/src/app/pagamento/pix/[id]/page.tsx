'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Copy, CheckCircle, Clock, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '../../../components/ui/Toaster';

interface PixPayment {
  id: string;
  pixCode: string;
  qrCode: string;
  amount: number;
  expiresAt: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  orderId: string;
}

export default function PixPaymentPage() {
  const [payment, setPayment] = useState<PixPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [checking, setChecking] = useState(false);
  
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const paymentId = params.id as string;

  useEffect(() => {
    loadPayment();
  }, [paymentId]);

  useEffect(() => {
    if (payment && payment.status === 'PENDING') {
      const interval = setInterval(() => {
        updateTimeLeft();
        checkPaymentStatus();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [payment]);

  const loadPayment = async () => {
    try {
      const response = await fetch(`/api/payments/pix/${paymentId}`);
      if (!response.ok) {
        throw new Error('Pagamento não encontrado');
      }
      
      const data = await response.json();
      setPayment(data);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível carregar os dados do pagamento'
      });
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const updateTimeLeft = () => {
    if (!payment) return;
    
    const now = new Date().getTime();
    const expiry = new Date(payment.expiresAt).getTime();
    const difference = expiry - now;

    if (difference > 0) {
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    } else {
      setTimeLeft('00:00');
      setPayment(prev => prev ? { ...prev, status: 'EXPIRED' } : null);
    }
  };

  const checkPaymentStatus = async () => {
    if (checking) return;
    
    setChecking(true);
    try {
      const response = await fetch(`/api/payments/pix/${paymentId}/status`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'PAID') {
          setPayment(prev => prev ? { ...prev, status: 'PAID' } : null);
          
          addToast({
            type: 'success',
            title: 'Pagamento confirmado!',
            message: 'Seu pedido foi confirmado com sucesso'
          });
          
          setTimeout(() => {
            router.push(`/pedidos/${payment?.orderId}`);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setChecking(false);
    }
  };

  const copyPixCode = async () => {
    if (!payment) return;
    
    setCopying(true);
    try {
      await navigator.clipboard.writeText(payment.pixCode);
      addToast({
        type: 'success',
        title: 'Copiado!',
        message: 'Código PIX copiado para a área de transferência'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível copiar o código'
      });
    } finally {
      setCopying(false);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pagamento...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Pagamento não encontrado</p>
          <Link href="/" className="text-orange-600 hover:text-orange-700">
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Pagamento PIX</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Status do Pagamento */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="text-center">
              {payment.status === 'PENDING' && (
                <div className="mb-4">
                  <Clock className="h-16 w-16 text-orange-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Aguardando Pagamento
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Escaneie o QR Code ou copie o código PIX para pagar
                  </p>
                  <div className="bg-orange-100 border border-orange-200 rounded-lg p-4">
                    <p className="text-orange-800 font-medium">
                      Valor: {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-orange-700 text-sm">
                      Expira em: {timeLeft}
                    </p>
                  </div>
                </div>
              )}

              {payment.status === 'PAID' && (
                <div className="mb-4">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-green-900 mb-2">
                    Pagamento Confirmado!
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Seu pedido foi confirmado e está sendo processado
                  </p>
                  <div className="bg-green-100 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">
                      Valor pago: {formatCurrency(payment.amount)}
                    </p>
                  </div>
                </div>
              )}

              {payment.status === 'EXPIRED' && (
                <div className="mb-4">
                  <Clock className="h-16 w-16 text-red-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-red-900 mb-2">
                    Pagamento Expirado
                  </h2>
                  <p className="text-gray-600 mb-4">
                    O tempo para pagamento expirou. Faça um novo pedido.
                  </p>
                  <Link
                    href="/"
                    className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 transition"
                  >
                    Fazer Novo Pedido
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* QR Code e Código PIX */}
          {payment.status === 'PENDING' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* QR Code */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4">Escaneie o QR Code</h3>
                  <div className="bg-gray-100 p-4 rounded-lg inline-block">
                    <img
                      src={payment.qrCode}
                      alt="QR Code PIX"
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Use o app do seu banco para escanear
                  </p>
                </div>

                {/* Código PIX */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Ou copie o código PIX</h3>
                  <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                    <p className="text-xs text-gray-600 font-mono break-all">
                      {payment.pixCode}
                    </p>
                  </div>
                  <button
                    onClick={copyPixCode}
                    disabled={copying}
                    className="w-full bg-orange-600 text-white py-3 px-4 rounded hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {copying ? 'Copiando...' : 'Copiar Código PIX'}
                  </button>
                </div>
              </div>

              {/* Instruções */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Como pagar:</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Abra o app do seu banco</li>
                  <li>2. Procure pela opção PIX</li>
                  <li>3. Escaneie o QR Code ou cole o código copiado</li>
                  <li>4. Confirme os dados e finalize o pagamento</li>
                  <li>5. O pagamento será confirmado automaticamente</li>
                </ol>
              </div>

              {/* Botão de verificar status */}
              <div className="mt-6 text-center">
                <button
                  onClick={checkPaymentStatus}
                  disabled={checking}
                  className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                  {checking ? 'Verificando...' : 'Verificar Status'}
                </button>
              </div>
            </div>
          )}

          {/* Link para pedido */}
          {payment.status === 'PAID' && (
            <div className="text-center mt-6">
              <Link
                href={`/pedidos/${payment.orderId}`}
                className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition"
              >
                Ver Detalhes do Pedido
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}