'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  Search,
  Building,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toaster';
import Loading from '../components/ui/Loading';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

interface QuoteItem {
  id: string;
  name: string;
  brand?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Quote {
  id: string;
  quoteNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  validUntil: string;
  notes?: string;
  createdAt: string;
  items: QuoteItem[];
  convertedOrder?: {
    id: string;
    orderNumber: string;
    status: string;
  };
}

export default function OrcamentosPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [phoneSearch, setPhoneSearch] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    loadQuotes();
  }, [user]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/quotes`;

      if (user?.id) {
        url = `${API_BASE_URL}/quotes/my-quotes?userId=${user.id}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQuotes(Array.isArray(data) ? data : data.items || []);
      }
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchByPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneSearch.trim()) return loadQuotes();

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/quotes/by-phone/${encodeURIComponent(phoneSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setQuotes(Array.isArray(data) ? data : []);
        if (data.length === 0) {
          addToast({
            type: 'info',
            title: 'Nenhum orçamento encontrado',
            message: 'Não encontramos orçamentos recentes para este telefone.',
          });
        }
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro na busca',
        message: 'Não foi possível buscar os orçamentos.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = (quote: Quote) => {
    const downloadUrl = `${API_BASE_URL}/quotes/${quote.id}/pdf`;
    window.open(downloadUrl, '_blank');
    addToast({
      type: 'success',
      title: 'Gerando PDF',
      message: `Baixando arquivo do Orçamento #${quote.quoteNumber}`,
    });
  };

  const isExpired = (validUntil: string) => {
    return new Date() > new Date(validUntil);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatPrice = (val: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-orange-600 font-semibold text-sm">
              <FileText className="w-5 h-5" />
              <span>Central de Orçamentos HubObra</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Meus Orçamentos</h1>
            <p className="text-sm text-slate-500">
              Consulte seus orçamentos passados, baixe a 2ª via do PDF ou feche seu pedido diretamente com a Lia.
            </p>
          </div>

          {/* Busca Rápida por Telefone */}
          <form onSubmit={searchByPhone} className="flex items-center gap-2 max-w-md w-full md:w-auto">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar por WhatsApp (DDD + Número)"
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-xl transition shadow-sm"
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Lista de Orçamentos */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loading size="lg" text="Carregando orçamentos..." />
          </div>
        ) : quotes.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Nenhum orçamento encontrado</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              Você ainda não gerou orçamentos ou fez pedidos com a Lia no WhatsApp.
            </p>
            <a
              href="https://wa.me/558589219126?text=Oi%20Lia,%20gostaria%20de%20fazer%20um%20orçamento%20de%20materiais%20de%20construção!"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition"
            >
              <MessageCircle className="w-4 h-4" />
              Pedir Orçamento no WhatsApp com a Lia
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotes.map((quote) => {
              const expired = isExpired(quote.validUntil);
              const isConverted = quote.status === 'CONVERTED';

              return (
                <div
                  key={quote.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Topo do Card */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Orçamento #{quote.quoteNumber}
                        </span>
                        <h2 className="text-lg font-bold text-slate-900 mt-0.5">{quote.customerName}</h2>
                      </div>
                      {isConverted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Pedido Fechado
                        </span>
                      ) : expired ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                          <AlertTriangle className="w-3.5 h-3.5" /> Expirado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                          <Clock className="w-3.5 h-3.5" /> Válido (7 dias)
                        </span>
                      )}
                    </div>

                    {/* Datas */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block">Emissão:</span>
                        <span className="font-semibold text-slate-800">{formatDate(quote.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Validade:</span>
                        <span className={`font-semibold ${expired && !isConverted ? 'text-rose-600' : 'text-slate-800'}`}>
                          {formatDate(quote.validUntil)}
                        </span>
                      </div>
                    </div>

                    {/* Resumo dos Itens */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-xs font-bold text-slate-700 block">
                        Itens Orçados ({quote.items?.length || 0}):
                      </span>
                      <ul className="space-y-1 text-xs text-slate-600 max-h-28 overflow-y-auto pr-1">
                        {quote.items?.map((item, idx) => (
                          <li key={idx} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                            <span className="truncate max-w-[200px]">
                              {item.quantity}x {item.name}
                            </span>
                            <span className="font-semibold text-slate-800 ml-2">
                              {formatPrice(item.total)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Rodapé do Card */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Total Geral</span>
                      <span className="text-xl font-extrabold text-orange-600">{formatPrice(quote.total)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadPdf(quote)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition"
                        title="Baixar PDF Oficial"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>

                      {!isConverted && (
                        <a
                          href={`https://wa.me/558589219126?text=Oi%20Lia!%20Gostaria%20de%20fechar%20o%20orçamento%20%23${quote.quoteNumber}%20no%20valor%20de%20${encodeURIComponent(formatPrice(quote.total))}.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-sm"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Comprar</span>
                        </a>
                      )}
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
