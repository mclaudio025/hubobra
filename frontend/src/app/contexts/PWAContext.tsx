'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  showIOSInstructions: boolean;
  setShowIOSInstructions: (show: boolean) => void;
  installPWA: () => Promise<boolean>;
  dismissBanner: () => void;
  isBannerDismissed: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Verificar se já está rodando como standalone (App instalado)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Verificar se o banner foi dispensado na sessão
    const dismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';
    setIsBannerDismissed(dismissed);

    // 3. Detectar se é dispositivo iOS (iPhone, iPad, iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // No iOS Safari não há evento 'beforeinstallprompt', então consideramos instalável via guia manual
    if (isIosDevice && !isStandalone) {
      setIsInstallable(true);
    }

    // 4. Capturar evento beforeinstallprompt (Android / Chrome / Edge / Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Impede que o banner nativo padrão suma ou apareça no momento errado
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      console.log('📱 PWA: Evento de instalação capturado com sucesso!');
    };

    // 5. Escutar quando o app for instalado com sucesso
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('🎉 PWA: Aplicativo instalado com sucesso!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = useCallback(async (): Promise<boolean> => {
    if (isIOS) {
      // No iOS, abre o modal de instruções passo a passo
      setShowIOSInstructions(true);
      return false;
    }

    if (!deferredPrompt) {
      // Se não houver prompt nativo pronto (por exemplo, em navegadores de desktop ou já engatilhado)
      setShowIOSInstructions(true);
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ Usuário aceitou a instalação do PWA');
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('❌ Usuário recusou a instalação');
        return false;
      }
    } catch (error) {
      console.error('Erro ao tentar instalar PWA:', error);
      return false;
    }
  }, [deferredPrompt, isIOS]);

  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa_banner_dismissed', 'true');
    }
  }, []);

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isIOS,
        showIOSInstructions,
        setShowIOSInstructions,
        installPWA,
        dismissBanner,
        isBannerDismissed,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA deve ser usado dentro de um PWAProvider');
  }
  return context;
}
