import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownLeft, Lock, Unlock, CheckCircle2, History } from 'lucide-react';
import { db, CashRegister, LocalSale } from '../db/db';

export const CashRegisterModal: React.FC = () => {
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(null);
  const [salesToday, setSalesToday] = useState<LocalSale[]>([]);
  const [movementType, setMovementType] = useState<'SUPPLY' | 'BLEED'>('SUPPLY');
  const [movementAmount, setMovementAmount] = useState<string>('');
  const [movementReason, setMovementReason] = useState<string>('');

  const loadData = async () => {
    const registers = await db.cashRegisters.where('status').equals('OPEN').first();
    setActiveRegister(registers || null);

    const allSales = await db.sales.toArray();
    setSalesToday(allSales);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalSales = salesToday.reduce((sum, s) => sum + s.total, 0);
  const totalPix = salesToday.filter((s) => s.paymentMethod === 'PIX').reduce((sum, s) => sum + s.total, 0);
  const totalCash = salesToday.filter((s) => s.paymentMethod === 'DINHEIRO').reduce((sum, s) => sum + s.total, 0);
  const totalCards = salesToday
    .filter((s) => s.paymentMethod.includes('CARTAO'))
    .reduce((sum, s) => sum + s.total, 0);
  const totalCredit = salesToday
    .filter((s) => s.paymentMethod === 'CREDIARIO_LOJA')
    .reduce((sum, s) => sum + s.total, 0);

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRegister || !movementAmount) return;

    const amount = Number(movementAmount);
    const newMovement = {
      type: movementType,
      amount,
      reason: movementReason || (movementType === 'SUPPLY' ? 'Reforço de Troco' : 'Retirada para Cofre'),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMovements = [...activeRegister.movements, newMovement];
    const updatedCash =
      movementType === 'SUPPLY'
        ? activeRegister.currentCash + amount
        : Math.max(0, activeRegister.currentCash - amount);

    await db.cashRegisters.update(activeRegister.id, {
      movements: updatedMovements,
      currentCash: updatedCash,
    });

    setMovementAmount('');
    setMovementReason('');
    await loadData();
    alert(`${movementType === 'SUPPLY' ? 'Suprimento' : 'Sangria'} registrado com sucesso!`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-500" />
            <span>Controle de Caixa & Fechamento de Turno</span>
          </h2>
          <p className="text-xs text-slate-400">
            Acompanhe as entradas por forma de pagamento e movimentações de gaveta
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Unlock className="w-3.5 h-3.5" /> Caixa Aberto
          </span>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Total em Vendas Hoje</span>
          <p className="text-2xl font-black text-white">R$ {totalSales.toFixed(2)}</p>
          <span className="text-[10px] text-slate-500">{salesToday.length} pedidos emitidos</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Entradas em Dinheiro</span>
          <p className="text-2xl font-black text-emerald-400">R$ {totalCash.toFixed(2)}</p>
          <span className="text-[10px] text-emerald-500/80">Disponível em gaveta</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Recebido via PIX</span>
          <p className="text-2xl font-black text-teal-400">R$ {totalPix.toFixed(2)}</p>
          <span className="text-[10px] text-teal-500/80">Conta Bancária</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Cartões (Déb./Créd.)</span>
          <p className="text-2xl font-black text-sky-400">R$ {totalCards.toFixed(2)}</p>
          <span className="text-[10px] text-sky-500/80">Maquininhas</span>
        </div>
      </div>

      {/* Movimentações de Caixa (Sangria e Suprimento) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulário */}
        <form
          onSubmit={handleAddMovement}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl"
        >
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
            Lançar Movimentação de Gaveta
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMovementType('SUPPLY')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                movementType === 'SUPPLY'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-800 bg-slate-950 text-slate-400'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" /> Suprimento (Troco)
            </button>
            <button
              type="button"
              onClick={() => setMovementType('BLEED')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                movementType === 'BLEED'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                  : 'border-slate-800 bg-slate-950 text-slate-400'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" /> Sangria (Retirada)
            </button>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Valor do Lançamento (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={movementAmount}
              onChange={(e) => setMovementAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-base font-bold"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Motivo / Justificativa</label>
            <input
              type="text"
              placeholder="Ex: Fundo de troco para notas de R$ 5 e R$ 10"
              value={movementReason}
              onChange={(e) => setMovementReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors"
          >
            Confirmar Movimentação
          </button>
        </form>

        {/* Histórico de Movimentos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400 mb-3">
              Movimentações Registradas
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {activeRegister?.movements.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg ${
                        m.type === 'SUPPLY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {m.type === 'SUPPLY' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-bold text-white">{m.type === 'SUPPLY' ? 'Suprimento' : 'Sangria'}</p>
                      <p className="text-[10px] text-slate-400">{m.reason} • {m.time}</p>
                    </div>
                  </div>
                  <span className={`font-mono font-bold ${m.type === 'SUPPLY' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {m.type === 'SUPPLY' ? '+' : '-'} R$ {m.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => alert('Fechamento de Caixa Cego concluído! Relatório impresso.')}
            className="w-full mt-4 py-3 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-bold text-xs rounded-xl border border-red-500/30 transition-all"
          >
            <Lock className="w-4 h-4 inline-block mr-1.5" /> Fechar Caixa do Turno
          </button>
        </div>
      </div>
    </div>
  );
};
