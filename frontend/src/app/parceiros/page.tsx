'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Building2, 
  TrendingUp, 
  Truck, 
  Users, 
  ShieldCheck, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  Percent, 
  Sparkles,
  ArrowLeft,
  DollarSign
} from 'lucide-react';
import { STORE_CONFIG, getWhatsAppLink } from '@/config/store.config';

export default function PartnersLandingPage() {
  const [formData, setFormData] = useState({
    storeName: '',
    ownerName: '',
    phone: '',
    city: '',
    category: 'Materiais Básicos & Estruturais',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const whatsappMessage = encodeURIComponent(
    `Olá! Tenho uma loja de materiais (${formData.storeName || 'Loja'}) em ${formData.city || 'minha cidade'} e quero conectar meu estoque à HubConstruções.`
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-white">
      {/* Top Banner Header */}
      <div className="container mx-auto px-4 py-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-orange-400 transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a Loja HubConstruções
        </Link>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 lg:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Programa de Lojistas Parceiros HubConstruções
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight"
          >
            Venda o estoque da sua loja física para centenas de{' '}
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
              novas obras na sua região.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-300 mt-6 max-w-2xl mx-auto leading-relaxed"
          >
            Você cuida do estoque e do caminhão de entrega. Nós trazemos os clientes, processamos o pagamento com segurança e você só paga comissão quando vender.
          </motion.p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-16">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl w-fit mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Aumento de Vendas sem Custo Fixo</h3>
            <p className="text-sm text-slate-400">
              Receba pedidos diários de pedreiros, construtoras e donos de obra sem precisar investir em equipe de marketing ou anúncios caros.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl w-fit mb-4">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Pagamento 100% Garantido</h3>
            <p className="text-sm text-slate-400">
              O cliente paga à vista no PIX ou cartão na plataforma HubConstruções antes de você despachar o material. Risco de inadimplência zero.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl w-fit mb-4">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Aproveite seus Caminhões</h3>
            <p className="text-sm text-slate-400">
              Otimize as rotas dos seus veículos de entrega atendendo bairros próximos que já fazem parte da sua logística diária.
            </p>
          </div>
        </div>

        {/* Lead Capture Form & WhatsApp Direct */}
        <div className="max-w-2xl mx-auto mt-16 bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative">
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Cadastre sua Loja de Materiais
          </h2>
          <p className="text-slate-400 text-sm text-center mb-8">
            Preencha seus dados abaixo para nossa equipe entrar em contato e ativar seu catálogo no app.
          </p>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Recebemos seu contato!</h3>
              <p className="text-slate-300 text-sm max-w-md mx-auto mb-6">
                Nossa equipe entrará em contato via WhatsApp para configurar sua loja e cadastrar seus primeiros produtos.
              </p>
              <a
                href={getWhatsAppLink(`Olá! Tenho uma loja de materiais (${formData.storeName || 'Loja'}) em ${formData.city || 'minha cidade'} e quero conectar meu estoque à ${STORE_CONFIG.name}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all"
              >
                <Phone className="w-4 h-4" />
                Falar Agora pelo WhatsApp
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nome da sua Loja ou Depósito
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Depósito São José Materiais"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Seu Nome / Responsável
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Seu nome"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    WhatsApp Comercial
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Cidade e Estado da sua Loja
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fortaleza - CE"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Principal Especialidade
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  <option>Materiais Básicos & Estruturais (Cimento, Areia, Ferro)</option>
                  <option>Hidráulica & Tubulações</option>
                  <option>Elétrica & Iluminação</option>
                  <option>Pisos, Revestimentos & Tintas</option>
                  <option>Ferramentas & Maquinário</option>
                  <option>Loja Completa (Tudo para Construção)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
              >
                <span>Enviar Cadastro para Análise</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
