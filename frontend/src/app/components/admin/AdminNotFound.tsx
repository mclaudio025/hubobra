'use client';

import Link from 'next/link';
import { ArrowLeft, Home, Search } from 'lucide-react';

interface AdminNotFoundProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
}

export default function AdminNotFound({
  title = "Página não encontrada",
  message = "A página que você está procurando não existe ou foi movida.",
  showBackButton = true
}: AdminNotFoundProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600 max-w-md mx-auto">{message}</p>
        </div>

        <div className="flex items-center justify-center gap-4">
          {showBackButton && (
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          )}

          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
