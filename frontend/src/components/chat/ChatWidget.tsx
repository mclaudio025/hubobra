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
    color: 'from-pink-500 to-purple-600',
    description: 'Especialista em decoração e design'
  },
  ze: {
    name: 'Zé da Obra',
    avatar: '/avatars/ze.png',
    color: 'from-orange-500 to-red-600',
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
      <div className={cn('fixed bottom-6 right-6 z-50', className)}>
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className={cn(
            'h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110',
            'bg-gradient-to-r', personas[currentPersona].color,
            'backdrop-blur-sm border border-white/20'
          )}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        
        {/* Indicador de persona ativa */}
        <div className="absolute -top-2 -left-2">
          <Avatar className="h-8 w-8 border-2 border-white shadow-md">
            <AvatarImage src={personas[currentPersona].avatar} />
            <AvatarFallback className={cn('text-xs bg-gradient-to-r', personas[currentPersona].color)}>
              {personas[currentPersona].name[0]}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      <Card className={cn(
        'w-96 transition-all duration-300 shadow-2xl border-0',
        'bg-white/80 backdrop-blur-xl',
        isMinimized ? 'h-16' : 'h-[600px]'
      )}>
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between p-4 border-b border-white/20',
          'bg-gradient-to-r', personas[currentPersona].color,
          'text-white rounded-t-lg'
        )}>
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8 border-2 border-white/30">
              <AvatarImage src={personas[currentPersona].avatar} />
              <AvatarFallback className="bg-white/20 text-white">
                {personas[currentPersona].name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{personas[currentPersona].name}</h3>
              <p className="text-xs text-white/80">{personas[currentPersona].description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title="Histórico"
            >
              <History className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewConversation}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title="Nova conversa"
            >
              <Plus className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {!isMinimized && (
          <>
            {/* History Panel */}
            {showHistory && (
              <div className="border-b bg-gray-50 max-h-48">
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">Conversas Recentes</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHistory(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="relative mb-2">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      placeholder="Buscar conversas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-7 h-7 text-xs"
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
                          className="w-full justify-start h-auto p-2 text-left"
                        >
                          <div className="flex items-center space-x-2 w-full">
                            <Avatar className="h-5 w-5">
                              <div className={cn(
                                'w-full h-full flex items-center justify-center text-white text-xs',
                                conversation.persona === 'lia' ? 'bg-pink-400' : 'bg-blue-500'
                              )}>
                                {conversation.persona === 'lia' ? 'L' : 'Z'}
                              </div>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{conversation.title}</p>
                              <p className="text-xs text-gray-500">
                                {conversation.messages.length} mensagens
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                {conversation.updatedAt.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </Button>
                      ))}
                      
                      {conversations.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
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
            <div className="p-3 border-b border-gray-200/50 bg-white/50">
              <div className="flex space-x-2">
                {Object.entries(personas).map(([key, persona]) => (
                  <Button
                    key={key}
                    variant={currentPersona === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => switchPersona(key as 'lia' | 'ze')}
                    className={cn(
                      'flex-1 h-8 text-xs',
                      currentPersona === key && `bg-gradient-to-r ${persona.color} text-white border-0`
                    )}
                  >
                    <Avatar className="h-4 w-4 mr-1">
                      <AvatarImage src={persona.avatar} />
                      <AvatarFallback className="text-xs">{persona.name[0]}</AvatarFallback>
                    </Avatar>
                    {persona.name}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 p-4 h-[400px]">
              <div className="space-y-4">
                {(!currentConversation?.messages || currentConversation.messages.length === 0) && (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="font-semibold text-gray-600 mb-2">
                      Olá! Sou {currentPersona === 'lia' ? 'a Lia' : 'o Zé da Obra'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {getWelcomeMessage()}
                    </p>
                    
                    <div className="grid grid-cols-1 gap-2 max-w-xs mx-auto">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => setInputValue('Preciso de dicas de decoração para minha sala')}
                      >
                        💡 Dicas de decoração
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => setInputValue('Como instalar este produto corretamente?')}
                      >
                        🔧 Ajuda com instalação
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => setInputValue('Preciso calcular quantos materiais vou precisar')}
                      >
                        📏 Calcular materiais
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
                        'max-w-[80%] rounded-lg p-3 text-sm relative group',
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : cn(
                              'bg-gradient-to-r text-white',
                              personas[message.sender as 'lia' | 'ze']?.color || 'bg-gray-200 text-gray-800'
                            )
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
                      
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      
                      <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                        <span>
                          {message.sender !== 'user' && (
                            <Badge variant="secondary" className="text-xs mr-2">
                              {message.sender === 'lia' ? 'Lia' : 'Zé da Obra'}
                            </Badge>
                          )}
                          {message.status === 'sending' && (
                            <Badge variant="outline" className="text-xs mr-2">
                              Enviando...
                            </Badge>
                          )}
                          {message.status === 'error' && (
                            <Badge variant="destructive" className="text-xs mr-2">
                              Erro
                            </Badge>
                          )}
                        </span>
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                      </div>
                      
                      {/* Message Actions */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            // Copy message content
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
                    <div className={cn(
                      'bg-gradient-to-r text-white rounded-lg p-3',
                      personas[currentPersona].color
                    )}>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
            
            {/* Contextual Suggestions */}
            {showSuggestions && currentConversation && (
              <div className="border-t p-3">
                <ContextualSuggestions
                  context={{
                    page: context?.page,
                    product: context?.product,
                    user: context?.user,
                    conversation: currentConversation.messages,
                    currentMessage: inputValue
                  }}
                  onSuggestionClick={handleSuggestionClick}
                  maxSuggestions={3}
                  className="border-0 p-0 shadow-none"
                />
              </div>
            )}
            
            {/* Input */}
            <div className="p-4 border-t border-gray-200/50 bg-white/50">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Input
                     ref={inputRef}
                     value={inputValue}
                     onChange={(e) => setInputValue(e.target.value)}
                     onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                     placeholder={`Digite sua mensagem para ${personas[currentPersona].name}...`}
                     className="pr-20 bg-white/80 border-gray-200/50"
                     disabled={isLoading}
                   />
                  
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowVoiceRecognition(true)}
                      className={cn(
                        'h-6 w-6 p-0',
                        isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-gray-600'
                      )}
                      disabled={isLoading}
                      title="Reconhecimento de voz"
                    >
                      {isRecording ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowImageAnalysis(true)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                      title="Análise de imagem"
                    >
                      <ImageIcon className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                      title="Anexar arquivo"
                    >
                      <Paperclip className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
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