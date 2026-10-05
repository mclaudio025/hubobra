import React, { useState, useEffect } from 'react';
import {
  Boxes,
  PackageCheck,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  CheckSquare,
  Square,
  PenTool,
  Search,
  Filter,
  RefreshCw,
  FileCheck,
  AlertCircle,
  User,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { db, LocalOrder, SaleItem } from '../db/db';

export const DigitalExpeditionView: React.FC = () => {
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<LocalOrder | null>(null);
  const [checkedItems, setCheckedItems] = useState<{ [itemIndex: number]: boolean }>({});
  const [dispatcherName, setDispatcherName] = useState<string>('Tiago (Conferente Galpão)');
  const [driverName, setDriverName] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [isSignModalOpen, setIsSignModalOpen] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'DONE'>('PENDING');

  const loadOrders = async () => {
    // Carregar pedidos pagos ou em separação
    const all = await db.orders.orderBy('createdAt').reverse().toArray();
    setOrders(all);
    if (!selectedOrder && all.length > 0) {
      setSelectedOrder(all[0]);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectItem = (idx: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleCompleteExpedition = async () => {
    if (!selectedOrder) return;

    await db.orders.update(selectedOrder.id, {
      status: 'ENTREGUE',
      notes: `${selectedOrder.notes || ''} | Expedido por ${dispatcherName} (Motorista: ${driverName || 'Cliente Direto'}, Placa: ${vehiclePlate || 'S/P'})`.trim(),
    });

    alert(`Pedido #${selectedOrder.orderNumber} expedido e baixado com sucesso!`);
    setIsSignModalOpen(false);
    setCheckedItems({});
    setDriverName('');
    setVehiclePlate('');
    loadOrders();
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'PENDING') return o.status === 'PAGO' || o.status === 'AGUARDANDO_PAGAMENTO';
    if (filterStatus === 'DONE') return o.status === 'ENTREGUE';
    return true;
  });

  const allItemsChecked = selectedOrder
    ? selectedOrder.items.every((_, idx) => checkedItems[idx])
    : false;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Coluna Esquerda: Fila de Pedidos para Separação */}
      <div className="w-full md:w-80 lg:w-96 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Boxes className="w-4 h-4 text-amber-500" />
              <span>Fila do Galpão & Separação</span>
            </h2>
            <button
              onClick={loadOrders}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Atualizar fila"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filtros de Status */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl text-[11px] font-bold">
            <button
              onClick={() => setFilterStatus('PENDING')}
              className={`py-1.5 rounded-lg transition-all ${
                filterStatus === 'PENDING' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
              }`}
            >
              A Separar
            </button>
            <button
              onClick={() => setFilterStatus('DONE')}
              className={`py-1.5 rounded-lg transition-all ${
                filterStatus === 'DONE' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400'
              }`}
            >
              Expedidos
            </button>
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`py-1.5 rounded-lg transition-all ${
                filterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              Todos
            </button>
          </div>
        </div>

        {/* Lista de Pedidos */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <Boxes className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Nenhum pedido na fila de separação</p>
            </div>
          ) : (
            filteredOrders.map((o) => {
              const isSelected = selectedOrder?.id === o.id;
              const isPaid = o.status === 'PAGO';
              const isDelivered = o.status === 'ENTREGUE';

              return (
                <div
                  key={o.id}
                  onClick={() => {
                    setSelectedOrder(o);
                    setCheckedItems({});
                  }}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black font-mono text-amber-400">{o.orderNumber}</span>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        isDelivered
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isPaid
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {isDelivered ? 'EXPEDIDO' : isPaid ? 'PAGO / LIBERADO' : 'AGUARDANDO CAIXA'}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white truncate">{o.customerName}</h3>
                  <p className="text-[10px] text-slate-400 truncate">Vendedor: {o.sellerName}</p>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{o.items.length} itens a carregar</span>
                    <span>{new Date(o.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Coluna Direita: Mapa de Separação por Baia & Checklist Digital */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
        {selectedOrder ? (
          <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
            {/* Header do Pedido Selecionado */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-black text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-lg border border-amber-400/20">
                    {selectedOrder.orderNumber}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    Emitido por {selectedOrder.sellerName}
                  </span>
                </div>
                <h1 className="text-lg font-bold text-white">{selectedOrder.customerName}</h1>
                {selectedOrder.notes && (
                  <p className="text-xs text-amber-300/90 mt-1 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                    <strong>Obs/Entrega:</strong> {selectedOrder.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Status Separação</p>
                  <p className="text-xs font-black text-amber-400">
                    {Object.values(checkedItems).filter(Boolean).length} de {selectedOrder.items.length} Conferidos
                  </p>
                </div>

                <button
                  onClick={() => setIsSignModalOpen(true)}
                  disabled={selectedOrder.status === 'ENTREGUE'}
                  className={`px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl transition-all ${
                    selectedOrder.status === 'ENTREGUE'
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : allItemsChecked
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-[0.98]'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                  <span>
                    {selectedOrder.status === 'ENTREGUE'
                      ? 'Já Expedido'
                      : allItemsChecked
                      ? 'Liberar & Coletar Assinatura'
                      : 'Liberar Carregamento'}
                  </span>
                </button>
              </div>
            </div>

            {/* Lista de Itens Agrupados por Localização no Galpão */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span>Roteiro de Separação (Locais Físicos no Galpão)</span>
                </h2>
                <span className="text-[11px] text-slate-400">
                  Toque no item para dar baixa conforme coloca no veículo
                </span>
              </div>

              <div className="space-y-2.5">
                {selectedOrder.items.map((item, idx) => {
                  const isChecked = !!checkedItems[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectItem(idx)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                        isChecked
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`p-2 rounded-xl ${isChecked ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                          {isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                              {item.location || 'Pátio Central'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">{item.sku}</span>
                          </div>
                          <h3 className={`text-sm font-bold mt-1 ${isChecked ? 'line-through text-slate-400' : 'text-white'}`}>
                            {item.name}
                          </h3>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-amber-400 font-mono">
                          {item.quantity} {item.unit}
                        </span>
                        {item.packaging && (
                          <p className="text-[10px] text-slate-400">{item.packaging}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
            <Boxes className="w-12 h-12 mb-3 opacity-20" />
            <p>Selecione um pedido na fila lateral para iniciar a conferência de carga.</p>
          </div>
        )}
      </div>

      {/* Modal de Assinatura Digital & Finalização de Carga */}
      {isSignModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-400" />
                  <span>Expedição Digital — Pedido #{selectedOrder.orderNumber}</span>
                </h3>
                <p className="text-xs text-slate-400">Cliente: {selectedOrder.customerName}</p>
              </div>
              <button
                onClick={() => setIsSignModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Dados do Transporte / Retirada */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nome do Conferente (Galpão)</label>
                <input
                  type="text"
                  value={dispatcherName}
                  onChange={(e) => setDispatcherName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Motorista / Quem Retirou</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Nome do motorista ou cliente"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Placa do Caminhão / Veículo</label>
                <input
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="Ex: BRA-2E19"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white uppercase font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Status da Carga</label>
                <div className="p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>100% dos Itens Conferidos</span>
                </div>
              </div>
            </div>

            {/* Campo Simulado de Assinatura na Tela */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 block">
                Assinatura Digital do Recebedor (Coleta na Tela do Tablet/Celular)
              </label>
              <div className="h-28 bg-slate-950 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-500 cursor-crosshair hover:border-slate-500 transition-colors">
                <PenTool className="w-5 h-5 mb-1 opacity-50" />
                <span className="text-xs">Assine aqui com o dedo ou caneta stylus</span>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsSignModalOpen(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleCompleteExpedition}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalizar & Dar Baixa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
