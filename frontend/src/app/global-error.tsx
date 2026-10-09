'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Fatal Error captured by Next.js GlobalError:', error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-800/90 border border-slate-700 rounded-2xl p-8 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">HubObra - Recuperação do Sistema</h1>
            <p className="text-sm text-slate-300">
              Ocorreu uma instabilidade inesperada na interface. Clique abaixo para restaurar a sessão com segurança.
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-slate-400 bg-slate-950/60 py-1 px-3 rounded-lg inline-block">
                ID do Erro: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold rounded-xl transition cursor-pointer"
            >
              Recarregar Aplicação
            </button>
            <a
              href="/"
              className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-xl transition"
            >
              Voltar para a Página Inicial
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
