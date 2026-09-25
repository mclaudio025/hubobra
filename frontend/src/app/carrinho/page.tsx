'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  Truck, 
  Sparkles, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck,
  Building2 
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { calculateShippingRates, ShippingRateResult } from '@/config/shipping.config';

export default function CarrinhoPage() {
  const { items, total, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [cepInput, setCepInput] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [shippingResult, setShippingResult] = useState<ShippingRateResult | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCalculateShipping = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCep = cepInput.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      const rates = calculateShippingRates({
        cep: cleanCep,
        city: data.localidade || 'Fortaleza',
        neighborhood: data.bairro || '',
        state: data.uf || 'CE',
        subtotal: total
      });

      setShippingResult(rates);
    } catch {
      // Fallback para cálculo direto pelo CEP
      const rates = calculateShippingRates({
        cep: cleanCep,
        city: 'Fortaleza',
        state: 'CE',
        subtotal: total
      });
      setShippingResult(rates);
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    let formatted = clean;
    if (clean.length > 5) {
      formatted = `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
    }
    setCepInput(formatted);
    if (clean.length === 8) {
      setTimeout(() => {
        const rates = calculateShippingRates({
          cep: clean,
          state: 'CE',
          subtotal: items.reduce((acc, i) => acc + Number(i.product.price) * i.quantity, 0)
        });
        setShippingResult(rates);
      }, 100);
    }
  };

  const subtotal = items.reduce((acc, item) => acc + Number(item.product.price) * item.quantity, 0);
  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const shippingCost = shippingResult ? shippingResult.fee : 0;
  const finalTotal = subtotal + shippingCost;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-orange-600 transition font-medium text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Continuar Comprando
            </Link>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-orange-600" />
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Carrinho de Compras</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {items.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl mx-auto p-8 shadow-sm">
            <div className="w-20 h-20 bg-orange-50 dark:bg-orange-950/40 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Seu carrinho está vazio</h2>
            <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto">
              Adicione produtos de construção, ferramentas ou acabamentos ao seu pedido para entrega rápida na sua obra.
            </p>
            <Link
              href="/produtos"
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3.5 rounded-xl font-bold transition inline-flex items-center gap-2 shadow-lg shadow-orange-500/20"
            >
              <ShoppingBag className="h-5 w-5" />
              Explorar Catálogo de Produtos
            </Link>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      Materiais Selecionados ({totalItemCount} {totalItemCount === 1 ? 'item' : 'itens'})
                    </h2>
                    <button
                      onClick={clearCart}
                      className="text-red-500 hover:text-red-700 text-xs font-bold transition"
                    >
                      Limpar Carrinho
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((item) => (
                      <div key={item.product.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          {/* Product Image */}
                          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-slate-200/60 dark:border-slate-700">
                            {item.product.images && item.product.images.length > 0 ? (
                              <img
                                src={item.product.images[0].url}
                                alt={item.product.images[0].alt || item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Building2 className="h-6 w-6 text-slate-400" />
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {item.product.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {formatCurrency(item.product.price)} / un
                            </p>
                          </div>
                        </div>

                        {/* Quantity Controls & Total */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 shadow-xs">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                              className="w-10 h-10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-orange-500 hover:text-white active:bg-orange-600 active:scale-90 transition-all font-bold select-none cursor-pointer"
                              aria-label="Diminuir quantidade"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-10 text-center text-sm font-black text-slate-900 dark:text-white select-none">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                              className="w-10 h-10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-orange-500 hover:text-white active:bg-orange-600 active:scale-90 transition-all font-bold select-none cursor-pointer"
                              aria-label="Aumentar quantidade"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="text-right min-w-[85px] sm:min-w-[100px]">
                            <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                              {formatCurrency(item.product.price * item.quantity)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="Remover produto"
                            aria-label="Remover produto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulador de Frete no Carrinho */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    <Truck className="h-4 w-4 text-orange-600" />
                    <span>Calcular Frete e Prazo de Entrega na Obra</span>
                  </div>

                  <form onSubmit={handleCalculateShipping} className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      value={cepInput}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="Digite seu CEP (ex: 60160-230)"
                      maxLength={9}
                      className="flex-1 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      type="submit"
                      disabled={loadingCep || cepInput.replace(/\D/g, '').length !== 8}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition disabled:opacity-50"
                    >
                      {loadingCep ? 'Calculando...' : 'Calcular'}
                    </button>
                  </form>

                  {shippingResult && (
                    <div className={`p-3.5 rounded-xl border text-xs ${
                      shippingResult.isFree
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                    }`}>
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          {shippingResult.isFree ? <Sparkles className="w-4 h-4 text-emerald-600" /> : <Truck className="w-4 h-4 text-blue-600" />}
                          {shippingResult.zoneName}
                        </span>
                        <span>{shippingResult.isFree ? '✨ GRÁTIS' : shippingResult.feeFormatted}</span>
                      </div>
                      <p className="mt-1 text-[11px] opacity-80">
                        {shippingResult.description} — Prazo estimado: {shippingResult.estimatedDays}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 sticky top-4 space-y-4">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-orange-600" />
                    Resumo do Pedido
                  </h3>

                  <div className="space-y-2 text-xs border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Subtotal</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(subtotal)}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span>Frete</span>
                      <span className={`font-bold ${
                        shippingResult?.isFree ? 'text-emerald-600' : 'text-slate-900 dark:text-white'
                      }`}>
                        {shippingResult ? (shippingResult.isFree ? 'GRÁTIS' : shippingResult.feeFormatted) : 'Calcular acima'}
                      </span>
                    </div>

                    <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>Total</span>
                      <span className="text-orange-600">{formatCurrency(finalTotal)}</span>
                    </div>
                  </div>

                  {isAuthenticated ? (
                    <Link
                      href="/checkout"
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3.5 px-4 rounded-xl font-bold text-center block shadow-lg shadow-orange-500/20 transition text-sm"
                    >
                      Finalizar Pedido
                    </Link>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        href="/login?redirect=/checkout"
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3.5 px-4 rounded-xl font-bold text-center block shadow-lg shadow-orange-500/20 transition text-sm"
                      >
                        Fazer Login e Finalizar
                      </Link>
                      <p className="text-[11px] text-slate-500 text-center">
                        Acesse sua conta para emitir recibos e rastrear a entrega.
                      </p>
                    </div>
                  )}

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Materiais protegidos com nota fiscal e garantia de troca em até 7 dias.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
