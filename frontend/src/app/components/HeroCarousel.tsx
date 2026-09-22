'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useBanners } from '../hooks/useApi';
import { useSettings } from '../hooks/useSettings';
import Loading from './ui/Loading';
import { designTokens } from '../../styles/design-tokens';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl?: string;
  bgColor?: string;
  textColor: string;
}

export default function HeroCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    duration: 30
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const bannersApi = useBanners();
  const { getCarouselInterval, loading: settingsLoading } = useSettings();

  // Animações de entrada sofisticadas
  const containerVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.95,
      rotateX: 10
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotateX: 0,
      transition: {
        duration: 1.2,
        type: "spring",
        stiffness: 100,
        damping: 20,
        mass: 1,
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { 
      y: 60, 
      opacity: 0,
      scale: 0.8,
      rotateY: -15,
      z: -100
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      z: 0,
      transition: {
        duration: 0.8,
        type: "spring",
        stiffness: 120,
        damping: 15,
        mass: 0.8
      }
    }
  };

  const bannerVariants = {
    hidden: {
      opacity: 0,
      x: 100,
      scale: 0.9,
      rotateY: 20
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      rotateY: 0,
      transition: {
        duration: 1,
        type: "spring",
        stiffness: 80,
        damping: 20
      }
    },
    exit: {
      opacity: 0,
      x: -100,
      scale: 0.9,
      rotateY: -20,
      transition: {
        duration: 0.6,
        ease: "easeInOut"
      }
    }
  };


  useEffect(() => {
    loadHeroBanners();
  }, []);

  const loadHeroBanners = async () => {
    
    try {
      setLoading(true);
      const response = await bannersApi.getBanners({
        type: 'HERO',
        active: true,
      });
      setBanners(response || []);
    } catch (error) {
      console.error('Erro ao carregar banners hero:', error);
      // Fallback para banners estáticos em caso de erro
      setBanners([
        {
          id: '1',
          title: "Materiais de Construção",
          subtitle: "Tudo para sua obra com qualidade e preço justo",
          description: "Encontre cimento, tijolos, telhas e muito mais",
          buttonText: "Ver Produtos",
          buttonLink: "/produtos",
          bgColor: "from-orange-600 to-orange-700",
          textColor: "text-white"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi || banners.length === 0 || settingsLoading) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    // Auto-play apenas se houver mais de um banner
    let autoplay: NodeJS.Timeout | null = null;
    if (banners.length > 1) {
      const interval = getCarouselInterval();
      autoplay = setInterval(() => {
        emblaApi.scrollNext();
      }, interval);
    }

    return () => {
      if (autoplay) clearInterval(autoplay);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect, banners.length, settingsLoading, getCarouselInterval]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (loading) {
    return (
      <motion.section 
        className="relative h-96 md:h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Loading size="lg" text="Carregando banners..." />
      </motion.section>
    );
  }

  if (banners.length === 0) {
    return (
      <motion.section 
        className="relative h-96 md:h-[500px] bg-gradient-hero flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <motion.div 
          className="text-center text-white z-10 relative"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
            Bem-vindo à Loja Moderna
          </h1>
          <p className="text-xl md:text-2xl opacity-90">Materiais de construção com qualidade</p>
        </motion.div>
        {/* Efeito de partículas de fundo */}
        <div className="absolute inset-0 opacity-10">
          {/* Fixed position particles to avoid hydration issues */}
          {[
            { left: '10%', top: '15%', duration: 3, delay: 0 },
            { left: '25%', top: '35%', duration: 3.5, delay: 0.2 },
            { left: '40%', top: '20%', duration: 4, delay: 0.4 },
            { left: '55%', top: '45%', duration: 3.2, delay: 0.6 },
            { left: '70%', top: '25%', duration: 4.5, delay: 0.8 },
            { left: '85%', top: '40%', duration: 3.8, delay: 1.0 },
            { left: '15%', top: '60%', duration: 3.3, delay: 1.2 },
            { left: '30%', top: '75%', duration: 4.2, delay: 1.4 },
            { left: '45%', top: '65%', duration: 3.7, delay: 1.6 },
            { left: '60%', top: '80%', duration: 4.1, delay: 1.8 },
            { left: '75%', top: '70%', duration: 3.6, delay: 2.0 },
            { left: '90%', top: '85%', duration: 4.3, delay: 0.3 },
            { left: '5%', top: '50%', duration: 3.9, delay: 0.5 },
            { left: '20%', top: '90%', duration: 3.4, delay: 0.7 },
            { left: '35%', top: '10%', duration: 4.4, delay: 0.9 },
            { left: '50%', top: '55%', duration: 3.1, delay: 1.1 },
            { left: '65%', top: '5%', duration: 4.6, delay: 1.3 },
            { left: '80%', top: '60%', duration: 3.5, delay: 1.5 },
            { left: '95%', top: '30%', duration: 4.0, delay: 1.7 },
            { left: '12%', top: '95%', duration: 3.8, delay: 1.9 }
          ].map((particle, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                left: particle.left,
                top: particle.top,
              }}
              animate={{
                y: [-20, 20],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: particle.delay,
              }}
            />
          ))}
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section 
      className="relative w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.8 }}
    >
      {/* Elementos decorativos de fundo animados */}
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 0.8, 1.2],
          opacity: [0.4, 0.7, 0.4],
          rotate: [360, 180, 0]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-yellow-500/15 to-orange-500/15 rounded-full blur-2xl"
        animate={{
          scale: [0.8, 1.4, 0.8],
          opacity: [0.2, 0.5, 0.2]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Fixed floating particles */}
      {[
        { left: '8%', top: '12%', duration: 8, delay: 0 },
        { left: '22%', top: '28%', duration: 9, delay: 1 },
        { left: '38%', top: '18%', duration: 10, delay: 2 },
        { left: '52%', top: '42%', duration: 11, delay: 3 },
        { left: '68%', top: '22%', duration: 12, delay: 4 },
        { left: '82%', top: '38%', duration: 8.5, delay: 0.5 },
        { left: '12%', top: '58%', duration: 9.5, delay: 1.5 },
        { left: '28%', top: '72%', duration: 10.5, delay: 2.5 },
        { left: '42%', top: '62%', duration: 11.5, delay: 3.5 },
        { left: '58%', top: '78%', duration: 8.2, delay: 4.5 },
        { left: '72%', top: '68%', duration: 9.8, delay: 0.8 },
        { left: '88%', top: '82%', duration: 10.2, delay: 1.8 }
      ].map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white/30 rounded-full"
          style={{
            left: particle.left,
            top: particle.top,
          }}
          animate={{
            y: [-20, -100, -20],
            x: [-10, 10, -10],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          <AnimatePresence mode="wait">
            {banners.map((banner, index) => (
              <motion.div 
                className="flex-[0_0_100%] min-w-0 relative" 
                key={banner.id}
                variants={bannerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="relative h-96 md:h-[500px] overflow-hidden">
                  {/* Background com efeito parallax aprimorado */}
                  <motion.div
                    className="absolute inset-0 z-0"
                    initial={{ scale: 1.2, rotateZ: 2 }}
                    animate={{ scale: 1, rotateZ: 0 }}
                    transition={{ 
                      duration: 1.5, 
                      type: "spring",
                      stiffness: 60,
                      damping: 20
                    }}
                  >
                    {/* Efeito de brilho dinâmico no background */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{
                        x: ["-100%", "100%"],
                        opacity: [0, 0.5, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 2,
                        ease: "easeInOut"
                      }}
                    />
                    {banner.imageUrl ? (
                      <div 
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${banner.imageUrl})` }}
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgColor || 'bg-gradient-hero'}`} />
                    )}
                  </motion.div>
                  
                  {/* Overlay com glassmorphism aprimorado */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-transparent z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  />
                  
                  {/* Fixed banner particles */}
                  {[
                    { left: '25%', top: '30%', duration: 4, delay: 0 },
                    { left: '45%', top: '25%', duration: 5, delay: 1 },
                    { left: '65%', top: '35%', duration: 6, delay: 2 },
                    { left: '35%', top: '55%', duration: 4.5, delay: 0.5 },
                    { left: '55%', top: '65%', duration: 5.5, delay: 1.5 },
                    { left: '75%', top: '60%', duration: 4.8, delay: 2.5 }
                  ].map((particle, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-orange-400/60 rounded-full"
                      style={{
                        left: particle.left,
                        top: particle.top,
                      }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                        rotate: [0, 360]
                      }}
                      transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        delay: particle.delay,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                  
                  {/* Content com animações sofisticadas */}
                  <div className="relative h-full flex items-center z-20">
                    <div className="container mx-auto px-4">
                      <motion.div 
                        className={`max-w-2xl ${banner.textColor}`}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {/* Brilho de fundo para o conteúdo */}
                        <motion.div
                          className="absolute -inset-4 bg-gradient-to-r from-orange-500/10 to-transparent rounded-2xl blur-xl"
                          animate={{
                            scale: [1, 1.05, 1],
                            opacity: [0.3, 0.6, 0.3]
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        
                        <motion.h1 
                          className="relative text-4xl md:text-6xl font-bold mb-4 leading-tight bg-gradient-to-r from-white via-orange-100 to-white bg-clip-text text-transparent"
                          initial={{ y: 40, opacity: 0, scale: 0.9, rotateX: 20 }}
                          animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
                          transition={{ 
                            delay: 0.6, 
                            duration: 0.8,
                            type: "spring",
                            stiffness: 100,
                            damping: 15
                          }}
                          whileHover={{
                            scale: 1.02,
                            textShadow: "0 0 20px rgba(255,255,255,0.5)"
                          }}
                        >
                          {banner.title}
                          
                          {/* Efeito de brilho no título */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{
                              x: ["-100%", "100%"]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 3,
                              ease: "easeInOut"
                            }}
                          />
                        </motion.h1>
                        {banner.subtitle && (
                          <motion.p 
                            className="relative text-xl md:text-2xl mb-2 font-medium text-orange-100"
                            initial={{ y: 30, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ 
                              delay: 0.8, 
                              duration: 0.7,
                              type: "spring",
                              stiffness: 120,
                              damping: 12
                            }}
                            whileHover={{
                              scale: 1.01,
                              color: "#fed7aa"
                            }}
                          >
                            {banner.subtitle}
                            
                            {/* Pontos decorativos */}
                            {[...Array(3)].map((_, i) => (
                              <motion.span
                                key={i}
                                className="inline-block w-1 h-1 bg-orange-400 rounded-full ml-2"
                                animate={{
                                  scale: [1, 1.5, 1],
                                  opacity: [0.5, 1, 0.5]
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  delay: i * 0.3,
                                  ease: "easeInOut"
                                }}
                              />
                            ))}
                          </motion.p>
                        )}
                        {banner.description && (
                          <motion.p 
                            className="relative text-lg mb-8 opacity-90 text-gray-200"
                            initial={{ y: 25, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ 
                              delay: 1, 
                              duration: 0.6,
                              ease: "easeOut"
                            }}
                            whileHover={{
                              opacity: 1,
                              y: -2
                            }}
                          >
                            {banner.description}
                            
                            {/* Efeito de brilho sutil */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded"
                              initial={{ opacity: 0 }}
                              whileHover={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            />
                          </motion.p>
                        )}
                        {banner.buttonText && banner.buttonLink && (
                          <motion.div
                            initial={{ y: 30, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ 
                              delay: 1.2, 
                              duration: 0.7,
                              type: "spring",
                              stiffness: 100,
                              damping: 15
                            }}
                          >
                            <Link
                              href={banner.buttonLink}
                              className="group inline-block"
                            >
                              <motion.div
                                className="relative glass px-8 py-4 rounded-xl font-semibold text-lg text-white border border-white/20 shadow-glow backdrop-blur-md overflow-hidden"
                                whileHover={{ 
                                  scale: 1.05,
                                  rotateY: 5,
                                  z: 50,
                                  boxShadow: "0 25px 50px rgba(255,165,0,0.3)"
                                }}
                                whileTap={{ 
                                  scale: 0.98,
                                  rotateY: 0,
                                  z: 0
                                }}
                                transition={{ 
                                  type: "spring", 
                                  stiffness: 300, 
                                  damping: 20,
                                  mass: 0.8
                                }}
                              >
                                {/* Brilho de fundo do botão */}
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl"
                                  animate={{
                                    scale: [1, 1.1, 1],
                                    opacity: [0.3, 0.6, 0.3]
                                  }}
                                  transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                />
                                
                                {/* Anel pulsante */}
                                <motion.div
                                  className="absolute inset-0 border-2 border-orange-400/50 rounded-xl"
                                  animate={{
                                    scale: [1, 1.05, 1],
                                    opacity: [0.5, 0.8, 0.5]
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                />
                                
                                <span className="relative z-10">{banner.buttonText}</span>
                                
                                {/* Efeito de passagem de luz */}
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-xl"
                                  initial={{ x: "-100%" }}
                                  whileHover={{ x: "100%" }}
                                  transition={{ duration: 0.8, ease: "easeInOut" }}
                                />
                                
                                {/* Partículas flutuantes no hover */}
                                {[...Array(4)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 bg-orange-300 rounded-full"
                                    style={{
                                      left: `${25 + i * 20}%`,
                                      top: `${30 + (i % 2) * 40}%`,
                                    }}
                                    initial={{ scale: 0, opacity: 0 }}
                                    whileHover={{
                                      scale: [0, 1, 0],
                                      opacity: [0, 1, 0],
                                      y: [-10, -20, -10]
                                    }}
                                    transition={{
                                      duration: 1.5,
                                      delay: i * 0.1,
                                      ease: "easeOut"
                                    }}
                                  />
                                ))}
                              </motion.div>
                            </Link>
                          </motion.div>
                        )}
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Efeito de brilho no canto */}
                  <motion.div
                    className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/20 to-transparent rounded-full blur-xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Buttons aprimorados - apenas se houver mais de um banner */}
      {banners.length > 1 && (
        <>
          <motion.button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 glass text-white p-4 rounded-full border border-white/20 shadow-glow backdrop-blur-md z-30 overflow-hidden"
            aria-label="Slide anterior"
            whileHover={{ 
              scale: 1.15,
              rotateY: -10,
              z: 50,
              boxShadow: "0 15px 40px rgba(255,165,0,0.4)"
            }}
            whileTap={{ 
              scale: 0.9,
              rotateY: 0,
              z: 0
            }}
            initial={{ opacity: 0, x: -30, rotateY: -20 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ 
              delay: 0.6, 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              mass: 0.8
            }}
          >
            {/* Brilho de fundo */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-orange-500/30 to-transparent rounded-full"
              initial={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Efeito de passagem de luz */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
            
            {/* Partículas flutuantes */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-orange-300 rounded-full"
                style={{
                  left: `${30 + i * 20}%`,
                  top: `${30 + i * 20}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                whileHover={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  x: [-5, 5, -5]
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}
            
            <motion.div
              whileHover={{ x: -3, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <ChevronLeft className="h-6 w-6 relative z-10" />
            </motion.div>
          </motion.button>
          
          <motion.button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 glass text-white p-4 rounded-full border border-white/20 shadow-glow backdrop-blur-md z-30 overflow-hidden"
            aria-label="Próximo slide"
            whileHover={{ 
              scale: 1.15,
              rotateY: 10,
              z: 50,
              boxShadow: "0 15px 40px rgba(255,165,0,0.4)"
            }}
            whileTap={{ 
              scale: 0.9,
              rotateY: 0,
              z: 0
            }}
            initial={{ opacity: 0, x: 30, rotateY: 20 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ 
              delay: 0.6, 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              mass: 0.8
            }}
          >
            {/* Brilho de fundo */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-l from-orange-500/30 to-transparent rounded-full"
              initial={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Efeito de passagem de luz */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
            
            {/* Partículas flutuantes */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-orange-300 rounded-full"
                style={{
                  right: `${30 + i * 20}%`,
                  top: `${30 + i * 20}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                whileHover={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  x: [5, -5, 5]
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}
            
            <motion.div
              whileHover={{ x: 3, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <ChevronRight className="h-6 w-6 relative z-10" />
            </motion.div>
          </motion.button>

          {/* Dots Indicator aprimorados com glassmorphism */}
          <motion.div 
            className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4 glass-subtle px-6 py-3 rounded-full border border-white/10 backdrop-blur-md z-30 overflow-hidden"
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 20 }}
          >
            {/* Brilho de fundo animado */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-orange-400/20 to-orange-500/10 rounded-full"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {banners.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => scrollTo(index)}
                className={`relative w-4 h-4 rounded-full transition-all duration-300 overflow-hidden ${
                  index === selectedIndex
                    ? 'bg-orange-500 shadow-lg shadow-orange-500/50'
                    : 'bg-white/40 hover:bg-white/60'
                }`}
                whileHover={{ 
                  scale: 1.3,
                  rotateZ: 180,
                  y: -2
                }}
                whileTap={{ 
                  scale: 0.8,
                  rotateZ: 0,
                  y: 0
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  delay: 0.9 + index * 0.1,
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
                aria-label={`Ir para slide ${index + 1}`}
              >
                {/* Brilho pulsante para indicador ativo */}
                {index === selectedIndex && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
                
                {/* Efeito de passagem de luz no hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full"
                  initial={{ x: "-100%", opacity: 0 }}
                  whileHover={{ x: "100%", opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
                
                {/* Anel pulsante para indicador ativo */}
                {index === selectedIndex && (
                  <motion.div
                    className="absolute -inset-1 border-2 border-orange-300/60 rounded-full"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.6, 0.2, 0.6]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
                
                {/* Partículas flutuantes para indicador ativo */}
                {index === selectedIndex && (
                  <>
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-0.5 h-0.5 bg-orange-200 rounded-full"
                        style={{
                          left: `${20 + i * 15}%`,
                          top: `${20 + i * 15}%`,
                        }}
                        animate={{
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                          x: [0, Math.cos(i * 90) * 8, 0],
                          y: [0, Math.sin(i * 90) * 8, 0]
                        }}
                        transition={{
                          duration: 2,
                          delay: i * 0.2,
                          repeat: Infinity,
                          ease: "easeOut"
                        }}
                      />
                    ))}
                  </>
                )}
                
                {/* Partículas de hover */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={`hover-${i}`}
                    className="absolute w-0.5 h-0.5 bg-white rounded-full"
                    style={{
                      left: `${30 + i * 20}%`,
                      top: `${30 + i * 20}%`,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                      x: [0, (i - 1) * 6, 0],
                      y: [0, (i - 1) * 6, 0]
                    }}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.1,
                      ease: "easeOut"
                    }}
                  />
                ))}
                
                {index === selectedIndex && (
                  <motion.div
                    className="absolute inset-0 bg-white rounded-full"
                    layoutId="activeIndicator"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        </>
       )}
     </motion.section>
   );
}
