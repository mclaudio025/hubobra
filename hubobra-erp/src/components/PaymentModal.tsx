import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Banknote,
  CreditCard,
  Clock,
  CheckCircle2,
  X,
  FileText,
  AlertTriangle,
  Layers,
  Plus,
  Trash2,
  DollarSign,
  Tag,
  ArrowRight,
  Sparkles,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { LocalCustomer, LocalOrder, PaymentEntry } from '../db/db';

export interface PaymentConfirmationData {
  method: 'PIX' | 'DINHEIRO' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO' | 'CREDIARIO_LOJA' | 'CREDITO_LOJA' | 'PAGAMENTO_MISTO';
  paymentSummary: string;
  payments: PaymentEntry[];
  cashReceived?: number;
  change?: number;
  storeCreditUsed?: number;
  creditUsed?: number;
  emitNfce: boolean;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total?: number;
  order?: LocalOrder | null;
  customer?: LocalCustomer | null;
  onConfirmPayment: (paymentData: PaymentConfirmationData) => void;
  isOnline?: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  total,
  order,
  customer,
  onConfirmPayment,
  isOnline = true,
}) => {
  const actualTotal = total !== undefined ? total : order ? order.total : 0;

  // Modo: Forma Única vs Múltiplas Formas
  const [paymentMode, setPaymentMode] = useState<'UNICO' | 'MISTO'>('UNICO');

  // Estado Forma Única
  const [singleMethod, setSingleMethod] = useState<
    'PIX' | 'DINHEIRO' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO' | 'CREDIARIO_LOJA' | 'CREDITO_LOJA'
  >('PIX');
  const [singleCashReceived, setSingleCashReceived] = useState<string>((actualTotal || 0).toFixed(2));
  const [singleInstallments, setSingleInstallments] = useState<number>(1);

  // Estado Pagamento Misto / Múltiplas Formas
  const [splitPayments, setSplitPayments] = useState<PaymentEntry[]>([]);
  const [newMethod, setNewMethod] = useState<
    'PIX' | 'DINHEIRO' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO' | 'CREDIARIO_LOJA' | 'CREDITO_LOJA'
  >('DINHEIRO');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newCashReceived, setNewCashReceived] = useState<string>('');
  const [newInstallments, setNewInstallments] = useState<number>(1);

  const [emitNfce, setEmitNfce] = useState<boolean>(true);

  // Saldo de Haver/Crédito do cliente
  const storeCreditAvailable = customer?.storeCredit || 0;
  const creditLimitAvailable = customer ? Math.max(0, customer.creditLimit - customer.creditUsed) : 0;

  // Reset e inicialização ao abrir
  useEffect(() => {
    if (isOpen) {
      setSingleCashReceived((actualTotal || 0).toFixed(2));
      setSingleInstallments(1);
      setSplitPayments([]);
      setNewAmount((actualTotal || 0).toFixed(2));
      setNewCashReceived((actualTotal || 0).toFixed(2));
      setPaymentMode('UNICO');
    }
  }, [actualTotal, isOpen]);

  // Cálculos no Modo Pagamento Misto
  const totalPaidInSplit = splitPayments.reduce((acc, p) => acc + p.amount, 0);
  const remainingInSplit = Math.max(0, Number((actualTotal - totalPaidInSplit).toFixed(2)));
  const totalChangeInSplit = splitPayments.reduce((acc, p) => acc + (p.change || 0), 0);
  const totalStoreCreditUsedInSplit = splitPayments
    .filter((p) => p.method === 'CREDITO_LOJA')
    .reduce((acc, p) => acc + p.amount, 0);
  const remainingStoreCredit = Math.max(0, storeCreditAvailable - totalStoreCreditUsedInSplit);

  // Atualiza valor padrão do novo pagamento misto ao alterar a lista
  useEffect(() => {
    if (remainingInSplit > 0) {
      setNewAmount(remainingInSplit.toFixed(2));
      setNewCashReceived(remainingInSplit.toFixed(2));
    } else {
      setNewAmount('0.00');
      setNewCashReceived('0.00');
    }
  }, [remainingInSplit]);

  if (!isOpen) return null;

  // Troco no modo único
  const numSingleCash = Number(singleCashReceived) || 0;
  const singleChange = Math.max(0, numSingleCash - actualTotal);

  // Validação de Crediário Único
  const isSingleCreditAllowed = creditLimitAvailable >= actualTotal;
  const isSingleStoreCreditAllowed = storeCreditAvailable >= actualTotal;

  // Função para adicionar parte do pagamento no modo misto
  const handleAddSplitPayment = () => {
    const amountNum = Number(newAmount);
    if (!amountNum || amountNum <= 0) {
      alert('Informe um valor válido maior que zero!');
      return;
    }

    if (amountNum > remainingInSplit) {
      alert(`O valor máximo que falta pagar é R$ ${remainingInSplit.toFixed(2)}`);
      return;
    }

    // Validação de Crédito de Loja
    if (newMethod === 'CREDITO_LOJA') {
      if (amountNum > remainingStoreCredit) {
        alert(`O cliente possui apenas R$ ${remainingStoreCredit.toFixed(2)} de saldo de haver/crédito disponível!`);
        return;
      }
    }

    // Validação de Crediário
    if (newMethod === 'CREDIARIO_LOJA') {
      const alreadyCrediario = splitPayments
        .filter((p) => p.method === 'CREDIARIO_LOJA')
        .reduce((acc, p) => acc + p.amount, 0);
      if (alreadyCrediario + amountNum > creditLimitAvailable) {
        alert(`Limite de crediário insuficiente! Disponível: R$ ${creditLimitAvailable.toFixed(2)}`);
        return;
      }
    }

    let itemChange = 0;
    let cashRec: number | undefined = undefined;
    let details = '';

    if (newMethod === 'DINHEIRO') {
      cashRec = Number(newCashReceived) || amountNum;
      if (cashRec < amountNum) {
        alert('O valor entregue em dinheiro não pode ser menor que o valor a pagar!');
        return;
      }
      itemChange = Math.max(0, cashRec - amountNum);
      details = itemChange > 0 ? `Entregue R$ ${cashRec.toFixed(2)} • Troco R$ ${itemChange.toFixed(2)}` : '';
    } else if (newMethod === 'CARTAO_CREDITO') {
      details = newInstallments > 1 ? `${newInstallments}x de R$ ${(amountNum / newInstallments).toFixed(2)}` : 'À Vista';
    } else if (newMethod === 'CREDITO_LOJA') {
      details = 'Abatimento de Saldo Haver / Devolução';
    }

    const newEntry: PaymentEntry = {
      id: `pay-${Date.now()}-${Math.random()}`,
      method: newMethod,
      amount: amountNum,
      installments: newMethod === 'CARTAO_CREDITO' ? newInstallments : undefined,
      cashReceived: cashRec,
      change: itemChange,
      notes: details,
    };

    setSplitPayments([...splitPayments, newEntry]);
    setNewInstallments(1);
  };

  const handleRemoveSplitPayment = (id: string) => {
    setSplitPayments(splitPayments.filter((p) => p.id !== id));
  };

  // Botão Rápido: Aplicar Saldo de Devolução / Haver
  const handleApplyQuickStoreCredit = () => {
    if (storeCreditAvailable <= 0) return;

    if (storeCreditAvailable >= actualTotal) {
      // Cobre o total
      setSingleMethod('CREDITO_LOJA');
      setPaymentMode('UNICO');
    } else {
      // Saldo parcial -> muda para misto e adiciona o crédito
      setPaymentMode('MISTO');
      const creditEntry: PaymentEntry = {
        id: `pay-${Date.now()}`,
        method: 'CREDITO_LOJA',
        amount: storeCreditAvailable,
        notes: `Abatimento integral do saldo de haver (R$ ${storeCreditAvailable.toFixed(2)})`,
      };
      setSplitPayments([creditEntry]);
    }
  };

  const handleConfirm = () => {
    if (paymentMode === 'UNICO') {
      let storeCredUsed = 0;
      let credUsed = 0;
      let summary = '';

      if (singleMethod === 'CREDITO_LOJA') {
        storeCredUsed = actualTotal;
        summary = `Crédito/Haver na Loja (R$ ${actualTotal.toFixed(2)})`;
      } else if (singleMethod === 'CREDIARIO_LOJA') {
        credUsed = actualTotal;
        summary = `A Prazo / Crediário (R$ ${actualTotal.toFixed(2)})`;
      } else if (singleMethod === 'DINHEIRO') {
        summary = `Dinheiro (R$ ${actualTotal.toFixed(2)})`;
      } else if (singleMethod === 'CARTAO_CREDITO') {
        summary = `Cartão Crédito ${singleInstallments}x (R$ ${actualTotal.toFixed(2)})`;
      } else if (singleMethod === 'CARTAO_DEBITO') {
        summary = `Cartão Débito (R$ ${actualTotal.toFixed(2)})`;
      } else {
        summary = `PIX Instantâneo (R$ ${actualTotal.toFixed(2)})`;
      }

      const singleEntry: PaymentEntry = {
        id: `pay-${Date.now()}`,
        method: singleMethod,
        amount: actualTotal,
        installments: singleMethod === 'CARTAO_CREDITO' ? singleInstallments : undefined,
        cashReceived: singleMethod === 'DINHEIRO' ? numSingleCash : undefined,
        change: singleMethod === 'DINHEIRO' ? singleChange : undefined,
      };

      onConfirmPayment({
        method: singleMethod,
        paymentSummary: summary,
        payments: [singleEntry],
        cashReceived: singleMethod === 'DINHEIRO' ? numSingleCash : undefined,
        change: singleMethod === 'DINHEIRO' ? singleChange : undefined,
        storeCreditUsed: storeCredUsed,
        creditUsed: credUsed,
        emitNfce,
      });
    } else {
      // Modo Misto
      if (remainingInSplit > 0.01) {
        alert(`Ainda falta quitar R$ ${remainingInSplit.toFixed(2)} do pedido!`);
        return;
      }

      const storeCredUsed = splitPayments
        .filter((p) => p.method === 'CREDITO_LOJA')
        .reduce((acc, p) => acc + p.amount, 0);

      const credUsed = splitPayments
        .filter((p) => p.method === 'CREDIARIO_LOJA')
        .reduce((acc, p) => acc + p.amount, 0);

      const summary = splitPayments
        .map((p) => {
          const names: Record<string, string> = {
            PIX: 'PIX',
            DINHEIRO: 'Dinheiro',
            CARTAO_DEBITO: 'Débito',
            CARTAO_CREDITO: `Crédito${p.installments && p.installments > 1 ? ` ${p.installments}x` : ''}`,
            CREDIARIO_LOJA: 'Crediário',
            CREDITO_LOJA: 'Haver Loja',
          };
          return `${names[p.method] || p.method} (R$ ${p.amount.toFixed(2)})`;
        })
        .join(' + ');

      onConfirmPayment({
        method: 'PAGAMENTO_MISTO',
        paymentSummary: summary,
        payments: splitPayments,
        change: totalChangeInSplit,
        storeCreditUsed: storeCredUsed,
        creditUsed: credUsed,
        emitNfce,
      });
    }
  };

  const getMethodLabel = (m: string) => {
    switch (m) {
      case 'PIX':
        return 'PIX Instantâneo';
      case 'DINHEIRO':
        return 'Dinheiro à Vista';
      case 'CARTAO_DEBITO':
        return 'Cartão Débito';
      case 'CARTAO_CREDITO':
        return 'Cartão Crédito';
      case 'CREDIARIO_LOJA':
        return 'A Prazo / Crediário';
      case 'CREDITO_LOJA':
        return 'Haver / Crédito Loja';
      default:
        return m;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* TOP HEADER */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                Fechamento de Caixa {order ? `• Pedido #${order.orderNumber}` : ''}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                {order?.customerName ? order.customerName.split(' ')[0] : 'Consumidor'}
              </span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">R$ {(actualTotal || 0).toFixed(2)}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* BANNER DE VENDA PARA ENTREGA FUTURA (SALDO DE MATERIAIS) */}
        {(order?.deliveryMode === 'FUTURE_PICKUP' || order?.isFutureDelivery) && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2.5 flex items-center gap-2.5 text-amber-300 text-xs font-bold">
            <span className="p-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm">📦</span>
            <div>
              <p className="text-xs font-black text-amber-300">MODALIDADE: SALDO DE MATERIAIS (RETIRADA FUTURA)</p>
              <p className="text-[10px] text-amber-200/80">A venda financeira será processada no caixa, mas o estoque físico permanece intacto no galpão para retiradas fracionadas.</p>
            </div>
          </div>
        )}

        {/* BANNER DE HAVER / CRÉDITO DO CLIENTE (SE HOUVER SALDO) */}
        {storeCreditAvailable > 0 && (
          <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>Cliente possui R$ {storeCreditAvailable.toFixed(2)} de Haver / Crédito na Loja</span>
                  <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 rounded font-black">Disponível</span>
                </p>
                <p className="text-[10px] text-slate-400">Origem: Devolução de materiais / adiantamento de obra</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyQuickStoreCredit}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {storeCreditAvailable >= actualTotal
                  ? `Quitar 100% com Haver`
                  : `Abater R$ ${storeCreditAvailable.toFixed(2)}`}
              </span>
            </button>
          </div>
        )}

        {/* SELETOR DE MODO: FORMA ÚNICA VS MÚLTIPLAS FORMAS (DIVIDIR PAGAMENTO) */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setPaymentMode('UNICO')}
              className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
                paymentMode === 'UNICO'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Forma de Pagamento Única</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMode('MISTO');
                if (splitPayments.length === 0) {
                  setNewAmount(actualTotal.toFixed(2));
                  setNewCashReceived(actualTotal.toFixed(2));
                }
              }}
              className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
                paymentMode === 'MISTO'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-600/30 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Múltiplas Formas (Pagamento Misto / Dividido)</span>
            </button>
          </div>
        </div>

        {/* CORPO DO MODAL COM SCROLL SEGURO */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {/* ========================================================================= */}
          {/* MODO 1: FORMA DE PAGAMENTO ÚNICA */}
          {/* ========================================================================= */}
          {paymentMode === 'UNICO' && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Selecione a Forma
              </label>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSingleMethod('PIX')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    singleMethod === 'PIX'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 font-bold shadow-lg shadow-emerald-500/10 scale-[1.02]'
                      : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <QrCode className="w-6 h-6 text-emerald-400" />
                  <span className="text-xs font-bold">PIX Instantâneo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSingleMethod('DINHEIRO')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    singleMethod === 'DINHEIRO'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 font-bold shadow-lg shadow-emerald-500/10 scale-[1.02]'
                      : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <Banknote className="w-6 h-6 text-emerald-400" />
                  <span className="text-xs font-bold">Dinheiro à Vista</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSingleMethod('CARTAO_DEBITO')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    singleMethod === 'CARTAO_DEBITO'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 font-bold shadow-lg shadow-emerald-500/10 scale-[1.02]'
                      : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-6 h-6 text-cyan-400" />
                  <span className="text-xs font-bold">Cartão Débito</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSingleMethod('CARTAO_CREDITO')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    singleMethod === 'CARTAO_CREDITO'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 font-bold shadow-lg shadow-emerald-500/10 scale-[1.02]'
                      : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-6 h-6 text-sky-400" />
                  <span className="text-xs font-bold">Cartão Crédito</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSingleMethod('CREDIARIO_LOJA')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    singleMethod === 'CREDIARIO_LOJA'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 font-bold shadow-lg shadow-emerald-500/10 scale-[1.02]'
                      : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <Clock className="w-6 h-6 text-amber-400" />
                  <span className="text-xs font-bold">A Prazo / Crediário</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSingleMethod('CREDITO_LOJA')}
                  disabled={storeCreditAvailable <= 0}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    singleMethod === 'CREDITO_LOJA'
                      ? 'border-amber-500 bg-amber-500/15 text-amber-400 font-bold shadow-lg shadow-amber-500/10 scale-[1.02]'
                      : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <Tag className="w-6 h-6 text-amber-400" />
                  <span className="text-xs font-bold">Haver / Crédito Loja</span>
                </button>
              </div>

              {/* Detalhes específicos de cada forma */}
              {singleMethod === 'DINHEIRO' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-bold">Valor Entregue pelo Cliente</label>
                      <input
                        type="number"
                        step="1.00"
                        value={singleCashReceived}
                        onChange={(e) => setSingleCashReceived(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xl font-black text-white focus:border-emerald-500 focus:outline-none font-mono"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-bold">Troco a Devolver</label>
                      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xl font-black text-emerald-400 flex items-center justify-between font-mono">
                        <span>R$ {singleChange.toFixed(2)}</span>
                        {singleChange > 0 && <span className="text-xs text-slate-400 font-sans font-bold">Troco</span>}
                      </div>
                    </div>
                  </div>

                  {/* Atalhos Rápidos de Cédulas */}
                  <div className="flex gap-1.5 pt-1 overflow-x-auto">
                    <span className="text-[10px] text-slate-500 self-center font-bold">Cédulas:</span>
                    {[20, 50, 100, 200, 500].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSingleCashReceived(val.toString())}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 hover:text-white transition-colors"
                      >
                        R$ {val}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSingleCashReceived(actualTotal.toFixed(2))}
                      className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold"
                    >
                      Exato
                    </button>
                  </div>
                </div>
              )}

              {singleMethod === 'CARTAO_CREDITO' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <label className="text-xs text-slate-400 block mb-2 font-bold">Parcelamento na Maquininha (TEF / POS)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 6, 10].map((parc) => (
                      <button
                        key={parc}
                        type="button"
                        onClick={() => setSingleInstallments(parc)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all ${
                          singleInstallments === parc
                            ? 'border-sky-500 bg-sky-500/20 text-sky-300 shadow'
                            : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span>{parc === 1 ? '1x À Vista' : `${parc}x Sem Juros`}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {parc === 1 ? `R$ ${actualTotal.toFixed(2)}` : `${parc}x R$ ${(actualTotal / parc).toFixed(2)}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {singleMethod === 'CREDITO_LOJA' && (
                <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Saldo de Haver do Cliente:</span>
                    <strong className="text-amber-400 font-mono text-sm">R$ {storeCreditAvailable.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Valor Abatido:</span>
                    <strong className="text-emerald-400 font-mono text-sm">R$ {actualTotal.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Saldo Restante de Haver:</span>
                    <strong className="text-slate-200 font-mono">
                      R$ {Math.max(0, storeCreditAvailable - actualTotal).toFixed(2)}
                    </strong>
                  </div>
                  {!isSingleStoreCreditAllowed && (
                    <div className="p-2 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        Saldo insuficiente para quitar 100%! Use o modo <strong>Múltiplas Formas</strong> para abater
                        este crédito e pagar a diferença no PIX/Cartão/Dinheiro.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {singleMethod === 'CREDIARIO_LOJA' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                  {customer ? (
                    <div>
                      <p className="text-xs font-bold text-white mb-2">Cliente: {customer.name}</p>
                      <div className="flex justify-between text-xs py-1 border-b border-slate-800">
                        <span className="text-slate-400">Limite de Crédito Total:</span>
                        <span className="text-slate-200 font-mono">R$ {customer.creditLimit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-slate-400">Limite Disponível:</span>
                        <span
                          className={`font-mono font-bold ${
                            isSingleCreditAllowed ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          R$ {creditLimitAvailable.toFixed(2)}
                        </span>
                      </div>
                      {!isSingleCreditAllowed && (
                        <div className="mt-2 p-2 bg-red-950/30 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-1.5 font-medium">
                          <AlertTriangle className="w-4 h-4 shrink-0" /> Limite insuficiente para lançar a prazo!
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-400 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      Identifique o cliente no balcão para liberar a venda a prazo no crediário.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODO 2: MÚLTIPLAS FORMAS DE PAGAMENTO (SPLIT PAYMENTS) */}
          {/* ========================================================================= */}
          {paymentMode === 'MISTO' && (
            <div className="space-y-4">
              {/* Tabela de Pagamentos já adicionados */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                  <span>Formas Lançadas ({splitPayments.length})</span>
                  <span>Total Lançado: R$ {totalPaidInSplit.toFixed(2)}</span>
                </div>

                {splitPayments.length > 0 ? (
                  <div className="space-y-2">
                    {splitPayments.map((p, idx) => (
                      <div
                        key={p.id}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{getMethodLabel(p.method)}</span>
                              {p.notes && (
                                <span className="text-[10px] text-slate-400 font-normal">({p.notes})</span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Subtotal Pago: <strong className="text-emerald-400">R$ {p.amount.toFixed(2)}</strong>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSplitPayment(p.id)}
                          className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-xl transition-colors"
                          title="Remover esta forma"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl text-center text-xs text-slate-500">
                    Nenhuma forma adicionada ainda. Selecione abaixo e clique em "+ Adicionar Pagamento".
                  </div>
                )}
              </div>

              {/* Painel para Adicionar Próxima Parcela de Pagamento */}
              {remainingInSplit > 0 ? (
                <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Pagamento (Falta: R$ {remainingInSplit.toFixed(2)})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setNewAmount(remainingInSplit.toFixed(2))}
                      className="text-[10px] text-slate-400 hover:text-amber-400 underline font-mono"
                    >
                      Preencher Restante (R$ {remainingInSplit.toFixed(2)})
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'DINHEIRO', label: 'Dinheiro', icon: Banknote },
                      { id: 'CARTAO_CREDITO', label: 'Crédito', icon: CreditCard },
                      { id: 'CARTAO_DEBITO', label: 'Débito', icon: CreditCard },
                      { id: 'PIX', label: 'PIX', icon: QrCode },
                      {
                        id: 'CREDITO_LOJA',
                        label: `Haver Loja (${remainingStoreCredit.toFixed(0)})`,
                        icon: Tag,
                        disabled: remainingStoreCredit <= 0,
                      },
                      { id: 'CREDIARIO_LOJA', label: 'Crediário', icon: Clock },
                    ].map((btn) => {
                      const IconComp = btn.icon;
                      const isSel = newMethod === btn.id;
                      return (
                        <button
                          key={btn.id}
                          type="button"
                          disabled={btn.disabled}
                          onClick={() => setNewMethod(btn.id as any)}
                          className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-30 ${
                            isSel
                              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-black shadow'
                              : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{btn.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1 font-bold">Valor a Lançar (R$)</label>
                      <input
                        type="number"
                        step="0.50"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-base font-black text-white focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    {newMethod === 'DINHEIRO' ? (
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1 font-bold">Valor Entregue (Cédulas)</label>
                        <input
                          type="number"
                          step="1.00"
                          value={newCashReceived}
                          onChange={(e) => setNewCashReceived(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-base font-black text-white focus:border-emerald-500 focus:outline-none font-mono"
                        />
                      </div>
                    ) : newMethod === 'CARTAO_CREDITO' ? (
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1 font-bold">Parcelamento</label>
                        <select
                          value={newInstallments}
                          onChange={(e) => setNewInstallments(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
                        >
                          <option value={1}>1x À Vista</option>
                          <option value={2}>2x Sem Juros</option>
                          <option value={3}>3x Sem Juros</option>
                          <option value={4}>4x Sem Juros</option>
                          <option value={6}>6x Sem Juros</option>
                          <option value={10}>10x Sem Juros</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-end">
                        <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-400 text-center">
                          Liquidação Imediata
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSplitPayment}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition-all active:scale-[0.99]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Lançar esta Forma no Pedido</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs text-emerald-300 font-bold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Total do pedido 100% quitado com as formas acima!</span>
                  </div>
                  {totalChangeInSplit > 0 && (
                    <span className="font-mono text-amber-300 font-black">
                      Troco Total: R$ {totalChangeInSplit.toFixed(2)}
                    </span>
                  )}
                </div>
              )}

              {/* Resumo Financeiro da Divisão */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Total do Pedido</span>
                  <strong className="text-white font-mono text-sm">R$ {actualTotal.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Total Quitado</span>
                  <strong className="text-emerald-400 font-mono text-sm">R$ {totalPaidInSplit.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Restante</span>
                  <strong
                    className={`font-mono text-sm ${
                      remainingInSplit === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-black'
                    }`}
                  >
                    R$ {remainingInSplit.toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* EMISSÃO FISCAL NFC-e */}
          {/* ========================================================================= */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}
              >
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Emitir Cupom Fiscal (NFC-e)</span>
                  {isOnline ? (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
                      SEFAZ Online
                    </span>
                  ) : (
                    <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-mono">
                      Contingência Offline
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-slate-400">
                  {isOnline
                    ? 'Transmissão síncrona autorizada em tempo real'
                    : '⚡ Emissão em contingência offline (autoriza em até 24h)'}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emitNfce}
                onChange={(e) => setEmitNfce(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {/* BOTTOM FOOTER / BOTÃO FINALIZAR */}
        <div className="bg-slate-950 p-4 border-t border-slate-800">
          <button
            type="button"
            disabled={
              (paymentMode === 'MISTO' && remainingInSplit > 0.01) ||
              (paymentMode === 'UNICO' && singleMethod === 'CREDIARIO_LOJA' && !isSingleCreditAllowed) ||
              (paymentMode === 'UNICO' && singleMethod === 'CREDITO_LOJA' && !isSingleStoreCreditAllowed)
            }
            onClick={handleConfirm}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 transition-all active:scale-[0.99]"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Confirmar Pagamento e Imprimir Comprovante</span>
          </button>
        </div>
      </div>
    </div>
  );
};
