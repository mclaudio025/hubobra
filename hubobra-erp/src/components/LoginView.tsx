import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  HardHat,
  Laptop,
  Smartphone,
  Boxes,
  DollarSign,
  ArrowRight,
  Sparkles,
  Server,
  Wifi,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { SystemUser, DEFAULT_SYSTEM_USERS } from './UserManagementView';

interface LoginViewProps {
  onLoginSuccess: (user: SystemUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [users, setUsers] = useState<SystemUser[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('hubobra_system_users') : null;
    if (saved) {
      try {
        const parsed: SystemUser[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((u) => u.id));
        const missing = DEFAULT_SYSTEM_USERS.filter((du) => !existingIds.has(du.id));
        if (missing.length > 0) {
          const merged = [...parsed, ...missing];
          localStorage.setItem('hubobra_system_users', JSON.stringify(merged));
          return merged;
        }
        return parsed;
      } catch (e) {
        return DEFAULT_SYSTEM_USERS;
      }
    }
    return DEFAULT_SYSTEM_USERS;
  });

  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [loginCode, setLoginCode] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loginMode, setLoginMode] = useState<'QUICK_PIN' | 'USER_PASS'>('QUICK_PIN');

  // Ao selecionar um usuário para PIN rápido
  const handleSelectUser = (user: SystemUser) => {
    setSelectedUser(user);
    setPinInput('');
    setErrorMessage('');
  };

  const handlePinKeyPress = (digit: string) => {
    if (pinInput.length < 6) {
      const newPin = pinInput + digit;
      setPinInput(newPin);
      setErrorMessage('');
      // Auto autenticar se atingir 4 dígitos
      if (selectedUser && newPin.length === selectedUser.pin.length) {
        verifyPin(newPin, selectedUser);
      }
    }
  };

  const handlePinBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const verifyPin = (pin: string, user: SystemUser) => {
    if (pin === user.pin) {
      onLoginSuccess(user);
    } else {
      setErrorMessage('PIN incorreto. Tente novamente.');
      setPinInput('');
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const found = users.find(
      (u) =>
        (u.code.toLowerCase() === loginCode.trim().toLowerCase() ||
          u.name.toLowerCase().includes(loginCode.trim().toLowerCase())) &&
        u.pin === password.trim()
    );

    if (found) {
      onLoginSuccess(found);
    } else {
      setErrorMessage('Usuário ou senha/PIN inválidos.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 md:p-8 select-none font-sans relative overflow-hidden">
      {/* Background Decorativo Tecnológico */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header com Status da Rede Local & Servidor */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto w-full z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <HardHat className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              <span>HUBOBRA ERP</span>
              <span className="text-xs bg-amber-500/20 text-amber-400 font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                v2.6 Local-First
              </span>
            </h1>
            <p className="text-xs text-slate-400">Sistema Conectado • Depósito São José</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-2xl text-xs backdrop-blur-md">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <Server className="w-4 h-4" />
            <span>Servidor Local: 192.168.1.100 (Conectado)</span>
          </div>
        </div>
      </header>

      {/* Área Central de Login */}
      <main className="max-w-4xl mx-auto w-full my-auto py-6 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Coluna 1: Lista Rápida de Usuários / Seleção de Perfil */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-500" />
                  <span>Selecione seu Usuário</span>
                </h2>
                <p className="text-xs text-slate-400">Clique no seu nome para digitar o PIN rápido</p>
              </div>

              <div className="flex bg-slate-950 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => {
                    setLoginMode('QUICK_PIN');
                    setErrorMessage('');
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    loginMode === 'QUICK_PIN' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
                  }`}
                >
                  PIN Rápido
                </button>
                <button
                  onClick={() => {
                    setLoginMode('USER_PASS');
                    setSelectedUser(null);
                    setErrorMessage('');
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    loginMode === 'USER_PASS' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
                  }`}
                >
                  Código / Senha
                </button>
              </div>
            </div>

            {loginMode === 'QUICK_PIN' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {users.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : u.role === 'COMPRADOR'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : u.role === 'VENDEDOR'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : u.role === 'CAIXA'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          }`}
                        >
                          {u.code}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-white truncate max-w-[140px]">{u.name}</h3>
                          <span className="text-[10px] text-slate-400 font-mono uppercase">{u.role}</span>
                        </div>
                      </div>

                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-600'}`} />
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Formulário Manual de Login por Código e Senha */
              <form onSubmit={handleManualLogin} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-bold">Código do Usuário ou Nome</label>
                  <input
                    type="text"
                    value={loginCode}
                    onChange={(e) => setLoginCode(e.target.value)}
                    placeholder="Ex: 01, cx01 ou admin"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white font-semibold focus:outline-none focus:border-amber-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-bold">Senha / PIN</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 font-semibold">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Coluna 2: Teclado Numérico PIN para Tela Touch ou Clique Rápido */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            {selectedUser ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30 mb-2 font-black text-sm">
                    {selectedUser.code}
                  </div>
                  <h3 className="text-sm font-bold text-white">{selectedUser.name}</h3>
                  <p className="text-[11px] text-slate-400">
                    Acesso: <strong className="text-amber-400">{selectedUser.role}</strong>
                  </p>
                </div>

                {/* Mostrador de Dígitos do PIN */}
                <div className="flex justify-center gap-3 py-1">
                  {[0, 1, 2, 3].map((idx) => {
                    const filled = pinInput.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-4 h-4 rounded-full transition-all ${
                          filled ? 'bg-amber-400 scale-125 shadow-lg shadow-amber-400/30' : 'bg-slate-800'
                        }`}
                      ></div>
                    );
                  })}
                </div>

                {errorMessage && (
                  <p className="text-[11px] text-red-400 text-center font-bold bg-red-500/10 p-1.5 rounded-lg border border-red-500/20">
                    {errorMessage}
                  </p>
                )}

                {/* Teclado Numérico Touch */}
                <div className="grid grid-cols-3 gap-2 pt-1 max-w-[240px] mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        if (k === 'C') setPinInput('');
                        else if (k === '⌫') handlePinBackspace();
                        else handlePinKeyPress(k);
                      }}
                      className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-bold text-base active:scale-95 transition-all flex items-center justify-center shadow"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
                <KeyRound className="w-12 h-12 opacity-30 text-amber-500" />
                <p className="text-xs">
                  Selecione seu usuário na lista ao lado para desbloquear com seu PIN de 4 dígitos.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer com Explicação de Rede e Banco Central */}
      <footer className="max-w-5xl mx-auto w-full text-center text-xs text-slate-500 z-10 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-800/80 pt-4">
        <span>HubObra ERP Local-First • Terminal Conectado à Rede da Loja</span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-emerald-400">● Banco no Servidor Central</span>
          <span className="text-amber-400">● Cache 0ms no Terminal</span>
          <span className="text-cyan-400">● 100% Offline-Proof</span>
        </div>
      </footer>
    </div>
  );
};
