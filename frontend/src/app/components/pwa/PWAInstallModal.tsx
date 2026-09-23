'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, PlusSquare, Smartphone, CheckCircle2 } from 'lucide-react';
import { usePWA } from '../../contexts/PWAContext';

export default function PWAInstallModal() {
  const { showIOSInstructions, setShowIOSInstructions, isIOS } = usePWA();

  if (!showIOSInstructions) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowIOSInstructions(false)}
        />

        {/* Modal Card */}
        <motion.div
          className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 text-slate-900 dark:text-slate-100"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Instalar Aplicativo</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">HubObra no seu celular</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Vantagens */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 mb-5 border border-slate-100 dark:border-slate-800 text-xs space-y-2 text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Acesso rápido direto da tela inicial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Carregamento instantâneo e menor consumo de dados</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Experiência em tela cheia como um app nativo</span>
            </div>
          </div>

          {/* Instruções */}
          <div className="space-y-3.5">
            {isIOS ? (
              <>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Como instalar no iPhone / iPad (Safari):
                </p>
                
                <div className="flex items-start gap-3 p-3 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                  <div className="w-7 h-7 rounded-xl bg-orange-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </div>
                  <div className="text-xs leading-relaxed">
                    Toque no botão <strong className="text-orange-600 dark:text-orange-400 inline-flex items-center gap-1 font-semibold"><Share className="w-3.5 h-3.5 inline" /> Compartilhar</strong> na barra inferior do Safari.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                  <div className="w-7 h-7 rounded-xl bg-orange-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </div>
                  <div className="text-xs leading-relaxed">
                    Role a lista para baixo e toque em <strong className="text-orange-600 dark:text-orange-400 inline-flex items-center gap-1 font-semibold"><PlusSquare className="w-3.5 h-3.5 inline" /> Adicionar à Tela de Início</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                  <div className="w-7 h-7 rounded-xl bg-orange-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </div>
                  <div className="text-xs leading-relaxed">
                    Toque em <strong>Adicionar</strong> no canto superior direito para concluir.
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Como instalar no seu navegador:
                </p>
                <div className="p-4 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 text-xs leading-relaxed space-y-2">
                  <p>1. Clique no ícone de <strong>instalação na barra de endereços</strong> do seu navegador (ícone de computador com seta ou monitor).</p>
                  <p>2. Ou abra o <strong>menu do navegador (⋮)</strong> e selecione <strong>&quot;Instalar aplicativo&quot;</strong> ou <strong>&quot;Adicionar à tela inicial&quot;</strong>.</p>
                </div>
              </>
            )}
          </div>

          {/* Botão Entendi */}
          <button
            onClick={() => setShowIOSInstructions(false)}
            className="mt-6 w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold rounded-2xl text-sm transition-all shadow-md hover:shadow-orange-500/25"
          >
            Entendi, vou instalar
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
