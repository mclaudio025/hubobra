'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import DepartmentShortcuts from './DepartmentShortcuts';
import ImmersiveHero from '../../components/ImmersiveHero';
import { HomeSection, useHomeSections } from '../hooks/useHomeSections';

/**
 * Carrossel Temático de Produtos (Padrão Acal)
 */
function ThematicProductCarousel({ section }: { section: HomeSection }) {
  const [products, setProducts] = useState<any[]>(section.products || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (section.products && section.products.length > 0) {
      setProducts(section.products);
      return;
    }

    let isMounted = true;
    const loadProducts = async () => {
      try {
        setLoading(true);
        let url = '/api/products?limit=12';
        if (section.productSource === 'category' && section.categorySlug) {
          url += `&search=${encodeURIComponent(section.categorySlug)}`;
        } else if (section.productSource === 'featured') {
          url += '&featured=true';
        }

        let res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
          res = await fetch('/api/products?limit=12', { cache: 'no-store' });
        }

        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data?.products)
            ? data.products
            : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
            ? data
            : [];

          if (isMounted) {
            if (items.length > 0) {
              setProducts(items);
            } else {
              // Fallback para todos os produtos se a categoria estiver vazia
              const fallbackRes = await fetch('/api/products?limit=12', { cache: 'no-store' });
              if (fallbackRes.ok) {
                const fbData = await fallbackRes.json();
                const fbItems = Array.isArray(fbData?.products) ? fbData.products : Array.isArray(fbData) ? fbData : [];
                if (isMounted && fbItems.length > 0) setProducts(fbItems);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar produtos para vitrine:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [section]);


  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    loop: false,
    dragFree: true,
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 640px)': { slidesToScroll: 2, dragFree: false },
      '(min-width: 1024px)': { slidesToScroll: 4, dragFree: false },
      '(min-width: 1280px)': { slidesToScroll: 5, dragFree: false },
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

  if (loading && products.length === 0) {
    return (
      <section className="py-6 sm:py-8 bg-transparent relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-64 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-64 bg-gray-100 dark:bg-slate-800/60 rounded-2xl animate-pulse border border-gray-200 dark:border-slate-700" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }


  const titleColor = section.titleColor || '#009de0';

  return (
    <section className="py-6 sm:py-8 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header da Vitrine no estilo Acal */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2
              className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight"
              style={{ color: titleColor }}
            >
              {section.title || 'Ofertas'}
            </h2>
            {section.subtitle && (
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {section.subtitle}
              </p>
            )}
          </div>

          {/* Seta de navegação compacta */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={scrollPrev}
              disabled={!prevBtnEnabled}
              className="w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-700 flex items-center justify-center hover:border-[#009de0] hover:text-[#009de0] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xs"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={scrollNext}
              disabled={!nextBtnEnabled}
              className="w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-700 flex items-center justify-center hover:border-[#009de0] hover:text-[#009de0] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xs"
              aria-label="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport do Carrossel */}
        <div className="overflow-hidden -mx-2 px-2 sm:mx-0 sm:px-0 select-none" ref={emblaRef} style={{ touchAction: 'pan-y' }}>
          <div className="flex gap-2.5 sm:gap-4 py-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex-[0_0_46%] min-[400px]:flex-[0_0_46.5%] sm:flex-[0_0_31%] md:flex-[0_0_23.5%] lg:flex-[0_0_19%]"
              >
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  comparePrice={product.comparePrice}
                  description={product.description}
                  sku={product.sku}
                  barcode={product.barcode}
                  stock={product.stock}
                  brand={product.brand}
                  isFeatured={product.featured}
                  images={product.images}
                  showAddToCart={true}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Indicadores / Dots e setas mobile */}
        {scrollSnaps.length > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={scrollPrev}
              disabled={!prevBtnEnabled}
              className="sm:hidden w-7 h-7 rounded-full border border-gray-300 bg-white text-gray-700 flex items-center justify-center disabled:opacity-30"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1.5">
              {scrollSnaps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollTo(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === selectedIndex
                      ? 'w-6 bg-[#009de0]'
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={scrollNext}
              disabled={!nextBtnEnabled}
              className="sm:hidden w-7 h-7 rounded-full border border-gray-300 bg-white text-gray-700 flex items-center justify-center disabled:opacity-30"
              aria-label="Próximo"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Banner Promocional Intercalado
 */
function InterstitialPromoBanner({ section }: { section: HomeSection }) {
  const imageUrl =
    section.bannerImageUrl ||
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&auto=format&fit=crop&q=80';
  const linkUrl = section.bannerLinkUrl || '/produtos';
  const altText = section.bannerAlt || section.title || 'Banner Promocional';

  return (
    <div className="py-2.5 sm:py-3.5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Link
        href={linkUrl}
        className="group relative block w-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200/80 dark:border-slate-800"
      >
        <div className="relative w-full h-28 sm:h-36 md:h-44 bg-slate-900 overflow-hidden">
          <img
            src={imageUrl}
            alt={altText}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&auto=format&fit=crop&q=80';
            }}
          />

          {/* Sutil overlay de hover */}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
        </div>
      </Link>
    </div>
  );
}

export default function DynamicHomeSections() {
  const { sections, loading, fetchPublicSections } = useHomeSections();

  useEffect(() => {
    fetchPublicSections();
  }, [fetchPublicSections]);

  if (loading && sections.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        <div className="h-44 bg-slate-900/40 rounded-2xl animate-pulse border border-slate-800" />
        <div className="h-64 bg-slate-900/40 rounded-2xl animate-pulse border border-slate-800" />
      </div>
    );
  }

  // Filtra estritamente para garantir que a rede de parceiros nunca renderize na home
  const homeSections = sections.filter(
    (s) => s.enabled && s.type !== 'partner_bar' && s.id !== 'partner-network-bar'
  );

  return (
    <div className="w-full space-y-2" suppressHydrationWarning>
      {homeSections.map((section) => {
        switch (section.type) {
          case 'hero':
            return <ImmersiveHero key={section.id} />;

          case 'department_shortcuts':
            return <DepartmentShortcuts key={section.id} />;

          case 'banner':
            return <InterstitialPromoBanner key={section.id} section={section} />;

          case 'product_carousel':
            return <ThematicProductCarousel key={section.id} section={section} />;

          default:
            return null;
        }
      })}
    </div>
  );
}
