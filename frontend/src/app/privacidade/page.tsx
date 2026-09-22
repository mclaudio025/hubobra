import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  Database, 
  UserCheck, 
  ChevronRight, 
  CheckCircle2 
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Privacidade & LGPD',
  description: 'Entenda como o HubConstruções protege seus dados pessoais e cumpre integralmente a Lei Geral de Proteção de Dados (LGPD).',
  alternates: {
    canonical: '/privacidade',
  },
};

export default function PrivacidadePage() {
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
            <span className="text-slate-900 font-bold">Política de Privacidade</span>
          </nav>
        </div>
      </div>

      {/* Hero Title */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white py-14 px-4">
        <div className="max-w-5xl mx-auto space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Conformidade LGPD (Lei nº 13.709/2018)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Política de Privacidade e Proteção de Dados
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
            Sua privacidade e a segurança dos dados da sua obra são prioridades absolutas para a HubConstruções.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/80 shadow-xs space-y-8 text-sm sm:text-base leading-relaxed text-slate-700">
          
          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-600" />
              1. Quais dados coletamos?
            </h2>
            <p>
              Coletamos apenas as informações estritamente necessárias para processar seus pedidos, calcular o frete para a sua obra e prestar suporte via WhatsApp:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Dados de Identificação:</strong> Nome completo, CPF ou CNPJ e Razão Social.</li>
              <li><strong>Dados de Contato:</strong> Número de telefone celular/WhatsApp e endereço de e-mail.</li>
              <li><strong>Dados de Entrega:</strong> Endereço completo da obra ou local de descarregamento (CEP, rua, número, bairro, cidade e estado).</li>
              <li><strong>Dados de Transação:</strong> Histórico de pedidos, comprovantes gerados e status de pagamentos via PIX ou cartão.</li>
            </ul>
          </section>

          <hr className="border-slate-100" />

          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-600" />
              2. Como protegemos suas informações?
            </h2>
            <p>
              Adotamos práticas avançadas de segurança da informação, incluindo:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Criptografia SSL/TLS</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Todas as conexões entre seu navegador e nossos servidores são protegidas por HTTPS.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Não Armazenamos Dados de Cartão</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Transações de cartão são processadas de forma segura e tokenizada por gateways certificados (PCI-DSS).</p>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-orange-600" />
              3. Seus Direitos (LGPD)
            </h2>
            <p>
              Em conformidade com o artigo 18 da LGPD, você tem o direito de, a qualquer momento e mediante requisição:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Confirmar a existência de tratamento de dados;</li>
              <li>Acessar seus dados pessoais cadastrados;</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
              <li>Solicitar a exclusão de dados pessoais tratados com o seu consentimento.</li>
            </ul>
          </section>

          <hr className="border-slate-100" />

          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-900">
              4. Contato do Encarregado de Dados (DPO)
            </h2>
            <p>
              Para esclarecer qualquer dúvida sobre o tratamento dos seus dados ou exercer seus direitos previstos na LGPD, entre em contato com nossa equipe através do e-mail oficial: <strong className="text-orange-600">privacidade@hubconstrucoes.com.br</strong> ou pelo nosso canal de atendimento via WhatsApp.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
