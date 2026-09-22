'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Sparkles } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import { useProducts } from '../hooks/useApi';
import Loading from './ui/Loading';
import Link from 'next/link';

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

export default function FeaturedProductsCarousel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'start',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 3 }
    }
  });
  
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const productsApi = useProducts();

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    const updateButtons = () => {
      setPrevBtnEnabled(emblaApi.canScrollPrev());
      setNextBtnEnabled(emblaApi.canScrollNext());
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', updateButtons);
    updateButtons();

    return () => {
      emblaApi.off('select', updateButtons);
    };
  }, [emblaApi]);

  const loadFeaturedProducts = async () => {
    try {
      setLoading(true);
      
      // Primeiro, tentar carregar produtos em destaque
      let response = await productsApi.getProducts({
        featured: true,
        active: true,
        limit: 10,
      });
      
      let featuredProducts = response.products || [];
      
      // Se não houver produtos em destaque suficientes, carregar produtos ativos
      if (featuredProducts.length < 6) {
        const additionalResponse = await productsApi.getProducts({
          active: true,
          limit: 10 - featuredProducts.length,
        });
        
        const additionalProducts = (additionalResponse.products || [])
          .filter(product => !featuredProducts.some(fp => fp.id === product.id));
        
        featuredProducts = [...featuredProducts, ...additionalProducts];
      }
      
      setProducts(featuredProducts);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-white via-orange-50/20 to-pink-50/10 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-64 mx-auto mb-4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <motion.div 
                key={i} 
                className="bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse rounded-2xl h-96 shadow-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Nossos Produtos</h2>
          <p className="text-center text-gray-600">Nenhum produto encontrado.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-white via-orange-50/20 to-pink-50/10 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-orange-200/10 to-pink-200/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-br from-blue-200/10 to-purple-200/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="text-center mb-12"
        >
          <motion.div 
            variants={itemVariants}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-8 w-8 text-orange-500" />
            </motion.div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
              Nossos Produtos
            </h2>
            <motion.div
              animate={{ rotate: [0, -360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-8 w-8 text-pink-500" />
            </motion.div>
          </motion.div>
          <motion.p 
            variants={itemVariants}
            className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
          >
            Descubra nossa seleção especial de produtos com as melhores ofertas e qualidade garantida
          </motion.p>
        </motion.div>
        
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="relative"
        >
          <div className="overflow-hidden rounded-2xl -mx-2 px-2 sm:mx-0 sm:px-0" ref={emblaRef}>
            <div className="flex gap-2.5 sm:gap-4">
              {products.map((product, index) => (
                <motion.div 
                  key={product.id} 
                  className="flex-[0_0_46%] min-[400px]:flex-[0_0_46.5%] sm:flex-[0_0_31%] md:flex-[0_0_23.5%] lg:flex-[0_0_19%]"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative group">
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      description={product.description}
                      images={product.images}
                      sku={product.sku}
                      stock={product.stock}
                      brand={product.brand}
                      isFeatured={product.featured}
                      showAddToCart={true}
                    />
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Enhanced Navigation Buttons */}
          <motion.button
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-xl border border-white/20 flex items-center justify-center transition-all duration-300 ${
              prevBtnEnabled 
                ? 'hover:bg-orange-500 hover:text-white hover:scale-110 text-gray-700 hover:shadow-orange-500/25' 
                : 'text-gray-400 cursor-not-allowed opacity-50'
            }`}
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!prevBtnEnabled}
            whileHover={{ scale: prevBtnEnabled ? 1.1 : 1 }}
            whileTap={{ scale: prevBtnEnabled ? 0.95 : 1 }}
          >
            <ChevronLeft className="h-6 w-6" />
          </motion.button>
          
          <motion.button
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-xl border border-white/20 flex items-center justify-center transition-all duration-300 ${
              nextBtnEnabled 
                ? 'hover:bg-orange-500 hover:text-white hover:scale-110 text-gray-700 hover:shadow-orange-500/25' 
                : 'text-gray-400 cursor-not-allowed opacity-50'
            }`}
            onClick={() => emblaApi?.scrollNext()}
            disabled={!nextBtnEnabled}
            whileHover={{ scale: nextBtnEnabled ? 1.1 : 1 }}
            whileTap={{ scale: nextBtnEnabled ? 0.95 : 1 }}
          >
            <ChevronRight className="h-6 w-6" />
          </motion.button>

          {/* Carousel indicators */}
          <div className="flex justify-center mt-8 gap-2">
            {products.map((_, index) => (
              <motion.button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  Math.floor(index / 3) === Math.floor(selectedIndex / 3)
                    ? 'bg-orange-500 scale-125 shadow-lg shadow-orange-500/50'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                onClick={() => emblaApi?.scrollTo(index)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </motion.div>

        {products.length > 3 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                href="/produtos" 
                className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-orange-500/25 group"
              >
                <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                Ver Todos os Produtos
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
