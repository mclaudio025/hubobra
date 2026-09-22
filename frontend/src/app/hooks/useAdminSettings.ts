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

interface UseAdminSettingsReturn {
  settings: Setting[];
  loading: boolean;
  error: string | null;
  getSetting: (key: string, defaultValue?: any) => any;
  updateSetting: (key: string, value: any) => Promise<void>;
  bulkUpdateSettings: (settings: Array<{ key: string; value: any }>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

export function useAdminSettings(category?: string): UseAdminSettingsReturn {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { apiCall } = useApi();

  const fetchSettings = async () => {
    if (!authLoading && isAuthenticated) {
      try {
        setLoading(true);
        setError(null);
        
        let endpoint = '/api/settings';
        if (category) {
          endpoint += `?category=${category}`;
        }
        
        const data = await apiCall(endpoint, { requireAuth: true });
        setSettings(data);
      } catch (error: any) {
        console.error('Erro ao carregar configurações administrativas:', error);
        setError(error.message || 'Erro ao carregar configurações');
        setSettings([]);
      } finally {
        setLoading(false);
      }
    } else if (!authLoading && !isAuthenticated) {
      setError('Usuário não autenticado');
      setSettings([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [isAuthenticated, authLoading, category]);

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

  const updateSetting = async (key: string, value: any) => {
    try {
      await apiCall(`/api/settings/${key}`, {
        method: 'PUT',
        body: { value },
        requireAuth: true
      });
      
      // Atualizar o estado local
      setSettings(prev => prev.map(setting => 
        setting.key === key 
          ? { ...setting, value: value.toString() }
          : setting
      ));
    } catch (error: any) {
      console.error('Erro ao atualizar configuração:', error);
      throw error;
    }
  };

  const bulkUpdateSettings = async (settingsToUpdate: Array<{ key: string; value: any }>) => {
    try {
      await apiCall('/api/settings/bulk', {
        method: 'PUT',
        body: { settings: settingsToUpdate },
        requireAuth: true
      });
      
      // Atualizar o estado local
      setSettings(prev => prev.map(setting => {
        const update = settingsToUpdate.find(s => s.key === setting.key);
        return update 
          ? { ...setting, value: update.value.toString() }
          : setting;
      }));
    } catch (error: any) {
      console.error('Erro ao atualizar configurações em lote:', error);
      throw error;
    }
  };

  const refreshSettings = async () => {
    await fetchSettings();
  };

  return {
    settings,
    loading,
    error,
    getSetting,
    updateSetting,
    bulkUpdateSettings,
    refreshSettings,
  };
}
