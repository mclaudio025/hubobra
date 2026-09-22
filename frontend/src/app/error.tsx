'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  RotateCcw, 
  Home, 
  MessageCircle, 
  Wrench,
  HelpCircle
} from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console or error monitoring service (e.g. Sentry)
    console.error('Captured by Next.js Error Boundary:', error);
  }, [error]);

  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-slate-50 via-white to-red-50/20 flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full text-center space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl">
        
        {/* Animated Warning Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute -inset-3 bg-amber-500/20 rounded-full blur-lg animate-pulse" />
          <div className="relative w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-200">
            <AlertTriangle className="w-10 h-10 text-amber-600" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Imprevisto Técnico na Obra
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            Ocorreu uma instabilidade temporária ao carregar esta página. Nossa equipe já foi notificada e está trabalhando no reparo.
          </p>
          {error.digest && (
            <p className="text-[11px] font-mono text-slate-400 bg-slate-100 py-1 px-3 rounded-full inline-block">
              Código do erro: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black rounded-xl shadow-md transition text-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Tentar Novamente</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition text-sm"
          >
            <Home className="w-4 h-4" />
            <span>Ir para o Início</span>
          </Link>

          <a
            href="https://wa.me/5585999999999?text=Ol%C3%A1%2C%20encontrei%20um%20erro%20no%20site%20da%20HubConstru%C3%A7%C3%B5es%20e%20gostaria%20de%20ajuda."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl transition text-sm"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Falar no WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
