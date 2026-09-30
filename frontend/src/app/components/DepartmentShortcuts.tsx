'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Building2,
  Sparkles,
} from 'lucide-react';
import { useCategories } from '../hooks/useApi';

export interface CategoryCardData {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  image: string;
  iconType: 'alvenaria' | 'hidraulica' | 'eletrica' | 'tintas' | 'ferramentas' | 'pisos' | 'portas' | 'iluminacao' | 'utilidades';
}

// 💎 AS 9 CATEGORIAS OFICIAIS COM TEXTOS E FOTOS EM ALTA RESOLUÇÃO
export const MASTER_CATEGORIES_DATA: CategoryCardData[] = [
  {
    id: 'db3d2816-192c-4021-ad4d-8a74c871ba49',
    name: 'Construção e Alvenaria',
    slug: 'construcao-e-alvenaria',
    tagline: 'Materiais brutos de fundação, elevação, vedação e cobertura para obras.',
    iconType: 'alvenaria',
    image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'afdf6873-1064-49bc-a3c3-add98d9ddf1b',
    name: 'Hidráulica e Encanamento',
    slug: 'hidraulica-e-encanamento',
    tagline: 'Tubulações, registros, conexões e reservatórios para instalações prediais de água e esgoto.',
    iconType: 'hidraulica',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: '3d18ccd4-f3fe-4123-bf23-3f1a0dd3e96f',
    name: 'Elétrica e Energia',
    slug: 'eletrica-e-energia',
    tagline: 'Condutores, proteção elétrica, acionamentos e cabeamento para instalações elétricas.',
    iconType: 'eletrica',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: '196962dd-cecb-48ee-a653-8b8d92cc8771',
    name: 'Tintas e Pintura',
    slug: 'tintas-e-pintura',
    tagline: 'Tintas imobiliárias, esmaltes, vernizes e ferramentas de aplicação de pintura.',
    iconType: 'tintas',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'b8418491-f74e-4ca0-a678-add8fc3d4039',
    name: 'Ferramentas, Máquinas e Abrasivos',
    slug: 'ferramentas-maquinas-e-abrasivos',
    tagline: 'Equipamentos profissionais, manuais, corte, desbaste, lixamento e proteção.',
    iconType: 'ferramentas',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: '107aad0a-b7d5-412c-8a2b-27f406475e75',
    name: 'Pisos, Revestimentos e Acabamentos',
    slug: 'pisos-revestimentos-e-acabamentos',
    tagline: 'Pisos cerâmicos, porcelanatos, revestimentos de parede, rejuntes e rodapés.',
    iconType: 'pisos',
    image: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: '14ad9d59-0f62-45d2-b9f3-b76c466ecce0',
    name: 'Portas, Janelas e Ferragens',
    slug: 'portas-janelas-e-ferragens',
    tagline: 'Esquadrias, fechaduras residenciais, cadeados, dobradiças e fixadores mecânicos.',
    iconType: 'portas',
    image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'c2f76e94-68f9-40da-a3e0-c199a414c54c',
    name: 'Iluminação e Lustres',
    slug: 'iluminacao-e-lustres',
    tagline: 'Soluções de iluminação técnica e decorativa para ambientes internos e externos.',
    iconType: 'iluminacao',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: '57560430-078f-4b84-950f-2481eb16f973',
    name: 'Utilidades, Casa e Jardim',
    slug: 'utilidades-casa-e-jardim',
    tagline: 'Suportes de TV e eletrodomésticos, mangueiras, escadas, organização e limpeza pós-obra.',
    iconType: 'utilidades',
    image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80',
  },
];

// Ícones vetorizados com contorno amarelo idênticos ao layout de referência
function renderCategoryIcon(type: CategoryCardData['iconType']) {
  switch (type) {
    case 'alvenaria':
      // Parede de tijolos
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fdb813" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 sm:w-7 sm:h-7">
          <rect x="2" y="3" width="20" height="18" rx="2" />
          <path d="M2 9h20" />
          <path d="M2 15h20" />
          <path d="M8 3v6" />
          <path d="M16 3v6" />
          <path d="M12 9v6" />
          <path d="M6 15v6" />
          <path d="M18 15v6" />
        </svg>
      );
    case 'hidraulica':
      // Registro / Tubulação
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fdb813" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 sm:w-7 sm:h-7">
          <path d="M3 13h18" />
          <path d="M12 5v8" />
          <path d="M8 5h8" />
          <path d="M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
        </svg>
      );
    case 'eletrica':
      // Raio / Energia
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fdb813" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 sm:w-7 sm:h-7">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'tintas':
      // Rolo de pintura
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fdb813" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 sm:w-7 sm:h-7">
          <rect x="3" y="3" width="16" height="6" rx="2" />
          <path d="M19 6h2a2 2 0 012 2v2a2 2 0 01-2 2h-9v4" />
          <rect x="10" y="16" width="4" height="6" rx="1" />
        </svg>
      );
    case 'ferramentas':
      // Chaves cruzadas
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fdb813" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 sm:w-7 sm:h-7">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
          <path d="M4 20l4-4" />
        </svg>
      );
    case 'pisos':
      // Grade de porcelanato
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fdb813" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 sm:w-7 sm:h-7">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M3 15h18" />
          <path d="M9 3v18" />
          <path d="M15 3v18" />
        </svg>
      );
    case 'portas':
      // Porta / Janela
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fdb813" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 sm:w-7 sm:h-7">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M12 3v18" />
          <circle cx="8" cy="12" r="1" fill="#fdb813" />
          <circle cx="16" cy="12" r="1" fill="#fdb813" />
        </svg>
      );
    case 'iluminacao':
      // Lâmpada e lustre
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fdb813" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 sm:w-7 sm:h-7">
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M12 2a7 7 0 00-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 00-7-7z" />
        </svg>
      );
    case 'utilidades':
    default:
      // Casa e Jardim
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fdb813" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 sm:w-7 sm:h-7">
          <path d="M3 9.5L12 3l9 6.5" />
          <path d="M19 13v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" />
          <path d="M9 22V12h6v10" />
        </svg>
      );
  }
}

export default function DepartmentShortcuts() {
  const [categoriesList, setCategoriesList] = useState<CategoryCardData[]>(MASTER_CATEGORIES_DATA);
  const categoriesApi = useCategories();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 640px)': { slidesToScroll: 2, dragFree: false },
      '(min-width: 1024px)': { slidesToScroll: 3, dragFree: false },
      '(min-width: 1280px)': { slidesToScroll: 3, dragFree: false },
    },
  });

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  // Sincronizar com banco mantendo prioridade para a lista mestra das 9 categorias
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoriesApi.getCategories(true);
        if (res && Array.isArray(res) && res.length > 0) {
          const matched = MASTER_CATEGORIES_DATA.map((card) => {
            const found = res.find(
              (c: any) =>
                c.slug === card.slug ||
                c.id === card.id ||
                c.name.toLowerCase() === card.name.toLowerCase()
            );
            return {
              ...card,
              id: found?.id || card.id,
              slug: found?.slug || card.slug,
            };
          });
          setCategoriesList(matched);
        }
      } catch (err) {
        console.error('Erro ao sincronizar categorias:', err);
      }
    };

    loadCategories();
  }, []);

  return (
    <section className="py-6 sm:py-8 bg-slate-50 dark:bg-slate-950/60 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 🟡 CABEÇALHO DA SEÇÃO DE CATEGORIAS */}
        <div className="relative mb-6 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-r from-[#031b33] via-[#08305c] to-[#0a3d75] border border-blue-900/40">
          <div
            className="absolute right-0 top-0 bottom-0 w-full sm:w-1/2 opacity-25 sm:opacity-35 pointer-events-none bg-cover bg-right"
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80)',
              maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
            }}
          />

          <div className="relative z-10 px-5 py-4 sm:px-8 sm:py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md flex-shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                  Categorias <span className="text-amber-400">da Nossa Loja</span>
                </h2>
                <div className="hidden sm:block h-6 w-[2px] bg-blue-300/30 mx-2" />
                <p className="hidden sm:block text-xs sm:text-sm font-medium text-blue-100/90">
                  Tudo para sua obra em um só lugar!
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>9 Departamentos Principais</span>
            </div>
          </div>
        </div>

        {/* 🎡 CARROSSEL DOS CARDS DE CATEGORIAS - DESIGN IDÊNTICO À REFERÊNCIA */}
        <div className="relative group/carousel">
          {/* Botão Anterior */}
          <button
            onClick={scrollPrev}
            disabled={!prevBtnEnabled}
            className="absolute -left-3 sm:-left-5 top-[50%] -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-2xl border border-gray-200 dark:border-slate-700 flex items-center justify-center hover:bg-amber-400 hover:text-slate-950 hover:border-amber-400 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none transition-all duration-200"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Botão Próximo */}
          <button
            onClick={scrollNext}
            disabled={!nextBtnEnabled}
            className="absolute -right-3 sm:-right-5 top-[50%] -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-2xl border border-gray-200 dark:border-slate-700 flex items-center justify-center hover:bg-amber-400 hover:text-slate-950 hover:border-amber-400 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none transition-all duration-200"
            aria-label="Próximo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Viewport */}
          <div className="overflow-hidden px-1 py-2" ref={emblaRef}>
            <div className="flex gap-4 sm:gap-5 md:gap-6">
              {categoriesList.map((cat) => (
                <div
                  key={cat.id}
                  className="flex-[0_0_285px] sm:flex-[0_0_330px] md:flex-[0_0_370px] select-none"
                >
                  <Link
                    href={`/categoria/${cat.slug}`}
                    className="group block rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-700/60 bg-[#061d36] hover:-translate-y-1.5"
                  >
                    {/* 📸 1. FOTO REALISTA NO TOPO */}
                    <div className="relative w-full h-36 sm:h-44 bg-slate-900 overflow-hidden">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>

                    {/* 🟡 2. LINHA DIVISÓRIA AMARELA */}
                    <div className="h-[2.5px] w-full bg-amber-400" />

                    {/* 📦 3. CORPO AZUL COM ÍCONE, TÍTULO, SUBTÍTULO E BOTÃO VER MAIS */}
                    <div className="p-3.5 sm:p-4 bg-[#051c36] flex flex-col justify-between min-h-[118px] relative">
                      <div className="flex items-start gap-3">
                        {/* Ícone vetorizado amarelo à esquerda */}
                        <div className="flex-shrink-0 mt-0.5">
                          {renderCategoryIcon(cat.iconType)}
                        </div>

                        {/* Textos */}
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-tight line-clamp-1 group-hover:text-amber-300 transition-colors">
                            {cat.name}
                          </h3>
                          <p className="text-[10px] sm:text-[11px] text-slate-300 font-normal leading-tight line-clamp-2 mt-1">
                            {cat.tagline}
                          </p>
                        </div>
                      </div>

                      {/* 🟡 Botão "Ver mais →" no canto inferior direito */}
                      <div className="flex justify-end mt-2">
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-md sm:rounded-lg bg-amber-400 group-hover:bg-amber-300 text-slate-950 font-extrabold text-[11px] sm:text-xs shadow transition-colors">
                          <span>Ver mais</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* 🔘 INDICADORES DE NAVEGAÇÃO (DOTS) */}
          {scrollSnaps.length > 1 && (
            <div className="flex justify-center items-center gap-2 mt-5">
              {scrollSnaps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollTo(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    idx === selectedIndex
                      ? 'w-8 bg-amber-400 shadow-sm'
                      : 'w-2.5 bg-gray-300 dark:bg-slate-700 hover:bg-gray-400'
                  }`}
                  aria-label={`Ir para slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
