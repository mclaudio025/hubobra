'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  UtensilsCrossed, 
  Grid, 
  Bath, 
  Paintbrush, 
  Home, 
  Zap, 
  Lightbulb, 
  Hammer, 
  Droplets, 
  Wrench, 
  Shield, 
  DoorOpen, 
  Flower2, 
  Package
} from 'lucide-react';

export interface DepartmentItem {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

interface DepartmentIconCarouselProps {
  categories?: DepartmentItem[];
  activeSlug?: string;
}

// Map category names / slugs to matching line-art icons
function getCategoryIcon(name: string, slug: string) {
  const s = (slug || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (s.includes('cozinha') || n.includes('cozinha')) return UtensilsCrossed;
  if (s.includes('piso') || s.includes('ceramica') || s.includes('revestimento') || n.includes('cerâmica') || n.includes('piso')) return Grid;
  if (s.includes('banheiro') || n.includes('banheiro') || s.includes('sanitari')) return Bath;
  if (s.includes('tinta') || s.includes('verniz') || s.includes('pintura') || n.includes('tinta')) return Paintbrush;
  if (s.includes('utilidade') || n.includes('utilidades') || s.includes('casa')) return Home;
  if (s.includes('eletric') || n.includes('elétrica') || s.includes('fios')) return Zap;
  if (s.includes('iluminac') || n.includes('iluminação') || s.includes('lampada')) return Lightbulb;
  if (s.includes('construc') || s.includes('cimento') || s.includes('argamassa') || n.includes('material')) return Hammer;
  if (s.includes('hidraul') || n.includes('hidráulica') || s.includes('tubo')) return Droplets;
  if (s.includes('ferramenta') || s.includes('ferrag') || n.includes('ferramenta')) return Wrench;
  if (s.includes('seguranca') || s.includes('comunic') || n.includes('segurança')) return Shield;
  if (s.includes('porta') || s.includes('janela') || n.includes('esquadria')) return DoorOpen;
  if (s.includes('jardim') || s.includes('lazer') || n.includes('jardim')) return Flower2;
  
  return Package;
}

const DEFAULT_DEPARTMENTS: DepartmentItem[] = [
  { id: '1', name: 'Cozinha', slug: 'cozinha' },
  { id: '2', name: 'Cerâmica', slug: 'pisos-e-revestimentos' },
  { id: '3', name: 'Banheiro', slug: 'banheiro' },
  { id: '4', name: 'Tintas', slug: 'tintas-e-vernizes' },
  { id: '5', name: 'Utilidades', slug: 'utilidades' },
  { id: '6', name: 'Elétrica', slug: 'eletrica' },
  { id: '7', name: 'Iluminação', slug: 'iluminacao' },
  { id: '8', name: 'Material de Construção', slug: 'cimento-e-argamassa' },
  { id: '9', name: 'Hidráulica', slug: 'hidraulica' },
  { id: '10', name: 'Ferramentas', slug: 'ferramentas' },
  { id: '11', name: 'Segurança e Comunicação', slug: 'seguranca-e-comunicacao' },
];

export default function DepartmentIconCarousel({ categories = [], activeSlug }: DepartmentIconCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Combine fetched categories with standard ones, removing duplicates by slug
  const displayCategories: DepartmentItem[] = (() => {
    const list = categories.length > 0 ? categories : DEFAULT_DEPARTMENTS;
    const seen = new Set<string>();
    const result: DepartmentItem[] = [];
    
    for (const cat of list) {
      const normalizedSlug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
      if (!seen.has(normalizedSlug)) {
        seen.add(normalizedSlug);
        result.push({
          ...cat,
          slug: normalizedSlug
        });
      }
    }

    // If active slug is not in list, add it
    if (activeSlug && !seen.has(activeSlug)) {
      result.unshift({
        id: 'active',
        name: activeSlug.replace(/-/g, ' ').toUpperCase(),
        slug: activeSlug
      });
    }

    return result;
  })();

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 350;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative w-full bg-white border-b border-gray-200 py-4 px-2 sm:px-6">
      <div className="max-w-7xl mx-auto relative flex items-center">
        {/* Left Arrow */}
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-0 z-10 p-1.5 rounded-full bg-white border border-gray-300 text-gray-700 shadow-sm hover:bg-gray-50 hover:text-black transition -translate-x-1 sm:-translate-x-3 focus:outline-none"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-6 sm:gap-10 overflow-x-auto scrollbar-none scroll-smooth px-8 py-1 w-full justify-start md:justify-center"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayCategories.map((cat) => {
            const Icon = getCategoryIcon(cat.name, cat.slug);
            const isActive = activeSlug === cat.slug;

            return (
              <Link
                key={cat.id || cat.slug}
                href={`/categoria/${cat.slug}`}
                className={`flex flex-col items-center justify-center min-w-[76px] sm:min-w-[90px] group transition-all duration-200 text-center ${
                  isActive 
                    ? 'text-black font-extrabold scale-105' 
                    : 'text-gray-700 hover:text-[#009de0]'
                }`}
              >
                <div 
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-1.5 transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-50 border-2 border-[#009de0] text-[#009de0] shadow-sm' 
                      : 'bg-gray-50 border border-gray-200 text-gray-800 group-hover:bg-blue-50/50 group-hover:border-[#009de0] group-hover:text-[#009de0]'
                  }`}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.6]" />
                </div>
                <span className={`text-[11px] sm:text-xs uppercase tracking-tight line-clamp-2 leading-tight ${
                  isActive ? 'text-black font-extrabold border-b-2 border-[#009de0] pb-0.5' : 'text-gray-800 group-hover:text-[#009de0]'
                }`}>
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-0 z-10 p-1.5 rounded-full bg-white border border-gray-300 text-gray-700 shadow-sm hover:bg-gray-50 hover:text-black transition translate-x-1 sm:translate-x-3 focus:outline-none"
          aria-label="Próximo"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
