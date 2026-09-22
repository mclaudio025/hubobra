'use client';

import { useState, useEffect } from 'react';
import { useApi } from './useApi';
import { useAuth } from '../contexts/AuthContext';

interface Setting {
  key: string;
  value: string;
  type: string;
  category: string;
  label: string;
  description?: string;
}

interface UseSettingsReturn {
  settings: Setting[];
  loading: boolean;
  error: string | null;
  getSetting: (key: string, defaultValue?: any) => any;
  getCarouselInterval: () => number;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { apiCall } = useApi();

  const defaultSettings = [
    {
      key: 'carousel_autoplay_interval',
      value: '5000',
      type: 'NUMBER',
      category: 'SYSTEM',
      label: 'Intervalo do Carrossel',
      description: 'Intervalo em milissegundos para troca automática do carrossel'
    }
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      if (!authLoading) {
        try {
          // Sempre usar configurações públicas para a página inicial
          // As configurações privadas só são necessárias no painel admin
          const response = await fetch('/api/settings/public');
          if (response.ok) {
            const data = await response.json();
            setSettings(data);
          } else {
            console.warn('Falha ao carregar configurações públicas, usando padrões');
            setSettings(defaultSettings);
          }
        } catch (error) {
          console.error('Erro ao carregar configurações:', error);
          setSettings(defaultSettings);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSettings();
  }, [authLoading]); // Removido isAuthenticated e apiCall das dependências

  const getSetting = (key: string, defaultValue?: any) => {
    const setting = settings.find(s => s.key === key);
    if (!setting) return defaultValue;

    // Converter valor baseado no tipo
    switch (setting.type) {
      case 'BOOLEAN':
        return setting.value === 'true';
      case 'NUMBER':
        return parseFloat(setting.value) || defaultValue;
      case 'JSON':
        try {
          return JSON.parse(setting.value);
        } catch {
          return defaultValue;
        }
      default:
        return setting.value || defaultValue;
    }
  };

  const getCarouselInterval = (): number => {
    return getSetting('carousel_autoplay_interval', 5000);
  };

  return {
    settings,
    loading,
    error,
    getSetting,
    getCarouselInterval,
  };
}
