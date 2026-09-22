'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileSearchBar() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/busca?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  const closeSearch = () => {
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      {/* Search Button - Visible only on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-700 dark:text-slate-200 hover:text-orange-500 dark:hover:text-orange-400 transition-colors rounded-xl active:bg-slate-100 dark:active:bg-slate-800"
        aria-label="Buscar produtos"
      >
        <Search className="h-6 w-6" />
      </button>

      {/* Mobile Search Overlay via Portal */}
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
                onClick={closeSearch}
              />
              
              {/* Search Panel */}
              <motion.div 
                className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xl z-[100000] p-4"
                initial={{ y: '-100%' }}
                animate={{ y: 0 }}
                exit={{ y: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              >
                <div className="flex items-center gap-3">
                  <form onSubmit={handleSearch} className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="O que sua obra precisa hoje?"
                        className="w-full h-11 pl-4 pr-11 text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="absolute right-1.5 top-1/2 transform -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white p-1.5 rounded-lg transition-colors"
                        aria-label="Pesquisar"
                      >
                        <Search className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                  
                  <button
                    onClick={closeSearch}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Fechar busca"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Quick Search Suggestions */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-400 mb-2">Buscas frequentes:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Cimento CP II', 'Tijolo 8 Furos', 'Tinta Acrílica', 'Fio 2.5mm', 'Tubo PVC 100mm', 'Furadeira', 'Porcelanato'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setQuery(suggestion);
                          router.push(`/busca?q=${encodeURIComponent(suggestion)}`);
                          closeSearch();
                        }}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 border border-slate-200 dark:border-slate-700 rounded-lg text-xs transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
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
