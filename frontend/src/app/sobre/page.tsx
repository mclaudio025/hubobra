import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  Building2, 
  Truck, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  TrendingUp, 
  ChevronRight, 
  ArrowRight,
  HardHat,
  Cpu
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sobre a HubConstruções',
  description: 'Conheça a história e o modelo de inovação do HubConstruções: o marketplace que conecta obras e depósitos de construção com tecnologia e entrega rápida.',
  alternates: {
    canonical: '/sobre',
  },
};

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-orange-600 transition-colors">
              Início
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">Sobre Nós</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.15),transparent_60%)]" />
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-4 h-4" />
            <span>Revolucionando a Construção Civil</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Conectando a sua Obra aos Melhores Depósitos da Região
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            A <strong>HubConstruções</strong> nasceu para eliminar o desperdício de tempo, os atrasos de entrega e a burocracia na cotação e compra de materiais de construção.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 space-y-16">
        
        {/* Mission & Vision Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-900 text-xl">Rede Integrada</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Integramos os estoques físicos dos principais depósitos e lojas de materiais da região em um único catálogo inteligente.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-900 text-xl">Entrega Ágil na Obra</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Despacho inteligente a partir do depósito mais próximo do seu CEP, barateando o frete e acelerando o descarregamento.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-900 text-xl">Tecnologia & IA</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Assistentes virtuais como o <strong>Zé da Obra</strong> para cálculo de quantitativos, simulador 3D de ambientes e recibos automáticos via WhatsApp.
            </p>
          </div>
        </div>

        {/* Story & Philosophy Section */}
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 leading-relaxed text-slate-700">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Nossa Proposta de Valor
          </h2>
          <p>
            Construir ou reformar costuma ser um processo desgastante: ligar para vários depósitos, comparar preços por telefone, lidar com estoques desatualizados e esperar dias pela entrega de materiais básicos como cimento, areia e tijolos.
          </p>
          <p>
            A <strong>HubConstruções</strong> transforma esse cenário ao digitalizar e conectar o ecossistema da construção. Seja você um proprietário fazendo uma pequena reforma residencial, um arquiteto especificando acabamentos de alto padrão ou uma construtora gerenciando múltiplos canteiros, nossa plataforma garante o melhor preço direto do parceiro e entrega ágil garantida.
          </p>
        </div>

        {/* Call to Action for Partners */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-3xl p-8 sm:p-12 text-slate-950 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-orange-500/20">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-black">Você é dono de uma Loja ou Depósito?</h3>
            <p className="text-sm sm:text-base font-medium opacity-90 max-w-xl">
              Venda seus materiais para milhares de clientes da sua região através da nossa plataforma com taxa zero de adesão.
            </p>
          </div>
          <Link
            href="/parceiros"
            className="shrink-0 bg-slate-950 text-white font-black px-8 py-4 rounded-2xl hover:bg-slate-900 transition flex items-center gap-2 shadow-lg"
          >
            <span>Seja um Parceiro</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
