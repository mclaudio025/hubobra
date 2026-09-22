'use client';

import { useState, useEffect } from 'react';
import { useApi } from './useApi';

interface ComponentConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

interface UseComponentsConfigReturn {
  components: ComponentConfig[];
  loading: boolean;
  error: string | null;
  isComponentEnabled: (componentId: string) => boolean;
  getComponentOrder: (componentId: string) => number;
  getSortedEnabledComponents: () => ComponentConfig[];
}

export function useComponentsConfig(): UseComponentsConfigReturn {
  const [components, setComponents] = useState<ComponentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { apiCall } = useApi();

  useEffect(() => {
    fetchComponentsConfig();
  }, []);

  const fetchComponentsConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBase}/components/config-public`);
      
      if (response.ok) {
        const data = await response.json();
        setComponents(data || []);
      } else {
        // Fallback para configuração padrão se a API não estiver disponível
        const defaultConfig = [
          { id: 'hero-carousel', name: 'Carrossel Principal', enabled: true, order: 1 },
          { id: 'promotional-banners', name: 'Banners Promocionais', enabled: true, order: 2 },
          { id: 'department-shortcuts', name: 'Atalhos de Departamentos', enabled: true, order: 3 },
          { id: 'featured-products', name: 'Produtos em Destaque', enabled: true, order: 4 },
          { id: 'weekly-offers', name: 'Ofertas da Semana', enabled: true, order: 5 },
          { id: 'footer', name: 'Rodapé', enabled: true, order: 6 },
        ];
        setComponents(defaultConfig);
      }
    } catch (err) {
      console.error('Erro ao carregar configuração de componentes:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      
      // Usar configuração padrão em caso de erro
      const defaultConfig = [
        { id: 'hero-carousel', name: 'Carrossel Principal', enabled: true, order: 1 },
        { id: 'promotional-banners', name: 'Banners Promocionais', enabled: true, order: 2 },
        { id: 'department-shortcuts', name: 'Atalhos de Departamentos', enabled: true, order: 3 },
        { id: 'featured-products', name: 'Produtos em Destaque', enabled: true, order: 4 },
        { id: 'weekly-offers', name: 'Ofertas da Semana', enabled: true, order: 5 },
        { id: 'footer', name: 'Rodapé', enabled: true, order: 6 },
      ];
      setComponents(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  const isComponentEnabled = (componentId: string): boolean => {
    const component = components.find(c => c.id === componentId);
    return component ? component.enabled : true; // Default para habilitado se não encontrar
  };

  const getComponentOrder = (componentId: string): number => {
    const component = components.find(c => c.id === componentId);
    return component ? component.order : 999; // Default para ordem alta se não encontrar
  };

  const getSortedEnabledComponents = (): ComponentConfig[] => {
    return components
      .filter(c => c.enabled)
      .sort((a, b) => a.order - b.order);
  };

  return {
    components,
    loading,
    error,
    isComponentEnabled,
    getComponentOrder,
    getSortedEnabledComponents,
  };
}
