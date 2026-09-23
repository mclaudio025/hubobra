'use client';

import React from 'react';
import { Download, Smartphone, Sparkles } from 'lucide-react';
import { usePWA } from '../../contexts/PWAContext';

interface PWAInstallButtonProps {
  variant?: 'header' | 'menu' | 'footer' | 'floating' | 'button';
  className?: string;
  showIfInstalled?: boolean;
}

export default function PWAInstallButton({
  variant = 'button',
  className = '',
  showIfInstalled = false,
}: PWAInstallButtonProps) {
  const { isInstalled, isInstallable, installPWA } = usePWA();

  // Não renderiza se já estiver instalado (a não ser que force)
  if (isInstalled && !showIfInstalled) {
    return null;
  }

  if (variant === 'header') {
    return (
      <button
        onClick={() => installPWA()}
        className={`flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold py-1.5 px-3 rounded-full transition-all shadow-sm hover:shadow-orange-500/25 active:scale-95 ${className}`}
        title="Instalar aplicativo HubObra"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Baixar App</span>
      </button>
    );
  }

  if (variant === 'menu') {
    return (
      <button
        onClick={() => installPWA()}
        className={`w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-500/20 hover:border-orange-500/40 text-left transition-all group ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Instalar Aplicativo</span>
              <span className="text-[10px] bg-orange-500 text-white font-bold px-1.5 py-0.2 rounded-full">Grátis</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Adicione à tela inicial do celular</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
          <Download className="w-4 h-4" />
        </div>
      </button>
    );
  }

  if (variant === 'footer') {
    return (
      <button
        onClick={() => installPWA()}
        className={`inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs py-2 px-4 rounded-xl border border-slate-700 transition-all hover:border-orange-500/50 ${className}`}
      >
        <Smartphone className="w-4 h-4 text-orange-400" />
        <span>Instalar App no Celular</span>
      </button>
    );
  }

  // Default variant
  return (
    <button
      onClick={() => installPWA()}
      className={`inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm py-2 px-4 rounded-xl transition-all shadow-md hover:shadow-orange-500/25 active:scale-95 ${className}`}
    >
      <Download className="w-4 h-4" />
      <span>Instalar Aplicativo</span>
    </button>
  );
}
