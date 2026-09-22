'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useCart as useCartApi } from '../hooks/useApi';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    images: Array<{ url: string; alt?: string }>;
    sku: string;
    stock: number;
  };
}

interface CartContextType {
  items: CartItem[];
  total: number;
  totalItems: number;
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const { isAuthenticated, loading: authLoading } = useAuth();
  const cartApi = useCartApi();

  // Carregar carrinho quando usuário fizer login
  useEffect(() => {
    // Aguardar que o carregamento da autenticação seja concluído
    if (authLoading) return;
    
    if (isAuthenticated) {
      refreshCart();
    } else {
      // Limpar carrinho quando usuário fizer logout
      setItems([]);
      setTotal(0);
      setTotalItems(0);
    }
  }, [isAuthenticated, authLoading]);

  const refreshCart = async () => {
    // Verificar se a autenticação ainda está carregando
    if (authLoading) return;
    
    if (!isAuthenticated) {
      // Se não estiver autenticado, apenas limpar o carrinho
      setItems([]);
      setTotal(0);
      setTotalItems(0);
      return;
    }

    try {
      setLoading(true);
      const cartData = await cartApi.getCart();
      setItems(cartData.items || []);
      setTotal(cartData.total || 0);
      setTotalItems(cartData.totalItems || 0);
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
      // Em caso de erro (como usuário não encontrado), limpar o carrinho
      setItems([]);
      setTotal(0);
      setTotalItems(0);
      
      // Se for erro de autenticação, não mostrar erro para o usuário
      if (error.message?.includes('Usuário não encontrado') || 
          error.message?.includes('401') || 
          error.message?.includes('Unauthorized') ||
          error.message?.includes('Failed to fetch')) {
        console.log('Erro de autenticação ou rede, carrinho limpo');
      }
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity = 1) => {
    if (!isAuthenticated) {
      // Para usuários não logados, mostrar modal de login
      alert('Faça login para adicionar produtos ao carrinho');
      return;
    }

    try {
      setLoading(true);
      await cartApi.addToCart(productId, quantity);
      await refreshCart();
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!isAuthenticated) {
      console.log('❌ Usuário não autenticado para remover item');
      return;
    }

    console.log('🗑️ Iniciando remoção do item:', productId);

    try {
      setLoading(true);
      console.log('📡 Chamando API para remover item...');
      await cartApi.removeFromCart(productId);
      console.log('✅ Item removido da API, atualizando carrinho...');
      await refreshCart();
      console.log('✅ Carrinho atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao remover do carrinho:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      if (quantity <= 0) {
        await removeFromCart(productId);
      } else {
        await cartApi.updateCartItem(productId, quantity);
        await refreshCart();
      }
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      await cartApi.clearCart();
      setItems([]);
      setTotal(0);
      setTotalItems(0);
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        totalItems,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
