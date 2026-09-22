'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Grid3X3, X, Flame, Sparkles } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export default function MobileCategoryNav() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const categories: Category[] = [
    { id: '1', name: 'Ferramentas & Equipamentos', slug: 'ferramentas', description: 'Manuais e elétricas', icon: '🛠️' },
    { id: '2', name: 'Materiais de Construção', slug: 'materiais-construcao', description: 'Cimento, areia, blocos', icon: '🧱' },
    { id: '3', name: 'Elétricos & Iluminação', slug: 'eletricos', description: 'Fios, cabos e disjuntores', icon: '⚡' },
    { id: '4', name: 'Hidráulicos & Louças', slug: 'hidraulicos', description: 'Tubos, conexões e registros', icon: '🚿' },
    { id: '5', name: 'Tintas & Vernizes', slug: 'tintas-vernizes', description: 'Tintas, pincéis e complementos', icon: '🎨' },
    { id: '6', name: 'Pisos & Revestimentos', slug: 'pisos-revestimentos', description: 'Porcelanatos e pisos cerâmicos', icon: '🧊' },
    { id: '7', name: 'Segurança & EPIs', slug: 'seguranca', description: 'Capacetes, luvas e botinas', icon: '🦺' },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Category Button - Visible only on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-700 dark:text-slate-200 hover:text-orange-500 dark:hover:text-orange-400 transition-colors rounded-xl active:bg-slate-100 dark:active:bg-slate-800"
        aria-label="Ver categorias"
      >
        <Grid3X3 className="h-6 w-6" />
      </button>

      {/* Mobile Category Overlay via Portal */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[99999] md:hidden">
              {/* Backdrop */}
              <motion.div 
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsOpen(false)}
              />
              
              {/* Category Panel */}
              <motion.div 
                className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden z-[100000] border-t border-slate-200 dark:border-slate-800 flex flex-col"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Departamentos da Obra</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Encontre materiais por setor</p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Fechar categorias"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Categories List */}
                <div className="overflow-y-auto flex-1 p-4 space-y-2.5">
                  {/* Ver Todos os Produtos */}
                  <Link
                    href="/produtos"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between p-3.5 bg-orange-500/10 border border-orange-500/30 rounded-2xl hover:bg-orange-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🏗️</span>
                      <div>
                        <h4 className="font-bold text-sm text-orange-950 dark:text-orange-300">Todos os Produtos</h4>
                        <p className="text-xs text-orange-700 dark:text-orange-400">Ver catálogo completo de parceiros</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-orange-500" />
                  </Link>

                  {/* Categories */}
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/categoria/${category.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{category.icon}</span>
                        <div>
                          <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100">{category.name}</h4>
                          {category.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  ))}
                </div>

                {/* Quick Shortcuts */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/produtos"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-transform"
                    >
                      <Flame className="h-4 w-4" />
                      <span>Ofertas da Semana</span>
                    </Link>
                    
                    <Link
                      href="/produtos"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 p-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md active:scale-95 transition-transform"
                    >
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      <span>Mais Vendidos</span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
