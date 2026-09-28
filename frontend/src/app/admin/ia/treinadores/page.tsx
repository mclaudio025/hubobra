'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  UserPlus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  User, 
  ArrowLeft,
  RefreshCw,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface Trainer {
  id: string;
  phone: string;
  name: string;
  role: string;
  is_active: boolean;
  notes: string;
  created_at: string;
}

const SUPABASE_URL = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

export default function TreinadoresPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('trainer');
  const [notes, setNotes] = useState('');

  const loadTrainers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ai_trainers?select=*&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTrainers(data);
      }
    } catch (err) {
      console.error('Erro ao buscar treinadores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainers();
  }, []);

  const handleAddTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !name) return;

    setSaving(true);
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

      const res = await fetch(`${SUPABASE_URL}/rest/v1/ai_trainers?on_conflict=phone`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify({
          phone: formattedPhone,
          name: name.trim(),
          role: role,
          notes: notes.trim() || 'Cadastrado pelo Painel Web',
          is_active: true,
          updated_at: new Date().toISOString()
        })
      });

      if (res.ok) {
        setName('');
        setPhone('');
        setNotes('');
        setShowModal(false);
        await loadTrainers();
      } else {
        alert('Erro ao cadastrar treinador. Verifique o número.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (trainer: Trainer) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ai_trainers?id=eq.${trainer.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !trainer.is_active,
          updated_at: new Date().toISOString()
        })
      });

      if (res.ok) {
        setTrainers(prev => prev.map(t => t.id === trainer.id ? { ...t, is_active: !t.is_active } : t));
      }
    } catch (err) {
      console.error('Erro ao alternar status:', err);
    }
  };

  const handleDeleteTrainer = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover a autorização de ${name}?`)) return;

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ai_trainers?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });

      if (res.ok) {
        setTrainers(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('Erro ao deletar treinador:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10">
      {/* Top Header */}
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
              <Shield className="w-8 h-8 text-emerald-400" />
              Treinadores Autorizados da Lia
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Apenas os números cadastrados nesta lista têm permissão para ensinar novas gírias, apelidos de produtos e regras de obra via WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={loadTrainers}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              title="Recarregar lista"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-semibold text-slate-950 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              <UserPlus className="w-5 h-5" />
              Novo Treinador
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        {/* Info Card */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-800/60 to-slate-900/60 border border-emerald-500/20 rounded-2xl p-6 mb-8 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 mt-1">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-300 text-base">Como funciona o treinamento via WhatsApp:</h3>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                Qualquer pessoa desta lista pode mandar um <strong>áudio de voz</strong> ou texto para o WhatsApp da Lia dizendo:<br />
                <span className="text-emerald-400 font-mono text-xs bg-slate-950/80 px-2 py-1 rounded inline-block mt-2">
                  "Lia, anota aí: quando o cliente pedir 'mangueira de nível', o produto oficial é a 'Mangueira de Silicone Transparente 5/16'."
                </span>
                <br />
                A Lia processará a instrução, salvará no banco de dados e responderá confirmando em áudio no mesmo instante!
              </p>
            </div>
          </div>
        </div>

        {/* Trainers List */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-5 border-b border-slate-700/60 flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-2 text-slate-200">
              <User className="w-5 h-5 text-emerald-400" />
              Treinadores Cadastrados ({trainers.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
              Carregando lista de autorizações...
            </div>
          ) : trainers.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              Nenhum treinador cadastrado ainda. Clique em "Novo Treinador" para autorizar o primeiro número.
            </div>
          ) : (
            <div className="divide-y divide-slate-700/40">
              {trainers.map(trainer => (
                <div 
                  key={trainer.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                      trainer.role === 'master_trainer' 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {trainer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-semibold text-slate-100 text-base">{trainer.name}</h3>
                        {trainer.role === 'master_trainer' && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Master Admin
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          {trainer.phone}
                        </span>
                        {trainer.notes && <span>• {trainer.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <button
                      onClick={() => handleToggleActive(trainer)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        trainer.is_active
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                      }`}
                    >
                      {trainer.is_active ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Ativo
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-400" /> Inativo
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteTrainer(trainer.id, trainer.name)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Excluir autorização"
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

      {/* Modal Cadastro */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              Autorizar Novo Treinador
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              O número cadastrado poderá ditar gírias e regras diretamente para o WhatsApp da IA.
            </p>

            <form onSubmit={handleAddTrainer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Completo / Cargo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Balconista ou Mestre Raimundo"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  WhatsApp (com DDD)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 85999998888 ou 5585999998888"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nível de Permissão
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="trainer">Treinador Comercial (Ensina gírias e materiais)</option>
                  <option value="master_trainer">Master Trainer (Acesso total)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observações (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Vendedor experiente de materiais pesados"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
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
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar Treinador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
