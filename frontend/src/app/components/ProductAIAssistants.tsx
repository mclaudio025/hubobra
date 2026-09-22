'use client';

import { useState } from 'react';
import { MessageCircle, Bot, UserCheck, Wrench, Sparkles, HelpCircle } from 'lucide-react';
import PersonasChat from './PersonasChat';
import { designTokens } from '@/styles/design-tokens';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  specifications?: any;
}

interface ProductAIAssistantsProps {
  product: Product;
  className?: string;
}

export default function ProductAIAssistants({ product, className = '' }: ProductAIAssistantsProps) {
  const [showAIChat, setShowAIChat] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleOpenChat = (initialMessage?: string) => {
    if (initialMessage) {
      // Aqui podemos passar uma mensagem inicial contextual
      // Por enquanto, apenas abrimos o chat
    }
    setShowAIChat(true);
  };

  const getProductContext = () => {
    return {
      productName: product.name,
      category: product.category,
      price: product.price,
      description: product.description
    };
  };

  const quickActions = [
    {
      id: 'specs',
      label: 'Especificações Técnicas',
      message: `Preciso de informações técnicas detalhadas sobre ${product.name}`,
      icon: <Wrench className="h-4 w-4" />,
      persona: 'ze',
      color: 'text-green-600 bg-green-50 hover:bg-green-100'
    },
    {
      id: 'compatibility',
      label: 'Compatibilidade',
      message: `Este produto ${product.name} é compatível com meu projeto?`,
      icon: <HelpCircle className="h-4 w-4" />,
      persona: 'ze',
      color: 'text-green-600 bg-green-50 hover:bg-green-100'
    },
    {
      id: 'installation',
      label: 'Como Instalar',
      message: `Como instalar ${product.name}? Preciso de orientações.`,
      icon: <Sparkles className="h-4 w-4" />,
      persona: 'ze',
      color: 'text-green-600 bg-green-50 hover:bg-green-100'
    },
    {
      id: 'purchase',
      label: 'Informações de Compra',
      message: `Gostaria de saber sobre entrega e garantia para ${product.name}`,
      icon: <UserCheck className="h-4 w-4" />,
      persona: 'lia',
      color: 'text-blue-600 bg-blue-50 hover:bg-blue-100'
    }
  ];

  return (
    <>
      <div className={`${className}`}>
        {/* Botão principal flutuante */}
        <div className="fixed bottom-6 left-6 z-40">
          <div className="flex flex-col gap-3">
            {/* Botão principal */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 group relative"
              aria-label="Assistentes virtuais para este produto"
            >
              <div className="relative">
                <MessageCircle className="h-6 w-6" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <span>Assistentes para este produto</span>
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </button>

            {/* Menu expandido */}
            {isExpanded && (
              <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 mb-4 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <Bot className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-800">Assistentes Virtuais</h3>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Tire suas dúvidas sobre <strong>{product.name}</strong>
                </p>

                {/* Ações rápidas */}
                <div className="space-y-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleOpenChat(action.message)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${action.color} text-left`}
                    >
                      {action.icon}
                      <span className="text-sm font-medium">{action.label}</span>
                    </button>
                  ))}
                </div>

                {/* Botão para chat geral */}
                <button
                  onClick={() => handleOpenChat()}
                  className="w-full mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-2 p-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">Chat livre</span>
                </button>
              </div>
            )}

            {/* Indicadores dos assistentes (sempre visíveis) */}
            <div className="flex flex-col gap-2">
              <div 
                className="bg-white rounded-full p-2 shadow-md border border-blue-200 group cursor-pointer hover:bg-blue-50 transition-colors relative" 
                onClick={() => handleOpenChat(`Olá Lia! Estou interessado no produto ${product.name}`)}
              >
                <UserCheck className="h-4 w-4 text-blue-600" />
                <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Lia - Atendimento
                </div>
              </div>
              <div 
                className="bg-white rounded-full p-2 shadow-md border border-green-200 group cursor-pointer hover:bg-green-50 transition-colors relative" 
                onClick={() => handleOpenChat(`Oi Zé! Preciso de ajuda técnica com ${product.name}`)}
              >
                <Wrench className="h-4 w-4 text-green-600" />
                <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Zé da Obra - Técnico
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Chat dos Assistentes */}
      <PersonasChat
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
      />
    </>
  );
}

export { ProductAIAssistants };