'use client';

import { useState, useEffect, useCallback } from 'react';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  notificationPermission: NotificationPermission;
}

interface PWAActions {
  installApp: () => Promise<void>;
  updateApp: () => Promise<void>;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  sendNotification: (title: string, options?: NotificationOptions) => void;
  registerBackgroundSync: (tag: string) => Promise<void>;
  cacheResource: (url: string, priority: 'high' | 'medium' | 'low') => void;
}

export function usePWA(): PWAState & PWAActions {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Registrar Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registered:', reg);
          setRegistration(reg);
          
          // Verificar atualizações
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  // Detectar se o app está instalado
  useEffect(() => {
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };
    
    checkInstalled();
    window.addEventListener('appinstalled', () => setIsInstalled(true));
    
    return () => {
      window.removeEventListener('appinstalled', () => setIsInstalled(true));
    };
  }, []);

  // Detectar evento de instalação
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Monitorar status de conexão
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Verificar permissão de notificação
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Instalar aplicativo
  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;
    
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted');
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Installation failed:', error);
    }
  }, [deferredPrompt]);

  // Atualizar aplicativo
  const updateApp = useCallback(async () => {
    if (!registration) return;
    
    try {
      const newWorker = registration.waiting;
      if (newWorker) {
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
  }, [registration]);

  // Solicitar permissão de notificação
  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      return 'denied';
    }
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission;
    } catch (error) {
      console.error('Notification permission request failed:', error);
      return 'denied';
    }
  }, []);

  // Enviar notificação
  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    
    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options
      });
      
      // Auto-close após 5 segundos
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('Notification failed:', error);
    }
  }, []);

  // Registrar sincronização em background
  const registerBackgroundSync = useCallback(async (tag: string) => {
    if (!registration || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.warn('Background sync not supported');
      return;
    }
    
    try {
      await registration.sync.register(tag);
      console.log('Background sync registered:', tag);
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }, [registration]);

  // Cache de recursos com prioridade
  const cacheResource = useCallback((url: string, priority: 'high' | 'medium' | 'low') => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_PRIORITY',
        url,
        priority
      });
    }
  }, []);

  return {
    // State
    isInstallable,
    isInstalled,
    isOnline,
    updateAvailable,
    notificationPermission,
    
    // Actions
    installApp,
    updateApp,
    requestNotificationPermission,
    sendNotification,
    registerBackgroundSync,
    cacheResource
  };
}

// Hook para dados offline
export function useOfflineData() {
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const { isOnline, registerBackgroundSync } = usePWA();

  // Adicionar dados à fila offline
  const addToOfflineQueue = useCallback((data: any) => {
    setOfflineQueue(prev => [...prev, { ...data, timestamp: Date.now() }]);
    
    // Registrar para sincronização quando voltar online
    if (!isOnline) {
      registerBackgroundSync('offline-data');
    }
  }, [isOnline, registerBackgroundSync]);

  // Processar fila quando voltar online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      // Processar dados offline
      console.log('Processing offline queue:', offlineQueue);
      
      // Limpar fila após processamento
      setOfflineQueue([]);
    }
  }, [isOnline, offlineQueue]);

  return {
    offlineQueue,
    addToOfflineQueue,
    hasOfflineData: offlineQueue.length > 0
  };
}

// Hook para notificações push
export function usePushNotifications() {
  const { notificationPermission, requestNotificationPermission, sendNotification } = usePWA();
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  // Configurar push notifications
  const setupPushNotifications = useCallback(async () => {
    if (notificationPermission !== 'granted') {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') return;
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });
        
        setSubscription(sub);
        
        // Enviar subscription para o servidor
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub)
        });
        
        console.log('Push notifications configured');
      } catch (error) {
        console.error('Push notification setup failed:', error);
      }
    }
  }, [notificationPermission, requestNotificationPermission]);

  return {
    subscription,
    setupPushNotifications,
    sendNotification,
    isSupported: 'serviceWorker' in navigator && 'PushManager' in window
  };
}