'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Trash2, 
  ArrowLeft, 
  RefreshCw, 
  Sparkles, 
  Tag, 
  MessageSquareQuote, 
  CheckCircle2, 
  Users,
  MessageCircle,
  Zap,
  Volume2
} from 'lucide-react';

interface ConstructionTerm {
  id: string;
  slang_term: string;
  official_term: string;
  category: string;
  explanation: string;
  target_sku: string | null;
  usage_count: number;
  created_at: string;
}

interface RegionalExpression {
  id: string;
  expression: string;
  usage_context: string;
  tone_impact: string;
  example_phrase: string;
  is_active: boolean;
  created_at: string;
}

const SUPABASE_URL = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

export default function DicionarioPage() {
  const [activeTab, setActiveTab] = useState<'termos' | 'expressoes'>('termos');
  
  // Terms State
  const [terms, setTerms] = useState<ConstructionTerm[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showTermModal, setShowTermModal] = useState(false);
  const [savingTerm, setSavingTerm] = useState(false);

  // Term Form State
  const [slang, setSlang] = useState('');
  const [official, setOfficial] = useState('');
  const [category, setCategory] = useState('Hidráulica');
  const [explanation, setExplanation] = useState('');

  // Expressions / Dialogues State
  const [expressions, setExpressions] = useState<RegionalExpression[]>([]);
  const [loadingExpressions, setLoadingExpressions] = useState(true);
  const [searchExpr, setSearchExpr] = useState('');
  const [showExprModal, setShowExprModal] = useState(false);
  const [savingExpr, setSavingExpr] = useState(false);

  // Expression Form State
  const [exprTitle, setExprTitle] = useState('');
  const [exprContext, setExprContext] = useState('Diálogo Modelo - Pergunta de Produto e Fechamento Rápido');
  const [exprTone, setExprTone] = useState('');
  const [exprDialogue, setExprDialogue] = useState('');

  const loadTerms = async () => {
    setLoadingTerms(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ai_construction_terms?select=*&order=slang_term.asc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTerms(data);
      }
    } catch (err) {
      console.error('Erro ao buscar termos:', err);
    } finally {
      setLoadingTerms(false);
    }
  };

  const loadExpressions = async () => {
    setLoadingExpressions(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ai_regional_expressions?select=*&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setExpressions(data);
      }
    } catch (err) {
      console.error('Erro ao buscar expressões:', err);
    } finally {
      setLoadingExpressions(false);
    }
  };

  useEffect(() => {
    loadTerms();
    loadExpressions();
  }, []);

  const handleAddTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slang || !official) return;

    setSavingTerm(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ai_construction_terms?on_conflict=slang_term`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify({
          slang_term: slang.toLowerCase().trim(),
          official_term: official.trim(),
          category: category,
          explanation: explanation.trim(),
          updated_at: new Date().toISOString()
        })
      });

      if (res.ok) {
        setSlang('');
        setOfficial('');
        setExplanation('');
        setShowTermModal(false);
        await loadTerms();
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar termo.');
    } finally {
      setSavingTerm(false);
    }
  };

  const handleDeleteTerm = async (id: string, termName: string) => {
    if (!confirm(`Remover "${termName}" do dicionário da IA?`)) return;

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ai_construction_terms?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });

      if (res.ok) {
        setTerms(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('Erro ao deletar termo:', err);
    }
  };

  const handleAddExpression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exprTitle || !exprDialogue) return;

    setSavingExpr(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ai_regional_expressions`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          expression: exprTitle.trim(),
          usage_context: exprContext.trim(),
          tone_impact: exprTone.trim() || 'Resposta cearense humanizada e ágil.',
          example_phrase: exprDialogue.trim(),
          is_active: true
        })
      });

      if (res.ok) {
        setExprTitle('');
        setExprTone('');
        setExprDialogue('');
        setShowExprModal(false);
        await loadExpressions();
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar expressão/diálogo.');
    } finally {
      setSavingExpr(false);
    }
  };

  const handleDeleteExpression = async (id: string, exprName: string) => {
    if (!confirm(`Remover "${exprName}" dos diálogos da IA?`)) return;

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ai_regional_expressions?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });

      if (res.ok) {
        setExpressions(prev => prev.filter(e => e.id !== id));
      }
    } catch (err) {
      console.error('Erro ao deletar expressão:', err);
    }
  };

  const handleToggleExpression = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ai_regional_expressions?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
      });

      if (res.ok) {
        setExpressions(prev => prev.map(e => e.id === id ? { ...e, is_active: !currentStatus } : e));
      }
    } catch (err) {
      console.error('Erro ao alternar status:', err);
    }
  };

  const categories = ['Todas', ...Array.from(new Set(terms.map(t => t.category)))];

  const filteredTerms = terms.filter(t => {
    const matchesSearch = t.slang_term.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.official_term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.explanation && t.explanation.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'Todas' || t.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const filteredExpressions = expressions.filter(e => {
    return e.expression.toLowerCase().includes(searchExpr.toLowerCase()) ||
           e.usage_context.toLowerCase().includes(searchExpr.toLowerCase()) ||
           e.example_phrase.toLowerCase().includes(searchExpr.toLowerCase()) ||
           (e.tone_impact && e.tone_impact.toLowerCase().includes(searchExpr.toLowerCase()));
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link 
              href="/admin/ia" 
              className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar ao Hub de IA
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-400" />
              Dicionário Cearense & Expressões de Atendimento
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Gírias de materiais e diálogos reais de atendimento que a Lia e o Zé da Obra usam no WhatsApp da loja.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/admin/ia/treinadores"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200 rounded-xl transition-all border border-slate-700"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              Ver Treinadores
            </Link>
            
            {activeTab === 'termos' ? (
              <button 
                onClick={() => setShowTermModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 font-semibold text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                Nova Gíria de Material
              </button>
            ) : (
              <button 
                onClick={() => setShowExprModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-semibold text-white rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                Novo Diálogo / Expressão
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 mt-6 border-b border-slate-800 pb-1">
          <button
            onClick={() => setActiveTab('termos')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-t-xl text-sm font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'termos'
                ? 'bg-slate-800 text-blue-400 border-blue-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Tag className="w-4 h-4" />
            🔨 Dicionário de Materiais & Gírias ({terms.length})
          </button>
          <button
            onClick={() => setActiveTab('expressoes')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-t-xl text-sm font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'expressoes'
                ? 'bg-slate-800 text-emerald-400 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <MessageSquareQuote className="w-4 h-4" />
            💬 Expressões & Diálogos no Atendimento ({expressions.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        {activeTab === 'termos' ? (
          <>
            {/* Filters and Search Bar for Terms */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por gíria (ex: rabicho, cotovelo, mangueira amarela)..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Terms Table */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="p-5 border-b border-slate-700/60 flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2 text-slate-200">
                  <Tag className="w-5 h-5 text-blue-400" />
                  Gírias & Materiais Mapeados ({filteredTerms.length})
                </h2>
                <button 
                  onClick={loadTerms}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Recarregar"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingTerms ? 'animate-spin text-blue-400' : ''}`} />
                </button>
              </div>

              {loadingTerms ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mb-3" />
                  Carregando dicionário da IA...
                </div>
              ) : filteredTerms.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  Nenhuma gíria encontrada com os filtros atuais.
                </div>
              ) : (
                <div className="divide-y divide-slate-700/40">
                  {filteredTerms.map(item => (
                    <div 
                      key={item.id}
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-emerald-400 text-lg font-mono">
                            "{item.slang_term}"
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700/80 text-slate-300 font-medium">
                            {item.category}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                          <span className="text-slate-400 font-normal">Produto Oficial:</span>
                          {item.official_term}
                        </p>

                        {item.explanation && (
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {item.explanation}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          onClick={() => handleDeleteTerm(item.id, item.slang_term)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Excluir do dicionário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Filters and Search Bar for Expressions & Dialogues */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por diálogo, expressão (ex: oxi, cuida, fita de isolar, só o filé)..."
                  value={searchExpr}
                  onChange={e => setSearchExpr(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Expressions & Dialogues Cards */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="p-5 border-b border-slate-700/60 flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2 text-slate-200">
                  <MessageSquareQuote className="w-5 h-5 text-emerald-400" />
                  Exemplos Reais de Diálogo & Expressões Cearenses ({filteredExpressions.length})
                </h2>
                <button 
                  onClick={loadExpressions}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Recarregar"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingExpressions ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              </div>

              {loadingExpressions ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
                  Carregando expressões e diálogos...
                </div>
              ) : filteredExpressions.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  Nenhum diálogo ou expressão cadastrado.
                </div>
              ) : (
                <div className="divide-y divide-slate-700/40">
                  {filteredExpressions.map(item => (
                    <div 
                      key={item.id}
                      className={`p-6 flex flex-col gap-4 hover:bg-slate-800/60 transition-colors ${!item.is_active ? 'opacity-50' : ''}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-emerald-300 text-lg">
                            {item.expression}
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                            {item.usage_context}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 self-end md:self-center">
                          <button
                            onClick={() => handleToggleExpression(item.id, item.is_active)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              item.is_active
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {item.is_active ? '● Ativo no Prompt' : '○ Desativado'}
                          </button>
                          <button
                            onClick={() => handleDeleteExpression(item.id, item.expression)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Excluir expressão"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Dialogue Box Preview */}
                      <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 font-mono text-xs md:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                        {item.example_phrase}
                      </div>

                      {item.tone_impact && (
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span><strong>Impacto / Estratégia:</strong> {item.tone_impact}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal Nova Gíria de Material */}
      {showTermModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" />
              Adicionar Nova Gíria de Material
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Ensine a Lia a reconhecer como o pedreiro ou cliente pede esse material.
            </p>

            <form onSubmit={handleAddTerm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Gíria / Como o cliente fala
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: rabicho de pia, mangueira amarela"
                  value={slang}
                  onChange={e => setSlang(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Produto Oficial no Catálogo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Engate Flexível Inox 40cm"
                  value={official}
                  onChange={e => setOfficial(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="Hidráulica">Hidráulica</option>
                  <option value="Elétrica">Elétrica</option>
                  <option value="Ferragens">Ferragens</option>
                  <option value="Alvenaria">Alvenaria</option>
                  <option value="Pintura">Pintura</option>
                  <option value="Ferramentas">Ferramentas</option>
                  <option value="Acabamento">Acabamento</option>
                  <option value="Impermeabilização">Impermeabilização</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Explicação / Onde é usado (Opcional)
                </label>
                <textarea
                  placeholder="Ex: Ligação de água da parede para torneira de lavatório"
                  value={explanation}
                  onChange={e => setExplanation(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500 h-20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTermModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingTerm}
                  className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingTerm ? 'Salvando...' : 'Salvar Gíria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Diálogo / Expressão Cearense */}
      {showExprModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <MessageSquareQuote className="w-5 h-5 text-emerald-400" />
              Novo Diálogo Modelo / Expressão Cearense
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Ensine a Lia como conduzir uma conversa com naturalidade, agilidade e sotaque de balcão no Ceará.
            </p>

            <form onSubmit={handleAddExpression} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Expressão / Título do Diálogo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Oxi, tem sim! / Qual tu quer? / Cuida que já coloco"
                  value={exprTitle}
                  onChange={e => setExprTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Contexto / Situação da Conversa
                </label>
                <select
                  value={exprContext}
                  onChange={e => setExprContext(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="Diálogo Modelo - Pergunta de Produto e Fechamento Rápido">Diálogo Modelo - Pergunta de Produto e Fechamento Rápido</option>
                  <option value="Diálogo Modelo - Balcão Rápido e Opções de Medida">Diálogo Modelo - Balcão Rápido e Opções de Medida</option>
                  <option value="Diálogo Modelo - Levantamento de Orçamento">Diálogo Modelo - Levantamento de Orçamento</option>
                  <option value="Diálogo Modelo - Zé da Obra / Cálculo Técnico">Diálogo Modelo - Zé da Obra / Cálculo Técnico</option>
                  <option value="Acolhimento / Saudação Cearense">Acolhimento / Saudação Cearense</option>
                  <option value="Fechamento e Envio do Pedido">Fechamento e Envio do Pedido</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Exemplo Completo da Conversa (Cliente vs Lia)
                </label>
                <textarea
                  required
                  placeholder={`Exemplo:\nCliente: oi lia, tu tem fita de isolar fio?\nLia: Oxi, tem sim! Tenho fita isolante imperial de 5 e de 10 metros, qual tu quer?\nCliente: quero uma de 10 metros.\nLia: A fita de 10 tá 8 reais, cuida que já coloco no teu pedido.`}
                  value={exprDialogue}
                  onChange={e => setExprDialogue(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500 h-32 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Impacto / Estratégia de Venda (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Oferecer tamanhos com naturalidade e fechar direto no pedido"
                  value={exprTone}
                  onChange={e => setExprTone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExprModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingExpr}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingExpr ? 'Salvando...' : 'Salvar Diálogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

