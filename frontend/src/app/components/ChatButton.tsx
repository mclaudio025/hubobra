'use client';

import { useState } from 'react';
import { MessageCircle, Bot } from 'lucide-react';
import PersonasChat from './PersonasChat';

export default function ChatButton() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isChatOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-40 group"
          aria-label="Abrir chat com assistentes virtuais"
        >
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span>Fale com Lia ou Zé da Obra</span>
            </div>
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </button>
      )}

      {/* Chat Component */}
      <PersonasChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
