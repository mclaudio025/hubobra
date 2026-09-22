'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  Box
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, isManager, logout } = useAuth();
  const { totalItems } = useCart();
  const { totalFavorites } = useFavorites();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Menu Button - Visible only on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2 text-gray-600 hover:text-orange-500 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={closeMenu}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center">
                <div className="bg-orange-500 text-white p-2 rounded-lg mr-3">
                  <div className="w-6 h-6 flex items-center justify-center font-bold text-sm">
                    LM
                  </div>
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Loja Moderna</h2>
                  <p className="text-xs text-gray-600">Materiais de Construção</p>
                </div>
              </div>
              <button
                onClick={closeMenu}
                className="p-2 text-gray-500 hover:text-gray-700"
                aria-label="Fechar menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Menu Content */}
            <div className="flex-1 overflow-y-auto">
              {/* User Section */}
              {isAuthenticated ? (
                <div className="p-4 bg-gray-50 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user?.name}</p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-b">
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="flex items-center gap-3 text-gray-700 hover:text-orange-500"
                  >
                    <User className="h-5 w-5" />
                    <span>Entrar / Cadastrar</span>
                  </Link>
                </div>
              )}

              {/* Quick Actions */}
              <div className="p-4 space-y-4 border-b">
                <Link
                  href="/busca"
                  onClick={closeMenu}
                  className="flex items-center gap-3 text-gray-700 hover:text-orange-500"
                >
                  <Search className="h-5 w-5" />
                  <span>Buscar Produtos</span>
                </Link>

                <Link
                  href="/favoritos"
                  onClick={closeMenu}
                  className="flex items-center gap-3 text-gray-700 hover:text-orange-500"
                >
                  <Heart className="h-5 w-5" />
                  <span>Favoritos</span>
                  {totalFavorites > 0 && (
                    <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      {totalFavorites > 99 ? '99+' : totalFavorites}
                    </span>
                  )}
                </Link>

                <Link
                  href="/carrinho"
                  onClick={closeMenu}
                  className="flex items-center gap-3 text-gray-700 hover:text-orange-500"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Carrinho</span>
                  {totalItems > 0 && (
                    <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </Link>

                <Link
                  href="/builder3d"
                  onClick={closeMenu}
                  className="flex items-center gap-3 text-gray-700 hover:text-purple-500"
                >
                  <Box className="h-5 w-5" />
                  <span>Builder 3D</span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                    Novo
                  </span>
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="p-4 space-y-4 border-b">
                <Link
                  href="/"
                  onClick={closeMenu}
                  className="flex items-center gap-3 text-gray-700 hover:text-orange-500"
                >
                  <Home className="h-5 w-5" />
                  <span>Página Inicial</span>
                </Link>

                <Link
                  href="/produtos"
                  onClick={closeMenu}
                  className="block text-gray-700 hover:text-orange-500 py-2"
                >
                  Todos os Produtos
                </Link>

                <Link
                  href="/categoria/ferramentas"
                  onClick={closeMenu}
                  className="block text-gray-700 hover:text-orange-500 py-2"
                >
                  Ferramentas
                </Link>

                <Link
                  href="/categoria/materiais-construcao"
                  onClick={closeMenu}
                  className="block text-gray-700 hover:text-orange-500 py-2"
                >
                  Materiais de Construção
                </Link>

                <Link
                  href="/categoria/eletricos"
                  onClick={closeMenu}
                  className="block text-gray-700 hover:text-orange-500 py-2"
                >
                  Elétricos
                </Link>

                <Link
                  href="/categoria/hidraulicos"
                  onClick={closeMenu}
                  className="block text-gray-700 hover:text-orange-500 py-2"
                >
                  Hidráulicos
                </Link>
              </div>

              {/* User Account Links */}
              {isAuthenticated && (
                <div className="p-4 space-y-4 border-b">
                  <Link
                    href="/perfil"
                    onClick={closeMenu}
                    className="block text-gray-700 hover:text-orange-500 py-2"
                  >
                    Meu Perfil
                  </Link>

                  <Link
                    href="/pedidos"
                    onClick={closeMenu}
                    className="block text-gray-700 hover:text-orange-500 py-2"
                  >
                    Meus Pedidos
                  </Link>

                  {(isAdmin || isManager) && (
                    <Link
                      href="/admin"
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-gray-700 hover:text-orange-500 py-2"
                    >
                      <Settings className="h-5 w-5" />
                      <span>Painel Admin</span>
                    </Link>
                  )}
                </div>
              )}

              {/* Contact Info */}
              <div className="p-4 space-y-4 border-b">
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="h-5 w-5" />
                  <span>(11) 3000-0000</span>
                </div>

                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="h-5 w-5" />
                  <span>Encontre nossa loja</span>
                </div>

                <Link
                  href="/atendimento"
                  onClick={closeMenu}
                  className="block text-gray-700 hover:text-orange-500 py-2"
                >
                  Atendimento
                </Link>

                <Link
                  href="/sobre"
                  onClick={closeMenu}
                  className="block text-gray-700 hover:text-orange-500 py-2"
                >
                  Sobre Nós
                </Link>
              </div>

              {/* Logout */}
              {isAuthenticated && (
                <div className="p-4">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 text-red-600 hover:text-red-700 py-2"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
