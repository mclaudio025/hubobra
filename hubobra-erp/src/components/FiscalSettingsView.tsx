import React, { useState } from 'react';
import { FileCheck, ShieldCheck, Key, Server, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

export const FiscalSettingsView: React.FC = () => {
  const [provider, setProvider] = useState<'NUVEM_FISCAL' | 'FOCUS_NFE' | 'PLUGNOTAS'>('NUVEM_FISCAL');
  const [apiToken, setApiToken] = useState<string>('tok_live_hubobra_fiscal_2026_sefaz_ce');
  const [environment, setEnvironment] = useState<'HOMOLOGACAO' | 'PRODUCAO'>('PRODUCAO');
  const [serieNfce, setSerieNfce] = useState<number>(1);
  const [nextNumber, setNextNumber] = useState<number>(1042);
  const [contingencyEnabled, setContingencyEnabled] = useState<boolean>(true);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-emerald-500" />
          <span>Configurações Fiscais & Emissão de NFC-e / NF-e</span>
        </h2>
        <p className="text-xs text-slate-400">
          Emissão direta via API com suporte legal a Contingência Offline (SEFAZ)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Certificado A1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Certificado Digital A1</h3>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Válido até 12/2027
              </span>
            </div>
          </div>

          <div className="space-y-1 text-xs text-slate-400 border-t border-slate-800 pt-3">
            <p><strong>CNPJ:</strong> 12.345.678/0001-90</p>
            <p><strong>Razão:</strong> HUBOBRA MATERIAIS DE CONSTRUCAO LTDA</p>
            <p><strong>UF:</strong> Ceará (SEFAZ-CE)</p>
          </div>

          <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors">
            Atualizar Arquivo .PFX / .P12
          </button>
        </div>

        {/* Card Contingência Offline */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Contingência Offline</h3>
              <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full">
                Ativo Automático
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 border-t border-slate-800 pt-3">
            Se o terminal perder o acesso à internet, o PDV assina localmente e imprime o DANFE NFC-e com a tarja legal.
          </p>

          <div className="text-[11px] bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-amber-300">
            Prazo legal SEFAZ: <strong>Até 24h</strong> para envio automático das notas pendentes.
          </div>
        </div>

        {/* Provedor Fiscal */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Motor Fiscal API</h3>
              <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded-full">
                {provider}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-400 border-t border-slate-800 pt-3 space-y-1">
            <p><strong>Ambiente:</strong> {environment}</p>
            <p><strong>Série NFC-e:</strong> {serieNfce}</p>
            <p><strong>Próximo Número:</strong> {nextNumber}</p>
          </div>
        </div>
      </div>

      {/* Formulário de Configurações */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
          Credenciais do Provedor de API Fiscal
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Provedor Homologado</label>
            <select
              value={provider}
              onChange={(e: any) => setProvider(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs font-semibold"
            >
              <option value="NUVEM_FISCAL">Nuvem Fiscal (Recomendado - API REST moderna)</option>
              <option value="FOCUS_NFE">Focus NFe (NFC-e / NF-e em Nuvem)</option>
              <option value="PLUGNOTAS">PlugNotas / TecnoSpeed</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Ambiente de Transmissão</label>
            <select
              value={environment}
              onChange={(e: any) => setEnvironment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs font-semibold"
            >
              <option value="PRODUCAO">Produção (Validade Jurídica Real)</option>
              <option value="HOMOLOGACAO">Homologação (Ambiente de Testes SEFAZ)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1">Token de Acesso à API Fiscal</label>
          <div className="relative">
            <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => alert('Configurações fiscais salvas com sucesso!')}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
        >
          Salvar Configurações Fiscais
        </button>
      </div>
    </div>
  );
};
