import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  User,
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneIncoming,
  PhoneOutgoing,
  Paperclip,
  Sparkles,
  ArrowRight,
  Plus,
  CheckCircle2,
  DollarSign,
  Copy,
  Settings,
  ExternalLink,
  ChevronRight,
  Clock,
  RefreshCw,
  Play,
  Pause,
  Mic,
  MicOff,
  Headphones,
  Volume2,
  VolumeX,
  Radio,
  Share2,
} from 'lucide-react';
import { LocalProduct, LocalOrder, SaleItem } from '../db/db';
import { SystemUser } from './UserManagementView';
import {
  getRealtimeConversations,
  getRealtimeMessages,
  sendWhatsAppMessage,
  DeskcommConversation,
} from '../services/deskcommService';

interface ChatMessage {
  id: string;
  sender: 'CUSTOMER' | 'SELLER' | 'LIA_AI' | 'SYSTEM';
  senderName: string;
  text: string;
  time: string;
  isVoiceAudio?: boolean;
  audioDuration?: string;
  audioTranscript?: string;
  callRecord?: {
    duration: string;
    summary: string;
    timestamp: string;
  };
  attachedOrder?: {
    orderNumber: string;
    total: number;
    itemsCount: number;
  };
}

interface ChatConversation {
  id: string;
  contactId?: string;
  customerName: string;
  customerPhone: string;
  companyName?: string;
  unreadCount: number;
  lastMessageTime: string;
  avatarText: string;
  messages: ChatMessage[];
  pendingItemsToImport?: Array<{
    productName: string;
    sku: string;
    quantity: number;
    unit: string;
  }>;
}

const SAMPLE_CONVERSATIONS: ChatConversation[] = [
  {
    id: '96af6ff5-ff85-40e2-9c80-4f88a8c9dacb',
    customerName: 'Claudio Sousa',
    customerPhone: '+55 85 8921-9126',
    companyName: 'Cliente WhatsApp',
    unreadCount: 1,
    lastMessageTime: 'Agora',
    avatarText: 'CS',
    pendingItemsToImport: [
      { productName: 'Cimento Poty Todas as Obras 50kg CP II-F', sku: '001100', quantity: 50, unit: 'SACO' },
    ],
    messages: [
      {
        id: 'm-1',
        sender: 'CUSTOMER',
        senderName: 'Claudio Sousa',
        text: '🎤 Áudio de Voz: "Olá Lia, gostaria de falar com o Carlos Eduardo para fechar um orçamento de cimento com ele."',
        time: 'Agora',
        isVoiceAudio: true,
        audioDuration: '0:07',
        audioTranscript: 'Olá Lia, gostaria de falar com o Carlos Eduardo para fechar um orçamento de cimento com ele.',
      },
      {
        id: 'm-2',
        sender: 'LIA_AI',
        senderName: 'Lia (IA HubObra)',
        text: 'Com certeza, Claudio! Estou transferindo o seu atendimento para o vendedor Carlos Eduardo agora mesmo. Ele já vai assumir a conversa aqui no chat para fechar o seu orçamento com as melhores condições! 🏗️',
        time: 'Agora',
      },
    ],
  },
];

interface ChatwootDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SystemUser | null;
  onImportItemsToOrder?: (
    items: Array<{
      productName: string;
      sku: string;
      quantity: number;
      unit: string;
      customerName?: string;
      customerPhone?: string;
      companyName?: string;
    }>
  ) => void;
  currentActiveOrder?: LocalOrder | null;
}

export const ChatwootDrawer: React.FC<ChatwootDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  onImportItemsToOrder,
  currentActiveOrder,
}) => {
  const [conversations, setConversations] = useState<ChatConversation[]>(SAMPLE_CONVERSATIONS);
  const [selectedConvId, setSelectedConvId] = useState<string>('conv-1');
  const [messageInput, setMessageInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'SIMULATOR' | 'SETTINGS' | 'LIVE_IFRAME'>('SIMULATOR');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [showCallMenu, setShowCallMenu] = useState<boolean>(false);
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [callStatus, setCallStatus] = useState<'DIALING' | 'RINGING' | 'CONNECTED' | 'ENDED'>('DIALING');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const ringIntervalRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sincronização em Tempo Real com o Deskcomm CRM
  useEffect(() => {
    let isMounted = true;

    const syncDeskcomm = async () => {
      try {
        const realConvs = await getRealtimeConversations();
        if (isMounted && realConvs && realConvs.length > 0) {
          // Manter ou atualizar conversas
          setConversations((prev) => {
            const updated = realConvs.map((rc) => {
              const existing = prev.find((p) => p.id === rc.id);
              return {
                id: rc.id,
                contactId: rc.contactId,
                customerName: rc.customerName,
                customerPhone: rc.customerPhone,
                companyName: rc.companyName,
                unreadCount: rc.unreadCount,
                lastMessageTime: rc.lastMessageTime,
                avatarText: rc.avatarText,
                messages: existing ? existing.messages : [],
                pendingItemsToImport: rc.pendingItemsToImport,
              };
            });
            return updated;
          });

          // Selecionar primeira conversa se a atual não existir
          setSelectedConvId((currentId) => {
            const exists = realConvs.some((r) => r.id === currentId);
            return exists ? currentId : realConvs[0].id;
          });
        }
      } catch (e) {
        console.warn('Erro ao sincronizar Deskcomm:', e);
      }
    };

    syncDeskcomm();
    const interval = setInterval(syncDeskcomm, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Sincronização de Mensagens da Conversa Selecionada
  useEffect(() => {
    if (!selectedConvId || selectedConvId.startsWith('conv-')) return;
    let isMounted = true;

    const syncMessages = async () => {
      try {
        const realMsgs = await getRealtimeMessages(selectedConvId);
        if (isMounted && realMsgs) {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === selectedConvId) {
                // Manter mensagens locais que ainda estão sendo gravadas no backend
                const pendingLocal = c.messages.filter(
                  (m) => m.id.startsWith('local-') && !realMsgs.some((rm) => rm.text === m.text)
                );
                return {
                  ...c,
                  messages: [...realMsgs, ...pendingLocal],
                };
              }
              return c;
            })
          );
        }
      } catch (e) {
        console.warn('Erro ao sincronizar mensagens:', e);
      }
    };

    syncMessages();
    const msgInterval = setInterval(syncMessages, 2000);
    return () => {
      isMounted = false;
      clearInterval(msgInterval);
    };
  }, [selectedConvId]);

  const selectedConversation = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  // Auto-scroll ao receber ou enviar novas mensagens
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversation?.messages?.length, isOpen]);

  // Áudios Web Audio API para simulação realista
  const playSound = (type: 'ring' | 'connect' | 'end') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      if (type === 'ring') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.frequency.setValueAtTime(480, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 1.2);
        osc2.stop(ctx.currentTime + 1.2);
      } else if (type === 'connect') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'end') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(330, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn('Audio context error:', e);
    }
  };

  // Iniciar Ligação de Voz pelo WhatsApp
  const handleStartCall = () => {
    setShowCallMenu(false);
    setIsCalling(true);
    setCallStatus('DIALING');
    setCallDuration(0);
    setIsMuted(false);

    // Toca toque de discagem imediatamente
    playSound('ring');

    // Intervalo de toque de chamada
    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    ringIntervalRef.current = setInterval(() => {
      playSound('ring');
    }, 2500);

    // Conecta automaticamente após 3 segundos
    setTimeout(() => {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
      playSound('connect');
      setCallStatus('CONNECTED');
    }, 3000);
  };

  // Timer da ligação em andamento
  useEffect(() => {
    if (isCalling && callStatus === 'CONNECTED') {
      timerIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    };
  }, [isCalling, callStatus]);

  // Encerrar Ligação
  const handleEndCall = () => {
    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    playSound('end');
    setCallStatus('ENDED');

    const formattedDur = `${Math.floor(callDuration / 60)
      .toString()
      .padStart(2, '0')}:${(callDuration % 60).toString().padStart(2, '0')}`;

    // Registrar histórico da ligação no chat
    const callLogMessage: ChatMessage = {
      id: `call-${Date.now()}`,
      sender: 'SYSTEM',
      senderName: 'Central WhatsApp VoIP',
      text: `📞 Chamada de Voz WhatsApp Concluída (${formattedDur})`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      callRecord: {
        duration: formattedDur,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        summary:
          selectedConversation.id === 'conv-1'
            ? 'Cliente confirmou entrega de 40 sacos de cimento e 10 de argamassa no canteiro da Obra Alpha 04 hoje às 14h.'
            : selectedConversation.id === 'conv-2'
            ? 'Mestre Raimundo confirmou a reserva de 20 barras de ferro 3/8 Gerdau para retirada às 11h.'
            : 'Dra. Camila aprovou a metragem calculada pela IA Lia de 25 caixas de Porcelanato Delta 84x84.',
      },
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === selectedConversation.id) {
          return {
            ...c,
            messages: [...c.messages, callLogMessage],
            lastMessageTime: callLogMessage.time,
          };
        }
        return c;
      })
    );

    setTimeout(() => {
      setIsCalling(false);
      setCallStatus('DIALING');
      setCallDuration(0);
    }, 600);
  };

  // Abrir diretamente no WhatsApp Web / Desktop
  const handleOpenWhatsAppNative = () => {
    setShowCallMenu(false);
    const cleanPhone = selectedConversation.customerPhone.replace(/\D/g, '');
    const url = `https://wa.me/55${cleanPhone}?text=Olá%20${encodeURIComponent(
      selectedConversation.customerName
    )},%20estou%20ligando%20aqui%20da%20HubObra!`;
    window.open(url, '_blank');
  };

  // Abrir discador padrão do sistema
  const handleOpenNativeTel = () => {
    setShowCallMenu(false);
    const cleanPhone = selectedConversation.customerPhone.replace(/\D/g, '');
    window.open(`tel:+55${cleanPhone}`);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const secs = (sec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || messageInput;
    if (!textToSend.trim()) return;

    const sellerName = currentUser ? currentUser.name : 'Carlos Eduardo';

    const newMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      sender: 'SELLER',
      senderName: sellerName,
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === selectedConversation.id) {
          return {
            ...c,
            messages: [...c.messages, newMsg],
            lastMessageTime: newMsg.time,
          };
        }
        return c;
      })
    );

    if (!customText) setMessageInput('');

    // Disparar envio para o WhatsApp real via Uazapi e gravar no Supabase
    if (selectedConversation.customerPhone) {
      await sendWhatsAppMessage(
        selectedConversation.id,
        selectedConversation.customerPhone,
        textToSend.trim(),
        sellerName,
        selectedConversation.contactId
      );
    }
  };

  const handleSendCurrentOrderQuote = () => {
    if (!currentActiveOrder || currentActiveOrder.items.length === 0) {
      alert('⚠️ Nenhum material lançado no pedido do balcão! Adicione produtos na tela de vendas antes de enviar o orçamento.');
      return;
    }

    const itemsList = currentActiveOrder.items
      .map(
        (it) =>
          `• *${it.quantity} ${it.unit}* x ${it.name} (R$ ${it.unitPrice.toFixed(2)}/${it.unit}) = *R$ ${it.total.toFixed(2)}*`
      )
      .join('\n');

    const discountLine =
      currentActiveOrder.discount > 0
        ? `\n🏷️ *Desconto Especial:* - R$ ${currentActiveOrder.discount.toFixed(2)}`
        : '';
    const shippingLine =
      currentActiveOrder.shipping > 0
        ? `\n🚚 *Frete / Entrega:* R$ ${currentActiveOrder.shipping.toFixed(2)}`
        : '';

    const quoteText =
      `*HUBOBRA MATERIAIS DE CONSTRUÇÃO* 🏬\n` +
      `Olá *${selectedConversation.customerName}*, segue o seu orçamento *#${currentActiveOrder.orderNumber}* solicitado:\n\n` +
      `📦 *MATERIAIS COTADOS (${currentActiveOrder.items.length} itens):*\n` +
      `${itemsList}\n` +
      `${discountLine}${shippingLine}\n` +
      `💰 *VALOR TOTAL: R$ ${currentActiveOrder.total.toFixed(2)}*\n` +
      `💳 *Condição:* ${currentActiveOrder.paymentCondition || 'A Vista no Caixa (PIX / Dinheiro)'}\n` +
      `📍 *Saída:* Depósito São José (Pronta Entrega no Galpão)\n\n` +
      `Podemos confirmar a separação no galpão e o envio? 🏗️`;

    handleSendMessage(quoteText);
  };

  const handleSendPixKey = () => {
    const pixText =
      `🔑 *CHAVE PIX DA HUBOBRA MATERIAIS:*\n\n` +
      `CNPJ: *12.345.678/0001-90*\n` +
      `Banco: Itaú Unibanco (Filial Dep. São José)\n` +
      `Favorecido: HubObra Materiais de Construção Ltda\n\n` +
      `Após o pagamento, envie o comprovante por aqui para liberação imediata do caminhão! 🚛`;
    handleSendMessage(pixText);
  };

  const handleImportItems = () => {
    if (selectedConversation.pendingItemsToImport && onImportItemsToOrder) {
      const itemsWithCustomer = selectedConversation.pendingItemsToImport.map((item) => ({
        ...item,
        customerName: selectedConversation.customerName,
        customerPhone: selectedConversation.customerPhone,
        companyName: selectedConversation.companyName,
      }));
      onImportItemsToOrder(itemsWithCustomer);
    }
  };

  const handleSaveChatwootSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('hubobra_chatwoot_url', chatwootUrl);
    localStorage.setItem('hubobra_chatwoot_acc_id', chatwootAccountId);
    localStorage.setItem('hubobra_chatwoot_token', chatwootToken);
    alert('Configurações do Chatwoot salvas com sucesso!');
    setActiveTab('SIMULATOR');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] md:w-[520px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col font-sans select-none animate-in slide-in-from-right duration-200">
      {/* Top Header da Gaveta */}
      <header className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30 shadow-inner">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white flex items-center gap-2">
              <span>Deskcomm CRM • WhatsApp Integrado</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                On-line
              </span>
            </h2>
            <p className="text-[10px] text-slate-400">
              Vendedor: <strong className="text-amber-400">{currentUser ? currentUser.name : 'Balcão'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab(activeTab === 'SETTINGS' ? 'SIMULATOR' : 'SETTINGS')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeTab === 'SETTINGS' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Configurar Conexão do Chatwoot"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Fechar Gaveta (Alt+W)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ABA DE CONFIGURAÇÃO DO CHATWOOT REAL */}
      {activeTab === 'SETTINGS' ? (
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-500" />
              <span>Conectar ao seu Servidor Chatwoot</span>
            </h3>
            <p className="text-slate-400 mt-1">
              Informe os dados da sua instância do Chatwoot para ativar o chat oficial:
            </p>
          </div>

          <form onSubmit={handleSaveChatwootSettings} className="space-y-3 pt-2">
            <div>
              <label className="text-slate-400 block mb-1 font-bold">URL do Chatwoot</label>
              <input
                type="text"
                value={chatwootUrl}
                onChange={(e) => setChatwootUrl(e.target.value)}
                placeholder="https://chat.hubobra.com.br ou https://app.chatwoot.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 font-bold">ID da Conta (Account ID)</label>
                <input
                  type="text"
                  value={chatwootAccountId}
                  onChange={(e) => setChatwootAccountId(e.target.value)}
                  placeholder="Ex: 1"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">Atalho Rápido</label>
                <div className="p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-300 font-mono font-bold text-center">
                  Alt + W
                </div>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-bold">Token de Acesso da API (Opcional)</label>
              <input
                type="password"
                value={chatwootToken}
                onChange={(e) => setChatwootToken(e.target.value)}
                placeholder="Ex: aBcDeF1234567890..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
              <p className="font-bold text-slate-200">ℹ️ Como pegar o Token no Chatwoot:</p>
              <p>1. Acesse o Chatwoot ➔ Clique no seu Avatar no canto inferior esquerdo.</p>
              <p>2. Vá em Configurações de Perfil ➔ Role até "Token de Acesso (Access Token)".</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('SIMULATOR')}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20"
              >
                Salvar Conexão
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ABA PRINCIPAL DE ATENDIMENTO INTEGRADO */
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Barra Superior: Seletor das 3 Conversas Ativas */}
          <div className="p-2 bg-slate-950 border-b border-slate-800 flex gap-2 overflow-x-auto scrollbar-none items-center">
            {conversations.map((c) => {
              const isSelected = selectedConvId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedConvId(c.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 ring-1 ring-amber-400'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isSelected ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {c.avatarText}
                  </div>
                  <div className="text-left flex flex-col">
                    <span className="truncate max-w-[105px] leading-tight">
                      {c.customerName.split(' ')[0]} {c.customerName.split(' ')[1] || ''}
                    </span>
                    <span
                      className={`text-[9px] font-normal leading-none ${
                        isSelected ? 'text-slate-900/80 font-semibold' : 'text-slate-500'
                      }`}
                    >
                      {c.companyName ? c.companyName.split(' ')[0] : 'Cliente'}
                    </span>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Cabeçalho do Cliente Selecionado com Botão de Ligar WhatsApp */}
          <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs backdrop-blur-sm relative">
            <div className="min-w-0 flex-1 mr-2">
              <h4 className="font-bold text-white flex items-center gap-1.5 truncate">
                <span className="truncate">{selectedConversation.customerName}</span>
                {selectedConversation.companyName && (
                  <span className="text-[10px] text-slate-400 font-normal shrink-0">
                    ({selectedConversation.companyName})
                  </span>
                )}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 font-semibold">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>{selectedConversation.customerPhone}</span>
                </p>
                <span className="text-slate-600 text-[10px]">•</span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Headphones className="w-2.5 h-2.5 text-blue-400" />
                  <span>Headset Pronto</span>
                </span>
              </div>
            </div>

            {/* Ações: Ligar WhatsApp + Puxar Balcão */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Menu / Botão de Ligar */}
              <div className="relative">
                <button
                  onClick={() => setShowCallMenu(!showCallMenu)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-[11px] rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all border border-emerald-500/40"
                  title="Ligar para o cliente pelo WhatsApp"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-white animate-bounce" />
                  <span>Ligar</span>
                </button>

                {/* Dropdown de Modos de Ligação */}
                {showCallMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-56 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      Como deseja ligar?
                    </div>

                    <button
                      onClick={handleStartCall}
                      className="w-full text-left p-2 rounded-xl hover:bg-emerald-950/60 hover:text-emerald-300 text-slate-200 flex items-center gap-2.5 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                        <Headphones className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[11px] leading-tight text-white">Chamada de Voz no Fone</p>
                        <p className="text-[9px] text-emerald-400">VoIP integrado + IA Lia</p>
                      </div>
                    </button>

                    <button
                      onClick={handleOpenWhatsAppNative}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-800 text-slate-200 flex items-center gap-2.5 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center border border-slate-700 group-hover:border-emerald-500/50">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[11px] leading-tight text-white">Abrir WhatsApp Web / App</p>
                        <p className="text-[9px] text-slate-400">Chamar no WhatsApp oficial</p>
                      </div>
                    </button>

                    <button
                      onClick={handleOpenNativeTel}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-800 text-slate-200 flex items-center gap-2.5 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center border border-slate-700 group-hover:border-blue-500/50">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[11px] leading-tight text-white">Ligar no Celular (Telefonia)</p>
                        <p className="text-[9px] text-slate-400">Abrir discador padrão</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Botão Puxar Itens para o Balcão */}
              {selectedConversation.pendingItemsToImport && (
                <button
                  onClick={handleImportItems}
                  className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-xl flex items-center gap-1 shadow-lg shadow-amber-500/20 transition-all active:scale-95 border border-amber-400"
                  title="Puxar os materiais que o cliente pediu no WhatsApp direto para a tela de vendas"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Puxar pro Balcão</span>
                </button>
              )}
            </div>
          </div>

          {/* MODAL / HUD DE CHAMADA DE VOZ ATIVA NO FONE DE OUVIDO */}
          {isCalling && (
            <div className="absolute inset-x-0 top-[96px] bottom-0 z-40 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-6 animate-in fade-in zoom-in-95 duration-200">
              {/* Status Superior da Chamada */}
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                  {callStatus === 'DIALING' ? (
                    <>
                      <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                      <span className="text-amber-300">Chamando via WhatsApp...</span>
                    </>
                  ) : callStatus === 'CONNECTED' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span className="text-emerald-300">Em Chamada WhatsApp (Headset)</span>
                    </>
                  ) : (
                    <span className="text-rose-400">Chamada Encerrada</span>
                  )}
                </div>
                <h3 className="text-lg font-black text-white mt-1">{selectedConversation.customerName}</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedConversation.customerPhone}</p>
                {selectedConversation.companyName && (
                  <p className="text-[11px] text-amber-400/90 font-medium">{selectedConversation.companyName}</p>
                )}
              </div>

              {/* Avatar Central com Efeito Pulsante e Ondas Sonoras */}
              <div className="relative my-4 flex flex-col items-center">
                {callStatus === 'DIALING' && (
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping scale-150"></div>
                )}

                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-3xl font-black shadow-2xl border-4 border-slate-900 relative z-10">
                  {selectedConversation.avatarText}
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-emerald-400">
                    <Headphones className="w-4 h-4" />
                  </div>
                </div>

                {/* Cronômetro e Ondas Sonoras em Tempo Real */}
                {callStatus === 'CONNECTED' && (
                  <div className="mt-4 text-center space-y-2">
                    <div className="text-2xl font-black font-mono text-white tracking-widest">
                      {formatSeconds(callDuration)}
                    </div>

                    {/* Visualizador de Áudio do Headset */}
                    <div className="flex items-center justify-center gap-1 h-8 px-4 py-1 bg-slate-900/80 rounded-full border border-slate-800">
                      {[14, 28, 20, 32, 16, 26, 36, 18, 30, 22, 12, 28, 18, 32, 20, 14].map((h, idx) => (
                        <div
                          key={idx}
                          className={`w-1 rounded-full transition-all duration-100 ${
                            isMuted ? 'bg-slate-700 h-2' : 'bg-emerald-400 animate-pulse'
                          }`}
                          style={{
                            height: isMuted ? '4px' : `${Math.max(6, (h * (callDuration % 3 + 1)) % 36)}px`,
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Assistente IA Lia Anotando a Ligação */}
              <div className="w-full bg-slate-900/80 border border-purple-500/30 rounded-2xl p-3 text-left space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-purple-400 font-bold uppercase">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" />
                    <span>IA Lia: Assistente de Voz em Tempo Real</span>
                  </span>
                  <span className="text-emerald-400 font-mono">
                    {callStatus === 'CONNECTED' ? '🎙️ Ouvindo Fone...' : 'Aguardando Atendimento'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 italic">
                  {callStatus === 'CONNECTED'
                    ? selectedConversation.id === 'conv-1'
                      ? '"Cliente solicitou agilizar os 40 sacos de Cimento Poty e confirmou a entrega para as 14h na Obra Alpha."'
                      : '"Anotando automaticamente detalhes do pedido falados pelo cliente no fone..."'
                    : 'A ligação será transcrita e anexada ao histórico do cliente assim que concluída.'}
                </p>
              </div>

              {/* Controles da Chamada (Mute, Viva-voz, Desligar) */}
              <div className="flex items-center gap-4 mt-4">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isMuted
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                  title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  onClick={handleEndCall}
                  className="px-6 py-3.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-sm rounded-2xl shadow-xl shadow-rose-600/30 flex items-center gap-2 border border-rose-400 transition-all"
                  title="Encerrar Ligação"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span>Encerrar Ligação</span>
                </button>

                <button
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isSpeakerOn
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                  title={isSpeakerOn ? 'Headset Padrão' : 'Viva-Voz'}
                >
                  {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Feed de Mensagens do WhatsApp */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/40">
            {selectedConversation.messages.map((m) => {
              const isCustomer = m.sender === 'CUSTOMER';
              const isLia = m.sender === 'LIA_AI';
              const isSystem = m.sender === 'SYSTEM';

              if (isSystem) {
                return (
                  <div key={m.id} className="w-full flex justify-center my-2">
                    <div className="max-w-[90%] p-3 rounded-2xl bg-slate-900 border border-emerald-500/30 text-xs shadow-lg space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold">
                        <span className="flex items-center gap-1.5">
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>{m.text}</span>
                        </span>
                        <span className="text-slate-400 font-mono">{m.time}</span>
                      </div>
                      {m.callRecord && (
                        <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                          <p className="text-[9px] text-amber-400 font-bold uppercase flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-pink-400" />
                            <span>Resumo da Ligação Gravado por IA Lia:</span>
                          </p>
                          <p className="italic text-slate-200">"{m.callRecord.summary}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={m.id}
                  className={`flex flex-col max-w-[85%] ${
                    isCustomer ? 'mr-auto items-start' : 'ml-auto items-end'
                  }`}
                >
                  <div className="flex items-center gap-1 text-[9px] text-slate-500 mb-0.5 px-1">
                    <span>{m.senderName}</span>
                    <span>•</span>
                    <span>{m.time}</span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed shadow-lg whitespace-pre-wrap ${
                      isCustomer
                        ? 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700/60'
                        : isLia
                        ? 'bg-gradient-to-r from-purple-900/60 to-pink-900/60 text-purple-100 border border-purple-500/40 rounded-tr-sm'
                        : 'bg-emerald-600 text-white rounded-tr-sm font-medium'
                    }`}
                  >
                    {m.isVoiceAudio ? (
                      <div className="space-y-2.5 min-w-[240px]">
                        {/* Player de Áudio do WhatsApp */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (playingAudioId === m.id) {
                                setPlayingAudioId(null);
                              } else {
                                setPlayingAudioId(m.id);
                                try {
                                  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                                  const osc = audioCtx.createOscillator();
                                  const gain = audioCtx.createGain();
                                  osc.frequency.setValueAtTime(440, audioCtx.currentTime);
                                  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                                  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);
                                  osc.connect(gain);
                                  gain.connect(audioCtx.destination);
                                  osc.start();
                                  osc.stop(audioCtx.currentTime + 1.2);
                                } catch (e) {}
                                setTimeout(() => setPlayingAudioId(null), 3000);
                              }
                            }}
                            className="w-9 h-9 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0"
                          >
                            {playingAudioId === m.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                          </button>

                          <div className="flex-1 space-y-1">
                            {/* Barras de Ondas Sonoras */}
                            <div className="flex items-center gap-0.5 h-6">
                              {[12, 24, 18, 28, 14, 22, 30, 16, 26, 20, 10, 24, 18, 28, 15, 20].map((h, bIdx) => (
                                <div
                                  key={bIdx}
                                  className={`w-1 rounded-full transition-all duration-150 ${
                                    playingAudioId === m.id
                                      ? 'bg-emerald-400 animate-pulse'
                                      : 'bg-slate-500'
                                  }`}
                                  style={{ height: `${h}px` }}
                                ></div>
                              ))}
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                              <span>{playingAudioId === m.id ? 'Reproduzindo no fone...' : 'Áudio WhatsApp'}</span>
                              <span>{m.audioDuration || '0:18'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Transcrição Automática da IA Lia */}
                        {m.audioTranscript && (
                          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-purple-500/30 text-[11px] text-purple-200">
                            <p className="text-[9px] text-purple-400 font-bold uppercase flex items-center gap-1 mb-1">
                              <Headphones className="w-3 h-3" />
                              <span>Transcrito com IA Lia (Áudio do Fone)</span>
                            </p>
                            <p className="italic text-slate-300 font-sans">"{m.audioTranscript}"</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      m.text
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Ações Rápidas de 1 Clique (Enviar Orçamento / PIX) */}
          <div className="p-2 bg-slate-950 border-t border-slate-800 flex gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={handleSendCurrentOrderQuote}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 rounded-xl text-[10px] font-bold shrink-0 flex items-center gap-1.5 transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Enviar Orçamento Atual</span>
            </button>

            <button
              onClick={handleSendPixKey}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] font-bold shrink-0 flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Enviar Chave PIX da Loja</span>
            </button>
          </div>

          {/* Input de Mensagem com Microfone e Envio */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder="Digite a resposta ou grave um áudio no fone..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />

            {/* Botão Microfone / Gravar Áudio com Fone */}
            <button
              type="button"
              onClick={() => {
                const voiceReplyText = '🎙️ Resposta em Áudio enviada: "Perfeito! Já separei seus materiais aqui no estoque da loja. Estamos prontos para entrega!"';
                handleSendMessage(voiceReplyText);
              }}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-xl transition-all shadow"
              title="Gravar resposta em áudio no fone de ouvido para o cliente"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleSendMessage()}
              disabled={!messageInput.trim()}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl shadow-lg transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

