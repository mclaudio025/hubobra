'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'assistant'
  persona?: 'lia' | 'ze'
  timestamp: Date
  type: 'text' | 'image' | 'audio' | 'file'
  metadata?: {
    imageUrl?: string
    fileName?: string
    fileSize?: number
    audioUrl?: string
    duration?: number
    analysis?: any
    context?: any
  }
  status?: 'sending' | 'sent' | 'delivered' | 'error'
  reactions?: {
    helpful?: boolean
    rating?: number
  }
}

export interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
  persona: 'lia' | 'ze'
  createdAt: Date
  updatedAt: Date
  context?: {
    page?: string
    product?: any
    user?: any
  }
  tags?: string[]
  summary?: string
}

interface UseChatHistoryOptions {
  maxConversations?: number
  maxMessagesPerConversation?: number
  autoSave?: boolean
  storageKey?: string
}

const DEFAULT_OPTIONS: UseChatHistoryOptions = {
  maxConversations: 50,
  maxMessagesPerConversation: 100,
  autoSave: true,
  storageKey: 'chat_history'
}

export function useChatHistory(options: UseChatHistoryOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }
  
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Carregar histórico do localStorage
  useEffect(() => {
    loadHistory()
  }, [])
  
  // Auto-save quando há mudanças
  useEffect(() => {
    if (config.autoSave && !isLoading) {
      saveHistory()
    }
  }, [conversations, config.autoSave, isLoading])
  
  const loadHistory = useCallback(() => {
    try {
      const stored = localStorage.getItem(config.storageKey!)
      if (stored) {
        const parsed = JSON.parse(stored)
        const restoredConversations = parsed.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }))
        
        setConversations(restoredConversations)
        
        // Restaurar última conversa ativa
        const lastActive = restoredConversations.find((conv: ChatConversation) => 
          conv.id === localStorage.getItem(`${config.storageKey}_current`)
        )
        if (lastActive) {
          setCurrentConversation(lastActive)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar histórico do chat:', error)
    } finally {
      setIsLoading(false)
    }
  }, [config.storageKey])
  
  const saveHistory = useCallback(() => {
    try {
      localStorage.setItem(config.storageKey!, JSON.stringify(conversations))
      if (currentConversation) {
        localStorage.setItem(`${config.storageKey}_current`, currentConversation.id)
      }
    } catch (error) {
      console.error('Erro ao salvar histórico do chat:', error)
    }
  }, [conversations, currentConversation, config.storageKey])
  
  const createConversation = useCallback((persona: 'lia' | 'ze', context?: any): ChatConversation => {
    const now = new Date()
    const conversation: ChatConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `Conversa com ${persona === 'lia' ? 'Lia' : 'Zé da Obra'}`,
      messages: [],
      persona,
      createdAt: now,
      updatedAt: now,
      context,
      tags: []
    }
    
    return conversation
  }, [])
  
  const startNewConversation = useCallback((persona: 'lia' | 'ze', context?: any) => {
    const newConversation = createConversation(persona, context)
    
    setConversations(prev => {
      const updated = [newConversation, ...prev]
      // Limitar número de conversas
      return updated.slice(0, config.maxConversations)
    })
    
    setCurrentConversation(newConversation)
    return newConversation
  }, [createConversation, config.maxConversations])
  
  const switchConversation = useCallback((conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId)
    if (conversation) {
      setCurrentConversation(conversation)
    }
  }, [conversations])
  
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    if (!currentConversation) return null
    
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: message.sender === 'user' ? 'sending' : 'delivered'
    }
    
    setConversations(prev => 
      prev.map(conv => {
        if (conv.id === currentConversation.id) {
          const updatedMessages = [...conv.messages, newMessage]
          // Limitar número de mensagens
          const limitedMessages = updatedMessages.slice(-config.maxMessagesPerConversation!)
          
          const updatedConv = {
            ...conv,
            messages: limitedMessages,
            updatedAt: new Date(),
            title: conv.messages.length === 0 ? generateConversationTitle(newMessage.content) : conv.title
          }
          
          // Atualizar conversa atual
          setCurrentConversation(updatedConv)
          
          return updatedConv
        }
        return conv
      })
    )
    
    return newMessage
  }, [currentConversation, config.maxMessagesPerConversation])
  
  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    if (!currentConversation) return
    
    setConversations(prev => 
      prev.map(conv => {
        if (conv.id === currentConversation.id) {
          const updatedConv = {
            ...conv,
            messages: conv.messages.map(msg => 
              msg.id === messageId ? { ...msg, ...updates } : msg
            ),
            updatedAt: new Date()
          }
          
          // Atualizar conversa atual
          setCurrentConversation(updatedConv)
          
          return updatedConv
        }
        return conv
      })
    )
  }, [currentConversation])
  
  const deleteMessage = useCallback((messageId: string) => {
    if (!currentConversation) return
    
    setConversations(prev => 
      prev.map(conv => {
        if (conv.id === currentConversation.id) {
          const updatedConv = {
            ...conv,
            messages: conv.messages.filter(msg => msg.id !== messageId),
            updatedAt: new Date()
          }
          
          setCurrentConversation(updatedConv)
          return updatedConv
        }
        return conv
      })
    )
  }, [currentConversation])
  
  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId))
    
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null)
    }
  }, [currentConversation])
  
  const clearHistory = useCallback(() => {
    setConversations([])
    setCurrentConversation(null)
    localStorage.removeItem(config.storageKey!)
    localStorage.removeItem(`${config.storageKey}_current`)
  }, [config.storageKey])
  
  const searchConversations = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase()
    
    return conversations.filter(conv => 
      conv.title.toLowerCase().includes(lowercaseQuery) ||
      conv.summary?.toLowerCase().includes(lowercaseQuery) ||
      conv.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      conv.messages.some(msg => 
        msg.content.toLowerCase().includes(lowercaseQuery)
      )
    )
  }, [conversations])
  
  const getConversationsByPersona = useCallback((persona: 'lia' | 'ze') => {
    return conversations.filter(conv => conv.persona === persona)
  }, [conversations])
  
  const getRecentConversations = useCallback((limit: number = 10) => {
    return conversations
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit)
  }, [conversations])
  
  const generateConversationTitle = (firstMessage: string): string => {
    // Gerar título baseado na primeira mensagem
    const words = firstMessage.split(' ').slice(0, 6)
    let title = words.join(' ')
    
    if (firstMessage.length > 50) {
      title += '...'
    }
    
    return title || 'Nova conversa'
  }
  
  const exportConversation = useCallback((conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId)
    if (!conversation) return null
    
    const exportData = {
      ...conversation,
      exportedAt: new Date(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversa_${conversation.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    return exportData
  }, [conversations])
  
  const getStats = useCallback(() => {
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0)
    const userMessages = conversations.reduce((sum, conv) => 
      sum + conv.messages.filter(msg => msg.sender === 'user').length, 0
    )
    const assistantMessages = totalMessages - userMessages
    
    const liaConversations = conversations.filter(conv => conv.persona === 'lia').length
    const zeConversations = conversations.filter(conv => conv.persona === 'ze').length
    
    const oldestConversation = conversations.reduce((oldest, conv) => 
      !oldest || conv.createdAt < oldest.createdAt ? conv : oldest, null as ChatConversation | null
    )
    
    const newestConversation = conversations.reduce((newest, conv) => 
      !newest || conv.createdAt > newest.createdAt ? conv : newest, null as ChatConversation | null
    )
    
    return {
      totalConversations: conversations.length,
      totalMessages,
      userMessages,
      assistantMessages,
      liaConversations,
      zeConversations,
      oldestConversation,
      newestConversation,
      averageMessagesPerConversation: conversations.length > 0 ? totalMessages / conversations.length : 0
    }
  }, [conversations])
  
  return {
    // Estado
    conversations,
    currentConversation,
    isLoading,
    
    // Ações de conversa
    startNewConversation,
    switchConversation,
    deleteConversation,
    
    // Ações de mensagem
    addMessage,
    updateMessage,
    deleteMessage,
    
    // Utilitários
    searchConversations,
    getConversationsByPersona,
    getRecentConversations,
    clearHistory,
    exportConversation,
    getStats,
    
    // Controle manual
    saveHistory,
    loadHistory
  }
}