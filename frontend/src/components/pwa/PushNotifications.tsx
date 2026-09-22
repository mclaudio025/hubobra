'use client';

import React, { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, Settings, Check, X } from 'lucide-react';

interface NotificationSettings {
  orders: boolean;
  promotions: boolean;
  recommendations: boolean;
  updates: boolean;
}

export function PushNotifications() {
  const { subscription, setupPushNotifications, sendNotification, isSupported } = usePushNotifications();
  const [isEnabled, setIsEnabled] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    orders: true,
    promotions: true,
    recommendations: false,
    updates: true
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setIsEnabled(!!subscription);
    
    // Carregar configurações salvas
    const savedSettings = localStorage.getItem('notification-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, [subscription]);

  const handleToggleNotifications = async () => {
    if (!isEnabled) {
      await setupPushNotifications();
    } else {
      // Desabilitar notificações
      if (subscription) {
        await subscription.unsubscribe();
        setIsEnabled(false);
      }
    }
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('notification-settings', JSON.stringify(newSettings));
  };

  const testNotification = () => {
    sendNotification('Teste de Notificação', {
      body: 'Esta é uma notificação de teste da Loja Moderna!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'test',
      actions: [
        {
          action: 'view',
          title: 'Ver Detalhes'
        },
        {
          action: 'dismiss',
          title: 'Dispensar'
        }
      ]
    });
  };

  if (!isSupported) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <BellOff className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-600">Notificações não suportadas</p>
              <p className="text-sm text-gray-500">Seu navegador não suporta notificações push</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle className="text-lg">Notificações Push</CardTitle>
                <CardDescription>
                  Receba atualizações importantes mesmo quando não estiver no site
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEnabled && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Check className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Ativar Notificações</p>
              <p className="text-sm text-gray-600">
                Permita que enviemos notificações para você
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggleNotifications}
            />
          </div>

          {isEnabled && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={testNotification}
                className="w-full"
              >
                Testar Notificação
              </Button>
            </div>
          )}

          {showSettings && isEnabled && (
            <div className="pt-4 border-t space-y-4">
              <h4 className="font-medium text-gray-900">Tipos de Notificação</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Pedidos</p>
                    <p className="text-xs text-gray-600">Status de pedidos e entregas</p>
                  </div>
                  <Switch
                    checked={settings.orders}
                    onCheckedChange={(value) => handleSettingChange('orders', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Promoções</p>
                    <p className="text-xs text-gray-600">Ofertas especiais e descontos</p>
                  </div>
                  <Switch
                    checked={settings.promotions}
                    onCheckedChange={(value) => handleSettingChange('promotions', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Recomendações</p>
                    <p className="text-xs text-gray-600">Produtos sugeridos para você</p>
                  </div>
                  <Switch
                    checked={settings.recommendations}
                    onCheckedChange={(value) => handleSettingChange('recommendations', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Atualizações</p>
                    <p className="text-xs text-gray-600">Novidades e melhorias do app</p>
                  </div>
                  <Switch
                    checked={settings.updates}
                    onCheckedChange={(value) => handleSettingChange('updates', value)}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exemplos de notificações */}
      {isEnabled && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm text-blue-800">Exemplos de Notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs space-y-1">
              <p className="font-medium text-blue-800">📦 Pedido enviado</p>
              <p className="text-blue-600">Seu pedido #1234 foi enviado e chegará em 2 dias</p>
            </div>
            <div className="text-xs space-y-1">
              <p className="font-medium text-blue-800">🎯 Oferta especial</p>
              <p className="text-blue-600">20% de desconto em cimentos - Válido até amanhã!</p>
            </div>
            <div className="text-xs space-y-1">
              <p className="font-medium text-blue-800">💡 Recomendação IA</p>
              <p className="text-blue-600">Lia sugere: Tijolo ecológico para seu projeto</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente para mostrar notificações recebidas
export function NotificationHistory() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Carregar histórico de notificações
    const history = localStorage.getItem('notification-history');
    if (history) {
      setNotifications(JSON.parse(history));
    }

    // Escutar novas notificações
    const handleNotification = (event: any) => {
      const newNotification = {
        id: Date.now(),
        title: event.title,
        body: event.body,
        timestamp: new Date().toISOString(),
        read: false
      };
      
      setNotifications(prev => {
        const updated = [newNotification, ...prev].slice(0, 50); // Manter apenas 50
        localStorage.setItem('notification-history', JSON.stringify(updated));
        return updated;
      });
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleNotification);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleNotification);
      };
    }
  }, []);

  const markAsRead = (id: number) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('notification-history', JSON.stringify(updated));
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem('notification-history');
  };

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Nenhuma notificação ainda</p>
          <p className="text-sm text-gray-500">Suas notificações aparecerão aqui</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Histórico de Notificações</CardTitle>
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Limpar Tudo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                notification.read 
                  ? 'bg-gray-50 border-gray-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notification.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-1" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}