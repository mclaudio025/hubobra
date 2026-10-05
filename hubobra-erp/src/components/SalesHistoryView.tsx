import React, { useState, useEffect } from 'react';
import { History, Printer, CheckCircle, Clock, AlertTriangle, FileText, Search } from 'lucide-react';
import { db, LocalSale } from '../db/db';

interface SalesHistoryViewProps {
  onPrintSale: (sale: LocalSale) => void;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ onPrintSale }) => {
  const [sales, setSales] = useState<LocalSale[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadSales = async () => {
    const all = await db.sales.orderBy('createdAt').reverse().toArray();
    setSales(all);
  };

  useEffect(() => {
    loadSales();
  }, []);

  const filtered = sales.filter(
    (s) =>
      s.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customerCpfCnpj && s.customerCpfCnpj.includes(searchTerm))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-amber-500" />
            <span>Histórico de Vendas & Comprovantes Emitidos</span>
          </h2>
          <p className="text-xs text-slate-400">
            {sales.length} vendas registradas no banco local do terminal
          </p>
        </div>

        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Nº Venda</th>
                <th className="p-3.5">Data / Hora</th>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Pagamento</th>
                <th className="p-3.5 text-right">Valor Total</th>
                <th className="p-3.5 text-center">Status Fiscal</th>
                <th className="p-3.5 text-center">Sincronização</th>
                <th className="p-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-amber-400">{s.saleNumber}</td>
                  <td className="p-3.5 text-slate-400">{new Date(s.createdAt).toLocaleString('pt-BR')}</td>
                  <td className="p-3.5 font-semibold text-white">{s.customerName}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 bg-slate-800 rounded font-bold text-[10px] text-slate-300">
                      {s.paymentMethod}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono font-black text-emerald-400">
                    R$ {s.total.toFixed(2)}
                  </td>
                  <td className="p-3.5 text-center">
                    {s.fiscalStatus === 'AUTHORIZED_SEFAZ' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> NFC-e Autorizada
                      </span>
                    )}
                    {s.fiscalStatus === 'CONTINGENCY_EMITTED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400">
                        <Clock className="w-3 h-3" /> Contingência Offline
                      </span>
                    )}
                    {s.fiscalStatus === 'NOT_EMITTED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                        Recibo Balcão
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    {s.syncedToCloud ? (
                      <span className="text-emerald-400 text-[10px] font-bold">Nuvem OK</span>
                    ) : (
                      <span className="text-amber-400 text-[10px] font-bold">Pendente Envio</span>
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => onPrintSale(s)}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                      title="Reimprimir Comprovante Térmico 80mm"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 text-xs">
                    Nenhuma venda encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
