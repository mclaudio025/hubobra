'use client';

import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  RotateCcw, 
  CheckCircle2, 
  Building2, 
  HardHat, 
  Search, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWhatsAppProductQuoteLink } from '@/config/store.config';
import { calculateShippingRates, ShippingRateResult } from '@/config/shipping.config';

interface ProductShippingTabProps {
  productPrice: number;
  productWeight?: number;
  productName: string;
}

export default function ProductShippingTab({
  productPrice,
  productName
}: ProductShippingTabProps) {
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<{
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  } | null>(null);
  const [shippingResult, setShippingResult] = useState<ShippingRateResult | null>(null);
  const [error, setError] = useState('');
  const [calculated, setCalculated] = useState(false);

  const handleCalculateCep = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      setError('Por favor, digite um CEP válido com 8 dígitos.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();

      if (data.erro) {
        setError('CEP não encontrado. Verifique os números e tente novamente.');
        setAddress(null);
        setCalculated(false);
      } else {
        setAddress(data);
        const result = calculateShippingRates({
          cep: cleanCep,
          city: data.localidade || 'Fortaleza',
          neighborhood: data.bairro || '',
          state: data.uf || 'CE',
          subtotal: productPrice
        });
        setShippingResult(result);
        setCalculated(true);
      }
    } catch {
      setError('Erro ao consultar CEP. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Bloco Superior: Simulador Interativo de CEP */}
      <div className="bg-gradient-to-br from-orange-50/70 via-white to-amber-50/50 p-6 md:p-8 rounded-2xl border border-orange-100 shadow-sm">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-orange-600 text-white rounded-xl shadow-sm">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Simulador de Frete e Prazos para Obra</h3>
              <p className="text-sm text-gray-600">
                Calcule prazos e valores de entrega para seu canteiro de obras em Fortaleza e Região
              </p>
            </div>
          </div>

          <form onSubmit={handleCalculateCep} className="mt-5 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={cep}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                  if (val.length > 5) {
                    setCep(`${val.slice(0, 5)}-${val.slice(5)}`);
                  } else {
                    setCep(val);
                  }
                }}
                placeholder="Digite seu CEP (ex: 60160-230)"
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
                maxLength={9}
              />
            </div>

            <button
              type="submit"
              disabled={loading || cep.replace(/\D/g, '').length !== 8}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2 shrink-0"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Calculando...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Calcular Frete</span>
                </>
              )}
            </button>
          </form>

          {/* Feedback de Erro */}
          {error && (
            <p className="text-xs text-red-600 mt-2 font-medium flex items-center gap-1.5">
              <span>⚠️</span> {error}
            </p>
          )}

          {/* Endereço Identificado */}
          {address && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-xs text-gray-600 flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>
                Entregando em: <strong>{address.logradouro ? `${address.logradouro}, ` : ''}{address.bairro} - {address.localidade}/{address.uf}</strong>
              </span>
            </motion.div>
          )}
        </div>

        {/* Modalidades de Frete Calculadas */}
        <AnimatePresence>
          {calculated && shippingResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-orange-100 space-y-4"
            >
              <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">
                Modalidades Disponíveis para a sua Região
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Opção 1: Entrega na Obra */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                  shippingResult.isFree 
                    ? 'bg-emerald-50/50 border-emerald-300' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                        <Truck className="h-5 w-5" />
                      </div>
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                        shippingResult.isFree ? 'bg-emerald-600 text-white' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {shippingResult.isFree ? '✨ FRETE GRÁTIS' : shippingResult.feeFormatted}
                      </span>
                    </div>
                    <h5 className="font-bold text-gray-900 text-sm mb-0.5">{shippingResult.zoneName}</h5>
                    <p className="text-xs text-gray-600 mb-2">{shippingResult.description}</p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Prazo de Entrega:</span>
                    <strong className="text-gray-900">{shippingResult.estimatedDays}</strong>
                  </div>
                </div>

                {/* Opção 2: Retirada no Galpão Parceiro */}
                <div className="p-4 rounded-xl border bg-white border-gray-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        SEM CUSTO
                      </span>
                    </div>
                    <h5 className="font-bold text-gray-900 text-sm mb-0.5">Retirada no Ponto de Coleta</h5>
                    <p className="text-xs text-gray-600 mb-2">
                      Retire no galpão parceiro em Fortaleza (localização enviada via WhatsApp).
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Disponibilidade:</span>
                    <strong className="text-gray-900">Em até 24h úteis</strong>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bloco de Cotação de Grande Quantidade */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-base flex items-center gap-2">
            <HardHat className="w-5 h-5 text-orange-400" />
            Precisa de carga fechada ou frete especial para construtoras?
          </h4>
          <p className="text-xs text-slate-300 mt-1">
            Nossa equipe comercial cota caminhão fechado ou caçamba direto com as distribuidoras parceiras.
          </p>
        </div>
        <a
          href={getWhatsAppProductQuoteLink(productName)}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition flex items-center gap-2 shadow-md"
        >
          <span>Falar com Consultor de Obra</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
