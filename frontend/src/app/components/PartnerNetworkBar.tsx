'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Store, 
  Truck, 
  ShieldCheck, 
  MapPin, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  Clock, 
  CheckCircle2, 
  Percent 
} from 'lucide-react';
import { STORE_CONFIG, getWhatsAppPartnerLink } from '@/config/store.config';
import { calculateShippingRates } from '@/config/shipping.config';

const mockPartners = [
  {
    name: 'Depósito Fortaleza Central',
    category: 'Estrutural, Aço & Cimento',
    deliveryTime: 'Entrega em até 12h',
    badge: 'Estoque Verificado',
    rating: 4.9,
    productsCount: '850+ itens',
  },
  {
    name: 'Constrular Materiais & Acabamento',
    category: 'Pisos, Porcelanatos & Tintas',
    deliveryTime: 'Entrega em até 24h',
    badge: 'Super Parceiro',
    rating: 4.8,
    productsCount: '1.200+ itens',
  },
  {
    name: 'Mundo dos Tubos & Conexões',
    category: 'Hidráulica & Esgoto Completo',
    deliveryTime: 'Entrega em até 24h',
    badge: 'Especialista',
    rating: 5.0,
    productsCount: '620+ itens',
  },
  {
    name: 'Elétrica & Iluminação Express',
    category: 'Fios, Cabos & Iluminação LED',
    deliveryTime: 'Entrega Expressa',
    badge: 'Estoque Real',
    rating: 4.9,
    productsCount: '580+ itens',
  },
];

export default function PartnerNetworkBar() {
  const [activeCep, setActiveCep] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [regionMessage, setRegionMessage] = useState('Fortaleza e Região Metropolitana (4 depósitos parceiros atendendo sua obra)');

  const handleCepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCep = activeCep.replace(/\D/g, '');
    if (cleanCep.length >= 5) {
      setIsSearching(true);
      try {
        const rate = calculateShippingRates({ cep: cleanCep });
        if (rate.isFree) {
          setRegionMessage(`✨ CEP ${activeCep}: Área com Frete Grátis em Fortaleza e 4 depósitos parceiros!`);
        } else {
          setRegionMessage(`🚛 CEP ${activeCep} (${rate.zoneName}): Atendido pela rede com entrega rápida!`);
        }
      } catch {
        setRegionMessage(`Região CEP ${activeCep} atendida por 4 depósitos parceiros!`);
      } finally {
        setIsSearching(false);
      }
    }
  };

  return (
    <section className="py-8 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white relative overflow-hidden border-y border-gray-200 dark:border-slate-800">
      <div className="container mx-auto px-4 relative z-10">
        {/* Header with CEP query */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-gray-200 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/80 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Store className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              Rede de Lojas Parceiras HubObra
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              O estoque da sua cidade conectado em um <span className="text-orange-600 dark:text-orange-400">único app</span>
            </h2>
            <p className="text-gray-600 dark:text-slate-400 text-sm mt-1">
              Compre com os melhores preços, entrega unificada na obra e garantia de entrega HubObra.
            </p>
          </div>

          {/* CEP Input Widget */}
          <form onSubmit={handleCepSubmit} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-300 dark:border-slate-700 shadow-sm w-full sm:w-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 text-gray-700 dark:text-slate-200 text-sm">
              <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
              <input
                type="text"
                placeholder="Digite seu CEP da obra..."
                value={activeCep}
                onChange={(e) => setActiveCep(e.target.value)}
                className="bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 text-xs sm:text-sm focus:outline-none w-40 sm:w-48"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
            >
              {isSearching ? 'Verificando...' : 'Calcular Lojas'}
            </button>
          </form>
        </div>

        {/* Active Region Notification */}
        <div className="flex items-center gap-2 py-3 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{regionMessage}</span>
        </div>

        {/* Partner Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          {mockPartners.map((partner, index) => (
            <motion.div
              key={index}
              className="bg-white dark:bg-slate-800 hover:bg-gray-50/80 dark:hover:bg-slate-800/80 border border-gray-200 dark:border-slate-700 hover:border-orange-500 rounded-2xl p-4 transition-all duration-300 shadow-xs group"
              whileHover={{ y: -4 }}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-100 dark:border-orange-900/50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                  ★ {partner.rating}
                </span>
              </div>

              <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors line-clamp-1">
                {partner.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{partner.category}</p>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400">
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{partner.deliveryTime}</span>
                </div>
                <span className="text-gray-700 dark:text-slate-300 font-semibold">{partner.productsCount}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Partner Onboarding CTA */}
        <div className="mt-6 bg-orange-50 dark:bg-slate-800/60 border border-orange-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="p-3 bg-orange-500 text-white rounded-2xl shrink-0 hidden sm:block">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white text-base">
                Você tem uma loja física ou depósito de materiais de construção?
              </h4>
              <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
                Conecte seu estoque à HubObra, venda para centenas de novas obras da região e pague apenas uma pequena comissão sobre as vendas realizadas.
              </p>
            </div>
          </div>
          <a
            href={getWhatsAppPartnerLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs px-5 py-3 rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <span>Cadastrar Minha Loja</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
