'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  Paperclip, 
  Bot, 
  User, 
  Minimize2, 
  Maximize2,
  Settings,
  History,
  Sparkles,
  Plus,
  Search,
  Download,
  MoreVertical,
  Star,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { VoiceRecognition } from './VoiceRecognition'
import { ImageAnalysis } from './ImageAnalysis'
import { ContextualSuggestions } from './ContextualSuggestions'
import { useChatHistory, ChatMessage, ChatConversation } from '@/hooks/useChatHistory'

interface Message {
  id: string
  content: string
  sender: 'user' | 'lia' | 'ze'
  timestamp: Date
  type?: 'text' | 'image' | 'document'
  metadata?: {
    imageUrl?: string
    documentName?: string
    context?: string
  }
}

interface ChatWidgetProps {
  className?: string
  defaultPersona?: 'lia' | 'ze'
  context?: {
    page?: string
    product?: any
    user?: any
  }
  onClose?: () => void
  initialOpen?: boolean
}

const personas = {
  lia: {
    name: 'Lia',
    avatar: '/avatars/lia.png',
    color: 'from-amber-500 to-orange-600',
    description: 'Especialista em materiais e acabamentos'
  },
  ze: {
    name: 'Zé da Obra',
    avatar: '/avatars/ze.png',
    color: 'from-slate-700 to-slate-900',
    description: 'Mestre de obras e construção'
  }
}

export function ChatWidget({ 
  className, 
  defaultPersona = 'lia', 
  context,
  onClose,
  initialOpen = false
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentPersona, setCurrentPersona] = useState<'lia' | 'ze'>(defaultPersona)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showVoiceRecognition, setShowVoiceRecognition] = useState(false)
  const [showImageAnalysis, setShowImageAnalysis] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  
  // Chat History Hook
  const {
    conversations,
    currentConversation,
    startNewConversation,
    switchConversation,
    deleteConversation,
    addMessage,
    updateMessage,
    searchConversations,
    getRecentConversations,
    clearHistory
  } = useChatHistory()
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [currentConversation?.messages])
  
  useEffect(() => {
    if (isOpen && !isMinimized) {
      // Focus input when opened
    }
  }, [isOpen, isMinimized])
  
  useEffect(() => {
    // Iniciar nova conversa se não houver uma ativa
    if (isOpen && !currentConversation) {
      startNewConversation(currentPersona, context)
    }
  }, [isOpen, currentPersona, context, currentConversation, startNewConversation])
  
  const getWelcomeMessage = () => {
    const persona = personas[currentPersona]
    if (context?.product) {
      return `Olá! Sou a ${persona.name}. Vi que você está interessado neste produto. Como posso ajudar? Posso explicar especificações, sugerir combinações ou tirar dúvidas sobre instalação!`
    }
    return `Olá! Sou a ${persona.name}, sua ${persona.description}. Como posso ajudar você hoje?`
  }
  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !currentConversation) return
    
    const userMessage = addMessage({
      content: inputValue,
      sender: 'user',
      type: 'text'
    })
    
    if (!userMessage) return
    
    setInputValue('')
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/ai-personas/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputValue,
          persona: currentPersona,
          context: {
            ...context,
            conversationHistory: currentConversation.messages.slice(-5) // Últimas 5 mensagens para contexto
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Erro na comunicação com o servidor')
      }
      
      const data = await response.json()
      
      const assistantMessage = addMessage({
        content: data.response,
        sender: currentPersona,
        type: 'text',
        metadata: data.metadata
      })
      
      if (assistantMessage) {
        updateMessage(userMessage.id, { status: 'delivered' })
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      updateMessage(userMessage.id, { status: 'error' })
      addMessage({
        content: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.',
        sender: currentPersona,
        type: 'text'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const audioChunks: BlobPart[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        // Aqui você implementaria a conversão de áudio para texto
        // Por enquanto, vamos simular
        setInputValue('Mensagem de voz convertida...')
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Erro ao acessar microfone:', error)
    }
  }
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const message: Message = {
        id: Date.now().toString() + Math.random(),
        content: `Arquivo enviado: ${file.name}`,
        sender: 'user',
        timestamp: new Date(),
        type: 'document',
        metadata: {
          documentName: file.name
        }
      }
      
      addMessage({
        content: message.content,
        sender: message.sender,
        type: message.type,
        metadata: message.metadata
      })
      
      // Simular resposta do bot
      setTimeout(() => {
        addMessage({
          content: `Recebi o arquivo "${file.name}". Como posso ajudá-lo com este documento?`,
          sender: currentPersona,
          type: 'text'
        })
      }, 1000)
    })
    
    // Limpar input
    event.target.value = ''
  }
  

  
  const switchPersona = (persona: 'lia' | 'ze') => {
    setCurrentPersona(persona)
    // Iniciar nova conversa com a nova persona
    startNewConversation(persona, context)
  }
  
  const handleVoiceResult = (transcript: string) => {
    setInputValue(transcript)
    setShowVoiceRecognition(false)
  }
  
  const handleImageAnalysis = (analysis: any) => {
    if (!currentConversation) return
    
    const imageMessage = addMessage({
      content: `Imagem analisada: ${analysis.description}`,
      sender: 'user',
      type: 'image',
      metadata: {
        imageUrl: analysis.imageUrl,
        analysis
      }
    })
    
    setShowImageAnalysis(false)
    
    // Gerar resposta baseada na análise
    setTimeout(() => {
      addMessage({
        content: generateImageResponse(analysis, currentPersona),
        sender: currentPersona,
        type: 'text'
      })
    }, 1000)
  }
  
  const handleSuggestionClick = (suggestion: any) => {
    if (suggestion.action?.type === 'message') {
      setInputValue(suggestion.action.payload)
      setShowSuggestions(false)
    }
  }
  
  const handleNewConversation = () => {
    startNewConversation(currentPersona, context)
    setShowHistory(false)
  }
  
  const handleConversationSelect = (conversation: ChatConversation) => {
    switchConversation(conversation.id)
    setCurrentPersona(conversation.persona)
    setShowHistory(false)
  }
  
  const handleClose = () => {
    setIsOpen(false)
    onClose?.()
  }
  
  const generateImageResponse = (analysis: any, persona: 'lia' | 'ze') => {
    // Implementar geração de resposta baseada na análise da imagem
    return `Como ${personas[persona].name}, posso ajudar você com essa imagem!`
  }
  
  if (!isOpen) {
    return (
      <div className={cn('fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50', className)}>
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          aria-label="Abrir assistente virtual"
          className={cn(
            'h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-105',
            'bg-gradient-to-r', personas[currentPersona].color,
            'text-white border-2 border-white dark:border-slate-800'
          )}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        
        {/* Indicador de persona ativa */}
        <div className="absolute -top-1 -left-1">
          <Avatar className="h-6 w-6 border-2 border-white shadow-md">
            <AvatarImage src={personas[currentPersona].avatar} />
            <AvatarFallback className={cn('text-[10px] text-white font-bold bg-gradient-to-r', personas[currentPersona].color)}>
              {personas[currentPersona].name[0]}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn('fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50', className)}>
      <Card className={cn(
        'w-[calc(100vw-32px)] max-w-[390px] sm:w-96 transition-all duration-300 shadow-2xl rounded-2xl overflow-hidden',
        'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col',
        isMinimized ? 'h-16' : 'h-[520px] sm:h-[580px] max-h-[85vh]'
      )}>
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 shrink-0',
          'bg-gradient-to-r', personas[currentPersona].color,
          'text-white'
        )}>
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9 border-2 border-white/30">
              <AvatarImage src={personas[currentPersona].avatar} />
              <AvatarFallback className="bg-white/20 text-white font-bold text-sm">
                {personas[currentPersona].name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-tight flex items-center gap-1.5">
                {personas[currentPersona].name}
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              </h3>
              <p className="text-xs text-white/80 truncate">{personas[currentPersona].description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-lg"
              title="Histórico"
            >
              <History className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewConversation}
              className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-lg"
              title="Nova conversa"
            >
              <Plus className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-lg"
              title={isMinimized ? "Maximizar" : "Minimizar"}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-lg"
              title="Fechar chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {!isMinimized && (
          <>
            {/* History Panel */}
            {showHistory && (
              <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 max-h-48 shrink-0">
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">Conversas Recentes</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHistory(false)}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="relative mb-2">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                    <Input
                      placeholder="Buscar conversas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-7 h-7 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                  
                  <ScrollArea className="h-32">
                    <div className="space-y-1">
                      {(searchQuery ? searchConversations(searchQuery) : getRecentConversations(10))
                        .map((conversation) => (
                        <Button
                          key={conversation.id}
                          variant={currentConversation?.id === conversation.id ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => handleConversationSelect(conversation)}
                          className="w-full justify-start h-auto p-2 text-left rounded-lg"
                        >
                          <div className="flex items-center space-x-2 w-full">
                            <Avatar className="h-5 w-5 shrink-0">
                              <div className={cn(
                                'w-full h-full flex items-center justify-center text-white text-[10px] font-bold',
                                conversation.persona === 'lia' ? 'bg-orange-500' : 'bg-slate-700'
                              )}>
                                {conversation.persona === 'lia' ? 'L' : 'Z'}
                              </div>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate text-slate-800 dark:text-slate-200">{conversation.title}</p>
                              <p className="text-[10px] text-slate-500">
                                {conversation.messages.length} mensagens
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-1 shrink-0">
                              <Clock className="h-3 w-3 text-slate-400" />
                              <span className="text-[10px] text-slate-400">
                                {conversation.updatedAt.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </Button>
                      ))}
                      
                      {conversations.length === 0 && (
                        <div className="text-center py-4 text-slate-400">
                          <MessageCircle className="h-6 w-6 mx-auto mb-1 opacity-50" />
                          <p className="text-xs">Nenhuma conversa ainda</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
            
            {/* Persona Switcher */}
            <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
              <div className="flex space-x-2">
                {Object.entries(personas).map(([key, persona]) => (
                  <Button
                    key={key}
                    variant={currentPersona === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => switchPersona(key as 'lia' | 'ze')}
                    className={cn(
                      'flex-1 h-8 text-xs font-medium rounded-lg transition-all',
                      currentPersona === key
                        ? `bg-gradient-to-r ${persona.color} text-white border-0 shadow-sm`
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <Avatar className="h-4 w-4 mr-1.5 shrink-0">
                      <AvatarImage src={persona.avatar} />
                      <AvatarFallback className="text-[10px]">{persona.name[0]}</AvatarFallback>
                    </Avatar>
                    {persona.name}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 p-3.5 sm:p-4 bg-slate-50/50 dark:bg-slate-900/50 overflow-y-auto">
              <div className="space-y-3">
                {(!currentConversation?.messages || currentConversation.messages.length === 0) && (
                  <div className="text-center py-6">
                    <Bot className="h-10 w-10 mx-auto mb-3 text-orange-500/80" />
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1.5">
                      Olá! Sou {currentPersona === 'lia' ? 'a Lia' : 'o Zé da Obra'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                      {getWelcomeMessage()}
                    </p>
                    
                    <div className="grid grid-cols-1 gap-1.5 max-w-xs mx-auto">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs justify-start bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-400 text-slate-700 dark:text-slate-300"
                        onClick={() => setInputValue('Preciso de dicas de materiais para minha obra')}
                      >
                        💡 Sugestões de materiais
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs justify-start bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-400 text-slate-700 dark:text-slate-300"
                        onClick={() => setInputValue('Como aplicar e instalar este produto?')}
                      >
                        🔧 Dúvidas técnicas e aplicação
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs justify-start bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-400 text-slate-700 dark:text-slate-300"
                        onClick={() => setInputValue('Como funciona a entrega e o pagamento no local?')}
                      >
                        🚚 Entrega rápida e pagamento
                      </Button>
                    </div>
                  </div>
                )}
                
                {currentConversation?.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex',
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl p-3 text-sm relative group shadow-sm',
                        message.sender === 'user'
                          ? 'bg-orange-500 text-white rounded-tr-none'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                      )}
                    >
                      {message.type === 'image' && message.metadata?.imageUrl && (
                        <div className="mb-2">
                          <img
                            src={message.metadata.imageUrl}
                            alt="Imagem analisada"
                            className="rounded-lg max-w-full h-auto"
                          />
                        </div>
                      )}
                      
                      <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{message.content}</p>
                      
                      <div className="flex items-center justify-between mt-2 text-[10px] opacity-70">
                        <span>
                          {message.sender !== 'user' && (
                            <Badge variant="secondary" className="text-[10px] mr-1.5 py-0 px-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {message.sender === 'lia' ? 'Lia' : 'Zé da Obra'}
                            </Badge>
                          )}
                          {message.status === 'sending' && (
                            <Badge variant="outline" className="text-[10px] mr-1.5 py-0 px-1.5">
                              Enviando...
                            </Badge>
                          )}
                          {message.status === 'error' && (
                            <Badge variant="destructive" className="text-[10px] mr-1.5 py-0 px-1.5">
                              Erro
                            </Badge>
                          )}
                        </span>
                        <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      
                      {/* Message Actions */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                          onClick={() => {
                            navigator.clipboard.writeText(message.content)
                          }}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl rounded-tl-none p-3 shadow-sm">
                      <div className="flex space-x-1.5 items-center">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
            
            {/* Contextual Suggestions */}
            {showSuggestions && currentConversation && (
              <div className="border-t border-slate-200 dark:border-slate-800 p-2.5 bg-white dark:bg-slate-900 shrink-0">
                <ContextualSuggestions
                  context={{
                    page: context?.page,
                    product: context?.product,
                    user: context?.user,
                    conversation: currentConversation.messages,
                    currentMessage: inputValue
                  }}
                  onSuggestionClick={handleSuggestionClick}
                  maxSuggestions={2}
                  className="border-0 p-0 shadow-none bg-transparent"
                />
              </div>
            )}
            
            {/* Input */}
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={`Mensagem para ${personas[currentPersona].name}...`}
                    className="pr-20 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs sm:text-sm focus-visible:ring-orange-500"
                    disabled={isLoading}
                  />
                  
                  <div className="absolute right-1.5 top-1/2 transform -translate-y-1/2 flex items-center space-x-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowVoiceRecognition(true)}
                      className={cn(
                        'h-7 w-7 p-0 rounded-lg',
                        isRecording ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                      )}
                      disabled={isLoading}
                      title="Reconhecimento de voz"
                    >
                      {isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowImageAnalysis(true)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                      disabled={isLoading}
                      title="Análise de imagem"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                      disabled={isLoading}
                      title="Anexar arquivo"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-9 px-3 shadow-sm transition-all shrink-0"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,audio/*,.pdf,.doc,.docx"
                className="hidden"
                multiple
              />
            </div>
          </>
        )}
      </Card>
      
      {/* Voice Recognition Modal */}
      {showVoiceRecognition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <VoiceRecognition
              onResult={handleVoiceResult}
              onClose={() => setShowVoiceRecognition(false)}
              isOpen={showVoiceRecognition}
            />
          </div>
        </div>
      )}
      
      {/* Image Analysis Modal */}
      {showImageAnalysis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <ImageAnalysis
              onAnalysis={handleImageAnalysis}
              onClose={() => setShowImageAnalysis(false)}
              context={{
                persona: currentPersona,
                product: context?.product,
                page: context?.page
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}