'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  User, 
  Heart, 
  ShoppingCart, 
  Home,
  Search,
  Phone,
  MapPin,
  Settings,
  LogOut,
  Box,
  Sparkles,
  ChevronRight,
  Hammer,
  Paintbrush,
  Zap,
  Droplets,
  Layers,
  ShieldCheck,
  PackageCheck,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import PWAInstallButton from '../pwa/PWAInstallButton';
import { STORE_CONFIG, getWhatsAppWholesaleLink } from '@/config/store.config';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated, isAdmin, isManager, logout } = useAuth();
  const { totalItems } = useCart();
  const { totalFavorites } = useFavorites();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-700 dark:text-slate-200 hover:text-orange-500 dark:hover:text-orange-400 transition-colors rounded-xl active:bg-slate-100 dark:active:bg-slate-800"
        aria-label="Abrir menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Portal to document.body to prevent any stacking context / transform issues */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[99999] lg:hidden">
              {/* Solid Backdrop */}
              <motion.div 
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeMenu}
              />
              
              {/* Solid Drawer Panel */}
              <motion.div 
                className="fixed top-0 left-0 bottom-0 h-full w-[310px] max-w-[85vw] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl z-[100000] flex flex-col border-r border-slate-200 dark:border-slate-800 overflow-hidden"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              >
                {/* Header with HubObra Brand */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white p-2 rounded-xl mr-2.5 shadow-md shadow-orange-500/20 flex items-center justify-center">
                      <Box className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
                          Hub<span className="text-orange-500">Obra</span>
                        </span>
                        <span className="text-[9px] bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 font-bold px-1.5 py-0.5 rounded uppercase">
                          App
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Marketplace da Construção</p>
                    </div>
                  </div>
                  <button
                    onClick={closeMenu}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Fechar menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                  {/* User Profile / Login Banner */}
                  <div className="p-4 bg-orange-50/40 dark:bg-slate-800/40">
                    {isAuthenticated ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-amber-500 text-white rounded-full flex items-center justify-center font-bold shadow-sm">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">{user?.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{user?.email}</p>
                          </div>
                        </div>
                        <Link 
                          href="/perfil" 
                          onClick={closeMenu}
                          className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                        >
                          Ver Perfil
                        </Link>
                      </div>
                    ) : (
                      <Link
                        href="/login"
                        onClick={closeMenu}
                        className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-orange-200 dark:border-slate-700 shadow-xs hover:border-orange-400 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Entrar ou Cadastrar</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Acesse seus pedidos e orçamentos</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </Link>
                    )}
                  </div>

                  {/* PWA Install Button Promo in Mobile Menu */}
                  <div className="px-3 pt-3 pb-1">
                    <PWAInstallButton variant="menu" />
                  </div>

                  {/* Main Quick Actions */}
                  <div className="p-3 space-y-1">
                    <Link
                      href="/"
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                    >
                      <Home className="h-4 w-4 text-orange-500" />
                      <span>Página Inicial</span>
                    </Link>

                    <Link
                      href="/busca"
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                    >
                      <Search className="h-4 w-4 text-orange-500" />
                      <span>Buscar Produtos</span>
                    </Link>

                    <Link
                      href="/carrinho"
                      onClick={closeMenu}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="h-4 w-4 text-orange-500" />
                        <span>Meu Carrinho</span>
                      </div>
                      {totalItems > 0 && (
                        <span className="bg-orange-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                          {totalItems}
                        </span>
                      )}
                    </Link>

                    <Link
                      href="/favoritos"
                      onClick={closeMenu}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                    >
                      <div className="flex items-center gap-3">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span>Favoritos</span>
                      </div>
                      {totalFavorites > 0 && (
                        <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                          {totalFavorites}
                        </span>
                      )}
                    </Link>

                    <Link
                      href="/pedidos"
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                    >
                      <PackageCheck className="h-4 w-4 text-orange-500" />
                      <span>Meus Pedidos</span>
                    </Link>
                  </div>

                  {/* WhatsApp Quick Quote CTA */}
                  <div className="p-3">
                    <a
                      href={getWhatsAppWholesaleLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">
                          <Phone className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-tight">Cotação Expressa no WhatsApp</p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Atendimento direto com especialista</p>
                        </div>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </a>
                  </div>

                  {/* Departments / Categories */}
                  <div className="p-3 space-y-1">
                    <p className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Departamentos & Produtos
                    </p>

                    <Link
                      href="/produtos"
                      onClick={closeMenu}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-semibold"
                    >
                      <div className="flex items-center gap-2.5">
                        <Layers className="h-3.5 w-3.5 text-orange-500" />
                        <span>Ver Todos os Produtos</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>

                    <Link
                      href="/categoria/materiais-construcao"
                      onClick={closeMenu}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Box className="h-3.5 w-3.5 text-amber-500" />
                        <span>Materiais de Construção</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>

                    <Link
                      href="/categoria/ferramentas"
                      onClick={closeMenu}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Hammer className="h-3.5 w-3.5 text-slate-500" />
                        <span>Ferramentas & Equipamentos</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>

                    <Link
                      href="/categoria/eletricos"
                      onClick={closeMenu}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Zap className="h-3.5 w-3.5 text-yellow-500" />
                        <span>Material Elétrico & Iluminação</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>

                    <Link
                      href="/categoria/hidraulicos"
                      onClick={closeMenu}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Droplets className="h-3.5 w-3.5 text-blue-500" />
                        <span>Hidráulica & Conexões</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>

                    <Link
                      href="/categoria/tintas-vernizes"
                      onClick={closeMenu}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Paintbrush className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Tintas & Acessórios</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>

                    <Link
                      href="/categoria/seguranca"
                      onClick={closeMenu}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-orange-500" />
                        <span>EPIs & Segurança</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>
                  </div>

                  {/* Institutional & Partner Links */}
                  <div className="p-3 space-y-1">
                    <p className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Institucional & Ajuda
                    </p>

                    <Link
                      href="/parceiros"
                      onClick={closeMenu}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-orange-600 dark:text-orange-400 font-semibold hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Seja um Lojista Parceiro</span>
                    </Link>

                    <Link
                      href="/atendimento"
                      onClick={closeMenu}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span>Central de Atendimento</span>
                    </Link>

                    <Link
                      href="/sobre"
                      onClick={closeMenu}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span>Sobre a HubObra</span>
                    </Link>

                    {(isAdmin || isManager) && (
                      <Link
                        href="/admin"
                        onClick={closeMenu}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        <span>Painel Administrativo</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Footer Bar inside Drawer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                    <span>Fortaleza - CE e Região</span>
                  </div>

                  {isAuthenticated && (
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 transition-colors pt-1"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sair da Conta</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
