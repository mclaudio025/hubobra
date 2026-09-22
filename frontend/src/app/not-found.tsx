'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  HardHat, 
  Search, 
  Home, 
  Package, 
  MessageCircle, 
  ArrowLeft, 
  Wrench, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';

export default function NotFound() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/busca?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const popularCategories = [
    { name: 'Cimento & Argamassa', slug: 'cimento-e-argamassa' },
    { name: 'Tijolos & Blocos', slug: 'tijolos-e-blocos' },
    { name: 'Pisos & Revestimentos', slug: 'pisos-e-revestimentos' },
    { name: 'Tintas & Acessórios', slug: 'tintas' },
    { name: 'Ferramentas', slug: 'ferramentas' },
    { name: 'Hidráulica', slug: 'hidraulica' },
    { name: 'Elétrica', slug: 'eletrica' },
  ];

  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-slate-50 via-white to-orange-50/30 flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full text-center space-y-8">
        
        {/* Animated Badge & Construction Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute -inset-4 bg-orange-500/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-24 h-24 bg-gradient-to-tr from-slate-900 to-slate-800 rounded-3xl flex items-center justify-center shadow-xl border border-slate-700/50">
            <HardHat className="w-12 h-12 text-orange-500 animate-bounce" />
          </div>
          <span className="absolute -bottom-2 -right-2 bg-orange-600 text-white font-black text-xs px-2.5 py-1 rounded-full shadow">
            404
          </span>
        </div>

        {/* Headings */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Página em Reforma ou Não Encontrada
          </h1>
          <p className="text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
            Parece que o link que você acessou foi movido, digitado incorretamente ou ainda está em construção.
          </p>
        </div>

        {/* Integrated Search Bar */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto">
          <div className="relative flex items-center shadow-sm">
            <Search className="absolute left-4 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="O que você está procurando para a sua obra?"
              className="w-full pl-12 pr-28 py-3.5 bg-white rounded-2xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-sm text-slate-800 placeholder-slate-400 transition"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 bg-slate-900 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition duration-200"
            >
              Buscar
            </button>
          </div>
        </form>

        {/* Quick Category Chips */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Departamentos mais buscados:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {popularCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categoria/${cat.slug}`}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50/50 text-slate-700 transition shadow-2xs"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black rounded-xl shadow-lg shadow-orange-500/20 transition text-sm"
          >
            <Home className="w-4 h-4" />
            <span>Voltar ao Início</span>
          </Link>

          <Link
            href="/produtos"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold rounded-xl transition text-sm"
          >
            <Package className="w-4 h-4 text-orange-500" />
            <span>Ver Todos os Produtos</span>
          </Link>

          <a
            href="https://wa.me/5585999999999?text=Ol%C3%A1%2C%20estava%20navegando%20no%20HubConstru%C3%A7%C3%B5es%20e%20preciso%20de%20ajuda%20para%20encontrar%20um%20material."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-50 border border-emerald-300/60 hover:bg-emerald-100/60 text-emerald-700 font-bold rounded-xl transition text-sm"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Suporte WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
