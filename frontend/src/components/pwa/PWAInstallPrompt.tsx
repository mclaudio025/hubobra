'use client';

import React, { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, X, Smartphone, Monitor, Wifi, Bell } from 'lucide-react';

interface PWAInstallPromptProps {
  onClose?: () => void;
  showFeatures?: boolean;
  autoShow?: boolean;
}

export function PWAInstallPrompt({ 
  onClose, 
  showFeatures = true, 
  autoShow = true 
}: PWAInstallPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { 
    isInstallable, 
    isInstalled, 
    installApp, 
    notificationPermission,
    requestNotificationPermission 
  } = usePWA();

  // Verificar se deve mostrar o prompt
  useEffect(() => {
    if (!autoShow) return;
    
    const hasBeenDismissed = localStorage.getItem('pwa-install-dismissed');
    const lastShown = localStorage.getItem('pwa-install-last-shown');
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    // Mostrar se:
    // - App é instalável
    // - Não está instalado
    // - Não foi dispensado permanentemente
    // - Não foi mostrado nas últimas 24h
    if (
      isInstallable && 
      !isInstalled && 
      !hasBeenDismissed &&
      (!lastShown || now - parseInt(lastShown) > dayInMs)
    ) {
      // Delay para não ser intrusivo
      const timer = setTimeout(() => {
        setIsVisible(true);
        localStorage.setItem('pwa-install-last-shown', now.toString());
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, autoShow]);

  const handleInstall = async () => {
    try {
      await installApp();
      setIsVisible(false);
      onClose?.();
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  const handleDismiss = (permanent = false) => {
    setIsVisible(false);
    setDismissed(true);
    
    if (permanent) {
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
    
    onClose?.();
  };

  const handleNotificationSetup = async () => {
    if (notificationPermission === 'default') {
      await requestNotificationPermission();
    }
  };

  if (!isInstallable || isInstalled || dismissed || !isVisible) {
    return null;
  }

  const features = [
    {
      icon: Smartphone,
      title: 'Acesso Rápido',
      description: 'Abra direto da tela inicial'
    },
    {
      icon: Wifi,
      title: 'Funciona Offline',
      description: 'Use mesmo sem internet'
    },
    {
      icon: Bell,
      title: 'Notificações',
      description: 'Receba atualizações importantes'
    },
    {
      icon: Monitor,
      title: 'Experiência Nativa',
      description: 'Interface otimizada'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-md border-0 shadow-2xl">
        <CardHeader className="text-center relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0"
            onClick={() => handleDismiss(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <Download className="h-8 w-8 text-white" />
          </div>
          
          <CardTitle className="text-xl font-bold text-gray-900">
            Instalar App
          </CardTitle>
          
          <CardDescription className="text-gray-600">
            Tenha acesso rápido e uma experiência melhor
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {showFeatures && (
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="text-center p-3 rounded-lg bg-gray-50">
                    <Icon className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <h4 className="font-medium text-sm text-gray-900 mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {notificationPermission === 'default' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  Ativar Notificações
                </span>
              </div>
              <p className="text-xs text-amber-700 mb-3">
                Receba atualizações sobre seus pedidos e ofertas especiais
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={handleNotificationSetup}
              >
                Permitir Notificações
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleInstall}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3"
            >
              <Download className="h-4 w-4 mr-2" />
              Instalar Agora
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1"
                onClick={() => handleDismiss(false)}
              >
                Agora Não
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="flex-1 text-gray-500"
                onClick={() => handleDismiss(true)}
              >
                Não Mostrar Mais
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <Badge variant="secondary" className="text-xs">
              Seguro
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Gratuito
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Sem Anúncios
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para mostrar status de instalação
export function PWAStatus() {
  const { isInstalled, isOnline, updateAvailable, updateApp } = usePWA();

  if (!isInstalled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {updateAvailable && (
        <Card className="bg-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Atualização Disponível</p>
                <p className="text-xs opacity-90">Nova versão do app</p>
              </div>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={updateApp}
              >
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {!isOnline && (
        <Card className="bg-amber-600 text-white border-0 shadow-lg mt-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Wifi className="h-5 w-5" />
              <div>
                <p className="font-medium text-sm">Modo Offline</p>
                <p className="text-xs opacity-90">Algumas funções limitadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}