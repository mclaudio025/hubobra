'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Facebook, 
  Instagram, 
  Youtube, 
  MessageSquare, 
  Phone, 
  Sparkles,
  MapPin
} from 'lucide-react';
import { STORE_CONFIG, getWhatsAppLink } from '@/config/store.config';
import PWAInstallButton from './pwa/PWAInstallButton';

const Footer = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  const linkVariants = {
    hidden: { x: -10, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15
      }
    }
  };

  return (
    <motion.footer 
      className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={containerVariants}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-purple-500/5 to-blue-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,165,0,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(138,43,226,0.1),transparent_50%)]" />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8"
          variants={containerVariants}
        >
          {/* Institucional */}
          <motion.div variants={itemVariants} className="group">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.h3 
                className="font-bold text-lg mb-4 bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent relative"
                whileHover={{ scale: 1.05 }}
              >
                Institucional
                <motion.div
                  className="absolute -top-1 -right-1 w-2 h-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-3 h-3 text-orange-400/60" />
                </motion.div>
              </motion.h3>
              
              <motion.ul variants={containerVariants}>
                {[
                  { label: 'Sobre a HubConstruções', href: '/sobre' },
                  { label: 'Seja uma Loja Parceira', href: '/parceiros' },
                  { label: 'Política de Privacidade & LGPD', href: '/privacidade' },
                  { label: 'Termos e Condições de Uso', href: '/termos-de-uso' }
                ].map((item, index) => (
                  <motion.li 
                    key={index}
                    className="mb-2 group/item"
                    variants={linkVariants}
                    whileHover={{ x: 5, scale: 1.02 }}
                  >
                    <Link 
                      href={item.href} 
                      className="text-gray-300 hover:text-orange-300 transition-colors duration-300 group-hover/item:text-orange-300"
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </motion.div>

          {/* Ajuda e Suporte */}
          <motion.div variants={itemVariants} className="group">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.h3 
                className="font-bold text-lg mb-4 bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent relative"
                whileHover={{ scale: 1.05 }}
              >
                Serviços & Ajuda
                <motion.div
                  className="absolute -top-1 -right-1 w-2 h-2"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-3 h-3 text-blue-400/60" />
                </motion.div>
              </motion.h3>
              
              <motion.ul variants={containerVariants}>
                {[
                  { label: 'Catálogo de Produtos', href: '/produtos' },
                  { label: 'Calculadora de Materiais', href: '/calculadora' },
                  { label: 'Simulador 3D de Obra', href: '/builder3d' },
                  { label: 'Trocas e Devoluções', href: '/trocas-e-devolucoes' },
                  { label: 'Meus Pedidos & Recibos', href: '/pedidos' }
                ].map((item, index) => (
                  <motion.li 
                    key={index}
                    className="mb-2 group/item"
                    variants={linkVariants}
                    whileHover={{ x: 5, scale: 1.02 }}
                  >
                    <Link 
                      href={item.href} 
                      className="text-gray-300 hover:text-blue-300 transition-colors duration-300 group-hover/item:text-blue-300"
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </motion.div>

          {/* Atendimento */}
          <motion.div variants={itemVariants} className="group">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.h3 
                className="font-bold text-lg mb-4 bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent relative"
                whileHover={{ scale: 1.05 }}
              >
                Atendimento
                <motion.div
                  className="absolute -top-1 -right-1 w-2 h-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-3 h-3 text-green-400/60" />
                </motion.div>
              </motion.h3>
              
              <motion.ul variants={containerVariants}>
                <motion.li 
                  className="flex items-center mb-2 group/item"
                  variants={linkVariants}
                  whileHover={{ x: 5, scale: 1.02 }}
                >
                  <a
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-300 hover:text-green-300 transition-colors"
                  >
                    <MessageSquare size={18} className="mr-2 text-green-400" />
                    <span>{STORE_CONFIG.contact.whatsappFormatted} (WhatsApp)</span>
                  </a>
                </motion.li>
                <motion.li 
                  className="flex items-center mb-2 group/item"
                  variants={linkVariants}
                  whileHover={{ x: 5, scale: 1.02 }}
                >
                  <a
                    href={`mailto:${STORE_CONFIG.contact.email}`}
                    className="flex items-center text-gray-300 hover:text-green-300 transition-colors"
                  >
                    <Phone size={18} className="mr-2 text-green-400" />
                    <span>{STORE_CONFIG.contact.email}</span>
                  </a>
                </motion.li>
                <motion.li 
                  className="flex items-start mb-2 group/item"
                  variants={linkVariants}
                  whileHover={{ x: 5, scale: 1.02 }}
                >
                  <MapPin size={18} className="mr-2 text-orange-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-400">{STORE_CONFIG.contact.address}</span>
                </motion.li>
              </motion.ul>
              
              <motion.h3 
                className="font-bold text-lg mt-6 mb-4 bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent"
                variants={itemVariants}
              >
                Redes Sociais
              </motion.h3>
              
              <motion.div 
                className="flex gap-4"
                variants={containerVariants}
              >
                {[
                  { icon: Facebook, color: 'text-blue-500', hoverColor: 'hover:text-blue-400', href: STORE_CONFIG.social.facebook },
                  { icon: Instagram, color: 'text-pink-500', hoverColor: 'hover:text-pink-400', href: STORE_CONFIG.social.instagram },
                  { icon: Youtube, color: 'text-red-500', hoverColor: 'hover:text-red-400', href: STORE_CONFIG.social.youtube }
                ].map((social, index) => {
                  const IconComponent = social.icon;
                  return (
                    <motion.div
                      key={index}
                      variants={linkVariants}
                      whileHover={{ 
                        scale: 1.2, 
                        rotate: [0, -10, 10, 0],
                        y: -5
                      }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <a 
                        href={social.href} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`${social.color} ${social.hoverColor} transition-colors duration-300`}
                        aria-label="Rede Social"
                      >
                        <IconComponent size={24} />
                      </a>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Formas de Pagamento */}
          <motion.div variants={itemVariants} className="group">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.h3 
                className="font-bold text-lg mb-4 bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent relative"
                whileHover={{ scale: 1.05 }}
              >
                Formas de Pagamento
                <motion.div
                  className="absolute -top-1 -right-1 w-2 h-2"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-3 h-3 text-yellow-400/60" />
                </motion.div>
              </motion.h3>
              
              <motion.p 
                className="mb-4 group-hover:text-gray-200 transition-colors"
                variants={linkVariants}
              >
                Aceitamos os principais cartões.
              </motion.p>
              
              <motion.div 
                className="flex gap-2 mt-2"
                variants={containerVariants}
              >
                {Array.from({ length: 3 }).map((_, index) => (
                  <motion.div 
                    key={index}
                    className="w-10 h-6 bg-gradient-to-br from-gray-600 to-gray-700 rounded shadow-lg"
                    variants={linkVariants}
                    whileHover={{ 
                      scale: 1.1, 
                      y: -2,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
                    }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* PWA App Download Bar */}
        <motion.div 
          className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-500/20 flex flex-col sm:flex-row items-center justify-between gap-4"
          variants={itemVariants}
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-orange-500/20">
              <span className="text-lg">📱</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Instale o App HubObra no seu celular</h4>
              <p className="text-xs text-gray-300">Acesse cotações, catálogo e pedidos direto da tela inicial com 1 clique.</p>
            </div>
          </div>
          <PWAInstallButton variant="footer" />
        </motion.div>

        {/* Copyright Section */}
        <motion.div 
          className="border-t border-gray-700 mt-8 pt-8 text-center text-sm relative overflow-hidden"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
        >
          {/* Animated background glow */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-purple-500/5 to-blue-500/5 opacity-0"
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          
          <motion.p 
            className="relative z-10 bg-gradient-to-r from-gray-300 via-white to-gray-300 bg-clip-text text-transparent"
            whileHover={{ 
              scale: 1.05,
              textShadow: "0 0 20px rgba(255,255,255,0.3)"
            }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            &copy; {new Date().getFullYear()} {STORE_CONFIG.name} — CNPJ: {STORE_CONFIG.cnpj}. Todos os direitos reservados.
          </motion.p>
          
          <motion.p 
            className="relative z-10 text-xs text-gray-400 mt-1"
            whileHover={{ 
              scale: 1.05,
              textShadow: "0 0 20px rgba(255,255,255,0.3)"
            }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {STORE_CONFIG.tagline} — O maior catálogo para sua construção e reforma.
          </motion.p>
          
          {/* Sparkle effects */}
          <motion.div
            className="absolute top-2 left-1/4 w-1 h-1"
            animate={{ 
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              delay: 0.5
            }}
          >
            <div className="w-1 h-1 bg-orange-400 rounded-full" />
          </motion.div>
          
          <motion.div
            className="absolute bottom-2 right-1/3 w-1 h-1"
            animate={{ 
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              rotate: [360, 180, 0]
            }}
            transition={{ 
              duration: 2.5,
              repeat: Infinity,
              delay: 1
            }}
          >
            <div className="w-1 h-1 bg-purple-400 rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;