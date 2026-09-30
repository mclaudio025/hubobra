'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Package,
  Layers,
  Hammer,
  Mountain,
  Paintbrush,
  Droplet,
  Zap,
  Wrench,
  DoorClosed,
  Grid,
  Lightbulb,
  Home,
  Building2,
  HardHat,
  Sparkles,
} from 'lucide-react';
import { useCategories } from '../hooks/useApi';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  image: string;
  iconName: string;
  badge?: string;
}

// Configuração visual ultra premium inspirada no design comercial
const DEFAULT_CATEGORY_CARDS: CategoryItem[] = [
  {
    id: 'cat-cimentos',
    name: 'Cimentos',
    slug: 'construcao-e-alvenaria',
    tagline: 'Qualidade e resistência para sua obra.',
    iconName: 'Package',
    image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'cat-tijolos',
    name: 'Tijolos e Blocos',
    slug: 'blocos-e-tijolos',
    tagline: 'Base sólida para grandes projetos.',
    iconName: 'Layers',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'cat-ferragens',
    name: 'Ferragens',
    slug: 'portas-janelas-e-ferragens',
    tagline: 'Mais segurança e durabilidade.',
    iconName: 'Hammer',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'cat-areia',
    name: 'Areia e Brita',
    slug: 'areia-brita-e-agregados',
    tagline: 'Materiais de confiança para sua construção.',
    iconName: 'Mountain',
    image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'cat-tintas',
    name: 'Tintas',
    slug: 'tintas-e-pintura',
    tagline: 'Cores e proteção para todos os ambientes.',
    iconName: 'Paintbrush',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'cat-hidraulica',
    name: 'Hidráulica',
    slug: 'hidraulica-e-encanamento',
    tagline: 'Instalações seguras e eficientes.',
    iconName: 'Droplet',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'cat-eletrica',
    name: 'Elétrica',
    slug: 'eletrica-e-energia',
    tagline: 'Energia com mais segurança.',
    iconName: 'Zap',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'cat-ferramentas',
    name: 'Ferramentas',
    slug: 'ferramentas-maquinas-e-abrasivos',
    tagline: 'Praticidade e eficiência no seu dia a dia.',
    iconName: 'Wrench',
    image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'cat-portas',
    name: 'Portas e Janelas',
    slug: 'portas-e-janelas',
    tagline: 'Beleza e funcionalidade para seu projeto.',
    iconName: 'DoorClosed',
    image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'cat-pisos',
    name: 'Revestimentos',
    slug: 'pisos-revestimentos-e-acabamentos',
    tagline: 'Acabamento que faz a diferença.',
    iconName: 'Grid',
    image: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'cat-iluminacao',
    name: 'Iluminação',
    slug: 'iluminacao-e-lustres',
    tagline: 'Luminárias e lâmpadas para valorizar o espaço.',
    iconName: 'Lightbulb',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'cat-utilidades',
    name: 'Utilidades & Obra',
    slug: 'utilidades-casa-e-jardim',
    tagline: 'Soluções práticas para casa e canteiro.',
    iconName: 'Home',
    image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=500&auto=format&fit=crop&q=80',
  },
];

export default function DepartmentShortcuts() {
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(DEFAULT_CATEGORY_CARDS);
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

  // Sincronizar com as categorias ativas do banco se disponíveis
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoriesApi.getCategories(true);
        if (res && Array.isArray(res) && res.length > 0) {
          const matched = DEFAULT_CATEGORY_CARDS.map((card) => {
            const found = res.find(
              (c: any) =>
                c.slug === card.slug ||
                c.slug.includes(card.slug) ||
                card.slug.includes(c.slug) ||
                c.name.toLowerCase().includes(card.name.toLowerCase())
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
        console.error('Erro ao buscar departamentos para o carrossel:', err);
      }
    };

    loadCategories();
  }, []);

  const renderIcon = (iconName: string) => {
    const props = { className: 'w-5 h-5 text-amber-400' };
    switch (iconName) {
      case 'Package':
        return <Package {...props} />;
      case 'Layers':
        return <Layers {...props} />;
      case 'Hammer':
        return <Hammer {...props} />;
      case 'Mountain':
        return <Mountain {...props} />;
      case 'Paintbrush':
        return <Paintbrush {...props} />;
      case 'Droplet':
        return <Droplet {...props} />;
      case 'Zap':
        return <Zap {...props} />;
      case 'Wrench':
        return <Wrench {...props} />;
      case 'DoorClosed':
        return <DoorClosed {...props} />;
      case 'Grid':
        return <Grid {...props} />;
      case 'Lightbulb':
        return <Lightbulb {...props} />;
      default:
        return <Home {...props} />;
    }
  };

  return (
    <section className="py-8 bg-slate-50 dark:bg-slate-950/60 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 🟡 HEADER BANNER MODERNO ESTILO HUBOBRA */}
        <div className="relative mb-6 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-r from-[#031b33] via-[#08305c] to-[#0a3d75] border border-blue-900/40">
          {/* Imagem de Fundo com Fade de Obra */}
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
            {/* Lado Esquerdo: Ícone + Título */}
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

            {/* Tag / Destaque Visual */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Departamentos Principais</span>
            </div>
          </div>
        </div>

        {/* 🎡 CARROSSEL DE CARDS DE CATEGORIAS */}
        <div className="relative group/carousel">
          {/* Seta Esquerda */}
          <button
            onClick={scrollPrev}
            disabled={!prevBtnEnabled}
            className="absolute -left-3 sm:-left-5 top-[40%] -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xl border border-gray-200 dark:border-slate-700 flex items-center justify-center hover:bg-amber-400 hover:text-slate-950 hover:border-amber-400 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none transition-all duration-200"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Seta Direita */}
          <button
            onClick={scrollNext}
            disabled={!nextBtnEnabled}
            className="absolute -right-3 sm:-right-5 top-[40%] -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xl border border-gray-200 dark:border-slate-700 flex items-center justify-center hover:bg-amber-400 hover:text-slate-950 hover:border-amber-400 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none transition-all duration-200"
            aria-label="Próximo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Viewport do Carrossel */}
          <div className="overflow-hidden px-1 py-2" ref={emblaRef}>
            <div className="flex gap-3 sm:gap-4 md:gap-5">
              {categoriesList.map((cat) => (
                <div
                  key={cat.id}
                  className="flex-[0_0_155px] sm:flex-[0_0_185px] md:flex-[0_0_210px] select-none"
                >
                  <Link
                    href={`/categoria/${cat.slug}`}
                    className="group flex flex-col h-full rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-700/60 bg-[#071e36] hover:-translate-y-1.5"
                  >
                    {/* 📸 FOTO SUPERIOR (ALTA RESOLUÇÃO) */}
                    <div className="relative w-full h-32 sm:h-40 bg-slate-900 overflow-hidden">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=80';
                        }}
                      />
                      {/* Leve gradiente para transição suave com o corpo azul */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#071e36] via-transparent to-black/20 opacity-90" />
                    </div>

                    {/* 📦 CORPO AZUL COM ÍCONE, NOME E MICRO-DESCRIÇÃO */}
                    <div className="p-3 sm:p-4 flex flex-col justify-between flex-1 bg-[#071e36]">
                      <div className="space-y-1.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/50 flex items-center justify-center mb-2 shadow-inner">
                          {renderIcon(cat.iconName)}
                        </div>

                        <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-tight line-clamp-1 group-hover:text-amber-300 transition-colors">
                          {cat.name}
                        </h3>

                        <p className="text-[11px] sm:text-xs text-blue-200/80 leading-snug line-clamp-2 min-h-[32px]">
                          {cat.tagline}
                        </p>
                      </div>
                    </div>

                    {/* 🟡 BOTÃO CTA AMARELO DE ALTA CONVERSÃO */}
                    <div className="bg-amber-400 group-hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm py-2.5 px-3 text-center uppercase tracking-wide flex items-center justify-center gap-1.5 transition-colors shadow-sm mt-auto">
                      <span>Ver mais</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* 🔘 INDICADORES DE PAGINAÇÃO (DOTS) */}
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
