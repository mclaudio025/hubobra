'use client';

import Link from 'next/link';
import { ArrowRight, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useBanners } from '../hooks/useApi';

interface BannerItem {
  id: string | number;
  title: string;
  subtitle?: string;
  description?: string;
  link: string;
  bgColor: string;
  textColor: string;
  icon?: string;
  imageUrl?: string;
}

const defaultBanners: BannerItem[] = [
  {
    id: 'default-1',
    title: "Cimento & Alvenaria",
    subtitle: "Até 25% OFF no PIX",
    description: "Cimentos CP-II, argamassas e blocos estruturais com entrega rápida na obra",
    link: "/categoria/cimento-e-argamassa",
    bgColor: "from-orange-600 via-amber-600 to-yellow-600",
    textColor: "text-white",
    icon: "🏗️",
  },
  {
    id: 'default-2',
    title: "Tubos & Conexões",
    subtitle: "Linha Tigre & Amanco",
    description: "Tudo para hidráulica, esgoto e drenagem direto dos distribuidores",
    link: "/produtos",
    bgColor: "from-blue-600 via-cyan-700 to-slate-800",
    textColor: "text-white",
    icon: "🚰",
  },
  {
    id: 'default-3',
    title: "Tintas & Acabamentos",
    subtitle: "Marcas Premium",
    description: "Tintas acrílicas, impermeabilizantes e vernizes com alta durabilidade",
    link: "/categoria/tintas-e-vernizes",
    bgColor: "from-emerald-600 via-teal-700 to-slate-900",
    textColor: "text-white",
    icon: "🎨",
  }
];

export default function PromotionalBanners() {
  const [banners, setBanners] = useState<BannerItem[]>(defaultBanners);
  const [loading, setLoading] = useState(true);
  const bannersApi = useBanners();

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const data = await bannersApi.getBanners({ active: true });
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((b: any, idx: number) => ({
            id: b.id,
            title: b.title,
            subtitle: b.subtitle || 'Oferta Especial',
            description: b.description || 'Confira os melhores preços para sua obra',
            link: b.buttonLink || '/produtos',
            bgColor: b.bgColor || (idx % 2 === 0 ? 'from-orange-600 via-amber-600 to-yellow-600' : 'from-blue-600 via-cyan-700 to-slate-800'),
            textColor: b.textColor || 'text-white',
            icon: b.type === 'PROMOTIONAL' ? '🏷️' : '🏗️',
            imageUrl: b.imageUrl
          }));
          setBanners(formatted.slice(0, 3));
        }
      } catch {
        // Usa banners padrão
      } finally {
        setLoading(false);
      }
    };

    loadBanners();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="py-16 bg-slate-950 text-white relative overflow-hidden border-y border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
            <Tag className="w-4 h-4" />
            Campanhas & Oportunidades
          </div>
          <motion.h2 
            variants={itemVariants}
            className="text-3xl sm:text-5xl font-black text-white tracking-tight"
          >
            Ofertas & Destaques da Região
          </motion.h2>
          <motion.p 
            variants={itemVariants}
            className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mt-2"
          >
            Condições especiais negociadas diretamente com estoques locais parceiros do HubConstruções
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {banners.map((banner) => (
            <motion.div
              key={banner.id}
              variants={itemVariants}
              whileHover={{ 
                y: -6, 
                scale: 1.02,
                transition: { duration: 0.25 }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={banner.link}
                className="group relative h-72 rounded-2xl overflow-hidden shadow-xl border border-slate-800 hover:border-orange-500/50 transition-all duration-300 block"
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${banner.bgColor} opacity-90 group-hover:opacity-100 transition-opacity`} />
                
                {banner.imageUrl && (
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 group-hover:scale-105 transition-transform duration-500"
                  />
                )}

                {/* Dark overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                {/* Content */}
                <div className="relative h-full flex flex-col justify-between p-6 z-10">
                  <div>
                    {banner.icon && (
                      <span className="text-3xl mb-3 block">
                        {banner.icon}
                      </span>
                    )}
                    {banner.subtitle && (
                      <span className="inline-block text-xs font-black uppercase tracking-wider bg-black/40 backdrop-blur-sm text-orange-300 px-3 py-1 rounded-full border border-white/10 mb-2">
                        {banner.subtitle}
                      </span>
                    )}
                    <h3 className="text-2xl font-black text-white group-hover:text-orange-200 transition-colors">
                      {banner.title}
                    </h3>
                    {banner.description && (
                      <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 mt-2 leading-relaxed">
                        {banner.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">
                      Conferir Itens
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                      <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
