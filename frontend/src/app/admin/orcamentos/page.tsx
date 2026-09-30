'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Download,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  User,
  Phone,
  Calendar,
  X,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toaster';
import Loading from '../../components/ui/Loading';

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

export default function AdminOrcamentosPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [converting, setConverting] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    loadQuotes();
  }, [statusFilter]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/quotes?take=50`;
      if (statusFilter !== 'ALL') {
        url += `&status=${statusFilter}`;
      }
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.items || (Array.isArray(data) ? data : []));
      }
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error);
      addToast({
        type: 'error',
        title: 'Erro de conexão',
        message: 'Não foi possível carregar os orçamentos.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = (quote: Quote) => {
    const downloadUrl = `${API_BASE_URL}/quotes/${quote.id}/pdf`;
    window.open(downloadUrl, '_blank');
  };

  const handleConvertToOrder = async (quote: Quote) => {
    if (!confirm(`Deseja converter o orçamento #${quote.quoteNumber} em um Pedido Oficial?`)) {
      return;
    }

    try {
      setConverting(true);
      const res = await fetch(`${API_BASE_URL}/quotes/${quote.id}/convert-to-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'PIX',
          street: 'Avenida Washington Soares',
          number: '1000',
          district: 'Edson Queiroz',
          city: 'Fortaleza',
          state: 'CE',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        addToast({
          type: 'success',
          title: 'Pedido Gerado!',
          message: `Orçamento convertido com sucesso no Pedido #${data.orderNumber}`,
        });
        loadQuotes();
        if (selectedQuote?.id === quote.id) {
          setSelectedQuote(null);
        }
      } else {
        const err = await res.json();
        addToast({
          type: 'error',
          title: 'Falha na conversão',
          message: err.message || 'Não foi possível converter o orçamento.',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro de conexão ao converter pedido.',
      });
    } finally {
      setConverting(false);
    }
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
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-orange-600 font-semibold text-sm">
              <FileText className="w-5 h-5" />
              <span>Gestão Comercial</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Orçamentos Emitidos</h1>
            <p className="text-sm text-slate-500">
              Acompanhe todas as propostas comerciais geradas pela Lia no WhatsApp e pela Web.
            </p>
          </div>

          <button
            onClick={loadQuotes}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar por cliente, número (#ORC-...) ou WhatsApp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadQuotes()}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">Todos os Status</option>
              <option value="OPEN">Em Aberto (Válidos)</option>
              <option value="CONVERTED">Convertidos em Pedido</option>
              <option value="EXPIRED">Expirados</option>
            </select>
          </div>
        </div>

        {/* Tabela de Orçamentos */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loading size="lg" text="Carregando orçamentos..." />
          </div>
        ) : quotes.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border border-slate-200">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800">Nenhum orçamento encontrado</h3>
            <p className="text-sm text-slate-500 mt-1">Nenhum registro corresponde aos filtros selecionados.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Orçamento</th>
                    <th className="py-3 px-4 font-semibold">Cliente / WhatsApp</th>
                    <th className="py-3 px-4 font-semibold">Emissão / Validade</th>
                    <th className="py-3 px-4 font-semibold">Itens</th>
                    <th className="py-3 px-4 font-semibold">Total</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotes.map((quote) => {
                    const expired = isExpired(quote.validUntil);
                    const isConverted = quote.status === 'CONVERTED';

                    return (
                      <tr key={quote.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          #{quote.quoteNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{quote.customerName}</div>
                          <div className="text-xs text-slate-500">{quote.customerPhone}</div>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div>Emissão: {formatDate(quote.createdAt)}</div>
                          <div className={expired && !isConverted ? 'text-rose-600 font-semibold' : 'text-slate-500'}>
                            Validade: {formatDate(quote.validUntil)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            {quote.items?.length || 0} produtos
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-orange-600">
                          {formatPrice(quote.total)}
                        </td>
                        <td className="py-3 px-4">
                          {isConverted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Pedido Fechado
                            </span>
                          ) : expired ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                              <AlertTriangle className="w-3 h-3" /> Expirado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                              <Clock className="w-3 h-3" /> Válido (7 dias)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedQuote(quote)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                              title="Ver Detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(quote)}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                              title="Baixar PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {!isConverted && (
                              <button
                                onClick={() => handleConvertToOrder(quote)}
                                disabled={converting}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
                                title="Converter em Pedido"
                              >
                                Fechar Pedido
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de Detalhes do Orçamento */}
        {selectedQuote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Detalhes do Orçamento #{selectedQuote.quoteNumber}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Emitido em {formatDate(selectedQuote.createdAt)} • Validade: {formatDate(selectedQuote.validUntil)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Informações do Cliente */}
              <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                <div className="font-bold text-slate-700">Cliente: {selectedQuote.customerName}</div>
                <div>Telefone: {selectedQuote.customerPhone}</div>
                {selectedQuote.customerEmail && <div>Email: {selectedQuote.customerEmail}</div>}
                {selectedQuote.notes && <div className="text-orange-600 mt-1">Obs: {selectedQuote.notes}</div>}
              </div>

              {/* Lista de Itens */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-500">Itens Orçados</h4>
                <div className="border rounded-xl divide-y text-xs">
                  {selectedQuote.items?.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-slate-900">{item.name}</span>
                        {item.brand && <span className="text-slate-400 ml-1">({item.brand})</span>}
                        <div className="text-slate-500">
                          {item.quantity} {item.unit} x {formatPrice(item.unitPrice)}
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">{formatPrice(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totais */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatPrice(selectedQuote.subtotal)}</span>
                </div>
                {selectedQuote.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Desconto:</span>
                    <span>- {formatPrice(selectedQuote.discount)}</span>
                  </div>
                )}
                {selectedQuote.shipping > 0 && (
                  <div className="flex justify-between">
                    <span>Frete:</span>
                    <span>+ {formatPrice(selectedQuote.shipping)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-bold text-base text-slate-900">
                  <span>Total Geral:</span>
                  <span className="text-orange-600">{formatPrice(selectedQuote.total)}</span>
                </div>
              </div>

              {/* Ações do Modal */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => handleDownloadPdf(selectedQuote)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition"
                >
                  <Download className="w-4 h-4" /> Baixar PDF
                </button>
                {selectedQuote.status !== 'CONVERTED' && (
                  <button
                    onClick={() => handleConvertToOrder(selectedQuote)}
                    disabled={converting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition"
                  >
                    <ShoppingBag className="w-4 h-4" /> Converter em Pedido
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
