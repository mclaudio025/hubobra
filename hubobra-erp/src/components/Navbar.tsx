import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShoppingCart,
  Calculator,
  Package,
  Users,
  DollarSign,
  FileCheck,
  Printer,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  HardHat,
  Receipt,
  Layers,
  Smartphone,
  Boxes,
  Shield,
  LogOut,
  User,
  TrendingUp,
} from 'lucide-react';
import { syncService, SyncStatus } from '../services/syncService';
import { SystemUser } from './UserManagementView';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingOrdersCount: number;
  currentUser: SystemUser | null;
  onLogout: () => void;
  onToggleChatwoot: () => void;
  isChatwootOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  pendingOrdersCount,
  currentUser,
  onLogout,
  onToggleChatwoot,
  isChatwootOpen,
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    lastSyncTime: null,
    isSyncing: false,
  });

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const unsub = syncService.subscribe(setSyncStatus);
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const handleSyncNow = async () => {
    await syncService.triggerSync();
  };

  const allNavItems = [
    { id: 'VENDEDOR_PEDIDOS', label: 'Balcão Vendedor', icon: FileText, hotkey: 'F4' },
    { id: 'VENDEDOR_MOBILE', label: 'App Vendedor Mobile', icon: Smartphone, highlight: true },
    { id: 'COMPRAS', label: 'Compras & Cotação', icon: TrendingUp, highlight: true },
    { id: 'CAIXA_CENTRAL', label: 'Caixa Central', icon: DollarSign, badge: pendingOrdersCount },
    { id: 'EXPEDICAO_DIGITAL', label: 'Expedição Galpão', icon: Boxes },
    { id: 'IMPRESSORAS', label: 'Impressoras & 3 Vias', icon: Printer },
    { id: 'USUARIOS_ADMIN', label: 'Administração & Permissões', icon: Shield },
    { id: 'PDV_RAPIDO', label: 'PDV Supermercado', icon: ShoppingCart, hotkey: 'F1' },
    { id: 'CALCULADORA', label: 'Cálculo de Obras', icon: Calculator },
    { id: 'PRODUTOS', label: 'Estoque', icon: Package },
    { id: 'CLIENTES', label: 'Clientes', icon: Users },
    { id: 'FISCAL', label: 'Fiscal NFC-e', icon: FileCheck },
    { id: 'CONFIG', label: 'Configurações', icon: Settings },
  ];

  // Filtro rigoroso baseado nas permissões configuradas pelo Administrador
  const allowedNavItems = allNavItems.filter((item) => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    const allowed = currentUser.permissions?.allowedTabs || [];
    return allowed.includes(item.id);
  });

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white select-none sticky top-0 z-40">
      {/* Top Status Bar */}
      <div className="bg-slate-950 px-4 py-1.5 flex items-center justify-between border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-black text-amber-500">
            <HardHat className="w-4 h-4" />
            <span>HUBOBRA ERP • LOCAL-FIRST</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Filial: <strong className="text-slate-200">1 - Dep. São José</strong></span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Servidor: <strong className="text-emerald-400">192.168.1.100 (OK)</strong></span>
        </div>

        {/* User Logged Info & Logout Button */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  currentUser.role === 'ADMIN'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : currentUser.role === 'COMPRADOR'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : currentUser.role === 'VENDEDOR'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : currentUser.role === 'CAIXA'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}
              >
                {currentUser.code}
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-white block leading-none">{currentUser.name}</span>
                <span className="text-[9px] text-amber-400 font-mono leading-none">{currentUser.role}</span>
              </div>
              <button
                onClick={onLogout}
                className="ml-2 p-1 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                title="Trocar de Usuário / Sair"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Botão de Acesso Rápido ao Chatwoot / WhatsApp */}
          <button
            type="button"
            onClick={onToggleChatwoot}
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              isChatwootOpen
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
            title="Abrir Atendimento WhatsApp Chatwoot (Alt+W)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>WhatsApp (Alt+W)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <span className="font-mono text-slate-400 text-xs">{currentTime}</span>

          <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-slate-800 bg-slate-900 text-xs">
            {syncStatus.isOnline ? (
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Wifi className="w-3.5 h-3.5" />
                <span>Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSyncNow}
            disabled={syncStatus.isSyncing || !syncStatus.isOnline}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors disabled:opacity-40"
            title="Sincronizar com Nuvem"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isSyncing ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Nav Tabs filtradas dinamicamente */}
      <div className="px-3 flex items-center justify-between overflow-x-auto py-1.5 scrollbar-none">
        <div className="flex items-center gap-1">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 relative ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : item.highlight
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
                {item.hotkey && (
                  <span className={`px-1 rounded text-[10px] ${isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {item.hotkey}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
