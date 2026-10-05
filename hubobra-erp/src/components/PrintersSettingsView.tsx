import React, { useState, useEffect } from 'react';
import {
  Printer,
  FileText,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Copy,
  Layers,
  Settings2,
  HardHat,
  Boxes,
} from 'lucide-react';
import { db } from '../db/db';

export interface PrinterConfig {
  id: string;
  role: 'CAIXA_TERMICA' | 'PEDIDOS_3VIAS' | 'ORCAMENTOS_A4';
  name: string;
  model: string;
  type: 'THERMAL_80MM' | 'THERMAL_58MM' | 'MATRIX_LX300' | 'A4_LASER';
  connectionType: 'WINDOWS_SPOOLER' | 'NETWORK_IP' | 'RAW_SERIAL_USB';
  ipAddress?: string;
  port?: number;
  copies: number;
  autoPrintOnFinish: boolean;
  cutPaper: boolean;
  via1Title: string; // Ex: VIA CLIENTE
  via2Title: string; // Ex: VIA CAIXA / LOJA
  via3Title: string; // Ex: VIA EXPEDIÇÃO / SEPARAÇÃO
  showPricesOnExpeditionVia: boolean;
  fontDensity: 'NORMAL' | 'CONDENSED_17CPI' | 'DRAFT';
}

export const DEFAULT_PRINTER_CONFIGS: PrinterConfig[] = [
  {
    id: 'prn-1',
    role: 'CAIXA_TERMICA',
    name: 'Impressora Térmica do Caixa (L7 / L9 / i9)',
    model: 'Daruma L7/L9 / Elgin i9 / Bematech MP-4200 (80mm)',
    type: 'THERMAL_80MM',
    connectionType: 'WINDOWS_SPOOLER',
    copies: 1,
    autoPrintOnFinish: true,
    cutPaper: true,
    via1Title: 'CUPOM FISCAL NFC-e / COMPROVANTE',
    via2Title: 'VIA CONTROLE CAIXA',
    via3Title: 'VIA EXPEDIÇÃO',
    showPricesOnExpeditionVia: true,
    fontDensity: 'NORMAL',
  },
  {
    id: 'prn-2',
    role: 'PEDIDOS_3VIAS',
    name: 'Impressora de Pedidos 3 Vias (Epson LX-300)',
    model: 'Epson LX-300 / LX-300+ II (Matricial 80 Colunas)',
    type: 'MATRIX_LX300',
    connectionType: 'WINDOWS_SPOOLER',
    copies: 3,
    autoPrintOnFinish: true,
    cutPaper: false,
    via1Title: '1ª VIA: CLIENTE (COMPROVANTE DE PEDIDO)',
    via2Title: '2ª VIA: LOJA / CAIXA (ARQUIVO & COMISSÃO)',
    via3Title: '3ª VIA: EXPEDIÇÃO (SEPARAÇÃO & CARREGAMENTO)',
    showPricesOnExpeditionVia: false,
    fontDensity: 'CONDENSED_17CPI',
  },
  {
    id: 'prn-3',
    role: 'ORCAMENTOS_A4',
    name: 'Impressora Padrão de Orçamentos (Folha A4)',
    model: 'Laser / Jato de Tinta Padrão Windows (A4)',
    type: 'A4_LASER',
    connectionType: 'WINDOWS_SPOOLER',
    copies: 1,
    autoPrintOnFinish: false,
    cutPaper: false,
    via1Title: 'ORÇAMENTO FORMAL',
    via2Title: 'VIA INTERNA',
    via3Title: 'VIA SEPARAÇÃO',
    showPricesOnExpeditionVia: true,
    fontDensity: 'NORMAL',
  },
];

export const PrintersSettingsView: React.FC = () => {
  const [configs, setConfigs] = useState<PrinterConfig[]>(DEFAULT_PRINTER_CONFIGS);
  const [activeTab, setActiveTab] = useState<'CAIXA_TERMICA' | 'PEDIDOS_3VIAS' | 'ORCAMENTOS_A4'>('PEDIDOS_3VIAS');
  const [testOutput, setTestOutput] = useState<string | null>(null);

  // Carregar do localStorage se existir
  useEffect(() => {
    const saved = localStorage.getItem('hubobra_printer_configs');
    if (saved) {
      try {
        setConfigs(JSON.parse(saved));
      } catch (e) {
        console.error('Erro ao ler configs de impressora:', e);
      }
    }
  }, []);

  const handleSaveConfigs = (newConfigs: PrinterConfig[]) => {
    setConfigs(newConfigs);
    localStorage.setItem('hubobra_printer_configs', JSON.stringify(newConfigs));
    alert('Configurações de impressoras salvas com sucesso!');
  };

  const currentConfig = configs.find((c) => c.role === activeTab) || configs[0];

  const updateCurrentConfig = (updates: Partial<PrinterConfig>) => {
    const updatedList = configs.map((c) => (c.role === activeTab ? { ...c, ...updates } : c));
    setConfigs(updatedList);
    localStorage.setItem('hubobra_printer_configs', JSON.stringify(updatedList));
  };

  const handleTestPrint = (config: PrinterConfig) => {
    if (config.type === 'MATRIX_LX300') {
      // Simulação das 3 Vias Matriciais
      const previewText = `
================================================================================
HUBOBRA MATERIAIS DE CONSTRUCAO - DEP. SAO JOSE
PEDIDO Nº: PED-4091 | VENDEDOR: Carlos Eduardo (01) | DATA: ${new Date().toLocaleString('pt-BR')}
CLIENTE: Construtora e Engenharia Silva Ltda (CNPJ: 12.345.678/0001-90)
--------------------------------------------------------------------------------
${config.via1Title}
[1] 40 SACO x Cimento Poty Todas as Obras 50kg CP II      [R$ 53,90] = R$ 2.156,00
[2] 10 SACO x Argamassa AC-III Cinza 20kg Quartzolit       [R$ 36,90] = R$   369,00
TOTAL DO PEDIDO: R$ 2.525,00 | FORMA: Boleto 30 Dias Faturado
--------------------------------------------------------------------------------
${config.via2Title}
ASSINATURA CLIENTE: _________________________ VENDEDOR: Carlos Eduardo
--------------------------------------------------------------------------------
${config.via3Title}
LOCAIS GALPÃO: Baia A (40 sacos Cimento) | Baia B (10 sacos Argamassa)
CONFERENTE GALPÃO: _________________ MOTORISTA: __________________
================================================================================
`;
      setTestOutput(previewText);
      setTimeout(() => window.print(), 100);
    } else if (config.type === 'THERMAL_80MM') {
      const previewText = `
HUBOBRA - CAIXA CENTRAL
TESTE DE IMPRESSAO TERMICA L7/L9/i9 (80MM)
DATA: ${new Date().toLocaleString('pt-BR')}
TERMINAL: Caixa 01 (Balcao)
------------------------------------------
STATUS: Impressora Termica OK
CORTE DE PAPEL: ${config.cutPaper ? 'HABILITADO' : 'DESABILITADO'}
------------------------------------------
`;
      setTestOutput(previewText);
      setTimeout(() => window.print(), 100);
    } else {
      window.print();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Printer className="w-6 h-6 text-amber-500" />
            <span>Configuração de Impressoras, Spooler & Vias de Pedido</span>
          </h2>
          <p className="text-xs text-slate-400">
            Configure a impressora térmica do caixa (L7/L9/i9), matricial de 3 vias (Epson LX-300) e A4
          </p>
        </div>

        <button
          onClick={() => handleSaveConfigs(configs)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Salvar Todas as Configurações</span>
        </button>
      </div>

      {/* Tabs das 3 Impressoras da Loja */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {configs.map((c) => {
          const isSelected = activeTab === c.role;
          return (
            <div
              key={c.id}
              onClick={() => setActiveTab(c.role)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-900 border-amber-500 shadow-xl shadow-amber-500/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${isSelected ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Printer className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.autoPrintOnFinish ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  {c.autoPrintOnFinish ? 'Auto-Imprimir ON' : 'Manual'}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mb-1">{c.name}</h3>
              <p className="text-xs text-slate-400 truncate">{c.model}</p>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Vias / Cópias:</span>
                <span className="font-bold text-amber-400">{c.copies} {c.copies === 1 ? 'Via' : 'Vias'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Painel Detalhado de Configuração da Impressora Selecionada */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
              Configurações Detalhadas
            </span>
            <h3 className="text-base font-bold text-white">{currentConfig.name}</h3>
          </div>

          <button
            onClick={() => handleTestPrint(currentConfig)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Testar Impressão Agora</span>
          </button>
        </div>

        {/* Formulário de Propriedades */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Nome / Descrição da Impressora</label>
            <input
              type="text"
              value={currentConfig.name}
              onChange={(e) => updateCurrentConfig({ name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-semibold"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Tecnologia / Tipo de Papel</label>
            <select
              value={currentConfig.type}
              onChange={(e: any) => updateCurrentConfig({ type: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-semibold"
            >
              <option value="MATRIX_LX300">Matricial Epson LX-300 / Formulário Contínuo (80 colunas)</option>
              <option value="THERMAL_80MM">Térmica 80mm ESC/POS (Elgin i7/i9, Daruma L7/L9, Bematech)</option>
              <option value="THERMAL_58MM">Térmica 58mm Pequena</option>
              <option value="A4_LASER">Folha A4 (Laser / Jato de Tinta)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Método de Comunicação</label>
            <select
              value={currentConfig.connectionType}
              onChange={(e: any) => updateCurrentConfig({ connectionType: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-semibold"
            >
              <option value="WINDOWS_SPOOLER">Driver Nativo do Windows / Spooler (Recomendado)</option>
              <option value="RAW_SERIAL_USB">Porta Direta USB / LPT1 (RAW ESC/P)</option>
              <option value="NETWORK_IP">Rede Ethernet / IP Direto (Porta 9100)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Quantidade de Vias / Cópias</label>
            <input
              type="number"
              min="1"
              max="5"
              value={currentConfig.copies}
              onChange={(e) => updateCurrentConfig({ copies: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-black text-amber-400"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Densidade da Fonte (LX-300)</label>
            <select
              value={currentConfig.fontDensity}
              onChange={(e: any) => updateCurrentConfig({ fontDensity: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-semibold"
            >
              <option value="CONDENSED_17CPI">Condensada 17 CPI (Cabe mais itens por linha)</option>
              <option value="DRAFT">Rascunho Rápido Draft (Velocidade Máxima)</option>
              <option value="NORMAL">Normal 10 CPI</option>
            </select>
          </div>

          {/* Toggle Auto Impressão */}
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div>
              <p className="text-xs font-bold text-white">Disparo Automático</p>
              <p className="text-[10px] text-slate-400">Imprimir sem pedir confirmação</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={currentConfig.autoPrintOnFinish}
                onChange={(e) => updateCurrentConfig({ autoPrintOnFinish: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {/* Configuração Específica das 3 Vias (Cliente, Loja e Expedição) */}
        {currentConfig.role === 'PEDIDOS_3VIAS' && (
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Personalização das 3 Vias (Formulário Contínuo)
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase block">1ª Via (Cliente)</span>
                <input
                  type="text"
                  value={currentConfig.via1Title}
                  onChange={(e) => updateCurrentConfig({ via1Title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
                <p className="text-[10px] text-slate-500">Contém dados completos, preços e endereço da obra.</p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase block">2ª Via (Loja / Caixa)</span>
                <input
                  type="text"
                  value={currentConfig.via2Title}
                  onChange={(e) => updateCurrentConfig({ via2Title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
                <p className="text-[10px] text-slate-500">Contém campo de assinatura e comissão do vendedor.</p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase block">3ª Via (Expedição / Galpão)</span>
                <input
                  type="text"
                  value={currentConfig.via3Title}
                  onChange={(e) => updateCurrentConfig({ via3Title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
                <p className="text-[10px] text-slate-500">
                  Destaque para a <strong>Localização no Galpão</strong> (Baia/Corredor) para os carregadores.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pré-Visualização Simulada da Impressão */}
      {testOutput && (
        <div id="thermal-receipt" className="hidden print:block font-mono text-[11px] whitespace-pre-wrap leading-tight text-black p-4 bg-white">
          {testOutput}
        </div>
      )}
    </div>
  );
};
