'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "João Silva",
    role: "Engenheiro Civil",
    company: "Construtora Silva & Cia",
    content: "A qualidade dos materiais é excepcional. Já realizei várias obras com os produtos da Loja Moderna e sempre superam as expectativas.",
    rating: 5,
    avatar: "/avatars/joao.jpg"
  },
  {
    id: 2,
    name: "Maria Santos",
    role: "Arquiteta",
    company: "MS Arquitetura",
    content: "O atendimento é personalizado e a variedade de produtos sustentáveis é impressionante. Recomendo para todos os meus clientes.",
    rating: 5,
    avatar: "/avatars/maria.jpg"
  },
  {
    id: 3,
    name: "Pedro Costa",
    role: "Mestre de Obras",
    company: "Construções Costa",
    content: "Trabalho há 20 anos na construção civil e posso afirmar que a Loja Moderna oferece os melhores materiais da região.",
    rating: 5,
    avatar: "/avatars/pedro.jpg"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20
    }
  }
};

export default function TestimonialsCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-blue-200/10 to-purple-200/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-gradient-to-br from-orange-200/10 to-pink-200/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="text-center mb-12"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-800 via-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            O que nossos clientes dizem
          </motion.h2>
          <motion.p 
            variants={itemVariants}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Depoimentos reais de profissionais que confiam na nossa qualidade
          </motion.p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative"
        >
          {/* Navigation buttons */}
          <motion.button
            variants={itemVariants}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-xl border border-white/20 flex items-center justify-center transition-all duration-300 ${
              prevBtnEnabled 
                ? 'hover:bg-blue-500 hover:text-white hover:scale-110 text-gray-700 hover:shadow-blue-500/25' 
                : 'text-gray-400 cursor-not-allowed opacity-50'
            }`}
            onClick={scrollPrev}
            disabled={!prevBtnEnabled}
            whileHover={{ scale: prevBtnEnabled ? 1.1 : 1 }}
            whileTap={{ scale: prevBtnEnabled ? 0.95 : 1 }}
          >
            <ChevronLeft className="h-6 w-6" />
          </motion.button>
          
          <motion.button
            variants={itemVariants}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-xl border border-white/20 flex items-center justify-center transition-all duration-300 ${
              nextBtnEnabled 
                ? 'hover:bg-blue-500 hover:text-white hover:scale-110 text-gray-700 hover:shadow-blue-500/25' 
                : 'text-gray-400 cursor-not-allowed opacity-50'
            }`}
            onClick={scrollNext}
            disabled={!nextBtnEnabled}
            whileHover={{ scale: nextBtnEnabled ? 1.1 : 1 }}
            whileTap={{ scale: nextBtnEnabled ? 0.95 : 1 }}
          >
            <ChevronRight className="h-6 w-6" />
          </motion.button>

          {/* Carousel */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {testimonials.map((testimonial) => (
                <motion.div
                  key={testimonial.id}
                  variants={itemVariants}
                  className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
                >
                  <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 h-full relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                    {/* Quote icon */}
                    <div className="absolute top-4 right-4 text-blue-100 group-hover:text-blue-200 transition-colors">
                      <Quote className="w-8 h-8" />
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-4">
                      {renderStars(testimonial.rating)}
                    </div>

                    {/* Content */}
                    <p className="text-gray-700 mb-6 leading-relaxed text-lg">
                      "{testimonial.content}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">
                          {testimonial.name}
                        </h4>
                        <p className="text-gray-600">
                          {testimonial.role}
                        </p>
                        <p className="text-blue-600 font-medium text-sm">
                          {testimonial.company}
                        </p>
                      </div>
                    </div>

                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}