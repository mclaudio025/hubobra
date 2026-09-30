'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useCategories } from '../hooks/useApi';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  icon?: string | null;
  _count?: {
    products: number;
  };
}

// Fotos padrão curadas para os 9 Departamentos Principais de materiais de construção
const categoryPhotos: Record<string, string> = {
  'construcao-e-alvenaria': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&auto=format&fit=crop&q=80',
  'hidraulica-e-encanamento': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=300&auto=format&fit=crop&q=80',
  'eletrica-e-energia': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300&auto=format&fit=crop&q=80',
  'tintas-e-pintura': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=300&auto=format&fit=crop&q=80',
  'ferramentas-maquinas-e-abrasivos': 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=300&auto=format&fit=crop&q=80',
  'pisos-revestimentos-e-acabamentos': 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=300&auto=format&fit=crop&q=80',
  'portas-janelas-e-ferragens': 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=300&auto=format&fit=crop&q=80',
  'iluminacao-e-lustres': 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=300&auto=format&fit=crop&q=80',
  'utilidades-casa-e-jardim': 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=300&auto=format&fit=crop&q=80',
  // Aliases de compatibilidade
  'pisos-e-revestimentos': 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=300&auto=format&fit=crop&q=80',
  'tintas-e-vernizes': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=300&auto=format&fit=crop&q=80',
  'ferramentas': 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=300&auto=format&fit=crop&q=80',
  'eletrica': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300&auto=format&fit=crop&q=80',
  'hidraulica': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=300&auto=format&fit=crop&q=80',
  'iluminacao': 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=300&auto=format&fit=crop&q=80',
};

export default function DepartmentShortcuts() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const categoriesApi = useCategories();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
    slidesToScroll: 2,
    breakpoints: {
      '(min-width: 640px)': { slidesToScroll: 3 },
      '(min-width: 768px)': { slidesToScroll: 4 },
      '(min-width: 1024px)': { slidesToScroll: 6 },
      '(min-width: 1280px)': { slidesToScroll: 7 },
    },
  });

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const res = await categoriesApi.getCategories(true);
        if (res && Array.isArray(res) && res.length > 0) {
          // Filtrar apenas Departamentos Principais (Nível 1 / Raízes)
          const mainDepartments = res.filter((c: any) => !c.parentId);
          setCategories(mainDepartments.length > 0 ? mainDepartments : res);
        }
      } catch (err) {
        console.error('Erro ao buscar departamentos:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  if (!loading && categories.length === 0) {
    return null;
  }

  const getCategoryImage = (cat: Category) => {
    if (cat.image) return cat.image;
    if (categoryPhotos[cat.slug]) return categoryPhotos[cat.slug];
    return 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=300&auto=format&fit=crop&q=80';
  };

  return (
    <section className="py-5 bg-white dark:bg-slate-900 border-y border-gray-200 dark:border-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Navigation Arrows */}
        <button
          onClick={scrollPrev}
          disabled={!prevBtnEnabled}
          className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-gray-800 dark:text-white shadow-md border border-gray-200 dark:border-slate-700 flex items-center justify-center hover:bg-gray-50 hover:text-[#009de0] hover:scale-105 disabled:opacity-0 disabled:pointer-events-none transition-all"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={scrollNext}
          disabled={!nextBtnEnabled}
          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-gray-800 dark:text-white shadow-md border border-gray-200 dark:border-slate-700 flex items-center justify-center hover:bg-gray-50 hover:text-[#009de0] hover:scale-105 disabled:opacity-0 disabled:pointer-events-none transition-all"
          aria-label="Próximo"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Carousel Viewport */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3 sm:gap-4">
            {categories.map((cat) => {
              const photoUrl = getCategoryImage(cat);

              return (
                <div
                  key={cat.id}
                  className="flex-[0_0_125px] sm:flex-[0_0_145px] md:flex-[0_0_155px] select-none"
                >
                  <Link
                    href={`/categoria/${cat.slug}`}
                    className="group flex flex-col rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    {/* Upper Category Image */}
                    <div className="relative w-full h-24 sm:h-28 bg-white dark:bg-slate-800 overflow-hidden">
                      <img
                        src={photoUrl}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=300&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>

                    {/* Blue Title Banner */}
                    <div className="bg-[#009de0] group-hover:bg-[#0088c6] text-white font-bold text-[11px] sm:text-xs text-center py-2 px-1.5 leading-tight line-clamp-2 min-h-[38px] flex items-center justify-center uppercase tracking-tight transition-colors">
                      {cat.name}
                    </div>

                    {/* Yellow CTA Bar */}
                    <div className="bg-[#ffea00] group-hover:bg-[#ffe100] text-slate-950 font-black text-[10px] sm:text-[11px] py-1 text-center uppercase tracking-wider flex items-center justify-center gap-1 transition-colors">
                      <span>CONFIRA</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
