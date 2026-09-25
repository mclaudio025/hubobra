'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, User, ShoppingCart, LogOut, Settings, Phone, MapPin, Sparkles, Box, Zap, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';

import { ThemeToggle } from '../../../components/ui/ThemeToggle';
import SearchBar from './SearchBar';
import MobileMenu from './MobileMenu';
import MobileSearchBar from './MobileSearchBar';
import MobileCategoryNav from './MobileCategoryNav';
import PWAInstallButton from '../pwa/PWAInstallButton';
import { getWhatsAppWholesaleLink } from '@/config/store.config';

export default function MainHeader() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isHovered, setIsHovered] = useState('');
  const { user, isAuthenticated, isAdmin, isManager, logout } = useAuth();
  const { totalItems } = useCart();
  const { totalFavorites } = useFavorites();

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <>
      {/* Top Bar - Hidden on mobile */}
      <motion.div 
        className="hidden md:block bg-slate-950 text-white text-xs relative overflow-hidden border-b border-slate-800"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-sky-500/10" />
        
        <div className="container mx-auto px-4 py-2.5 relative">
          <div className="flex justify-between items-center">
            <motion.div 
              className="flex items-center gap-6"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {/* Location Selector */}
              <motion.div 
                className="flex items-center gap-2 text-amber-400 font-medium cursor-pointer group bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20"
                whileHover={{ scale: 1.03 }}
              >
                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                <span>📍 Entregar em: <strong>Selecione seu CEP</strong></span>
                <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded">Parceiros Ativos</span>
              </motion.div>

              {/* Fast WhatsApp Quote */}
              <motion.a 
                href={getWhatsAppWholesaleLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors font-medium cursor-pointer"
                whileHover={{ scale: 1.05 }}
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Cotação Expressa WhatsApp</span>
              </motion.a>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-5"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Link 
                href="/parceiros" 
                className="text-slate-300 hover:text-orange-400 transition-colors font-semibold flex items-center gap-1"
              >
                <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                <span>Seja um Lojista Parceiro</span>
              </Link>
              <span className="text-slate-700">|</span>
              <Link href="/atendimento" className="text-slate-400 hover:text-white transition-colors">
                Suporte à Obra
              </Link>
              <PWAInstallButton variant="header" />
              <ThemeToggle />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Header */}
      <motion.div 
        className="glass bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-50 shadow-sm"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      >
        <div className="container mx-auto px-2.5 sm:px-4 py-2.5 sm:py-3.5 relative">
          <div className="flex items-center justify-between gap-1.5 sm:gap-4">
            {/* Mobile Menu Button */}
            <motion.div
              className="shrink-0"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <MobileMenu />
            </motion.div>

            {/* Logo HubObra */}
            <motion.div
              className="flex items-center shrink min-w-0"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6, type: "spring", stiffness: 200 }}
            >
              <Link href="/" className="flex items-center group shrink min-w-0">
                <motion.div 
                  className="flex items-center shrink min-w-0"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {/* Modern Hub Icon */}
                  <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white p-2 sm:p-2.5 rounded-xl mr-1.5 sm:mr-3 shadow-md shadow-orange-500/20 relative overflow-hidden flex items-center justify-center shrink-0">
                    <Box className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                        Hub<span className="text-orange-500">Obra</span>
                      </span>
                      <span className="hidden sm:inline-block text-[9px] bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Marketplace
                      </span>
                    </div>
                    <p className="hidden md:block text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-tight truncate">
                      Estoque Unificado de Lojas Parceiras
                    </p>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
            
            {/* Search Bar - Hidden on small screens */}
            <motion.div 
              className="hidden md:block flex-1 max-w-2xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <SearchBar />
            </motion.div>

            {/* Actions */}
            <motion.div 
              className="flex items-center gap-0.5 sm:gap-3 lg:gap-6 shrink-0"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              {/* Mobile Search Button */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
              >
                <MobileSearchBar />
              </motion.div>

              {/* Mobile Category Navigation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
              >
                <MobileCategoryNav />
              </motion.div>

              {/* Favoritos - Hidden on mobile */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.0, type: "spring", stiffness: 200 }}
              >
                <Link 
                  href="/favoritos" 
                  className="hidden lg:flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors relative group"
                  onMouseEnter={() => setIsHovered('favorites')}
                  onMouseLeave={() => setIsHovered('')}
                >
                  <motion.div 
                    className="relative"
                    whileHover={{ 
                      scale: 1.1,
                      rotate: [0, -10, 10, 0]
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      animate={isHovered === 'favorites' ? {
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5]
                      } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-0 bg-red-400/20 rounded-full"
                    />
                    <Heart className="h-6 w-6 group-hover:fill-current transition-all duration-300 relative z-10" />
                    {totalFavorites > 0 && (
                      <motion.span 
                        className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-glow"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      >
                        {totalFavorites > 99 ? '99+' : totalFavorites}
                      </motion.span>
                    )}
                  </motion.div>
                  <span className="text-xs mt-1">Favoritos</span>
                </Link>
              </motion.div>

              {/* Builder 3D - Hidden on mobile */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.05, type: "spring", stiffness: 200 }}
              >
                <Link 
                  href="/builder3d" 
                  className="hidden lg:flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400 transition-colors relative group"
                  onMouseEnter={() => setIsHovered('builder3d')}
                  onMouseLeave={() => setIsHovered('')}
                >
                  <motion.div 
                    className="relative"
                    whileHover={{ 
                      scale: 1.1, 
                      rotateY: 180,
                      rotateX: [0, 15, -15, 0]
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.6 }}
                  >
                    <motion.div
                      animate={isHovered === 'builder3d' ? {
                        rotate: [0, 360],
                        scale: [1, 1.3, 1]
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full opacity-0 group-hover:opacity-100"
                    />
                    <Box className="h-6 w-6 group-hover:drop-shadow-lg transition-all duration-300 relative z-10" />
                    <motion.div
                      className="absolute -top-1 -right-1"
                      animate={isHovered === 'builder3d' ? {
                        scale: [0, 1, 0],
                        rotate: [0, 180, 360]
                      } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Zap className="h-3 w-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  </motion.div>
                  <span className="text-xs mt-1">Builder 3D</span>
                </Link>
              </motion.div>

              {/* User Menu */}
              <motion.div 
                className="relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.1, type: "spring", stiffness: 200 }}
              >
                {isAuthenticated ? (
                  <div>
                    <motion.button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="hidden lg:flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className="relative p-1 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors"
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.6 }}
                      >
                        <User className="h-6 w-6" />
                      </motion.div>
                      <span className="text-xs mt-1">
                        {user?.name?.split(' ')[0] || 'Conta'}
                      </span>
                    </motion.button>

                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div 
                          className="absolute right-0 mt-2 w-56 glass bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 py-2 z-50 overflow-hidden"
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          {/* Gradient background */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
                          
                          <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50 relative">
                            <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                          </div>
                          
                          <motion.div className="py-1 relative">
                            {[
                              { href: '/perfil', label: 'Meu Perfil', icon: User },
                              { href: '/pedidos', label: 'Meus Pedidos', icon: ShoppingCart },
                              { href: '/favoritos', label: 'Lista de Favoritos', icon: Heart },
                              { href: '/dashboard', label: 'Dashboard', icon: Settings }
                            ].map((item, index) => (
                              <motion.div
                                key={item.href}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                <Link
                                  href={item.href}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                  onClick={() => setShowUserMenu(false)}
                                >
                                  <item.icon className="h-4 w-4 mr-3" />
                                  {item.label}
                                </Link>
                              </motion.div>
                            ))}
                            
                            {(isAdmin || isManager) && (
                              <>
                                <hr className="my-2 border-gray-200/50 dark:border-gray-700/50" />
                                <motion.div
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.15 }}
                                >
                                  <Link
                                    href="/admin"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    onClick={() => setShowUserMenu(false)}
                                  >
                                    <Settings className="h-4 w-4 mr-3" />
                                    Painel Admin
                                  </Link>
                                </motion.div>
                              </>
                            )}
                            
                            <hr className="my-2 border-gray-200/50 dark:border-gray-700/50" />
                            <motion.button
                              onClick={handleLogout}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 }}
                              whileHover={{ x: 5 }}
                            >
                              <LogOut className="h-4 w-4 mr-3" />
                              Sair
                            </motion.button>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link 
                      href="/login" 
                      className="hidden lg:flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors group"
                    >
                      <motion.div
                        className="relative p-1 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors"
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.6 }}
                      >
                        <User className="h-6 w-6" />
                      </motion.div>
                      <span className="text-xs mt-1">Entrar</span>
                    </Link>
                  </motion.div>
                )}
              </motion.div>

              {/* Cart */}
              <motion.div
                className="shrink-0 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
              >
                <Link 
                  href="/carrinho" 
                  className="flex flex-col items-center justify-center text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors relative group min-w-[42px] px-1 py-0.5"
                  aria-label="Carrinho de compras"
                >
                  <motion.div 
                    className="relative flex items-center justify-center"
                    whileHover={{ 
                      scale: 1.1, 
                      rotate: [0, -5, 5, 0],
                      y: [0, -2, 0]
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    onHoverStart={() => setIsHovered('cart')}
                    onHoverEnd={() => setIsHovered('')}
                  >
                    <motion.div
                      animate={isHovered === 'cart' ? {
                        scale: [1, 1.4, 1],
                        opacity: [0.3, 0.8, 0.3]
                      } : {}}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="absolute inset-0 bg-orange-400/30 rounded-full"
                    />
                    <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 group-hover:drop-shadow-lg transition-all duration-300 relative z-10" />
                    {totalItems > 0 && (
                      <motion.span 
                        className="absolute -top-1.5 -right-2 bg-gradient-primary text-white rounded-full min-w-4 h-4 px-1 flex items-center justify-center text-[10px] font-bold shadow-glow leading-none"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      >
                        {totalItems > 99 ? '99+' : totalItems}
                      </motion.span>
                    )}
                  </motion.div>
                  <span className="text-[10px] sm:text-xs mt-0.5 font-medium leading-none text-center">Carrinho</span>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Overlay para fechar menu */}
      <AnimatePresence>
        {showUserMenu && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowUserMenu(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
