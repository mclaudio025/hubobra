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
    <section className="py-10 bg-gray-50 text-gray-900 relative overflow-hidden border-y border-gray-200">
      <div className="container mx-auto px-4 relative z-10">
        {/* Header with CEP query */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-gray-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <Store className="w-3.5 h-3.5 text-orange-600" />
              Rede de Lojas Parceiras
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">
              O estoque da sua cidade conectado em um <span className="text-orange-600">único app</span>
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Compre com os melhores preços, entrega unificada na obra e garantia HubConstruções.
            </p>
          </div>

          {/* CEP Input Widget */}
          <form onSubmit={handleCepSubmit} className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-300 shadow-sm w-full sm:w-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 text-gray-700 text-sm">
              <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
              <input
                type="text"
                placeholder="Digite seu CEP da obra..."
                value={activeCep}
                onChange={(e) => setActiveCep(e.target.value)}
                className="bg-transparent text-gray-900 placeholder-gray-400 text-xs sm:text-sm focus:outline-none w-40 sm:w-48"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="bg-[#009de0] hover:bg-[#0088c6] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
            >
              {isSearching ? 'Verificando...' : 'Calcular Lojas'}
            </button>
          </form>
        </div>

        {/* Active Region Notification */}
        <div className="flex items-center gap-2 py-3 text-xs text-emerald-700 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{regionMessage}</span>
        </div>

        {/* Partner Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {mockPartners.map((partner, index) => (
            <motion.div
              key={index}
              className="bg-white hover:bg-gray-50/80 border border-gray-200 hover:border-[#009de0] rounded-2xl p-4 transition-all duration-300 shadow-xs group"
              whileHover={{ y: -4 }}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[#009de0] group-hover:bg-[#009de0] group-hover:text-white transition-colors">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                  ★ {partner.rating}
                </span>
              </div>

              <h3 className="font-bold text-sm text-gray-900 group-hover:text-[#009de0] transition-colors line-clamp-1">
                {partner.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{partner.category}</p>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <div className="flex items-center gap-1 text-emerald-600 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{partner.deliveryTime}</span>
                </div>
                <span className="text-gray-700 font-semibold">{partner.productsCount}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Partner Onboarding CTA */}
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="p-3 bg-[#009de0] text-white rounded-2xl shrink-0 hidden sm:block">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-base">
                Você tem uma loja física ou depósito de materiais de construção?
              </h4>
              <p className="text-gray-600 text-xs sm:text-sm mt-0.5">
                Conecte seu estoque à HubConstruções, venda para centenas de novas obras da região e pague apenas uma pequena comissão sobre as vendas realizadas.
              </p>
            </div>
          </div>
          <a
            href={getWhatsAppPartnerLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-[#009de0] hover:bg-[#0088c6] text-white font-black text-xs px-5 py-3 rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <span>Cadastrar Minha Loja</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
