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
    // 1. Atualização otimista imediata na interface
    setItems((prevItems) => {
      const next = prevItems.filter((i) => i.product.id !== productId);
      const newTotal = next.reduce((acc, i) => acc + Number(i.product.price) * i.quantity, 0);
      const newTotalItems = next.reduce((acc, i) => acc + i.quantity, 0);
      setTotal(newTotal);
      setTotalItems(newTotalItems);
      return next;
    });

    if (!isAuthenticated) return;

    try {
      await cartApi.removeFromCart(productId);
    } catch (error) {
      console.error('❌ Erro ao remover do carrinho no servidor:', error);
      // Re-sincronizar em caso de erro
      await refreshCart();
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    // 1. Atualização otimista instantânea (0ms de atraso na tela e no total)
    setItems((prevItems) => {
      const next = prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
      const newTotal = next.reduce((acc, i) => acc + Number(i.product.price) * i.quantity, 0);
      const newTotalItems = next.reduce((acc, i) => acc + i.quantity, 0);
      setTotal(newTotal);
      setTotalItems(newTotalItems);
      return next;
    });

    if (!isAuthenticated) return;

    // 2. Sincronização em background com a API
    try {
      await cartApi.updateCartItem(productId, quantity);
    } catch (error) {
      console.error('Erro ao atualizar quantidade no servidor:', error);
      // Se a API falhar, resincronizar
      await refreshCart();
    }
  };

  const clearCart = async () => {
    setItems([]);
    setTotal(0);
    setTotalItems(0);

    if (!isAuthenticated) return;

    try {
      await cartApi.clearCart();
    } catch (error) {
      console.error('Erro ao limpar carrinho no servidor:', error);
      await refreshCart();
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
