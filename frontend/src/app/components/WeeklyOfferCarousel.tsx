'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Flame, Tag } from 'lucide-react';
import ProductCard from './ProductCard';
import { useProducts } from '../hooks/useApi';

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  images: Array<{ url: string; alt?: string }>;
  sku: string;
  stock: number;
  brand?: string;
  featured: boolean;
}

export default function WeeklyOfferCarousel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const productsApi = useProducts();

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    slidesToScroll: 1, 
    align: 'start', 
    containScroll: 'trimSnaps',
    loop: true,
    breakpoints: {
      '(min-width: 640px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 4 }
    }
  });
  
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
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
    const loadOffers = async () => {
      try {
        setLoading(true);
        const res = await productsApi.getProducts({ active: true, limit: 12 });
        if (res && Array.isArray(res.products) && res.products.length > 0) {
          setProducts(res.products);
        }
      } catch (err) {
        console.error('Erro ao buscar ofertas da semana:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOffers();
  }, []);

  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-slate-900/60 border-t border-slate-800 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
              <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
              Preços Especiais de Lojistas Parceiros
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Ofertas da Semana para sua Obra
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Descontos válidos por tempo limitado com faturamento direto da distribuidora
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={scrollPrev}
              disabled={!prevBtnEnabled}
              className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-white hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-slate-800 transition"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollNext}
              disabled={!nextBtnEnabled}
              className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-white hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-slate-800 transition"
              aria-label="Próximo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="overflow-hidden -mx-2 px-2 sm:mx-0 sm:px-0" ref={emblaRef}>
          <div className="flex gap-2.5 sm:gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex-[0_0_46%] min-[400px]:flex-[0_0_46.5%] sm:flex-[0_0_31%] md:flex-[0_0_23.5%] lg:flex-[0_0_19%]"
              >
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  description={product.description}
                  sku={product.sku}
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
      </div>
    </section>
  );
}
