'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  MessageCircle,
  Copy,
  Check,
  Share2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrders } from '../../../hooks/useApi';
import { useToast } from '../../../components/ui/Toaster';
import OrderReceipt from '../../../components/OrderReceipt';
import { STORE_CONFIG } from '@/config/store.config';

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
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/orders/${orderId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error('Comprovante não localizado');
      }

      const orderData = await res.json();
      setOrder(orderData);
      
      // Pré-preencher telefone se disponível
      const phone = orderData?.user?.phone || orderData?.customer?.phone || orderData?.customerInfo?.phone || '';
      if (phone) {
        setWhatsappPhone(phone);
      }
    } catch (error) {
      console.error('Erro ao carregar recibo:', error);
      addToast({
        type: 'error',
        title: 'Aviso',
        message: 'Não foi possível carregar os dados do comprovante'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      addToast({
        type: 'info',
        title: 'Gerando PDF',
        message: 'Aguarde a preparação do seu documento...'
      });

      const response = await fetch(`/api/orders/${orderId}/receipt/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        // Fallback: se o backend puppeteer não estiver disponível, abre o diálogo de impressão
        window.print();
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprovante-pedido-${order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addToast({
        type: 'success',
        title: 'PDF Pronto',
        message: 'Comprovante baixado com sucesso!'
      });
    } catch (error) {
      window.print();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 11 && (cleanPhone.startsWith('85') || cleanPhone.startsWith('88'))) {
      return `55${cleanPhone}`;
    } else if (cleanPhone.length === 10) {
      return `55${cleanPhone}`;
    }
    return cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  };

  const generateWhatsAppMessage = () => {
    if (!order) return '';
    const siteOrigin = typeof window !== 'undefined' ? window.location.origin : STORE_CONFIG.siteUrl;
    const receiptLink = `${siteOrigin}/pedidos/${orderId}/recibo`;
    
    const itemsList = (order.items || [])
      .map((item: any) => `• ${item.quantity}x ${item.name || item.product?.name} (R$ ${Number(item.price).toFixed(2)})`)
      .join('\n');

    const paymentLabel = order.payment?.method === 'PIX' 
      ? 'PIX Instantâneo' 
      : 'Pagar no Recebimento / Maquininha';

    return (
      `🏗️ *COMPROVANTE DE PEDIDO - HUBOBRA*\n\n` +
      `Olá, *${order.user?.name || order.customer?.name || 'Cliente'}*!\n` +
      `Aqui está o comprovante do seu pedido na HubObra:\n\n` +
      `📋 *Pedido:* #${order.orderNumber}\n` +
      `📅 *Data:* ${new Date(order.createdAt).toLocaleDateString('pt-BR')}\n` +
      `💳 *Pagamento:* ${paymentLabel}\n\n` +
      `📦 *Materiais Solicitados:*\n${itemsList}\n\n` +
      `💰 *Total:* R$ ${Number(order.total || order.subtotal || 0).toFixed(2)}\n\n` +
      `🔗 *Acesse o recibo completo e nota em:*\n${receiptLink}\n\n` +
      `_Dúvidas ou suporte para sua obra: (85) 99999-9999_`
    );
  };

  const handleOpenWhatsAppDirectly = () => {
    if (!order) return;
    const cleanPhone = formatPhoneForWhatsApp(whatsappPhone || order.user?.phone || '');
    const message = whatsappMessage.trim() || generateWhatsAppMessage();
    const encodedText = encodeURIComponent(message);
    
    const waUrl = cleanPhone && cleanPhone.length > 8
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(waUrl, '_blank');
    setShowWhatsAppModal(false);
  };

  const handleSendWhatsAppApi = async () => {
    if (!whatsappPhone.trim()) {
      addToast({
        type: 'error',
        title: 'Telefone obrigatório',
        message: 'Informe o número do WhatsApp com DDD'
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
        throw new Error('Falha no envio automático');
      }

      addToast({
        type: 'success',
        title: 'Enviado com sucesso',
        message: 'Comprovante disparado via WhatsApp'
      });

      setShowWhatsAppModal(false);
    } catch (error: any) {
      // Fallback para abrir o WhatsApp diretamente
      handleOpenWhatsAppDirectly();
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handleCopySummary = async () => {
    try {
      const summary = generateWhatsAppMessage();
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      
      addToast({
        type: 'success',
        title: 'Copiado para a área de transferência',
        message: 'Resumo do pedido pronto para colar no WhatsApp'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível copiar o texto'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Carregando comprovante do pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-sm">
          <p className="text-slate-600 dark:text-slate-400 mb-4 font-medium">Pedido não encontrado.</p>
          <Link
            href="/pedidos"
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-6 rounded-xl transition text-sm inline-block"
          >
            Voltar aos Pedidos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-16">
      {/* Top Action Bar (hidden when printing) */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm no-print">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Title & Back */}
            <div className="flex items-center gap-3">
              <Link
                href={`/pedidos/${orderId}`}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition flex-shrink-0"
                title="Voltar ao Pedido"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Recibo Oficial</span>
                  <span className="text-orange-600 font-mono">#{order.orderNumber}</span>
                </h1>
                <p className="text-[11px] text-slate-500">Documento de Venda & Conferência</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* WhatsApp Button */}
              <button
                onClick={() => {
                  setWhatsappMessage(generateWhatsAppMessage());
                  setShowWhatsAppModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </button>

              {/* PDF Button */}
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Baixar PDF</span>
              </button>

              {/* Print Button */}
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Imprimir</span>
              </button>

              {/* Copy Summary */}
              <button
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 rounded-xl text-xs font-bold transition"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Voucher Paper */}
      <div className="container mx-auto px-2 sm:px-4 py-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md border border-slate-200/90 overflow-hidden print:shadow-none print:border-none print:p-0">
          <OrderReceipt order={order} />
        </div>
      </div>

      {/* Modal WhatsApp */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-emerald-600" />
                <span>Enviar Comprovante por WhatsApp</span>
              </h3>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp do Destinatário (com DDD):
                </label>
                <input
                  type="tel"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 dark:text-white"
                  placeholder="(85) 99999-9999"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mensagem Formatada:
                </label>
                <textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  rows={6}
                  className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                onClick={handleOpenWhatsAppDirectly}
                className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md shadow-emerald-600/20"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Abrir no WhatsApp</span>
              </button>

              <button
                onClick={handleSendWhatsAppApi}
                disabled={sendingWhatsApp}
                className="w-full sm:w-auto px-4 py-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition text-xs font-semibold disabled:opacity-50"
              >
                {sendingWhatsApp ? 'Enviando...' : 'Disparo Servidor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}