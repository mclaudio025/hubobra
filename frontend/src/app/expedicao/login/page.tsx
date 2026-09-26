'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Truck, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function ExpedicaoLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Informe seu e-mail de operador e sua senha de acesso.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loggedUser = await login(email, password);
      // Redireciona para o painel de expedição
      router.push('/expedicao');
    } catch (err: any) {
      console.error('Falha no login da expedição:', err);
      setError(
        err?.message || 'Credenciais inválidas. Verifique seu usuário e senha com o administrador da loja.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md">
        {/* Card Principal */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Topo / Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 shadow-lg shadow-orange-500/30 mb-4 ring-4 ring-orange-500/20">
              <Truck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Hub<span className="text-orange-500">Expedição</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Controle de Saída & Despacho de Mercadorias
            </p>
          </div>

          {/* Banner de Erro */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-200 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300">Falha de Autenticação</p>
                <p className="text-xs text-red-200/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 ml-1">
                E-mail ou Usuário do Operador
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operador@hubobra.com.br"
                  required
                  autoComplete="username"
                  className="w-full bg-slate-950/80 border border-slate-750 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-600 text-base transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 ml-1">
                Senha / PIN de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-950/80 border border-slate-750 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-600 text-base transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-[0.98] text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar no Galpão</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Dica de Segurança */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-500 text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Acesso restrito para equipe de logística e expedição.</span>
          </div>
        </div>
      </div>
    </main>
  );
}
