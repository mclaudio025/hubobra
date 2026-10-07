'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Home,
} from 'lucide-react';
import { useCategories } from '../hooks/useApi';

export interface CategoryCardData {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  image: string;
  iconType:
    | 'alvenaria'
    | 'hidraulica'
    | 'eletrica'
    | 'tintas'
    | 'ferramentas'
    | 'pisos'
    | 'portas'
    | 'iluminacao'
    | 'utilidades';
}

// 💎 AS 9 CATEGORIAS OFICIAIS COM FOTOS E DESCRIÇÕES APROVADAS
export const MASTER_CATEGORIES_DATA: CategoryCardData[] = [
  {
    id: 'db3d2816-192c-4021-ad4d-8a74c871ba49',
    name: 'Construção e Alvenaria',
    slug: 'construcao-e-alvenaria',
    tagline: 'Materiais brutos de fundação, elevação, vedação e cobertura para obras.',
    iconType: 'alvenaria',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'afdf6873-1064-49bc-a3c3-add98d9ddf1b',
    name: 'Hidráulica e Encanamento',
    slug: 'hidraulica-e-encanamento',
    tagline: 'Tubulações, registros, conexões e reservatórios para instalações prediais de água e esgoto.',
    iconType: 'hidraulica',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '3d18ccd4-f3fe-4123-bf23-3f1a0dd3e96f',
    name: 'Elétrica e Energia',
    slug: 'eletrica-e-energia',
    tagline: 'Condutores, proteção elétrica, acionamentos e cabeamento para instalações elétricas.',
    iconType: 'eletrica',
    image: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '196962dd-cecb-48ee-a653-8b8d92cc8771',
    name: 'Tintas e Pintura',
    slug: 'tintas-e-pintura',
    tagline: 'Tintas imobiliárias, esmaltes, vernizes e ferramentas de aplicação de pintura.',
    iconType: 'tintas',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'b8418491-f74e-4ca0-a678-add8fc3d4039',
    name: 'Ferramentas, Máquinas e Abrasivos',
    slug: 'ferramentas-maquinas-e-abrasivos',
    tagline: 'Equipamentos profissionais, manuais, corte, desbaste, lixamento e proteção.',
    iconType: 'ferramentas',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '107aad0a-b7d5-412c-8a2b-27f406475e75',
    name: 'Pisos e Revestimentos',
    slug: 'pisos-revestimentos-e-acabamentos',
    tagline: 'Pisos cerâmicos, porcelanatos, revestimentos de parede, rejuntes e rodapés.',
    iconType: 'pisos',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '14ad9d59-0f62-45d2-b9f3-b76c466ecce0',
    name: 'Portas e Janelas',
    slug: 'portas-janelas-e-ferragens',
    tagline: 'Esquadrias, fechaduras residenciais, cadeados, dobradiças e fixadores mecânicos.',
    iconType: 'portas',
    image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'c2f76e94-68f9-40da-a3e0-c199a414c54c',
    name: 'Iluminação e Lustres',
    slug: 'iluminacao-e-lustres',
    tagline: 'Soluções de iluminação técnica e decorativa para ambientes internos e externos.',
    iconType: 'iluminacao',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '57560430-078f-4b84-950f-2481eb16f973',
    name: 'Utilidades, Casa e Jardim',
    slug: 'utilidades-casa-e-jardim',
    tagline: 'Suportes de TV e eletrodomésticos, mangueiras, escadas, organização e limpeza pós-obra.',
    iconType: 'utilidades',
    image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80',
  },
];

// 🎨 OS 9 SÍMBOLOS EXATOS DESENHADOS PELO CLIENTE (ESTILO NEON DOURADO #fdb813)
function renderCustomCategoryIcon(type: CategoryCardData['iconType']) {
  const commonProps = {
    viewBox: '0 0 64 64',
    fill: 'none',
    stroke: '#fdb813',
    strokeWidth: '3.6',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: 'w-7 h-7 sm:w-8 sm:h-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]',
  };

  switch (type) {
    case 'alvenaria':
      // 🧱 1. Tijolos e Colher de Pedreiro
      return (
        <svg {...commonProps}>
          <rect x="10" y="14" width="28" height="9" rx="1.5" />
          <rect x="4" y="25" width="20" height="9" rx="1.5" />
          <rect x="26" y="25" width="20" height="9" rx="1.5" />
          <rect x="10" y="36" width="28" height="9" rx="1.5" />
          <path d="M43 38 L54 26 L47 48 Z" />
          <path d="M49 48 L56 56" />
        </svg>
      );

    case 'hidraulica':
      // 🚰 2. Cano com Registro / Válvula
      return (
        <svg {...commonProps}>
          <path d="M18 16 v8 h8 v16 a7 7 0 0 0 7 7 h4 a7 7 0 0 0 7 -7 v-7 h-4" />
          <path d="M14 16 h8" />
          <path d="M14 24 h8" />
          <rect x="39" y="23" width="13" height="13" rx="2" />
          <path d="M45.5 23 v-5" />
          <path d="M39 18 h13" />
          <path d="M52 27 h4 v5 h-4" />
        </svg>
      );

    case 'eletrica':
      // 💡 3. Lâmpada com Raio e Plugue Elétrico
      return (
        <svg {...commonProps}>
          <path d="M26 12 a13 13 0 0 1 11 20 c-2 3 -3 5 -3 8 h-8 c0 -3 -1 -5 -3 -8 a13 13 0 0 1 3 -20 z" />
          <path d="M27 40 h8" />
          <path d="M28 44 h6" />
          <path d="M33 18 l-4 6 h5 l-3 7" />
          <path d="M31 44 v3 a6 6 0 0 0 6 6 h7 a6 6 0 0 0 6 -6 v-14" />
          <rect x="46" y="24" width="8" height="11" rx="2" />
          <path d="M48 24 v-5" />
          <path d="M52 24 v-5" />
        </svg>
      );

    case 'tintas':
      // 🎨 4. Lata de Tinta escorrendo com Rolo de Pintura
      return (
        <svg {...commonProps}>
          <rect x="12" y="16" width="24" height="32" rx="3.5" />
          <path d="M12 23 c3 0 3 5 7 5 s3 -4 7 -4 s3 5 9 3" />
          <rect x="28" y="26" width="20" height="9" rx="2.5" transform="rotate(-15 28 26)" />
          <path d="M46 22 l4 2 a3 3 0 0 1 1.5 3.5 l-2 5 a3 3 0 0 1 -3 2 l-6 -1" />
          <rect x="38" y="42" width="5" height="11" rx="1.5" transform="rotate(30 38 42)" />
        </svg>
      );

    case 'ferramentas':
      // 🛠️ 5. Chave de Boca e Chave Philips Cruzadas
      return (
        <svg {...commonProps}>
          <path d="M18 16 a8 8 0 0 1 10 2 l-3 3 a4 4 0 0 0 -4 4 l18 18 a3 3 0 0 1 -4 4 l-18 -18 a4 4 0 0 0 -4 4 l-3 -3 a8 8 0 0 1 8 -10 z" />
          <path d="M46 16 l4 4 l-3 3 l-20 20 l-4 -4 l20 -20 z" />
          <circle cx="21" cy="45" r="2.5" fill="#fdb813" />
        </svg>
      );

    case 'pisos':
      // 🔲 6. Placas de Revestimento Isométricas Sobrepostas
      return (
        <svg {...commonProps}>
          <path d="M32 14 L52 24 L32 34 L12 24 Z" />
          <path d="M32 14 L32 34" />
          <path d="M12 24 L52 24" />
          <path d="M12 30 L32 40 L52 30" />
          <path d="M12 36 L32 46 L52 36" />
        </svg>
      );

    case 'portas':
      // 🚪 7. Porta com Maçaneta e Janela 4 Vidros
      return (
        <svg {...commonProps}>
          <rect x="8" y="14" width="22" height="38" rx="2" />
          <rect x="13" y="19" width="12" height="28" rx="1" />
          <circle cx="22" cy="34" r="1.5" fill="#fdb813" />
          <rect x="34" y="20" width="22" height="26" rx="2" />
          <path d="M34 33 h22" />
          <path d="M45 20 v26" />
        </svg>
      );

    case 'iluminacao':
      // 🏮 8. Lustre Pendente / Cúpula com Lâmpada
      return (
        <svg {...commonProps}>
          <path d="M32 12 v8" />
          <path d="M16 32 a16 16 0 0 1 32 0 z" />
          <circle cx="32" cy="38" r="5" />
          <path d="M22 47 l-4 5" />
          <path d="M32 49 v6" />
          <path d="M42 47 l4 5" />
        </svg>
      );

    case 'utilidades':
    default:
      // 🚜 9. Carrinho de Mão com Folhas e Pá
      return (
        <svg {...commonProps}>
          <path d="M12 36 h26 l-5 12 h-14 z" />
          <circle cx="16" cy="48" r="5" />
          <path d="M33 48 l2 4" />
          <path d="M38 36 l10 -4" />
          <path d="M22 36 c-2 -8 4 -14 10 -12 c6 2 4 10 -2 12" />
          <path d="M26 36 c4 -8 12 -6 14 -2 c2 4 -4 8 -8 8" />
          <path d="M48 48 l6 6" />
          <path d="M48 48 l-4 -12 a4 4 0 0 1 6 -2 l2 8 z" />
          <path d="M54 54 h4" />
        </svg>
      );
  }
}

// Helper para determinar o ícone temático de acordo com o nome ou slug da categoria
function getCategoryIconType(name: string, slug: string): CategoryCardData['iconType'] {
  const s = (slug || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (s.includes('alvenaria') || s.includes('construc') || n.includes('alvenaria') || n.includes('construção') || n.includes('cimento') || n.includes('obra')) return 'alvenaria';
  if (s.includes('hidraul') || n.includes('hidráulica') || s.includes('encanamento') || n.includes('encanamento') || s.includes('tubo') || s.includes('esgoto')) return 'hidraulica';
  if (s.includes('eletric') || n.includes('elétrica') || s.includes('energia') || n.includes('energia') || s.includes('fio') || s.includes('cabo')) return 'eletrica';
  if (s.includes('tinta') || n.includes('tinta') || s.includes('pintura') || n.includes('pintura') || s.includes('verniz')) return 'tintas';
  if (s.includes('ferramenta') || n.includes('ferramenta') || s.includes('maquina') || s.includes('abrasivo') || s.includes('disco')) return 'ferramentas';
  if (s.includes('piso') || n.includes('piso') || s.includes('revestimento') || n.includes('revestimento') || s.includes('ceramica') || n.includes('porcelanato')) return 'pisos';
  if (s.includes('porta') || n.includes('porta') || s.includes('janela') || n.includes('janela') || s.includes('ferrag') || s.includes('fechadura')) return 'portas';
  if (s.includes('ilumina') || n.includes('iluminação') || s.includes('lustre') || n.includes('lustre') || s.includes('lampada') || s.includes('led')) return 'iluminacao';
  return 'utilidades';
}

function getCategoryFallbackImage(name: string, slug: string): string {
  const s = (slug || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (s.includes('alvenaria') || s.includes('construc') || n.includes('alvenaria') || n.includes('construção') || n.includes('cimento') || n.includes('obra')) 
    return 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80';
  if (s.includes('hidraul') || n.includes('hidráulica') || s.includes('encanamento') || n.includes('encanamento') || s.includes('tubo') || s.includes('esgoto')) 
    return 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80';
  if (s.includes('eletric') || n.includes('elétrica') || s.includes('energia') || n.includes('energia') || s.includes('fio') || s.includes('cabo')) 
    return 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=600&auto=format&fit=crop&q=80';
  if (s.includes('tinta') || n.includes('tinta') || s.includes('pintura') || n.includes('pintura') || s.includes('verniz')) 
    return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80';
  if (s.includes('ferramenta') || n.includes('ferramenta') || s.includes('maquina') || s.includes('abrasivo') || s.includes('disco')) 
    return 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80';
  if (s.includes('piso') || n.includes('piso') || s.includes('revestimento') || n.includes('revestimento') || s.includes('ceramica') || n.includes('porcelanato')) 
    return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80';
  if (s.includes('porta') || n.includes('porta') || s.includes('janela') || n.includes('janela') || s.includes('ferrag') || s.includes('fechadura')) 
    return 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&auto=format&fit=crop&q=80';
  if (s.includes('ilumina') || n.includes('iluminação') || s.includes('lustre') || n.includes('lustre') || s.includes('lampada') || s.includes('led')) 
    return 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&auto=format&fit=crop&q=80';
  return 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80';
}

function normalizeKey(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const CATEGORIES_CACHE_KEY = 'hubobra_cached_department_shortcuts_v3';

export default function DepartmentShortcuts() {
  const [categoriesList, setCategoriesList] = useState<CategoryCardData[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(CATEGORIES_CACHE_KEY) || sessionStorage.getItem(CATEGORIES_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        // Silenciosamente usar MASTER_CATEGORIES_DATA
      }
    }
    return MASTER_CATEGORIES_DATA;
  });
  const categoriesApi = useCategories();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
    slidesToScroll: 2,
    breakpoints: {
      '(min-width: 640px)': { slidesToScroll: 3, dragFree: false },
      '(min-width: 768px)': { slidesToScroll: 4, dragFree: false },
      '(min-width: 1024px)': { slidesToScroll: 5, dragFree: false },
      '(min-width: 1280px)': { slidesToScroll: 6, dragFree: false },
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

  // Sincronizar dinamicamente categorias e imagens do banco de dados com persistência local
  useEffect(() => {
    const isValidImageUrl = (url?: string | null): boolean => {
      if (!url || typeof url !== 'string') return false;
      const clean = url.trim();
      if (clean.length === 0 || clean.startsWith('blob:') || clean === 'null' || clean === 'undefined') return false;
      return clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/') || clean.startsWith('data:image/');
    };

    const loadCategories = async () => {
      try {
        const res = await categoriesApi.getCategories(true);
        if (res && Array.isArray(res) && res.length > 0) {
          // Filtrar departamentos principais (raiz ou sem parentId)
          const rootCategories = res.filter((c: any) => !c.parentId);
          const sourceList = rootCategories.length > 0 ? rootCategories : res;

          const dynamicMapped: CategoryCardData[] = sourceList.map((dbCat: any) => {
            const normDbSlug = normalizeKey(dbCat.slug);
            const normDbName = normalizeKey(dbCat.name);

            // Tenta encontrar dados de estilo padrão no catálogo mestre
            const masterFallback = MASTER_CATEGORIES_DATA.find((m) => {
              const normMasterSlug = normalizeKey(m.slug);
              const normMasterName = normalizeKey(m.name);
              return (
                m.id === dbCat.id ||
                normMasterSlug === normDbSlug ||
                normMasterName === normDbName ||
                normDbSlug.includes(normMasterSlug) ||
                normMasterSlug.includes(normDbSlug)
              );
            });

            const rawImage = dbCat.image;
            const finalImage = (rawImage && isValidImageUrl(rawImage))
              ? rawImage
              : (masterFallback?.image || getCategoryFallbackImage(dbCat.name, dbCat.slug));

            return {
              id: dbCat.id,
              name: dbCat.name,
              slug: dbCat.slug,
              tagline: dbCat.description || masterFallback?.tagline || 'Tudo para sua construção e acabamento.',
              image: finalImage,
              iconType: masterFallback?.iconType || getCategoryIconType(dbCat.name, dbCat.slug),
            };
          });

          if (dynamicMapped.length > 0) {
            setCategoriesList(dynamicMapped);
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(dynamicMapped));
                sessionStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(dynamicMapped));
              } catch (e) {
                // Ignore storage limits
              }
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao sincronizar categorias:', err);
      }
    };

    loadCategories();
  }, []);

  return (
    <section className="py-6 sm:py-8 bg-slate-50 dark:bg-slate-950/60 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 🟡 CABEÇALHO OFICIAL "CATEGORIAS DA NOSSA LOJA" */}
        <div className="relative mb-6 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-r from-[#002244] via-[#003366] to-[#004080] border border-blue-900/50">
          {/* Imagem de Fundo com Capacete e Planta Baixa */}
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
            <div className="flex items-center gap-3.5">
              {/* Ícone de Casa Amarelo */}
              <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md flex-shrink-0">
                <Home className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="flex items-center flex-wrap gap-2.5">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                  Categorias <span className="text-amber-400">da Nossa Loja</span>
                </h2>
                <div className="hidden sm:block h-6 w-[2px] bg-blue-300/40 mx-2" />
                <p className="hidden sm:block text-xs sm:text-sm font-semibold text-blue-100/90 tracking-wide">
                  Tudo para sua obra em um só lugar!
                </p>
              </div>
            </div>

            {/* Tag Decorativa */}
            <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide">
              <span>9 Departamentos Principais</span>
            </div>
          </div>
        </div>

        {/* 🎡 CARROSSEL DOS CARDS DE CATEGORIAS (FORMATO VERTICAL COMPACTO EXATO) */}
        <div className="relative group/carousel">
          {/* Seta Esquerda */}
          <button
            onClick={scrollPrev}
            disabled={!prevBtnEnabled}
            className="absolute -left-3 sm:-left-5 top-[45%] -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xl border border-gray-200 dark:border-slate-700 flex items-center justify-center hover:bg-amber-400 hover:text-slate-950 hover:border-amber-400 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none transition-all duration-200"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Seta Direita */}
          <button
            onClick={scrollNext}
            disabled={!nextBtnEnabled}
            className="absolute -right-3 sm:-right-5 top-[45%] -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xl border border-gray-200 dark:border-slate-700 flex items-center justify-center hover:bg-amber-400 hover:text-slate-950 hover:border-amber-400 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none transition-all duration-200"
            aria-label="Próximo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Viewport do Carrossel */}
          <div className="overflow-hidden px-1 py-2" ref={emblaRef}>
            <div className="flex gap-3 sm:gap-4 md:gap-4">
              {categoriesList.map((cat) => {
                const fallbackImg = getCategoryFallbackImage(cat.name, cat.slug);
                const displayImage = cat.image || fallbackImg;

                return (
                  <div
                    key={cat.id}
                    className="flex-[0_0_145px] sm:flex-[0_0_165px] md:flex-[0_0_180px] select-none"
                  >
                    <Link
                      href={`/categoria/${cat.slug}`}
                      className="group flex flex-col h-full rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-700/60 bg-[#00264d] hover:-translate-y-1.5"
                    >
                      {/* 📸 1. FOTO REALISTA SUPERIOR */}
                      <div className="relative w-full h-32 sm:h-36 bg-slate-900 overflow-hidden">
                        <img
                          src={displayImage}
                          alt={cat.name}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                          loading="eager"
                          decoding="async"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== fallbackImg) {
                              target.src = fallbackImg;
                            }
                          }}
                        />
                      </div>

                    {/* 📦 2. CORPO AZUL COM O SÍMBOLO EXATO, NOME E DESCRIÇÃO */}
                    <div className="p-3 flex flex-col items-center justify-between flex-1 bg-[#00264d] text-center min-h-[125px]">
                      {/* Ícone Vetorial Amarelo Específico */}
                      <div className="flex items-center justify-center my-1 group-hover:scale-110 transition-transform duration-300">
                        {renderCustomCategoryIcon(cat.iconType)}
                      </div>

                      {/* Título da Categoria */}
                      <h3 className="font-extrabold text-xs sm:text-sm text-white tracking-tight leading-tight line-clamp-1 group-hover:text-amber-300 transition-colors mt-1">
                        {cat.name}
                      </h3>

                      {/* Micro-descrição Oficial */}
                      <p className="text-[10px] sm:text-[11px] text-blue-200/80 leading-tight line-clamp-2 mt-1 px-0.5">
                        {cat.tagline}
                      </p>
                    </div>

                    {/* 🟡 3. BARRA INFERIOR AMARELA "VER MAIS →" */}
                    <div className="bg-amber-400 group-hover:bg-amber-300 text-slate-950 font-black text-xs py-2 px-2 text-center uppercase tracking-wide flex items-center justify-center gap-1 transition-colors shadow-sm mt-auto">
                      <span>Ver mais</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

          {/* 🔘 DOTS DE PAGINAÇÃO */}
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
