import React, { useState } from 'react';
import { Calculator, Layers, Box, Hammer, X, Check, ArrowRight } from 'lucide-react';
import { LocalProduct } from '../db/db';

interface MaterialsCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyMaterials: (items: Array<{ productSku?: string; name: string; quantity: number; unit: string; price: number }>) => void;
  availableProducts: LocalProduct[];
}

export const MaterialsCalculatorModal: React.FC<MaterialsCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplyMaterials,
  availableProducts,
}) => {
  const [activeTab, setActiveTab] = useState<'PISOS' | 'CONCRETO' | 'ALVENARIA'>('PISOS');

  // Estado Pisos
  const [pisoWidth, setPisoWidth] = useState<number>(4);
  const [pisoLength, setPisoLength] = useState<number>(5);
  const [pisoPerda, setPisoPerda] = useState<number>(10);
  const [m2PorCaixa, setM2PorCaixa] = useState<number>(2.12);

  // Estado Concreto
  const [concLargura, setConcLargura] = useState<number>(3);
  const [concComprimento, setConcComprimento] = useState<number>(6);
  const [concEspessura, setConcEspessura] = useState<number>(0.10); // 10cm

  // Estado Alvenaria
  const [paredesM2, setParedesM2] = useState<number>(40);

  if (!isOpen) return null;

  // Cálculos Pisos
  const areaBruta = pisoWidth * pisoLength;
  const areaComPerda = areaBruta * (1 + pisoPerda / 100);
  const caixasNecessarias = Math.ceil(areaComPerda / (m2PorCaixa || 1));
  const m2Final = (caixasNecessarias * m2PorCaixa).toFixed(2);
  const sacosArgamassaPiso = Math.ceil(Number(m2Final) / 4.5); // 1 saco de 20kg rende ~4.5m²

  // Cálculos Concreto
  const volumeM3 = concLargura * concComprimento * concEspessura;
  // Traço médio estrutural 1:2:3 -> 1m³ de concreto = 7 sacos cimento, 0.67m³ areia, 0.83m³ brita
  const sacosCimentoConc = Math.ceil(volumeM3 * 7);
  const areiaM3Conc = (volumeM3 * 0.67).toFixed(2);
  const britaM3Conc = (volumeM3 * 0.83).toFixed(2);

  // Cálculos Alvenaria
  const tijolosTotal = Math.ceil(paredesM2 * 27); // 27 tijolos 8 furos por m²
  const sacosCimentoAlv = Math.ceil(paredesM2 * 0.15); // ~0.15 saco por m² de alvenaria
  const areiaM3Alv = (paredesM2 * 0.025).toFixed(2);

  const handleApplyPisos = () => {
    onApplyMaterials([
      {
        name: `Porcelanato/Piso (${caixasNecessarias} caixas = ${m2Final}m²)`,
        quantity: Number(m2Final),
        unit: 'M2',
        price: 64.90,
      },
      {
        name: 'Argamassa AC-III 20kg Quartzolit',
        quantity: sacosArgamassaPiso,
        unit: 'SACO',
        price: 36.90,
      },
    ]);
    onClose();
  };

  const handleApplyConcreto = () => {
    onApplyMaterials([
      {
        name: 'Cimento Poty 50kg CP II',
        quantity: sacosCimentoConc,
        unit: 'SACO',
        price: 53.90,
      },
      {
        name: 'Areia Média Lavada M³',
        quantity: Number(areiaM3Conc),
        unit: 'M3',
        price: 95.00,
      },
      {
        name: 'Brita N01 M³',
        quantity: Number(britaM3Conc),
        unit: 'M3',
        price: 110.00,
      },
    ]);
    onClose();
  };

  const handleApplyAlvenaria = () => {
    onApplyMaterials([
      {
        name: `Tijolo Cerâmico 8 Furos (${tijolosTotal} unidades)`,
        quantity: Math.ceil(tijolosTotal / 1000 * 10) / 10,
        unit: 'MILHEIRO',
        price: 680.00,
      },
      {
        name: 'Cimento Poty 50kg CP II',
        quantity: sacosCimentoAlv,
        unit: 'SACO',
        price: 53.90,
      },
      {
        name: 'Areia Lavada Média M³',
        quantity: Number(areiaM3Alv),
        unit: 'M3',
        price: 95.00,
      },
    ]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Calculadora de Obras Especializada</h2>
              <p className="text-xs text-orange-100">Calcule e lance no pedido com caixas fechadas e traço ideal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-2">
          <button
            onClick={() => setActiveTab('PISOS')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'PISOS' ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" /> Pisos e Revestimentos (M²)
          </button>
          <button
            onClick={() => setActiveTab('CONCRETO')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'CONCRETO' ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Box className="w-4 h-4" /> Concreto & Traço (M³)
          </button>
          <button
            onClick={() => setActiveTab('ALVENARIA')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'ALVENARIA' ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Hammer className="w-4 h-4" /> Alvenaria & Tijolos
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'PISOS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Medidas do Ambiente</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Largura (metros)</label>
                    <input
                      type="number"
                      value={pisoWidth}
                      onChange={(e) => setPisoWidth(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Comprimento (metros)</label>
                    <input
                      type="number"
                      value={pisoLength}
                      onChange={(e) => setPisoLength(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Margem de Perda</label>
                    <select
                      value={pisoPerda}
                      onChange={(e) => setPisoPerda(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-semibold"
                    >
                      <option value={10}>10% (Padrão Reto)</option>
                      <option value={15}>15% (Diagonal / Recortes)</option>
                      <option value={5}>5% (Mínimo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">M² por Caixa Fechada</label>
                    <input
                      type="number"
                      step="0.01"
                      value={m2PorCaixa}
                      onChange={(e) => setM2PorCaixa(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Resultado */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Resultado do Cálculo</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-sm text-slate-400">Área Líquida:</span>
                      <span className="text-base font-bold text-white">{areaBruta.toFixed(2)} m²</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-sm text-slate-400">Com Perda ({pisoPerda}%):</span>
                      <span className="text-base font-bold text-amber-400">{areaComPerda.toFixed(2)} m²</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-sm text-slate-400">Caixas Fechadas:</span>
                      <span className="text-xl font-extrabold text-emerald-400">{caixasNecessarias} caixas</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-sm text-slate-400">Argamassa Indicada:</span>
                      <span className="text-sm font-semibold text-slate-200">{sacosArgamassaPiso} sacos AC3 (20kg)</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleApplyPisos}
                  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <Check className="w-5 h-5" /> Inserir no Pedido do Caixa
                </button>
              </div>
            </div>
          )}

          {activeTab === 'CONCRETO' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Dimensões da Estrutura</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Largura (m)</label>
                    <input
                      type="number"
                      value={concLargura}
                      onChange={(e) => setConcLargura(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Comprimento (m)</label>
                    <input
                      type="number"
                      value={concComprimento}
                      onChange={(e) => setConcComprimento(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Espessura (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={concEspessura}
                      onChange={(e) => setConcEspessura(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-semibold"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">Ex: Laje/Piso de 10cm de espessura = 0.10m</p>
              </div>

              {/* Resultado Concreto */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Traço Estrutural (1:2:3)</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-sm text-slate-400">Volume Total:</span>
                      <span className="text-base font-bold text-white">{volumeM3.toFixed(2)} m³</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-sm text-slate-400">Cimento CP II:</span>
                      <span className="text-base font-bold text-amber-400">{sacosCimentoConc} sacos (50kg)</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-sm text-slate-400">Areia Lavada:</span>
                      <span className="text-base font-bold text-emerald-400">{areiaM3Conc} m³</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-sm text-slate-400">Brita N01:</span>
                      <span className="text-base font-bold text-cyan-400">{britaM3Conc} m³</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleApplyConcreto}
                  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <Check className="w-5 h-5" /> Inserir Pacote no Caixa
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ALVENARIA' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Área das Paredes</h3>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Metragem Quadrada de Parede (m²)</label>
                  <input
                    type="number"
                    value={paredesM2}
                    onChange={(e) => setParedesM2(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-semibold"
                  />
                  <p className="text-xs text-slate-500 mt-1">Desconte as aberturas de portas e janelas.</p>
                </div>
              </div>

              {/* Resultado Alvenaria */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Materiais para Levantamento</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-sm text-slate-400">Tijolos 8 Furos:</span>
                      <span className="text-base font-bold text-amber-400">{tijolosTotal} un ({(tijolosTotal/1000).toFixed(2)} milheiros)</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-sm text-slate-400">Cimento p/ Assentamento:</span>
                      <span className="text-base font-bold text-emerald-400">{sacosCimentoAlv} sacos (50kg)</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-sm text-slate-400">Areia Média:</span>
                      <span className="text-base font-bold text-cyan-400">{areiaM3Alv} m³</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleApplyAlvenaria}
                  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <Check className="w-5 h-5" /> Inserir no Pedido
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
