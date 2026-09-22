'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '../components/ui/Toaster';

interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  images: Array<{
    url: string;
    alt: string;
  }>;
}

interface FavoritesContextType {
  favorites: Product[];
  addToFavorites: (product: Product) => void;
  removeFromFavorites: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
  totalFavorites: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const { isAuthenticated, user } = useAuth();
  const { addToast } = useToast();

  // Carregar favoritos do localStorage quando o componente monta
  useEffect(() => {
    if (isAuthenticated && user) {
      const savedFavorites = localStorage.getItem(`favorites_${user.id}`);
      if (savedFavorites) {
        try {
          setFavorites(JSON.parse(savedFavorites));
        } catch (error) {
          console.error('Erro ao carregar favoritos:', error);
        }
      }
    } else {
      // Se não estiver logado, limpar favoritos
      setFavorites([]);
    }
  }, [isAuthenticated, user]);

  // Salvar favoritos no localStorage sempre que a lista mudar
  useEffect(() => {
    if (isAuthenticated && user) {
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(favorites));
    }
  }, [favorites, isAuthenticated, user]);

  const addToFavorites = (product: Product) => {
    if (!isAuthenticated) {
      addToast({
        type: 'error',
        title: 'Login necessário',
        message: 'Você precisa estar logado para adicionar favoritos'
      });
      return;
    }

    if (isFavorite(product.id)) {
      addToast({
        type: 'info',
        title: 'Produto já favoritado',
        message: 'Este produto já está na sua lista de favoritos'
      });
      return;
    }

    setFavorites(prev => [...prev, product]);
    addToast({
      type: 'success',
      title: 'Adicionado aos favoritos',
      message: `${product.name} foi adicionado aos seus favoritos`
    });
  };

  const removeFromFavorites = (productId: string) => {
    const product = favorites.find(p => p.id === productId);
    setFavorites(prev => prev.filter(p => p.id !== productId));
    
    if (product) {
      addToast({
        type: 'success',
        title: 'Removido dos favoritos',
        message: `${product.name} foi removido dos seus favoritos`
      });
    }
  };

  const isFavorite = (productId: string) => {
    return favorites.some(product => product.id === productId);
  };

  const clearFavorites = () => {
    setFavorites([]);
    addToast({
      type: 'success',
      title: 'Favoritos limpos',
      message: 'Todos os favoritos foram removidos'
    });
  };

  const value: FavoritesContextType = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    clearFavorites,
    totalFavorites: favorites.length
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
