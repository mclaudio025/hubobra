'use client';

import { useState } from 'react';
import { MessageCircle, Bot, Mic, Sparkles } from 'lucide-react';
import PersonasChat from './PersonasChat';
import LiveVoiceModal from './LiveVoiceModal';

export default function ChatButton() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const openVoice = () => {
    setIsChatOpen(false);
    setIsVoiceOpen(true);
  };

  const openChat = () => {
    setIsVoiceOpen(false);
    setIsChatOpen(true);
  };

  return (
    <>
      {/* Floating Action Buttons */}
      {!isChatOpen && !isVoiceOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
          
          {/* Botão 1: Falar por Voz em Tempo Real (Lia Live) */}
          <button
            onClick={openVoice}
            className="flex items-center gap-2.5 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white pl-4 pr-5 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 group border border-orange-400/40"
            aria-label="Falar por voz com a Lia"
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute w-7 h-7 rounded-full bg-orange-400/40 animate-ping" />
              <div className="relative w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Mic className="h-4 w-4 text-white animate-pulse" />
              </div>
            </div>

            <div className="flex flex-col items-start text-left">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 text-orange-100">
                <Sparkles className="w-3 h-3 text-amber-200" />
                Lia por Voz
              </span>
              <span className="text-[11px] text-white/90 font-medium">Falar com a IA</span>
            </div>
          </button>

          {/* Botão 2: Chat em Texto Tradicional */}
          <button
            onClick={openChat}
            className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white p-3.5 rounded-full shadow-lg transition-all duration-300 hover:scale-105 group border border-slate-700/70"
            aria-label="Abrir chat de texto com assistentes virtuais"
          >
            <div className="relative">
              <MessageCircle className="h-5 w-5" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full"></div>
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none shadow-md">
              <div className="flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5 text-orange-400" />
                <span>Chat em Texto (Lia & Zé)</span>
              </div>
            </div>
          </button>

        </div>
      )}

      {/* Modal de Voz em Tempo Real */}
      <LiveVoiceModal 
        isOpen={isVoiceOpen} 
        onClose={() => setIsVoiceOpen(false)} 
        onSwitchToTextChat={openChat}
      />

      {/* Modal de Chat em Texto Tradicional */}
      <PersonasChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </>
  );
}
