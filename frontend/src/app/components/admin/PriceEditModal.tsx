'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { 
  X, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Tag, 
  Package, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw,
  Percent
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  promotionalPrice?: number;
  category: { name: string };
}

interface PriceEditModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSave: (productId: string, newPrice: number, reason: string) => Promise<void>;
}

const QUICK_REASONS = [
  'Ajuste de Margem',
  'Promoção Especial',
  'Reajuste de Fornecedor',
  'Alinhamento Concorrência',
];

const QUICK_PERCENT_ADJUSTMENTS = [
  { label: '-10%', value: -10 },
  { label: '-5%', value: -5 },
  { label: '+5%', value: 5 },
  { label: '+10%', value: 10 },
  { label: '+15%', value: 15 },
];

export default function PriceEditModal({ product, isOpen, onClose, onSave }: PriceEditModalProps) {
  const [newPrice, setNewPrice] = useState(product?.price?.toString() || '0');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setNewPrice(product.price.toString());
      setReason('');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleSave = async () => {
    const priceNum = parseFloat(newPrice.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Informe um valor de preço válido e maior que zero.');
      return;
    }

    if (!reason.trim()) {
      alert('Informe o motivo da alteração de preço para manter o histórico de auditoria.');
      return;
    }

    try {
      setLoading(true);
      await onSave(product.id, priceNum, reason.trim());
      onClose();
    } catch (error) {
      console.error('Erro ao salvar preço:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const parsedNewPrice = parseFloat(newPrice.replace(',', '.')) || product.price;
  const priceDifference = parsedNewPrice - product.price;
  const percentageChange = product.price > 0 ? ((priceDifference / product.price) * 100) : 0;
  const isIncrease = priceDifference > 0;
  const isDecrease = priceDifference < 0;

  const applyPercent = (pct: number) => {
    const calculated = Math.round((product.price * (1 + pct / 100)) * 100) / 100;
    setNewPrice(calculated.toFixed(2));
    if (!reason) {
      setReason(pct > 0 ? `Reajuste de +${pct}%` : `Desconto promocional de ${pct}%`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Elegante */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shadow-xs">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Editar Preço do Produto
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ajuste os valores de venda e registre o histórico
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-5">
          {/* Card Resumo do Produto */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-blue-600" /> Produto
              </span>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[11px] font-mono bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                  SKU: {product.sku || 'N/D'}
                </Badge>
                {product.category?.name && (
                  <Badge variant="secondary" className="text-[11px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900">
                    {product.category.name}
                  </Badge>
                )}
              </div>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
              {product.name}
            </h3>
          </div>

          {/* Grid de Preço Atual vs Novo Preço */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Preço Atual */}
            <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Preço Atual Cadastrado
              </span>
              <div className="text-xl font-bold text-slate-700 dark:text-slate-300">
                {formatCurrency(product.price)}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                Valor ativo na loja virtual
              </span>
            </div>

            {/* Novo Preço Input */}
            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-1.5">
              <label className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center justify-between">
                <span>Novo Preço (R$)</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">Valor de Venda</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  R$
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="0,00"
                  className="pl-9 text-lg font-black text-slate-900 dark:text-white bg-white dark:bg-slate-900 border-blue-300 dark:border-blue-800 focus:ring-2 focus:ring-blue-500 rounded-xl"
                  autoFocus
                />
              </div>
            </div>
          </div>

          {/* Botões Rápidos de Porcentagem */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Percent className="h-3 w-3" /> Ajuste Rápido Percentual:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PERCENT_ADJUSTMENTS.map((adj) => (
                <button
                  key={adj.label}
                  type="button"
                  onClick={() => applyPercent(adj.value)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-300 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all font-medium"
                >
                  {adj.label}
                </button>
              ))}
            </div>
          </div>

          {/* Painel de Impacto Financeiro / Variação */}
          {priceDifference !== 0 && !isNaN(parsedNewPrice) && (
            <div className={`p-4 rounded-xl border transition-all ${
              isIncrease 
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200' 
                : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  {isIncrease ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      Aumento de Preço
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-amber-600" />
                      Redução de Preço (Desconto)
                    </>
                  )}
                </span>
                <Badge className={`text-xs font-black ${
                  isIncrease
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-600 text-white'
                }`}>
                  {isIncrease ? '+' : ''}{percentageChange.toFixed(2)}%
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Diferença em Reais:</span>
                  <span className="font-bold text-sm">
                    {isIncrease ? '+' : ''}{formatCurrency(priceDifference)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Novo Preço à Vista (Pix -5%):</span>
                  <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                    {formatCurrency(parsedNewPrice * 0.95)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Motivo da Alteração */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-slate-500" />
                Motivo da Alteração <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400">Obrigatório para auditoria</span>
            </div>

            {/* Sugestões Rápidas de Motivo */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    reason === r
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Digite ou selecione o motivo da alteração..."
              className="text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="px-5 rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || !newPrice || !reason.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 rounded-xl shadow-md flex items-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
