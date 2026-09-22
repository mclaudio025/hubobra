'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MobileSearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

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
        className="md:hidden p-2 text-gray-600 hover:text-orange-500 transition-colors"
        aria-label="Buscar"
      >
        <Search className="h-6 w-6" />
      </button>

      {/* Mobile Search Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={closeSearch}
          />
          
          {/* Search Panel */}
          <div className="fixed top-0 left-0 right-0 bg-white shadow-lg">
            <div className="p-4">
              <div className="flex items-center gap-4">
                <form onSubmit={handleSearch} className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="O que você está procurando?"
                      className="w-full h-12 pl-4 pr-12 text-gray-900 bg-gray-100 border-2 border-gray-200 rounded-full focus:border-orange-500 focus:outline-none transition-colors"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full transition-colors"
                    >
                      <Search className="h-5 w-5" />
                    </button>
                  </div>
                </form>
                
                <button
                  onClick={closeSearch}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  aria-label="Fechar busca"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Quick Search Suggestions */}
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Buscar por:</p>
                <div className="flex flex-wrap gap-2">
                  {['Ferramentas', 'Parafusos', 'Tintas', 'Cimento', 'Elétricos'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setQuery(suggestion);
                        router.push(`/busca?q=${encodeURIComponent(suggestion)}`);
                        closeSearch();
                      }}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-orange-100 hover:text-orange-700 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
