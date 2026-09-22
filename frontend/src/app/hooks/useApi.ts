'use client';

import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  requireAuth?: boolean;
}

export function useApi() {
  const { token } = useAuth();

  const apiCall = async (endpoint: string, options: ApiOptions = {}) => {
    const {
      method = 'GET',
      body,
      headers = {},
      requireAuth = false,
    } = options;

    // Log para debug de remoção do carrinho
    if (endpoint.includes('/cart/items/') && method === 'DELETE') {
      console.log('🔍 DEBUG: Iniciando requisição de remoção do carrinho');
      console.log('- Endpoint:', endpoint);
      console.log('- Method:', method);
      console.log('- RequireAuth:', requireAuth);
      console.log('- Token presente:', !!token);
    }

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    // Adicionar token de autenticação se necessário
    if (requireAuth && token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    } else if (requireAuth && !token) {
      throw new Error('Token de autenticação não encontrado. Faça login novamente.');
    }

    // Adicionar body se fornecido
    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    try {
      // Priorizar rotas relativas /api/... do Next.js no navegador para evitar bloqueios de CORS e extensões
      let url = endpoint;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (!url.startsWith('/api/')) {
          url = `/api${url.startsWith('/') ? url : `/${url}`}`;
        }
      }

      let response: Response;
      try {
        response = await fetch(url, config);
      } catch (fetchErr: any) {
        // Fallback para chamada direta ao backend se a rota /api falhar na rede
        if (!url.startsWith('http') && API_URL) {
          const directUrl = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
          console.warn(`Tentando fallback direto para ${directUrl}...`);
          response = await fetch(directUrl, config);
        } else {
          throw fetchErr;
        }
      }
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
        const errorMessage = Array.isArray(error.message) 
          ? error.message.join(', ') 
          : (error.message || `Erro ${response.status}`);
        throw new Error(errorMessage);
      }

      // Verificar se há conteúdo para parsear
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        
        if (endpoint.includes('/cart/items/') && method === 'DELETE') {
          console.log('✅ DEBUG: Resultado da remoção:', result);
        }
        
        return result;
      }
      
      return null;
    } catch (error: any) {
      console.error(`Erro na API (${endpoint}):`, error);
      
      // Tratamento específico para diferentes tipos de erro
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Erro de conexão: Verifique se o servidor está rodando e a URL está correta');
      }
      
      if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
        throw new Error('Erro de rede: Verifique sua conexão com a internet');
      }
      
      throw error;
    }
  };

  return { apiCall };
}

// Hooks específicos para diferentes recursos
export function useProducts() {
  const { apiCall } = useApi();

  return {
    getProducts: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      categoryId?: string;
      active?: boolean;
      featured?: boolean;
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
      }
      const query = searchParams.toString();
      return apiCall(`/products${query ? `?${query}` : ''}`);
    },

    getProduct: (id: string) => apiCall(`/products/${id}`),

    createProduct: (product: any) => 
      apiCall('/products', { method: 'POST', body: product, requireAuth: true }),

    bulkCreateProducts: (products: any[]) =>
      apiCall('/products/bulk', { method: 'POST', body: { products }, requireAuth: true }),

    updateProduct: (id: string, product: any) =>
      apiCall(`/products/${id}`, { method: 'PATCH', body: product, requireAuth: true }),

    deleteProduct: (id: string) =>
      apiCall(`/products/${id}`, { method: 'DELETE', requireAuth: true }),

    getProductStats: () =>
      apiCall('/products/stats', { requireAuth: true }),

    importProducts: (file: File, options: any = {}) => {
      const formData = new FormData();
      formData.append('file', file);
      if (options && Object.keys(options).length > 0) {
        formData.append('options', JSON.stringify(options));
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      return fetch(`${baseUrl}/products/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      }).then(async (response) => {
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Erro na importação');
        }
        return response.json();
      });
    },

    searchProductImages: (params: { query?: string; ean?: string; brand?: string; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params.query) searchParams.append('query', params.query);
      if (params.ean) searchParams.append('ean', params.ean);
      if (params.brand) searchParams.append('brand', params.brand);
      if (params.limit) searchParams.append('limit', params.limit.toString());
      return apiCall(`/products/images/search?${searchParams.toString()}`, { requireAuth: false });
    },

    downloadProductImageFromUrl: (data: { imageUrl: string; productId?: string; alt?: string; isMain?: boolean }) => {
      return apiCall('/products/images/download-from-url', {
        method: 'POST',
        body: data,
        requireAuth: false,
      });
    },

    bulkFetchMissingImages: (params?: { limit?: number; forceUpdate?: boolean }) => {
      return apiCall('/products/images/bulk-fetch-missing', {
        method: 'POST',
        body: params || {},
        requireAuth: true,
      });
    },

    autoEnrichSpecs: (productId: string) => {
      return apiCall(`/products/${productId}/auto-specs`, {
        method: 'POST',
      });
    },

    previewSpecs: (params: { name: string; brand?: string; barcode?: string; categoryName?: string }) => {
      const searchParams = new URLSearchParams();
      searchParams.append('name', params.name);
      if (params.brand) searchParams.append('brand', params.brand);
      if (params.barcode) searchParams.append('barcode', params.barcode);
      if (params.categoryName) searchParams.append('categoryName', params.categoryName);
      return apiCall(`/products/search-specs/preview?${searchParams.toString()}`);
    },
  };
}

export function useReviews() {
  const { apiCall } = useApi();

  return {
    getProductReviews: (productId: string, page = 1, limit = 10) => {
      return apiCall(`/products/${productId}/reviews?page=${page}&limit=${limit}`);
    },

    createReview: (productId: string, data: { rating: number; title: string; comment: string; userName?: string; verified?: boolean }) => {
      return apiCall(`/products/${productId}/reviews`, {
        method: 'POST',
        body: data,
      });
    },

    voteReview: (reviewId: string, helpful: boolean) => {
      return apiCall(`/reviews/${reviewId}/vote`, {
        method: 'POST',
        body: { helpful },
      });
    },
  };
}

export function useCategories() {
  const { apiCall } = useApi();

  return {
    getCategories: (active?: boolean) => {
      const query = active !== undefined ? `?active=${active}` : '';
      return apiCall(`/categories${query}`);
    },

    getCategory: (id: string) => apiCall(`/categories/${id}`),

    createCategory: (category: any) =>
      apiCall('/categories', { method: 'POST', body: category, requireAuth: true }),

    updateCategory: (id: string, category: any) =>
      apiCall(`/categories/${id}`, { method: 'PATCH', body: category, requireAuth: true }),

    deleteCategory: (id: string) =>
      apiCall(`/categories/${id}`, { method: 'DELETE', requireAuth: true }),
  };
}

export function useCart() {
  const { apiCall } = useApi();

  return {
    getCart: () => apiCall('/cart', { requireAuth: true }),

    addToCart: (productId: string, quantity: number) =>
      apiCall('/cart/items', { 
        method: 'POST', 
        body: { productId, quantity }, 
        requireAuth: true 
      }),

    updateCartItem: (productId: string, quantity: number) =>
      apiCall(`/cart/items/${productId}`, { 
        method: 'PATCH', 
        body: { quantity }, 
        requireAuth: true 
      }),

    removeFromCart: (productId: string) =>
      apiCall(`/cart/items/${productId}`, { method: 'DELETE', requireAuth: true }),

    clearCart: () =>
      apiCall('/cart', { method: 'DELETE', requireAuth: true }),
  };
}

export function useOrders() {
  const { apiCall } = useApi();

  return {
    // Criar pedido
    createOrder: (orderData: any) =>
      apiCall('/orders', { method: 'POST', body: orderData, requireAuth: true }),

    // Listar pedidos do usuário
    getMyOrders: (page: number = 1, limit: number = 10) =>
      apiCall(`/orders/my-orders?page=${page}&limit=${limit}`, { requireAuth: true }),

    // Buscar pedido específico
    getOrder: (id: string) =>
      apiCall(`/orders/${id}`, { requireAuth: true }),

    // Cancelar pedido
    cancelOrder: (id: string, reason?: string) =>
      apiCall(`/orders/${id}/cancel`, { 
        method: 'PATCH', 
        body: { reason }, 
        requireAuth: true 
      }),

    // Admin: Listar todos os pedidos
    getAllOrders: (page: number = 1, limit: number = 20, status?: string) => {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (status) params.append('status', status);
      return apiCall(`/orders?${params.toString()}`, { requireAuth: true });
    },

    // Admin: Atualizar status do pedido
    updateOrderStatus: (id: string, status: string, notes?: string) =>
      apiCall(`/orders/${id}/status`, { 
        method: 'PATCH', 
        body: { status, notes }, 
        requireAuth: true 
      }),

    // Admin: Atualizar status do pagamento
    updatePaymentStatus: (id: string, status: string, transactionId?: string) =>
      apiCall(`/orders/${id}/payment`, { 
        method: 'PATCH', 
        body: { status, transactionId }, 
        requireAuth: true 
      }),

    // Admin: Estatísticas
    getOrderStats: () =>
      apiCall('/orders/stats', { requireAuth: true }),
  };
}

export function useUpload() {
  const { apiCall } = useApi();

  return {
    // Upload de uma imagem
    uploadImage: (file: File, variants?: string[]) => {
      const formData = new FormData();
      formData.append('file', file);
      if (variants) {
        formData.append('variants', variants.join(','));
      }
      
      return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      }).then(async (response) => {
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Erro no upload');
        }
        return response.json();
      });
    },

    // Upload de múltiplas imagens
    uploadMultipleImages: (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/upload/images/multiple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      }).then(async (response) => {
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Erro no upload');
        }
        return response.json();
      });
    },

    // Obter variantes de uma imagem
    getImageVariants: (id: string, extension: string) =>
      apiCall(`/upload/image/${id}/variants?extension=${extension}`),

    // Otimizar imagem existente
    optimizeImage: (filename: string) =>
      apiCall(`/upload/image/${filename}/optimize`, { method: 'POST', requireAuth: true }),

    // Deletar imagem
    deleteImage: (filename: string) =>
      apiCall(`/upload/image/${filename}`, { method: 'DELETE', requireAuth: true }),

    // Estatísticas de upload
    getUploadStats: () =>
      apiCall('/upload/stats', { requireAuth: true }),
  };
}

export function useUsers() {
  const { apiCall } = useApi();

  return {
    getUsers: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
      }
      const query = searchParams.toString();
      return apiCall(`/users${query ? `?${query}` : ''}`, { requireAuth: true });
    },

    getUser: (id: string) => apiCall(`/users/${id}`, { requireAuth: true }),

    createUser: (user: any) =>
      apiCall('/users', { method: 'POST', body: user, requireAuth: true }),

    updateUser: (id: string, user: any) =>
      apiCall(`/users/${id}`, { method: 'PATCH', body: user, requireAuth: true }),

    deleteUser: (id: string) =>
      apiCall(`/users/${id}`, { method: 'DELETE', requireAuth: true }),

    getUserStats: () =>
      apiCall('/users/stats', { requireAuth: true }),
  };
}

export function useBanners() {
  const { apiCall } = useApi();

  return {
    getBanners: (params?: {
      type?: string;
      active?: boolean;
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
      }
      const query = searchParams.toString();
      return apiCall(`/banners${query ? `?${query}` : ''}`);
    },

    getBanner: (id: string) => apiCall(`/banners/${id}`),

    createBanner: (banner: any) =>
      apiCall('/banners', { method: 'POST', body: banner, requireAuth: true }),

    updateBanner: (id: string, banner: any) =>
      apiCall(`/banners/${id}`, { method: 'PATCH', body: banner, requireAuth: true }),

    deleteBanner: (id: string) =>
      apiCall(`/banners/${id}`, { method: 'DELETE', requireAuth: true }),

    toggleBannerActive: (id: string) =>
      apiCall(`/banners/${id}/toggle-active`, { method: 'PATCH', requireAuth: true }),

    reorderBanners: (bannerIds: string[]) =>
      apiCall('/banners/reorder', { method: 'PATCH', body: { bannerIds }, requireAuth: true }),

    getBannerStats: () =>
      apiCall('/banners/stats', { requireAuth: true }),
  };
}
