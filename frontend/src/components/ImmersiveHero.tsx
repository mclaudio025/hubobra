'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowRight, Sparkles, Zap, Phone, ShoppingBag } from 'lucide-react';
import GlassOverlay from './ui/GlassOverlay';
import { getWhatsAppWholesaleLink } from '@/config/store.config';

// Componente de partículas CSS animadas aprimoradas
function AnimatedParticles() {
  const particles = [
    { id: 0, left: 10, top: 20, x: -5, duration: 5, delay: 0, size: 1.5, color: 'bg-orange-400/40' },
    { id: 1, left: 25, top: 60, x: 8, duration: 6, delay: 0.5, size: 2, color: 'bg-pink-400/30' },
    { id: 2, left: 45, top: 15, x: -10, duration: 4.5, delay: 1, size: 1.2, color: 'bg-yellow-400/35' },
    { id: 3, left: 70, top: 80, x: 12, duration: 7, delay: 1.5, size: 1.8, color: 'bg-red-400/30' },
    { id: 4, left: 85, top: 35, x: -8, duration: 5.5, delay: 2, size: 1.4, color: 'bg-orange-400/40' },
    { id: 5, left: 15, top: 75, x: 6, duration: 6.5, delay: 2.5, size: 2.2, color: 'bg-pink-400/30' },
    { id: 6, left: 55, top: 45, x: -12, duration: 4.8, delay: 0.8, size: 1.6, color: 'bg-yellow-400/35' },
    { id: 7, left: 90, top: 10, x: 9, duration: 5.8, delay: 1.8, size: 1.3, color: 'bg-red-400/30' },
    { id: 8, left: 35, top: 90, x: -7, duration: 6.2, delay: 0.3, size: 1.9, color: 'bg-orange-400/40' },
    { id: 9, left: 65, top: 25, x: 11, duration: 4.2, delay: 2.2, size: 1.7, color: 'bg-pink-400/30' },
    { id: 10, left: 5, top: 50, x: -9, duration: 5.2, delay: 1.2, size: 1.1, color: 'bg-yellow-400/35' },
    { id: 11, left: 80, top: 65, x: 7, duration: 6.8, delay: 0.7, size: 2.1, color: 'bg-red-400/30' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${particle.color} shadow-lg`}
          style={{
            width: `${particle.size * 2}px`,
            height: `${particle.size * 2}px`,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, particle.x, 0],
            opacity: [0.2, 0.9, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Componente de orbes flutuantes aprimoradas
function FloatingOrbs() {
  const orbs = [
    { id: 0, size: 120, left: 15, top: 25, x: -15, y: -20, duration: 8, delay: 0, gradient: 'from-orange-400/25 via-red-400/20 to-pink-400/25' },
    { id: 1, size: 90, left: 70, top: 60, x: 18, y: 25, duration: 9, delay: 1, gradient: 'from-yellow-400/20 via-orange-400/25 to-red-400/20' },
    { id: 2, size: 110, left: 40, top: 10, x: -12, y: -15, duration: 7, delay: 2, gradient: 'from-pink-400/20 via-purple-400/15 to-blue-400/20' },
    { id: 3, size: 85, left: 85, top: 80, x: 20, y: 30, duration: 10, delay: 0.5, gradient: 'from-red-400/25 via-orange-400/20 to-yellow-400/25' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className={`absolute rounded-full bg-gradient-to-br ${orb.gradient} backdrop-blur-sm shadow-2xl`}
          style={{
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            left: `${orb.left}%`,
            top: `${orb.top}%`,
            filter: 'blur(1px)',
          }}
          animate={{
            y: [0, orb.y, 0],
            x: [0, orb.x, 0],
            scale: [0.8, 1.3, 0.8],
            opacity: [0.1, 0.6, 0.1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            delay: orb.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Componente principal ImmersiveHero
export default function ImmersiveHero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const playVideo = async () => {
      const video = videoRef.current;
      if (video && video.isConnected && !video.paused) {
        try {
          setTimeout(async () => {
            if (video.isConnected) {
              await video.play();
            }
          }, 100);
        } catch (error) {
          console.error('❌ Video play failed:', error);
        }
      }
    };

    playVideo();

    return () => {
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    };
  }, []);
  
  return (
    <>
      {/* ========================================================================= */}
      {/* 📱 MOBILE COMPACT HERO (Ultra-direto para não empurrar os produtos) */}
      {/* ========================================================================= */}
      <div className="block md:hidden px-3 pt-2 pb-1">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/80 p-3.5 border border-orange-500/30 shadow-lg text-white">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Tag & Mini Header */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-[10px] font-bold text-orange-300">
              <Sparkles className="w-3 h-3 text-orange-400" />
              <span>HubObra • Marketplace</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
              ⚡ Entrega até 24h
            </span>
          </div>

          {/* Heading Compacto */}
          <h1 className="text-base font-black tracking-tight leading-snug mb-2.5 text-white">
            O Maior Estoque da Região,{' '}
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
              Direto na sua Obra.
            </span>
          </h1>

          {/* Quick Action Buttons (Linha compacta) */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href="/produtos"
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl font-bold text-slate-950 text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-transform"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Ver Produtos</span>
            </a>

            <a
              href={getWhatsAppWholesaleLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md active:scale-95 transition-transform"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Cotar WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 💻 DESKTOP & TABLET IMMERSIVE HERO (Experiência Completa e Espaçosa) */}
      {/* ========================================================================= */}
      <section className="hidden md:flex relative min-h-[420px] lg:min-h-[460px] w-full overflow-hidden py-10 lg:py-14 items-center">
        {/* Vídeo de fundo */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-red-500 via-pink-600 to-purple-700 animate-gradient-x" />
            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 via-transparent to-blue-500/20 animate-pulse" />
            
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover opacity-80"
              autoPlay
              muted
              loop
              playsInline
              poster="/hero-poster.jpg"
              onError={() => console.warn('🎬 Video failed to load, using fallback background')}
            >
              <source src="https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-heights-in-a-sunset-26070-large.mp4" type="video/mp4" />
            </video>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-br from-black/65 via-black/20 to-orange-950/50" />
        </div>

        {/* Animações CSS */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <FloatingOrbs />
          <AnimatedParticles />
        </div>

        {/* Overlay com glassmorphism */}
        <div className="relative z-20 w-full">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Conteúdo principal */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="text-left"
              >
                {/* Badge */}
                <GlassOverlay
                  variant="base"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-3 w-fit bg-slate-900/80 border border-orange-500/30"
                  delay={0.1}
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-xs sm:text-sm font-bold text-orange-300">
                    🏗️ HubObra • Lojas Parceiras Conectadas
                  </span>
                </GlassOverlay>

                {/* Título principal */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3 leading-[1.1] tracking-tight text-white"
                  style={{
                    textShadow: '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(251,146,60,0.3)'
                  }}
                >
                  O Maior Estoque da Região,{' '}
                  <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
                    Direto na sua Obra.
                  </span>
                </motion.h1>

                {/* Subtítulo */}
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-sm sm:text-base font-normal text-slate-200 mb-5 max-w-2xl leading-relaxed"
                  style={{
                    textShadow: '0 2px 10px rgba(0,0,0,0.8)'
                  }}
                >
                  Conectamos você aos melhores depósitos e lojas de materiais da sua cidade. Compre com entrega rápida em até 24h e receba cotações automáticas com nosso{' '}
                  <span className="text-amber-300 font-bold">
                    Consultor Zé da Obra IA
                  </span>.
                </motion.p>

                {/* Trust Metric Badges */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="grid grid-cols-3 gap-3 mb-6 max-w-lg"
                >
                  <div className="bg-slate-950/70 backdrop-blur-md border border-white/10 rounded-xl p-2.5 text-center">
                    <div className="text-orange-400 font-black text-base lg:text-lg">+3.000</div>
                    <div className="text-[11px] text-slate-300">Produtos no App</div>
                  </div>
                  <div className="bg-slate-950/70 backdrop-blur-md border border-white/10 rounded-xl p-2.5 text-center">
                    <div className="text-emerald-400 font-black text-base lg:text-lg">Até 24h</div>
                    <div className="text-[11px] text-slate-300">Entrega na Obra</div>
                  </div>
                  <div className="bg-slate-950/70 backdrop-blur-md border border-white/10 rounded-xl p-2.5 text-center">
                    <div className="text-amber-400 font-black text-base lg:text-lg">100%</div>
                    <div className="text-[11px] text-slate-300">Estoque Real</div>
                  </div>
                </motion.div>

                {/* CTAs */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="flex flex-row gap-3"
                >
                  <a
                    href="/produtos"
                    className="group relative px-6 py-3 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-xl font-bold text-slate-950 shadow-xl hover:shadow-orange-500/30 transition-all duration-300 text-center flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <span>Explorar Catálogo</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>

                  <a
                    href={getWhatsAppWholesaleLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group px-6 py-3 rounded-xl font-bold text-white bg-slate-900/80 hover:bg-slate-900 border border-white/20 hover:border-orange-500/50 transition-all duration-300 text-center flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Cotação de Obra no WhatsApp</span>
                  </a>
                </motion.div>
              </motion.div>

              {/* Card de assistentes IA */}
              <div className="hidden lg:block">
                <GlassOverlay
                  variant="intense"
                  className="p-6 bg-slate-950/70 border border-white/10 rounded-2xl"
                  delay={0.6}
                >
                  <motion.h3 
                    className="text-lg font-bold mb-4 text-white"
                    whileHover={{ scale: 1.02 }}
                  >
                    Assistentes Inteligentes de Obra
                  </motion.h3>
                  
                  {/* Lia */}
                  <div className="mb-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">L</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-blue-200">
                          Lia
                        </h4>
                        <p className="text-[11px] text-blue-300 font-medium">Atendente Virtual</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-300">
                      Assistente pessoal para encontrar produtos e tirar dúvidas.
                    </p>
                  </div>

                  {/* Zé da Obra */}
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">Z</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-orange-200">
                          Zé da Obra
                        </h4>
                        <p className="text-[11px] text-orange-300 font-medium">Especialista Técnico</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-300">
                      Consultoria especializada e cálculos de materiais para sua obra.
                    </p>
                  </div>
                </GlassOverlay>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}