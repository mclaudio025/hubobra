'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  User, 
  UserCheck, 
  Wrench,
  ArrowRight,
  Camera,
  FileText,
  Brain,
  Box,
  Image,
  Upload,
  Mic,
  MicOff,
  Settings
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'lia' | 'ze';
  timestamp: Date;
  suggestedActions?: string[];
  shouldTransfer?: boolean;
  transferReason?: string;
  attachments?: MessageAttachment[];
  context?: MessageContext;
  aiAnalysis?: AIAnalysis;
}

interface MessageAttachment {
  id: string;
  type: 'image' | 'document' | 'project' | 'measurement';
  name: string;
  url?: string;
  data?: any;
  analysis?: string;
}

interface MessageContext {
  currentPage?: string;
  productId?: string;
  projectData?: any;
  userLocation?: string;
  previousInteractions?: string[];
  builderState?: any;
}

interface AIAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  intent: string;
  confidence: number;
  suggestedResponse?: string;
  relatedProducts?: string[];
  estimatedCost?: number;
}

interface PersonasChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PersonasChat({ isOpen, onClose }: PersonasChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<'lia' | 'ze'>('lia');
  const [sessionId] = useState(`session_${Date.now()}`);
  const [activeTab, setActiveTab] = useState<'chat' | 'context' | 'analysis'>('chat');
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [contextData, setContextData] = useState<MessageContext>({});
  const [aiInsights, setAiInsights] = useState<AIAnalysis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    // Capturar contexto da página atual
    const currentPath = window.location.pathname;
    const productMatch = currentPath.match(/\/products\/(\w+)/);
    
    setContextData({
      currentPage: currentPath,
      productId: productMatch?.[1],
      userLocation: 'Brasil', // Pode ser obtido via geolocalização
      previousInteractions: messages.slice(-5).map(m => m.text)
    });
  }, [messages]);

  // Função para análise de IA da mensagem
  const analyzeMessage = async (text: string): Promise<AIAnalysis> => {
    // Simulação de análise de IA - em produção seria uma chamada real
    const keywords = text.toLowerCase();
    let intent = 'general';
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    let confidence = 0.8;
    
    if (keywords.includes('comprar') || keywords.includes('preço')) {
      intent = 'purchase';
    } else if (keywords.includes('problema') || keywords.includes('erro')) {
      intent = 'support';
      sentiment = 'negative';
    } else if (keywords.includes('obrigado') || keywords.includes('ótimo')) {
      sentiment = 'positive';
    }
    
    return {
      sentiment,
      intent,
      confidence,
      suggestedResponse: intent === 'purchase' ? 'Posso ajudar com informações de preço e disponibilidade!' : undefined,
      relatedProducts: intent === 'purchase' ? ['produto-1', 'produto-2'] : undefined,
      estimatedCost: intent === 'purchase' ? Math.random() * 1000 + 100 : undefined
    };
  };

  // Função para upload de arquivos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const attachment: MessageAttachment = {
        id: `attachment_${Date.now()}_${Math.random()}`,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        name: file.name,
        url: URL.createObjectURL(file)
      };
      
      setAttachments(prev => [...prev, attachment]);
    });
  };

  // Função para gravação de voz
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Implementar gravação de voz aqui
  };

  // Função para integração com Builder3D
  const sendToBuilder3D = (data: any) => {
    // Enviar dados para o Builder3D
    console.log('Enviando para Builder3D:', data);
  };

  // Mensagem inicial da Lia
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        text: 'Olá! 😊 Sou a *Lia*, sua atendente virtual da loja!\n\n✨ Posso ajudar você com informações gerais, pedidos e entregas.\n\n🔧 Para questões técnicas sobre produtos, posso chamar nosso engenheiro especialista, o *Zé da Obra*!\n\nComo posso ajudar você hoje?',
        sender: 'lia',
        timestamp: new Date(),
        suggestedActions: ['Ver produtos', 'Meus pedidos', 'Promoções', 'Falar com especialista']
      }]);
    }
  }, [messages.length]);

  const sendMessage = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;
    if (isLoading) return;

    // Análise da mensagem
    const analysis = inputValue ? await analyzeMessage(inputValue) : null;
    setAiInsights(analysis);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
      attachments: [...attachments],
      context: contextData,
      aiAnalysis: analysis
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-personas/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          sessionId,
          userName: 'Cliente',
          channel: 'web',
          persona: currentPersona,
          context: {
            previousMessages: messages.slice(-5),
            pageContext: contextData,
            attachments: userMessage.attachments,
            aiAnalysis: analysis
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na comunicação com o servidor');
      }

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: data.persona,
        timestamp: new Date(),
        suggestedActions: data.suggestedActions,
        shouldTransfer: data.shouldTransfer,
        transferReason: data.transferReason,
        context: data.context
      };

      setMessages(prev => [...prev, botMessage]);
      setCurrentPersona(data.persona);
      
      // Integração com Builder3D se houver dados relevantes
      if (data.builderData) {
        sendToBuilder3D(data.builderData);
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.',
        sender: 'lia',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestedAction = (action: string) => {
    setInputValue(action);
    setTimeout(() => sendMessage(), 100);
  };

  const getPersonaInfo = (persona: 'lia' | 'ze') => {
    if (persona === 'lia') {
      return {
        name: 'Lia',
        role: 'Atendente Virtual',
        avatar: 'L',
        color: 'bg-blue-500',
        icon: <UserCheck className="w-4 h-4" />
      };
    } else {
      return {
        name: 'Zé da Obra',
        role: 'Engenheiro Especialista',
        avatar: 'Z',
        color: 'bg-green-600',
        icon: <Wrench className="w-4 h-4" />
      };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-96 shadow-2xl transition-all duration-300 ${isMinimized ? 'h-16' : 'h-[700px]'}`}>
        <CardHeader className="flex flex-row items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {getPersonaInfo(currentPersona).icon}
              <div>
                <CardTitle className="text-lg font-bold">
                  {getPersonaInfo(currentPersona).name} 2.0
                </CardTitle>
                <p className="text-sm opacity-90">
                  {getPersonaInfo(currentPersona).role} • IA Avançada
                </p>
              </div>
            </div>
            {aiInsights && (
              <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                <Brain className="w-3 h-3 mr-1" />
                {Math.round(aiInsights.confidence * 100)}%
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/20"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[636px]">
            {/* Tabs de Navegação */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex flex-col h-full">
              <div className="p-3 bg-gray-50 border-b">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="chat" className="text-xs">
                    <User className="w-3 h-3 mr-1" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="context" className="text-xs">
                    <Brain className="w-3 h-3 mr-1" />
                    Contexto
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="text-xs">
                    <Settings className="w-3 h-3 mr-1" />
                    Análise
                  </TabsTrigger>
                </TabsList>
                
                {/* Indicador de Persona Ativa */}
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <Badge variant={currentPersona === 'lia' ? 'default' : 'secondary'} className="text-xs">
                    👩‍💼 Lia 2.0
                  </Badge>
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                  <Badge variant={currentPersona === 'ze' ? 'default' : 'secondary'} className="text-xs">
                    👨‍🔧 Zé da Obra 3.0
                  </Badge>
                </div>
              </div>

              <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-0">

                {/* Área de Mensagens */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="space-y-2">
                        <div
                          className={`flex ${
                            message.sender === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`flex items-start space-x-2 max-w-[80%] ${
                              message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                            }`}
                          >
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarFallback
                                className={
                                  message.sender === 'user'
                                    ? 'bg-gray-500 text-white'
                                    : message.sender === 'lia'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-green-600 text-white'
                                }
                              >
                                {message.sender === 'user' ? (
                                  <User className="w-4 h-4" />
                                ) : message.sender === 'lia' ? (
                                  'L'
                                ) : (
                                  'Z'
                                )}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div
                              className={`rounded-lg p-3 ${
                                message.sender === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : message.sender === 'lia'
                                  ? 'bg-blue-50 text-gray-800 border border-blue-200'
                                  : 'bg-green-50 text-gray-800 border border-green-200'
                              }`}
                            >
                              <div className="whitespace-pre-wrap text-sm">
                                {message.text}
                              </div>
                              
                              {/* Anexos */}
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {message.attachments.map((attachment) => (
                                    <div key={attachment.id} className="flex items-center space-x-2 text-xs bg-white/50 rounded p-1">
                                      {attachment.type === 'image' ? <Image className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                      <span>{attachment.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Análise de IA */}
                              {message.aiAnalysis && message.sender === 'user' && (
                                <div className="mt-2 p-2 bg-white/20 rounded text-xs">
                                  <div className="flex items-center space-x-1">
                                    <Brain className="w-3 h-3" />
                                    <span>Intenção: {message.aiAnalysis.intent}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {message.aiAnalysis.sentiment}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                              
                              {message.shouldTransfer && (
                                <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                                  🔄 <strong>Transferindo:</strong> {message.transferReason}
                                </div>
                              )}
                              
                              <div className="text-xs opacity-70 mt-1">
                                {message.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Ações Sugeridas */}
                        {message.suggestedActions && message.suggestedActions.length > 0 && (
                          <div className="flex flex-wrap gap-2 ml-10">
                            {message.suggestedActions.map((action, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleSuggestedAction(action)}
                                className="text-xs h-7"
                              >
                                {action}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className={getPersonaInfo(currentPersona).color + ' text-white'}>
                              {getPersonaInfo(currentPersona).avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-gray-100 rounded-lg p-3">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Input de Mensagem */}
                <div className="p-4 border-t bg-white">
                  {/* Anexos Preview */}
                  {attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center space-x-1 bg-gray-100 rounded px-2 py-1 text-xs">
                          {attachment.type === 'image' ? <Image className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          <span>{attachment.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAttachments(prev => prev.filter(a => a.id !== attachment.id))}
                            className="h-4 w-4 p-0"
                          >
                            <X className="w-2 h-2" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2"
                        disabled={isLoading}
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleRecording}
                        className={`px-2 ${isRecording ? 'bg-red-100 text-red-600' : ''}`}
                        disabled={isLoading}
                      >
                        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => sendToBuilder3D({ action: 'open', context: contextData })}
                        className="px-2"
                        disabled={isLoading}
                      >
                        <Box className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={`Digite sua mensagem para ${getPersonaInfo(currentPersona).name} 2.0...`}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={(!inputValue.trim() && attachments.length === 0) || isLoading}
                      size="sm"
                      className="px-3"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </TabsContent>

              {/* Aba de Contexto */}
              <TabsContent value="context" className="flex-1 m-0 p-4">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">📍 Contexto Atual</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>Página:</span>
                          <span className="font-mono">{contextData.currentPage || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Produto:</span>
                          <span>{contextData.productId || 'Nenhum'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Localização:</span>
                          <span>{contextData.userLocation || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-sm mb-2">🧠 Histórico de Interações</h4>
                      <div className="space-y-1">
                        {contextData.previousInteractions?.slice(-3).map((interaction, index) => (
                          <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                            {interaction.substring(0, 50)}...
                          </div>
                        )) || <p className="text-xs text-gray-500">Nenhuma interação anterior</p>}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-sm mb-2">🔧 Estado do Builder3D</h4>
                      <div className="text-xs p-2 bg-gray-50 rounded">
                        {contextData.builderState ? (
                          <pre>{JSON.stringify(contextData.builderState, null, 2)}</pre>
                        ) : (
                          'Builder3D não ativo'
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Aba de Análise */}
              <TabsContent value="analysis" className="flex-1 m-0 p-4">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {aiInsights ? (
                      <>
                        <div>
                          <h4 className="font-semibold text-sm mb-2">🎯 Análise da Última Mensagem</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs">Intenção:</span>
                              <Badge variant="outline" className="text-xs">{aiInsights.intent}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs">Sentimento:</span>
                              <Badge 
                                variant={aiInsights.sentiment === 'positive' ? 'default' : aiInsights.sentiment === 'negative' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {aiInsights.sentiment}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs">Confiança:</span>
                              <span className="text-xs font-mono">{Math.round(aiInsights.confidence * 100)}%</span>
                            </div>
                          </div>
                        </div>
                        
                        {aiInsights.relatedProducts && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">🛍️ Produtos Relacionados</h4>
                            <div className="space-y-1">
                              {aiInsights.relatedProducts.map((product, index) => (
                                <div key={index} className="text-xs p-2 bg-blue-50 rounded">
                                  {product}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {aiInsights.estimatedCost && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">💰 Estimativa de Custo</h4>
                            <div className="text-lg font-bold text-green-600">
                              R$ {aiInsights.estimatedCost.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center text-gray-500 text-sm">
                        <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Envie uma mensagem para ver a análise de IA</p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-semibold text-sm mb-2">📊 Estatísticas da Sessão</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-gray-50 rounded text-center">
                          <div className="font-bold">{messages.length}</div>
                          <div>Mensagens</div>
                        </div>
                        <div className="p-2 bg-gray-50 rounded text-center">
                          <div className="font-bold">{messages.filter(m => m.sender === 'user').length}</div>
                          <div>Suas mensagens</div>
                        </div>
                        <div className="p-2 bg-gray-50 rounded text-center">
                          <div className="font-bold">{messages.filter(m => m.shouldTransfer).length}</div>
                          <div>Transferências</div>
                        </div>
                        <div className="p-2 bg-gray-50 rounded text-center">
                          <div className="font-bold">{messages.filter(m => m.attachments?.length).length}</div>
                          <div>Com anexos</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
