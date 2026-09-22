'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowRight, Sparkles, Zap } from 'lucide-react';
import GlassOverlay from './ui/GlassOverlay';
import { getWhatsAppWholesaleLink } from '@/config/store.config';

// Componente de partículas CSS animadas aprimoradas
function AnimatedParticles() {
  // Posições fixas predefinidas para evitar problemas de hidratação
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
    { id: 12, left: 20, top: 5, x: -6, duration: 4.7, delay: 1.7, size: 1.4, color: 'bg-orange-400/40' },
    { id: 13, left: 50, top: 85, x: 10, duration: 5.9, delay: 0.9, size: 1.8, color: 'bg-pink-400/30' },
    { id: 14, left: 75, top: 40, x: -11, duration: 6.3, delay: 2.3, size: 1.6, color: 'bg-yellow-400/35' },
    { id: 15, left: 95, top: 70, x: 8, duration: 4.4, delay: 1.4, size: 1.2, color: 'bg-red-400/30' },
    { id: 16, left: 30, top: 30, x: -8, duration: 5.6, delay: 0.6, size: 2, color: 'bg-orange-400/40' },
    { id: 17, left: 60, top: 55, x: 9, duration: 6.1, delay: 2.1, size: 1.5, color: 'bg-pink-400/30' },
    { id: 18, left: 12, top: 85, x: -7, duration: 4.9, delay: 1.9, size: 1.7, color: 'bg-yellow-400/35' },
    { id: 19, left: 88, top: 20, x: 12, duration: 5.4, delay: 0.4, size: 1.3, color: 'bg-red-400/30' }
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
            y: [0, -40, 0],
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
  // Posições fixas predefinidas para evitar problemas de hidratação
  const orbs = [
    { id: 0, size: 120, left: 15, top: 25, x: -15, y: -20, duration: 8, delay: 0, gradient: 'from-orange-400/25 via-red-400/20 to-pink-400/25' },
    { id: 1, size: 90, left: 70, top: 60, x: 18, y: 25, duration: 9, delay: 1, gradient: 'from-yellow-400/20 via-orange-400/25 to-red-400/20' },
    { id: 2, size: 110, left: 40, top: 10, x: -12, y: -15, duration: 7, delay: 2, gradient: 'from-pink-400/20 via-purple-400/15 to-blue-400/20' },
    { id: 3, size: 85, left: 85, top: 80, x: 20, y: 30, duration: 10, delay: 0.5, gradient: 'from-red-400/25 via-orange-400/20 to-yellow-400/25' },
    { id: 4, size: 95, left: 25, top: 75, x: -18, y: -25, duration: 8.5, delay: 1.5, gradient: 'from-orange-400/25 via-red-400/20 to-pink-400/25' },
    { id: 5, size: 130, left: 60, top: 35, x: 15, y: 20, duration: 9.5, delay: 2.5, gradient: 'from-yellow-400/20 via-orange-400/25 to-red-400/20' },
    { id: 6, size: 75, left: 5, top: 50, x: -10, y: -18, duration: 7.5, delay: 3, gradient: 'from-pink-400/20 via-purple-400/15 to-blue-400/20' },
    { id: 7, size: 105, left: 90, top: 15, x: 12, y: 22, duration: 8.8, delay: 0.8, gradient: 'from-red-400/25 via-orange-400/20 to-yellow-400/25' },
    { id: 8, size: 80, left: 35, top: 85, x: -16, y: -28, duration: 6.5, delay: 1.8, gradient: 'from-orange-400/25 via-red-400/20 to-pink-400/25' },
    { id: 9, size: 115, left: 75, top: 45, x: 14, y: 18, duration: 9.2, delay: 2.8, gradient: 'from-yellow-400/20 via-orange-400/25 to-red-400/20' },
    { id: 10, size: 88, left: 50, top: 70, x: -14, y: -22, duration: 7.8, delay: 3.5, gradient: 'from-pink-400/20 via-purple-400/15 to-blue-400/20' },
    { id: 11, size: 125, left: 20, top: 20, x: 16, y: 26, duration: 8.2, delay: 1.2, gradient: 'from-red-400/25 via-orange-400/20 to-yellow-400/25' }
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
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const playVideo = async () => {
      const video = videoRef.current;
      if (video && video.isConnected && !video.paused) {
        try {
          // Aguardar um pouco para garantir que o DOM esteja pronto
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

    // Cleanup function
    return () => {
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    };
  }, []);
  
  return (
    <section className="relative min-h-[380px] sm:min-h-[430px] lg:min-h-[460px] w-full overflow-hidden py-8 sm:py-12 flex items-center">
      {/* Vídeo de fundo */}
      <div className="absolute inset-0 z-0">
        {/* Vídeo de fundo com fallback */}
        <div className="absolute inset-0 w-full h-full">
          {/* Fallback gradient background aprimorado */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-red-500 via-pink-600 to-purple-700 animate-gradient-x" />
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 via-transparent to-blue-500/20 animate-pulse" />
          
          {/* Video overlay */}
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
            Seu navegador não suporta vídeos HTML5.
          </video>
        </div>
        
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-transparent to-orange-900/40" />
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
              className="text-center lg:text-left"
            >
              {/* Badge */}
              <GlassOverlay
                variant="base"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-3 w-fit bg-slate-900/80 border border-orange-500/30"
                delay={0.1}
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs sm:text-sm font-bold text-orange-300">
                  🏗️ HubConstruções • Lojas Parceiras Conectadas
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
                className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 max-w-lg"
              >
                <div className="bg-slate-950/60 backdrop-blur-md border border-white/10 rounded-xl p-2 text-center">
                  <div className="text-orange-400 font-black text-sm sm:text-base">+3.000</div>
                  <div className="text-[10px] sm:text-xs text-slate-300">Produtos no App</div>
                </div>
                <div className="bg-slate-950/60 backdrop-blur-md border border-white/10 rounded-xl p-2 text-center">
                  <div className="text-emerald-400 font-black text-sm sm:text-base">Até 24h</div>
                  <div className="text-[10px] sm:text-xs text-slate-300">Entrega na Obra</div>
                </div>
                <div className="bg-slate-950/60 backdrop-blur-md border border-white/10 rounded-xl p-2 text-center">
                  <div className="text-amber-400 font-black text-sm sm:text-base">100%</div>
                  <div className="text-[10px] sm:text-xs text-slate-300">Estoque Real</div>
                </div>
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                {/* CTA Principal */}
                <a
                  href="/busca"
                  className="group relative px-6 py-3 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-xl font-bold text-slate-950 shadow-xl hover:shadow-orange-500/30 transition-all duration-300 text-center flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <span>Explorar Catálogo</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>

                {/* CTA Secundário */}
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
                className="p-6"
                delay={0.6}
              >
                <motion.h3 
                  className="text-xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent"
                  style={{
                    textShadow: '0 2px 15px rgba(0,0,0,0.5)'
                  }}
                  whileHover={{ scale: 1.02 }}
                >
                  Assistentes Inteligentes
                </motion.h3>
                
                {/* Lia 2.0 */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="mb-3 p-3.5 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">L</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                        Lia
                      </h4>
                      <p className="text-[11px] text-blue-200 font-medium">Atendente Virtual</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-200">
                    Assistente pessoal para encontrar produtos e tirar dúvidas.
                  </p>
                </motion.div>

                {/* Zé da Obra 3.0 */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-3.5 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">Z</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm bg-gradient-to-r from-orange-200 to-yellow-200 bg-clip-text text-transparent">
                        Zé da Obra
                      </h4>
                      <p className="text-[11px] text-orange-200 font-medium">Especialista Técnico</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-200">
                    Consultoria especializada e cálculos de materiais para sua obra.
                  </p>
                </motion.div>
              </GlassOverlay>
             </div>
           </div>
        </div>
      </div>
    </section>
  );
}