import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  RotateCcw, 
  PackageCheck, 
  Clock, 
  Truck, 
  MessageCircle, 
  ChevronRight, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { STORE_CONFIG, getWhatsAppLink } from '@/config/store.config';

export const metadata: Metadata = {
  title: 'Trocas e Devoluções',
  description: 'Conheça a política de trocas, devoluções e garantias de materiais de construção do HubConstruções.',
  alternates: {
    canonical: '/trocas-e-devolucoes',
  },
};

export default function TrocasEDevolucoesPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-orange-600 transition-colors">
              Início
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">Trocas e Devoluções</span>
          </nav>
        </div>
      </div>

      {/* Hero Title */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white py-14 px-4">
        <div className="max-w-5xl mx-auto space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Código de Defesa do Consumidor</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Política de Trocas, Devoluções e Garantia
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
            Transparência e agilidade para garantir que sua obra não pare. Veja as condições e prazos para trocas e cancelamentos.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
        <div className="space-y-8">

          {/* 3 Main Pillars Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-900 text-lg">7 Dias para Desistência</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direito de arrependimento em até 7 dias corridos após o recebimento dos materiais na obra (art. 49 do CDC).
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <PackageCheck className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-900 text-lg">Garantia de Fábrica</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Materiais com defeito de fabricação ou divergência de lote contam com garantia legal de até 90 dias.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-900 text-lg">Estorno Rápido</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Devolução imediata do valor via PIX ou cancelamento no cartão após a conferência do material devolvido.
              </p>
            </div>
          </div>

          {/* Details Section */}
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 text-sm sm:text-base leading-relaxed text-slate-700">
            
            <h2 className="text-xl font-black text-slate-900">
              Condições para Troca de Materiais
            </h2>
            
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>O produto deve estar em sua embalagem original, sem violação, lacrado e sem sinais de umidade ou mau armazenamento na obra (especialmente cimento, argamassa, gesso e tintas).</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>No caso de pisos, porcelanatos e azulejos, as caixas devem estar intactas e com o mesmo número de lote/tonalidade.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Apresentação do Recibo de Compra gerado na plataforma ou Nota Fiscal emitida pelo depósito parceiro.</span>
              </li>
            </ul>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-xs sm:text-sm text-amber-900 mt-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Importante sobre descarregamento:</strong> Sempre confira a quantidade de sacos, blocos e integridade das peças no momento da entrega do caminhão. Se notar avarias, recuse o item no próprio canhoto de entrega.
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-black text-slate-900 text-base">Precisa solicitar uma troca ou devolução?</h4>
                <p className="text-xs text-slate-500">Nosso time de atendimento agiliza a coleta ou troca no depósito mais próximo.</p>
              </div>
              <a
                href={getWhatsAppLink(`Olá, preciso solicitar uma troca/devolução ou suporte sobre um pedido na ${STORE_CONFIG.name}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition text-sm shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Solicitar via WhatsApp</span>
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
