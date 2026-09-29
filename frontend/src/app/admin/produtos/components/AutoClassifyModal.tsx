'use client';

import { useState } from 'react';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Layers, 
  Loader2, 
  Check, 
  Info,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useApi } from '../../../hooks/useApi';
import { useToast } from '../../../components/ui/Toaster';

interface ClassificationResult {
  productId: string;
  productName: string;
  sku?: string;
  previousCategoryId?: string;
  previousCategoryName?: string;
  newCategoryId: string;
  newCategoryName: string;
  confidence: number;
  reason: string;
  changed: boolean;
}

interface AutoClassifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AutoClassifyModal({ isOpen, onClose, onSuccess }: AutoClassifyModalProps) {
  const { apiCall } = useApi();
  const { addToast } = useToast();

  const [mode, setMode] = useState<'all' | 'unclassified_only'>('all');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    totalAnalyzed: number;
    totalUpdated: number;
    totalUnchanged: number;
    changes: ClassificationResult[];
    summaryByCategory: Record<string, number>;
  } | null>(null);

  const [filterChangedOnly, setFilterChangedOnly] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const handleStartClassification = async () => {
    try {
      setIsRunning(true);
      setResults(null);

      const data = await apiCall('/categories/auto-classify', {
        method: 'POST',
        body: { mode, limit: 1000 },
        requireAuth: true,
      });

      setResults(data);
      addToast({
        type: 'success',
        title: 'Classificação concluída com sucesso!',
        message: `${data.totalUpdated} produto(s) foram reclassificados e organizados nas categorias corretas.`,
      });
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao auto-classificar:', error);
      addToast({
        type: 'error',
        title: 'Erro na classificação automática',
        message: error?.message || 'Ocorreu uma falha ao comunicar com o serviço de classificação.',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const filteredChanges = results?.changes.filter((c) => {
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchName = c.productName.toLowerCase().includes(q);
      const matchSku = c.sku?.toLowerCase().includes(q);
      const matchNewCat = c.newCategoryName.toLowerCase().includes(q);
      const matchPrevCat = c.previousCategoryName?.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchNewCat && !matchPrevCat) return false;
    }
    return true;
  }) || [];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-amber-300 shadow-inner">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Auto-Classificador Inteligente de Catálogo
              </h2>
              <p className="text-xs text-indigo-200/80">
                Organiza produtos automaticamente usando as descrições e itens cadastrados nas suas categorias
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition disabled:opacity-30"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!results && !isRunning && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 text-amber-900 text-sm flex gap-3 items-start">
                <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-950">Como funciona a classificação automática:</p>
                  <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                    O sistema analisa o nome, especificações e termos de cada produto e compara com as <strong>descrições detalhadas e listas de itens (bullet points •)</strong> que você preencheu nas categorias. Produtos incorretos serão automaticamente realocados para sua categoria correta.
                  </p>
                </div>
              </div>

              {/* Selection Mode */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-800 uppercase tracking-wider block">
                  Selecione o Escopo da Análise:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    onClick={() => setMode('all')}
                    className={`cursor-pointer rounded-xl p-4 border-2 transition-all flex flex-col justify-between ${
                      mode === 'all'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          mode === 'all' ? 'border-indigo-600 bg-indigo-600' : 'border-gray-400'
                        }`}>
                          {mode === 'all' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <span className="font-bold text-gray-900 text-sm">Revisar Todo o Catálogo</span>
                      </div>
                      <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Recomendado
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 pl-6.5 leading-relaxed">
                      Analisa todos os produtos. Corrige itens em categorias erradas (ex: lixas que estão em Pisos serão movidas para Acessórios de Pintura).
                    </p>
                  </div>

                  <div
                    onClick={() => setMode('unclassified_only')}
                    className={`cursor-pointer rounded-xl p-4 border-2 transition-all flex flex-col justify-between ${
                      mode === 'unclassified_only'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          mode === 'unclassified_only' ? 'border-indigo-600 bg-indigo-600' : 'border-gray-400'
                        }`}>
                          {mode === 'unclassified_only' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <span className="font-bold text-gray-900 text-sm">Apenas Sem Categoria</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 pl-6.5 leading-relaxed">
                      Classifica somente produtos que ainda não possuem nenhuma categoria associada.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Running State */}
          {isRunning && (
            <div className="py-16 text-center space-y-5">
              <div className="inline-flex items-center justify-center p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner animate-pulse">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Processando Catálogo...</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  Cruzando termos dos produtos com as descrições e itens das categorias. Por favor, aguarde alguns instantes...
                </p>
              </div>
              <div className="w-64 h-2 bg-gray-100 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 animate-[shimmer_2s_infinite] w-full" />
              </div>
            </div>
          )}

          {/* Results State */}
          {results && !isRunning && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Produtos Analisados</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">{results.totalAnalyzed}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">Reclassificados / Corrigidos</span>
                  <span className="text-2xl font-black text-emerald-700 mt-1 block">{results.totalUpdated}</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block">Já Estavam Corretos</span>
                  <span className="text-2xl font-black text-blue-700 mt-1 block">{results.totalUnchanged}</span>
                </div>
              </div>

              {/* Summary by Category */}
              {Object.keys(results.summaryByCategory).length > 0 && (
                <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                    Destino dos Produtos Movidos:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(results.summaryByCategory).map(([catName, count]) => (
                      <span key={catName} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 shadow-sm rounded-lg text-xs font-medium text-gray-800">
                        <span className="font-semibold text-indigo-600">+{count}</span>
                        <span>{catName}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Changes List / Table */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Histórico de Alterações Realizadas ({filteredChanges.length})
                  </h4>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Filtrar por nome ou categoria..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {filteredChanges.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-200 text-gray-500 text-sm">
                    {results.totalUpdated === 0 
                      ? "Todos os produtos analisados já estavam perfeitamente categorizados!" 
                      : "Nenhuma alteração encontrada com os filtros atuais."}
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 sticky top-0">
                        <tr>
                          <th className="p-3">Produto</th>
                          <th className="p-3">Categoria Anterior</th>
                          <th className="p-3">Nova Categoria</th>
                          <th className="p-3">Motivo / Correspondência</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredChanges.map((change) => (
                          <tr key={change.productId} className="hover:bg-indigo-50/30 transition">
                            <td className="p-3">
                              <p className="font-semibold text-gray-900">{change.productName}</p>
                              {change.sku && <p className="text-[10px] text-gray-400">SKU: {change.sku}</p>}
                            </td>
                            <td className="p-3">
                              <span className="text-gray-500 line-through">
                                {change.previousCategoryName || 'Sem Categoria'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/60">
                                <ArrowRight className="h-3 w-3 text-emerald-500" />
                                {change.newCategoryName}
                              </span>
                            </td>
                            <td className="p-3 text-gray-600">
                              <span className="text-[11px] leading-tight block">{change.reason}</span>
                              <span className="text-[9px] text-indigo-600 font-medium mt-0.5 block">
                                Confiança: {Math.round(change.confidence * 100)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isRunning}
            className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition disabled:opacity-50"
          >
            {results ? 'Fechar' : 'Cancelar'}
          </button>

          {!results && (
            <button
              onClick={handleStartClassification}
              disabled={isRunning}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  Iniciar Auto-Classificação
                </>
              )}
            </button>
          )}

          {results && (
            <button
              onClick={() => {
                onClose();
                onSuccess();
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all"
            >
              <Check className="h-4 w-4" />
              Concluir e Atualizar Tela
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
