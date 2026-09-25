'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import Footer from './Footer';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { PWAInstallPrompt, PWAStatus } from '@/components/pwa';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isAdminArea = pathname.startsWith('/admin');
  const isReceiptPage = pathname.includes('/recibo');

  if (isAdminArea || isReceiptPage) {
    // Na área administrativa ou páginas de recibo, renderizar apenas o conteúdo sem navegação pública
    return <>{children}</>;
  }

  // Na área pública, renderizar com navegação completa, chat e PWA
  return (
    <>
      <Header />
      <main className="min-h-screen overflow-x-hidden w-full max-w-[100vw]">
        {children}
      </main>
      <Footer />
      <ChatWidget />
      <PWAInstallPrompt />
      <PWAStatus />
    </>
  );
}
