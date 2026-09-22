'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Download, 
  Share, 
  Printer, 
  MessageCircle,
  Phone,
  Mail,
  Copy,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrders } from '../../../hooks/useApi';
import { useToast } from '../../../components/ui/Toaster';
import OrderReceipt from '../../../components/OrderReceipt';

export default function OrderReceiptPage() {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { user, isAuthenticated } = useAuth();
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
      const orderData = await ordersApi.getOrder(orderId);
      setOrder(orderData);
      
      // Pré-preencher telefone se disponível
      if (orderData?.customer?.phone) {
        setWhatsappPhone(orderData.customer.phone);
      } else if (orderData?.customerInfo?.phone) {
        // Fallback para customerInfo se customer não existir
        setWhatsappPhone(orderData.customerInfo.phone);
      } else if (orderData?.phone) {
        // Fallback direto no order se não tiver customer
        setWhatsappPhone(orderData.phone);
      }
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível carregar o pedido'
      });
      router.push('/pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/receipt/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-pedido-${order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addToast({
        type: 'success',
        title: 'PDF baixado',
        message: 'Recibo baixado com sucesso'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível baixar o PDF'
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = async () => {
    if (!whatsappPhone.trim()) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Número do WhatsApp é obrigatório'
      });
      return;
    }

    try {
      setSendingWhatsApp(true);

      const response = await fetch(`/api/orders/${orderId}/receipt/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          phone: whatsappPhone,
          message: whatsappMessage || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao enviar WhatsApp');
      }

      addToast({
        type: 'success',
        title: 'WhatsApp enviado',
        message: 'Recibo enviado por WhatsApp com sucesso'
      });

      setShowWhatsAppModal(false);
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: error.message || 'Não foi possível enviar por WhatsApp'
      });
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handleOpenWhatsAppDirectly = () => {
    if (!order) return;
    const cleanPhone = formatPhoneForWhatsApp(whatsappPhone || order.customer?.phone || order.customerInfo?.phone || '');
    const siteOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const receiptLink = `${siteOrigin}/pedidos/${orderId}/recibo`;
    
    const itemsList = (order.items || [])
      .map((item: any) => `• ${item.quantity}x ${item.name || item.product?.name} (R$ ${Number(item.price).toFixed(2)})`)
      .join('\n');

    const message = whatsappMessage.trim() || 
      `🏗️ *Recibo do Pedido #${order.orderNumber} - HubConstruções*\n\n` +
      `Olá, *${order.customer?.name || order.customerInfo?.name || order.user?.name || 'Cliente'}*!\n` +
      `Aqui está o comprovante detalhado do seu pedido:\n\n` +
      `📋 *Itens:* \n${itemsList}\n\n` +
      `💰 *Total:* R$ ${Number(order.total || order.subtotal || 0).toFixed(2)}\n` +
      `📦 *Status:* ${order.status === 'PAID' ? 'Pago ✅' : 'Registrado'}\n\n` +
      `🔗 *Acesse o recibo oficial em:* \n${receiptLink}\n\n` +
      `Agradecemos pela preferência! Se precisar de suporte, estamos à disposição.`;

    const encodedText = encodeURIComponent(message);
    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(waUrl, '_blank');
    setShowWhatsAppModal(false);
  };

  const handleCopyLink = async () => {
    try {
      const link = `${window.location.origin}/pedidos/${orderId}/recibo`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      addToast({
        type: 'success',
        title: 'Link copiado',
        message: 'Link do recibo copiado para a área de transferência'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível copiar o link'
      });
    }
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Adiciona código do país se não tiver
    if (cleanPhone.length === 11 && cleanPhone.startsWith('85')) {
      return `55${cleanPhone}`;
    } else if (cleanPhone.length === 10 && cleanPhone.startsWith('85')) {
      return `5585${cleanPhone.substring(2)}`;
    }
    
    return cleanPhone;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando recibo...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Pedido não encontrado</p>
          <Link
            href="/pedidos"
            className="text-orange-600 hover:text-orange-700"
          >
            Voltar aos pedidos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b no-print">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/pedidos/${orderId}`}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="h-5 w-5" />
                Voltar ao Pedido
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Recibo - Pedido #{order.orderNumber}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download className="h-4 w-4" />
                Baixar PDF
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </button>

              <button
                onClick={() => setShowWhatsAppModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado!' : 'Copiar Link'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recibo */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <OrderReceipt order={order} />
        </div>
      </div>

      {/* Modal WhatsApp */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Enviar por WhatsApp
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número do WhatsApp *
                </label>
                <input
                  type="tel"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="(85) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem (opcional)
                </label>
                <textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Deixe em branco para usar a mensagem padrão..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se deixar em branco, será enviada uma mensagem padrão com os dados do pedido
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
              <button
                onClick={handleOpenWhatsAppDirectly}
                className="w-full sm:w-auto flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Abrir no WhatsApp</span>
              </button>
              <button
                onClick={handleSendWhatsApp}
                disabled={sendingWhatsApp}
                className="w-full sm:w-auto px-4 py-2.5 border border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition text-sm font-semibold disabled:opacity-50"
                title="Dispara automaticamente via servidor"
              >
                {sendingWhatsApp ? 'Enviando...' : 'Envio Automático'}
              </button>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm text-gray-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          .container {
            max-width: none;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}