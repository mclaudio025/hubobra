'use client';

import { useState, useCallback } from 'react';
import { useApi } from './useApi';

export interface HomeSection {
  id: string;
  type: 'product_carousel' | 'banner' | 'department_shortcuts' | 'hero' | 'partner_bar';
  title?: string;
  subtitle?: string;
  titleColor?: string;
  enabled: boolean;
  order: number;
  productSource?: 'category' | 'manual' | 'discount' | 'featured' | 'bestsellers' | 'newest';
  categorySlug?: string;
  categoryName?: string;
  manualProductIds?: string[];
  minDiscountPercent?: number;
  limit?: number;
  bannerImageUrl?: string;
  bannerLinkUrl?: string;
  bannerAlt?: string;
  bannerHeight?: 'compact' | 'medium' | 'full';
  products?: any[];
}

const DEFAULT_SECTIONS: HomeSection[] = [
  {
    id: 'hero-main',
    type: 'hero',
    title: 'Hero Principal',
    enabled: true,
    order: 1,
  },
  {
    id: 'partner-network-bar',
    type: 'partner_bar',
    title: 'Rede de Lojas Parceiras & CEP',
    enabled: false,
    order: 2,
  },
  {
    id: 'promo-banners-top',
    type: 'banner',
    title: 'Semana da Construção & Reforma - Até 20% OFF',
    bannerImageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&auto=format&fit=crop&q=80',
    bannerLinkUrl: '/produtos',
    bannerAlt: 'Semana da Construção - Cimento, Argamassas e Estrutural',
    enabled: true,
    order: 3,
  },
  {
    id: 'dept-shortcuts',
    type: 'department_shortcuts',
    title: 'Atalhos de Departamentos',
    enabled: true,
    order: 4,
  },
  {
    id: 'section-ofertas-tempo-limitado',
    type: 'product_carousel',
    title: 'Ofertas Por Tempo Limitado!',
    titleColor: '#009de0',
    productSource: 'discount',
    minDiscountPercent: 10,
    limit: 12,
    enabled: true,
    order: 5,
  },
  {
    id: 'section-tintas-oferta',
    type: 'product_carousel',
    title: 'Tintas em Oferta',
    titleColor: '#009de0',
    productSource: 'category',
    categorySlug: 'tintas-e-vernizes',
    categoryName: 'Tintas e Vernizes',
    limit: 12,
    enabled: true,
    order: 6,
  },
  {
    id: 'banner-seguranca-meio',
    type: 'banner',
    title: 'Ferramentas & Elétrica Profissional - Descontos Exclusivos',
    bannerImageUrl: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=1200&auto=format&fit=crop&q=80',
    bannerLinkUrl: '/produtos',
    bannerAlt: 'Linha de Ferramentas Elétricas, Iluminação e Segurança',
    enabled: true,
    order: 7,
  },
  {
    id: 'section-mais-vendidos',
    type: 'product_carousel',
    title: 'Mais vendidos',
    titleColor: '#009de0',
    productSource: 'bestsellers',
    limit: 12,
    enabled: true,
    order: 8,
  },
  {
    id: 'section-ofertas-exclusivas',
    type: 'product_carousel',
    title: 'Ofertas Exclusivas',
    titleColor: '#009de0',
    productSource: 'featured',
    limit: 12,
    enabled: true,
    order: 9,
  },
];

export function useHomeSections() {
  const [sections, setSections] = useState<HomeSection[]>(DEFAULT_SECTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { apiCall } = useApi();

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

  /**
   * Busca as seções públicas com os produtos carregados para a Home Page
   */
  const fetchPublicSections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${apiBase}/components/home-sections`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSections(data);
          return data;
        }
      }
      setSections(DEFAULT_SECTIONS);
      return DEFAULT_SECTIONS;
    } catch (err: any) {
      console.warn('Usando seções padrão para a home:', err);
      setSections(DEFAULT_SECTIONS);
      return DEFAULT_SECTIONS;
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  /**
   * Busca a lista bruta para o painel Admin
   */
  const fetchAdminSections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiCall('/components/home-sections/admin', {
        requireAuth: true,
      });
      if (Array.isArray(data) && data.length > 0) {
        setSections(data);
        return data;
      }
      setSections(DEFAULT_SECTIONS);
      return DEFAULT_SECTIONS;
    } catch (err: any) {
      console.warn('Erro ao carregar seções admin, usando padrão:', err);
      setSections(DEFAULT_SECTIONS);
      return DEFAULT_SECTIONS;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  /**
   * Salva a lista completa e ordem das seções
   */
  const saveSections = async (newSections: HomeSection[]) => {
    try {
      setSaving(true);
      const res = await apiCall('/components/home-sections', {
        method: 'PUT',
        requireAuth: true,
        body: newSections,
      });
      if (res?.sections) {
        setSections(res.sections);
      }
      return res;
    } catch (err: any) {
      console.error('Erro ao salvar seções:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Adiciona uma nova seção
   */
  const addSection = async (sectionData: Partial<HomeSection>) => {
    try {
      setSaving(true);
      const res = await apiCall('/components/home-sections', {
        method: 'POST',
        requireAuth: true,
        body: sectionData,
      });
      if (res?.sections) {
        setSections(res.sections);
      }
      return res;
    } catch (err: any) {
      console.error('Erro ao adicionar seção:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Atualiza uma seção existente
   */
  const updateSection = async (id: string, sectionData: Partial<HomeSection>) => {
    try {
      setSaving(true);
      const res = await apiCall(`/components/home-sections/${id}`, {
        method: 'PUT',
        requireAuth: true,
        body: sectionData,
      });
      if (res?.sections) {
        setSections(res.sections);
      }
      return res;
    } catch (err: any) {
      console.error('Erro ao atualizar seção:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Deleta uma seção
   */
  const deleteSection = async (id: string) => {
    try {
      setSaving(true);
      const res = await apiCall(`/components/home-sections/${id}`, {
        method: 'DELETE',
        requireAuth: true,
      });
      if (res?.sections) {
        setSections(res.sections);
      }
      return res;
    } catch (err: any) {
      console.error('Erro ao excluir seção:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Restaura o padrão inspirado na Acal
   */
  const resetDefaultSections = async () => {
    try {
      setSaving(true);
      const res = await apiCall('/components/home-sections/reset-default', {
        method: 'POST',
        requireAuth: true,
      });
      if (res?.sections) {
        setSections(res.sections);
      }
      return res;
    } catch (err: any) {
      console.error('Erro ao restaurar padrão:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    sections,
    setSections,
    loading,
    saving,
    error,
    fetchPublicSections,
    fetchAdminSections,
    saveSections,
    addSection,
    updateSection,
    deleteSection,
    resetDefaultSections,
  };
}
