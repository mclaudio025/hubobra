'use client';

import { useEffect } from 'react';

// Executa imediatamente na inicialização do bundle do cliente
if (typeof window !== 'undefined') {
  try {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const fullMessage = args
        .map((arg) => (typeof arg === 'string' ? arg : arg?.message || ''))
        .join(' ');

      if (
        fullMessage.includes('bis_skin_checked') ||
        fullMessage.includes('cz-shortcut-listen') ||
        fullMessage.includes('hydration-mismatch') ||
        fullMessage.includes('A tree hydrated but some attributes') ||
        fullMessage.includes('did not match the client properties')
      ) {
        // Ignora silenciosamente modificações de DOM causadas por extensões do cliente (Bitdefender, antivírus, etc.)
        return;
      }
      originalError.apply(console, args);
    };
  } catch (_) {}
}

export default function HydrationHandler() {
  useEffect(() => {
    // Garante persistência após montagem
  }, []);

  return null;
}
