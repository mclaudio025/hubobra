import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  FileText, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  AlertCircle, 
  ChevronRight, 
  ArrowLeft,
  Store,
  Scale
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Conheça os Termos e Condições de Uso da plataforma e marketplace HubConstruções.',
  alternates: {
    canonical: '/termos-de-uso',
  },
};

export default function TermosDeUsoPage() {
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
            <span className="text-slate-900 font-bold">Termos de Uso</span>
          </nav>
        </div>
      </div>

      {/* Hero Title */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white py-14 px-4">
        <div className="max-w-5xl mx-auto space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
            <Scale className="w-3.5 h-3.5" />
            <span>Documento Legal Oficial</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Termos e Condições de Uso
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
            Última atualização: Setembro de 2026. Este documento estabelece as regras e diretrizes para navegação, compra e utilização da plataforma HubConstruções.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Quick Navigation Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs sticky top-24 space-y-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-3">
                Tópicos
              </span>
              <a href="#1-visao-geral" className="block text-xs font-semibold text-slate-700 hover:text-orange-600 py-1 transition">
                1. Visão Geral
              </a>
              <a href="#2-cadastro" className="block text-xs font-semibold text-slate-700 hover:text-orange-600 py-1 transition">
                2. Cadastro e Conta
              </a>
              <a href="#3-marketplace" className="block text-xs font-semibold text-slate-700 hover:text-orange-600 py-1 transition">
                3. Modelo Marketplace
              </a>
              <a href="#4-pagamentos" className="block text-xs font-semibold text-slate-700 hover:text-orange-600 py-1 transition">
                4. Preços e Pagamentos
              </a>
              <a href="#5-entregas" className="block text-xs font-semibold text-slate-700 hover:text-orange-600 py-1 transition">
                5. Entregas na Obra
              </a>
              <a href="#6-responsabilidades" className="block text-xs font-semibold text-slate-700 hover:text-orange-600 py-1 transition">
                6. Responsabilidades
              </a>
            </div>
          </aside>

          {/* Main Legal Text */}
          <main className="lg:col-span-3 bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/80 shadow-xs space-y-8 text-sm sm:text-base leading-relaxed text-slate-700">
            
            <section id="1-visao-geral" className="space-y-3">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span className="text-orange-600 font-mono">1.</span> Visão Geral e Aceitação
              </h2>
              <p>
                Bem-vindo ao <strong>HubConstruções</strong>. Ao acessar o site, utilizar nossos serviços digitais (incluindo calculadoras, simuladores 3D e assistentes de IA) ou realizar pedidos de materiais de construção, você concorda expressamente com os presentes Termos de Uso.
              </p>
              <p>
                Caso não concorde com qualquer termo aqui descrito, solicitamos que não prossiga com a navegação ou a contratação dos serviços.
              </p>
            </section>

            <hr className="border-slate-100" />

            <section id="2-cadastro" className="space-y-3">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span className="text-orange-600 font-mono">2.</span> Cadastro de Usuário e Segurança
              </h2>
              <p>
                Para realizar compras ou emitir recibos de obras, o usuário deverá fornecer dados cadastrais verdadeiros, precisos e atualizados (nome completo, CPF/CNPJ, e-mail, telefone para WhatsApp e endereço de entrega da obra).
              </p>
              <div className="bg-slate-50 border-l-4 border-orange-500 p-4 rounded-r-xl text-xs sm:text-sm text-slate-700">
                <strong>Atenção:</strong> O sigilo da senha de acesso é de inteira responsabilidade do usuário. A HubConstruções nunca solicitará sua senha por WhatsApp ou e-mail.
              </div>
            </section>

            <hr className="border-slate-100" />

            <section id="3-marketplace" className="space-y-3">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span className="text-orange-600 font-mono">3.</span> Modelo de Operação (Marketplace da Construção)
              </h2>
              <p>
                A <strong>HubConstruções</strong> atua como plataforma tecnológica conectando clientes finais, construtores, arquitetos e mestres de obras aos estoques físicos de <strong>Lojas e Depósitos Parceiros</strong> devidamente credenciados na região.
              </p>
              <p>
                Os produtos ofertados na plataforma possuem garantia legal, procedência e são faturados diretamente pelos depósitos oficiais integrados ao ecossistema.
              </p>
            </section>

            <hr className="border-slate-100" />

            <section id="4-pagamentos" className="space-y-3">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span className="text-orange-600 font-mono">4.</span> Preços, Ofertas e Pagamento
              </h2>
              <p>
                Os preços e condições de pagamento divulgados no site são válidos para compras realizadas na plataforma. Reservamo-nos o direito de corrigir eventuais erros gráficos ou de digitação nos valores com prévia comunicação ao cliente.
              </p>
              <p>
                Aceitamos pagamentos via <strong>PIX</strong> (com desconto e confirmação instantânea), <strong>Cartão de Crédito</strong> e opções de faturamento negociadas para compras em grande volume (atacado).
              </p>
            </section>

            <hr className="border-slate-100" />

            <section id="5-entregas" className="space-y-3">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span className="text-orange-600 font-mono">5.</span> Entregas e Prazos na Obra
              </h2>
              <p>
                O prazo de entrega é calculado com base no CEP informado da obra e na disponibilidade do estoque na loja parceira mais próxima.
              </p>
              <p>
                É fundamental que haja uma pessoa responsável no local para o recebimento e conferência física dos materiais (como sacos de cimento, argamassas, cerâmicas e tijolos) no momento do descarregamento.
              </p>
            </section>

            <hr className="border-slate-100" />

            <section id="6-responsabilidades" className="space-y-3">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span className="text-orange-600 font-mono">6.</span> Legislação e Foro
              </h2>
              <p>
                Estes Termos são regidos pelas leis da República Federativa do Brasil, em conformidade com o Código de Defesa do Consumidor (Lei nº 8.078/1990) e o Marco Civil da Internet (Lei nº 12.965/2014).
              </p>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
}
