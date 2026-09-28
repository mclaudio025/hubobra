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
  CheckCircle2,
  Users
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

const SUPABASE_URL = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

export default function DicionarioPage() {
  const [terms, setTerms] = useState<ConstructionTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [slang, setSlang] = useState('');
  const [official, setOfficial] = useState('');
  const [category, setCategory] = useState('Hidráulica');
  const [explanation, setExplanation] = useState('');

  const loadTerms = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTerms();
  }, []);

  const handleAddTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slang || !official) return;

    setSaving(true);
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
        setShowModal(false);
        await loadTerms();
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar termo.');
    } finally {
      setSaving(false);
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

  const categories = ['Todas', ...Array.from(new Set(terms.map(t => t.category)))];

  const filteredTerms = terms.filter(t => {
    const matchesSearch = t.slang_term.toLowerCase().includes(search.toLowerCase()) || 
                          t.official_term.toLowerCase().includes(search.toLowerCase()) ||
                          (t.explanation && t.explanation.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCategory === 'Todas' || t.category === selectedCategory;
    return matchesSearch && matchesCat;
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
              Dicionário Cearense de Obra da Lia
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Termos, gírias e apelidos populares que a Lia e o Zé da Obra conhecem e traduzem instantaneamente para o catálogo real.
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
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 font-semibold text-white rounded-xl transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-5 h-5" />
              Nova Gíria / Apelido
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por gíria (ex: rabicho, cotovelo, mangueira amarela)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
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

        {/* Dictionary Table */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-5 border-b border-slate-700/60 flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-2 text-slate-200">
              <Tag className="w-5 h-5 text-blue-400" />
              Termos Mapeados ({filteredTerms.length})
            </h2>
            <button 
              onClick={loadTerms}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Recarregar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>

          {loading ? (
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
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
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
      </div>

      {/* Modal Nova Gíria */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" />
              Adicionar Nova Gíria de Obra
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
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar Gíria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
