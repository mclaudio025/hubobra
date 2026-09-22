'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export default function SearchBar({ 
  placeholder = "O que você está procurando?", 
  onSearch 
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else {
        router.push(`/busca?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const clearSearch = () => {
    setQuery('');
    setIsExpanded(false);
  };

  return (
    <form onSubmit={handleSearch} className="relative flex-1 max-w-2xl">
      <div className={`relative transition-all duration-200 ${isExpanded ? 'scale-105' : ''}`}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          onBlur={() => setIsExpanded(false)}
          placeholder={placeholder}
          className="w-full h-12 pl-4 pr-20 text-gray-900 bg-white border-2 border-gray-200 rounded-full focus:border-orange-500 focus:outline-none transition-colors"
        />
        
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full transition-colors"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>

      {/* Sugestões de busca (implementar depois) */}
      {isExpanded && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <p className="text-sm text-gray-500">Sugestões aparecerão aqui...</p>
          </div>
        </div>
      )}
    </form>
  );
}
