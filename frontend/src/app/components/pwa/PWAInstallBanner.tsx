'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, X, Sparkles } from 'lucide-react';
import { usePWA } from '../../contexts/PWAContext';

export default function PWAInstallBanner() {
  const { isInstallable, isInstalled, isBannerDismissed, installPWA, dismissBanner } = usePWA();

  if (!isInstallable || isInstalled || isBannerDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40 bg-slate-900/95 text-white backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-700/60"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/30">
            <Smartphone className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm text-slate-100">Instalar App HubObra</h4>
              <span className="text-[10px] bg-orange-500/30 text-orange-400 font-semibold px-1.5 py-0.2 rounded border border-orange-500/40">
                Mais Rápido
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Tenha acesso direto da tela inicial, cotações rápidas e compras sem travar.
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => installPWA()}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-xs py-1.5 px-3.5 rounded-xl transition-all shadow-md shadow-orange-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar Agora</span>
              </button>
              <button
                onClick={dismissBanner}
                className="text-xs text-slate-400 hover:text-slate-200 py-1.5 px-2.5 transition-colors"
              >
                Agora não
              </button>
            </div>
          </div>

          <button
            onClick={dismissBanner}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
