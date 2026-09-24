'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Sparkles, 
  ShoppingCart, 
  Check, 
  RefreshCw, 
  HardHat, 
  Headphones, 
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import Image from 'next/image';

interface ProductItem {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  sku?: string;
  image?: string;
  unit?: string;
}

interface CalculationData {
  tipo: string;
  areaM2?: number;
  cimentoSacos?: number;
  areiaM3?: string;
  tijolos?: number;
  argamassaSacos?: number;
  britaM3?: string;
}

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToTextChat?: () => void;
}

export default function LiveVoiceModal({ isOpen, onClose, onSwitchToTextChat }: LiveVoiceModalProps) {
  const { addToCart } = useCart();

  // Estados de voz e transcrição
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Agente ativo e conteúdos
  const [currentPersona, setCurrentPersona] = useState<'lia' | 'ze'>('lia');
  const [userTranscript, setUserTranscript] = useState('');
  const [aiResponseText, setAiResponseText] = useState('');
  const [delegationNotice, setDelegationNotice] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [calculation, setCalculation] = useState<CalculationData | null>(null);
  const [addedProductIds, setAddedProductIds] = useState<Set<string>>(new Set());
  const [statusMessage, setStatusMessage] = useState('Clique no microfone para conversar');

  // Refs de áudio e reconhecimento
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sessionIdRef = useRef<string>(`voice_session_${Date.now()}`);
  const isAutoListeningRef = useRef<boolean>(false);

  // Inicializar Speech Recognition e Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          setStatusMessage('Ouvindo sua voz...');
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setUserTranscript(currentTranscript);

          // Se for resultado final
          if (event.results[0].isFinal) {
            handleProcessUserSpeech(currentTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setStatusMessage('Permissão de microfone negada no navegador');
          } else if (event.error !== 'no-speech') {
            setStatusMessage('Toque no microfone para tentar novamente');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      stopAllAudio();
    };
  }, []);

  // Quando abre o modal, dá as boas-vindas com voz da Lia
  useEffect(() => {
    if (isOpen) {
      sessionIdRef.current = `voice_session_${Date.now()}`;
      setAddedProductIds(new Set());
      setDelegationNotice(null);
      setProducts([]);
      setCalculation(null);

      const welcomeText = 'Olá! Sou a Lia, sua consultora de obras. Como posso te ajudar a calcular ou escolher materiais hoje?';
      setUserTranscript('');
      setAiResponseText(welcomeText);
      setCurrentPersona('lia');

      // Tocar boas-vindas após breve delay
      const timer = setTimeout(() => {
        speakText(welcomeText, 'lia', true);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      stopAllAudio();
    }
  }, [isOpen]);

  // Função para parar áudio e microfone
  const stopAllAudio = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignorar
      }
    }
    setIsSpeaking(false);
    setIsListening(false);
    setIsProcessing(false);
  };

  // Limpeza de texto para voz (remove asteriscos, emojis, formatação markdown)
  const cleanTextForSpeech = (text: string): string => {
    return text
      .replace(/[*_~`#]/g, '') // remove markdown
      .replace(/•/g, ', ') // substitui bullet points
      .replace(/[\u{1F600}-\u{1F6FF}|[\u{1F300}-\u{1F5FF}|[\u{1F680}-\u{1F6FF}|[\u{2600}-\u{26FF}]/gu, '') // remove emojis
      .replace(/R\$\s?(\d+)[,.](\d{2})/g, '$1 reais e $2 centavos')
      .replace(/m²/g, 'metros quadrados')
      .replace(/m³/g, 'metros cúbicos')
      .replace(/\n+/g, '. ')
      .trim();
  };

  // Falar texto com síntese de voz nativa pt-BR
  const speakText = (text: string, persona: 'lia' | 'ze', autoStartListeningAfter = false) => {
    if (isMuted || !synthRef.current || typeof window === 'undefined') return;

    synthRef.current.cancel(); // cancela qualquer fala anterior

    const cleaned = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'pt-BR';

    // Ajuste de voz e entonação conforme a persona
    if (persona === 'lia') {
      utterance.pitch = 1.15; // tom mais agudo e acolhedor
      utterance.rate = 1.05; // ritmo dinâmico de consultora
    } else {
      utterance.pitch = 0.85; // tom mais encorpado e técnico do Zé
      utterance.rate = 0.98; // ritmo firme de engenheiro
    }

    // Tentar selecionar melhor voz em português disponível
    const voices = synthRef.current.getVoices();
    const ptVoices = voices.filter(v => v.lang.includes('pt') || v.lang.includes('BR'));
    if (ptVoices.length > 0) {
      if (persona === 'lia') {
        const femaleVoice = ptVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('maria') || v.name.toLowerCase().includes('luciana') || v.name.toLowerCase().includes('google português do brasil'));
        if (femaleVoice) utterance.voice = femaleVoice;
      } else {
        const maleVoice = ptVoices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('ricardo') || v.name.toLowerCase().includes('antonio'));
        if (maleVoice) utterance.voice = maleVoice;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setStatusMessage(persona === 'lia' ? 'Lia falando...' : 'Zé da Obra explicando...');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setStatusMessage('Sua vez de falar. Toque no microfone ou fale!');
      if (autoStartListeningAfter && !isMuted) {
        startListening();
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setStatusMessage('Pronto para sua pergunta');
    };

    activeUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  // Iniciar captura de voz do microfone
  const startListening = () => {
    if (synthRef.current) {
      synthRef.current.cancel(); // Barge-in: para de falar imediatamente se o usuário for falar
    }
    setIsSpeaking(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setStatusMessage('Ouvindo você com atenção...');
      } catch (e) {
        // Se já estava rodando, aborta e reinicia
        try {
          recognitionRef.current.abort();
          setTimeout(() => {
            recognitionRef.current.start();
            setIsListening(true);
          }, 100);
        } catch (err) {
          console.warn('Erro ao reiniciar reconhecimento:', err);
        }
      }
    } else {
      setStatusMessage('Reconhecimento de voz não suportado neste navegador');
    }
  };

  // Alternar microfone
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setStatusMessage('Microfone pausado');
    } else {
      startListening();
    }
  };

  // Processar fala do usuário via Backend / IA
  const handleProcessUserSpeech = async (speechText: string) => {
    if (!speechText.trim()) return;

    setIsProcessing(true);
    setStatusMessage('Lia consultando o sistema...');

    try {
      const response = await fetch('/api/ai-personas/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: speechText,
          sessionId: sessionIdRef.current,
          userName: 'Cliente',
          channel: 'voice_web',
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao comunicar com a IA');
      }

      const data = await response.json();
      const responsePersona = data.persona || 'lia';
      const responseText = data.response || 'Entendido! Como posso ajudar mais?';

      // Atualizar estados
      setCurrentPersona(responsePersona);
      setAiResponseText(responseText);

      if (data.products && Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products);
      }

      if (data.calculation) {
        setCalculation(data.calculation);
        setDelegationNotice('⚡ Lia delegou para Zé da Obra o dimensionamento técnico dos materiais');
      } else if (responsePersona === 'ze') {
        setDelegationNotice('👷 Zé da Obra assumiu para tirar suas dúvidas técnicas');
      } else {
        setDelegationNotice(null);
      }

      setIsProcessing(false);

      // Falar a resposta sintetizada
      speakText(responseText, responsePersona, false);

    } catch (error) {
      console.error('Erro no processamento da voz:', error);
      setIsProcessing(false);
      const fallbackMsg = 'Desculpe, tive uma instabilidade momentânea na conexão. Pode repetir por gentileza?';
      setAiResponseText(fallbackMsg);
      speakText(fallbackMsg, 'lia', false);
    }
  };

  // Enviar sugestão rápida clicada
  const handleQuickPrompt = (prompt: string) => {
    setUserTranscript(prompt);
    handleProcessUserSpeech(prompt);
  };

  // Adicionar produto ao carrinho direto da interface de voz
  const handleAddToCart = async (product: ProductItem) => {
    try {
      await addToCart(product.id, 1);
      setAddedProductIds(prev => new Set(prev).add(product.id));
      
      // Feedback auditivo sutil
      const addMsg = `Adicionei ${product.name} ao seu carrinho!`;
      setStatusMessage(addMsg);
    } catch (err) {
      console.error('Erro ao adicionar produto:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Superior */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              currentPersona === 'ze' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
            }`}>
              {currentPersona === 'ze' ? <HardHat className="w-6 h-6" /> : <Headphones className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-white">
                  {currentPersona === 'ze' ? 'Zé da Obra' : 'Lia HubObra'}
                </h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  currentPersona === 'ze'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                }`}>
                  {currentPersona === 'ze' ? 'Engenheiro & Cálculos' : 'Voz & Consultoria'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Harness de Voz Inteligente com Múltiplos Especialistas</p>
            </div>
          </div>

          {/* Botões de Ação no Topo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                if (!isMuted && synthRef.current) synthRef.current.cancel();
              }}
              className={`p-2 rounded-xl border transition-colors ${
                isMuted 
                  ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                  : 'bg-slate-800/60 text-slate-300 border-slate-700/50 hover:bg-slate-800'
              }`}
              title={isMuted ? 'Ativar Voz' : 'Silenciar Voz'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {onSwitchToTextChat && (
              <button
                onClick={() => {
                  stopAllAudio();
                  onClose();
                  onSwitchToTextChat();
                }}
                className="p-2 rounded-xl bg-slate-800/60 text-slate-300 border border-slate-700/50 hover:bg-slate-800 transition-colors"
                title="Alternar para Chat de Texto"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => {
                stopAllAudio();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/50 hover:bg-slate-800 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notificação de Delegação Multi-Agente */}
        {delegationNotice && (
          <div className="mx-6 mt-4 px-4 py-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300 animate-in slide-in-from-top-2 duration-300">
            <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-spin" />
            <span>{delegationNotice}</span>
          </div>
        )}

        {/* Área Central: Visualizador de Voz e Transcrição */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          
          {/* Visualizador de Onda Sonora Holográfica */}
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative flex items-center justify-center">
              {/* Glow Pulsante */}
              <div className={`absolute w-32 h-32 rounded-full blur-2xl transition-all duration-500 ${
                isSpeaking 
                  ? (currentPersona === 'ze' ? 'bg-emerald-500/30 scale-125' : 'bg-orange-500/30 scale-125') 
                  : isListening 
                    ? 'bg-cyan-500/30 scale-110 animate-pulse' 
                    : 'bg-slate-800/40 scale-90'
              }`} />

              {/* Botão Principal do Microfone */}
              <button
                onClick={toggleListening}
                disabled={isProcessing}
                className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                  isListening
                    ? 'bg-cyan-500 text-white shadow-cyan-500/50 ring-4 ring-cyan-400/30 scale-105'
                    : isSpeaking
                      ? (currentPersona === 'ze' ? 'bg-emerald-600 text-white shadow-emerald-600/40' : 'bg-orange-600 text-white shadow-orange-600/40')
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/50'
                }`}
              >
                {isProcessing ? (
                  <RefreshCw className="w-10 h-10 animate-spin text-white" />
                ) : isListening ? (
                  <Mic className="w-10 h-10 animate-bounce" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </button>
            </div>

            {/* Status Visual */}
            <p className="mt-4 text-xs font-medium text-slate-300 tracking-wide flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                isListening ? 'bg-cyan-400 animate-ping' : isSpeaking ? 'bg-orange-400 animate-pulse' : 'bg-slate-500'
              }`} />
              {statusMessage}
            </p>
          </div>

          {/* Card da Última Fala do Usuário */}
          {userTranscript && (
            <div className="p-3.5 bg-slate-800/40 border border-slate-700/40 rounded-2xl">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Você disse:
              </span>
              <p className="text-sm text-slate-100 italic">
                "{userTranscript}"
              </p>
            </div>
          )}

          {/* Card da Resposta da Lia / Zé */}
          {aiResponseText && (
            <div className={`p-4 rounded-2xl border transition-all ${
              currentPersona === 'ze'
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-100'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-100'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-orange-400 flex items-center gap-1.5">
                  {currentPersona === 'ze' ? <HardHat className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4 text-orange-400" />}
                  {currentPersona === 'ze' ? 'Zé da Obra:' : 'Lia:'}
                </span>
                {isSpeaking && (
                  <span className="text-[10px] text-orange-300 font-medium animate-pulse flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5" /> Falando em áudio
                  </span>
                )}
              </div>
              <p className="text-sm whitespace-pre-line leading-relaxed">
                {aiResponseText}
              </p>
            </div>
          )}

          {/* Resumo do Cálculo de Engenharia (se houver) */}
          {calculation && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HardHat className="w-4 h-4 text-emerald-400" />
                Resumo do Cálculo do Zé ({calculation.tipo})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {calculation.areaM2 && (
                  <div className="p-2 bg-slate-900/60 rounded-xl border border-emerald-500/20">
                    <span className="text-slate-400 block text-[10px]">Área Total</span>
                    <span className="font-bold text-white text-sm">{calculation.areaM2} m²</span>
                  </div>
                )}
                {calculation.cimentoSacos && (
                  <div className="p-2 bg-slate-900/60 rounded-xl border border-emerald-500/20">
                    <span className="text-slate-400 block text-[10px]">Cimento CP-II</span>
                    <span className="font-bold text-emerald-400 text-sm">{calculation.cimentoSacos} sacos</span>
                  </div>
                )}
                {calculation.areiaM3 && (
                  <div className="p-2 bg-slate-900/60 rounded-xl border border-emerald-500/20">
                    <span className="text-slate-400 block text-[10px]">Areia Lavada</span>
                    <span className="font-bold text-emerald-400 text-sm">{calculation.areiaM3} m³</span>
                  </div>
                )}
                {calculation.tijolos && (
                  <div className="p-2 bg-slate-900/60 rounded-xl border border-emerald-500/20">
                    <span className="text-slate-400 block text-[10px]">Tijolos Cerâmicos</span>
                    <span className="font-bold text-emerald-400 text-sm">~{calculation.tijolos} un</span>
                  </div>
                )}
                {calculation.argamassaSacos && (
                  <div className="p-2 bg-slate-900/60 rounded-xl border border-emerald-500/20">
                    <span className="text-slate-400 block text-[10px]">Argamassa</span>
                    <span className="font-bold text-emerald-400 text-sm">{calculation.argamassaSacos} sacos</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Carrossel de Produtos Recomendados em Tempo Real */}
          {products.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-orange-400" />
                Produtos recomendados em estoque:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {products.map((product) => {
                  const isAdded = addedProductIds.has(product.id);
                  return (
                    <div 
                      key={product.id}
                      className="p-3 bg-slate-800/70 border border-slate-700/60 rounded-2xl flex items-center gap-3 hover:border-orange-500/40 transition-colors"
                    >
                      <div className="relative w-14 h-14 bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 border border-slate-700/40">
                        {product.image && product.image.startsWith('http') ? (
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px]">
                            Foto
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{product.name}</p>
                        <p className="text-xs font-bold text-orange-400 mt-0.5">
                          R$ {Number(product.salePrice || product.price).toFixed(2).replace('.', ',')}
                        </p>
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={isAdded}
                        className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1 transition-all ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-orange-600 hover:bg-orange-500 text-white'
                        }`}
                        title="Adicionar ao Carrinho"
                      >
                        {isAdded ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <ShoppingCart className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sugestões Rápidas de Pergunta por Voz */}
          <div className="pt-2">
            <span className="text-[11px] font-medium text-slate-400 block mb-2">
              💡 Toque para simular perguntas de clientes:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickPrompt('Quanto de cimento e areia preciso para rebocar 15m²?')}
                className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-full text-xs text-slate-300 hover:text-white transition-colors text-left"
              >
                🧱 Quanto cimento para 15m² de reboco?
              </button>
              <button
                onClick={() => handleQuickPrompt('Quantos tijolos preciso para construir um muro de 20m²?')}
                className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-full text-xs text-slate-300 hover:text-white transition-colors text-left"
              >
                🏗️ Tijolos para muro de 20m²?
              </button>
              <button
                onClick={() => handleQuickPrompt('Vocês têm cimento em promoção e qual o prazo de entrega?')}
                className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-full text-xs text-slate-300 hover:text-white transition-colors text-left"
              >
                🚚 Cimento em promoção e frete?
              </button>
            </div>
          </div>

        </div>

        {/* Rodapé com Atalhos */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Multi-Agent Harness: Web Speech + Catalog Tool</span>
          </div>

          <button
            onClick={() => {
              stopAllAudio();
              onClose();
              if (onSwitchToTextChat) onSwitchToTextChat();
            }}
            className="text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1 hover:underline"
          >
            Abrir chat em texto <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
