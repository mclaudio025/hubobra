'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Lightbulb, 
  Zap, 
  ShoppingCart, 
  Ruler, 
  Palette, 
  Home, 
  Wrench, 
  Calculator,
  TrendingUp,
  Star,
  Clock,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Suggestion {
  id: string
  type: 'product' | 'action' | 'tip' | 'calculation' | 'style' | 'compatibility'
  title: string
  description: string
  icon: React.ReactNode
  priority: 'high' | 'medium' | 'low'
  category: string
  action?: {
    type: 'message' | 'navigate' | 'calculate' | 'search'
    payload: any
  }
  metadata?: {
    confidence?: number
    relevance?: number
    timestamp?: Date
  }
}

interface ContextualSuggestionsProps {
  context: {
    page?: string
    product?: any
    user?: any
    conversation?: any[]
    currentMessage?: string
  }
  onSuggestionClick: (suggestion: Suggestion) => void
  className?: string
  maxSuggestions?: number
}

const suggestionIcons = {
  product: <ShoppingCart className="h-4 w-4" />,
  action: <Zap className="h-4 w-4" />,
  tip: <Lightbulb className="h-4 w-4" />,
  calculation: <Calculator className="h-4 w-4" />,
  style: <Palette className="h-4 w-4" />,
  compatibility: <Wrench className="h-4 w-4" />
}

const priorityColors = {
  high: 'border-red-200 bg-red-50',
  medium: 'border-yellow-200 bg-yellow-50',
  low: 'border-blue-200 bg-blue-50'
}

export function ContextualSuggestions({ 
  context, 
  onSuggestionClick, 
  className,
  maxSuggestions = 6
}: ContextualSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  useEffect(() => {
    generateSuggestions()
  }, [context])
  
  const generateSuggestions = async () => {
    setIsLoading(true)
    
    try {
      // Simular geração de sugestões baseada no contexto
      const contextualSuggestions = await generateContextualSuggestions(context)
      setSuggestions(contextualSuggestions.slice(0, maxSuggestions))
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const generateContextualSuggestions = async (ctx: any): Promise<Suggestion[]> => {
    // Simular análise de contexto e geração de sugestões
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const baseSuggestions: Suggestion[] = []
    
    // Sugestões baseadas na página atual
    if (ctx.page === 'product') {
      baseSuggestions.push(
        {
          id: 'spec-details',
          type: 'action',
          title: 'Ver especificações técnicas',
          description: 'Mostrar detalhes técnicos completos do produto',
          icon: <Ruler className="h-4 w-4" />,
          priority: 'high',
          category: 'Produto',
          action: {
            type: 'message',
            payload: 'Mostre as especificações técnicas detalhadas deste produto'
          },
          metadata: { confidence: 0.95, relevance: 0.9 }
        },
        {
          id: 'compatibility-check',
          type: 'compatibility',
          title: 'Verificar compatibilidade',
          description: 'Checar se é compatível com outros produtos',
          icon: <Wrench className="h-4 w-4" />,
          priority: 'high',
          category: 'Compatibilidade',
          action: {
            type: 'message',
            payload: 'Este produto é compatível com quais outros itens?'
          },
          metadata: { confidence: 0.88, relevance: 0.85 }
        },
        {
          id: 'installation-guide',
          type: 'tip',
          title: 'Guia de instalação',
          description: 'Como instalar este produto corretamente',
          icon: <Home className="h-4 w-4" />,
          priority: 'medium',
          category: 'Instalação',
          action: {
            type: 'message',
            payload: 'Como instalar este produto? Preciso de ferramentas especiais?'
          },
          metadata: { confidence: 0.82, relevance: 0.8 }
        }
      )
    }
    
    // Sugestões baseadas no produto atual
    if (ctx.product) {
      baseSuggestions.push(
        {
          id: 'calculate-materials',
          type: 'calculation',
          title: 'Calcular materiais necessários',
          description: 'Quantos itens preciso para meu projeto?',
          icon: <Calculator className="h-4 w-4" />,
          priority: 'high',
          category: 'Cálculo',
          action: {
            type: 'calculate',
            payload: { productId: ctx.product.id, type: 'materials' }
          },
          metadata: { confidence: 0.92, relevance: 0.88 }
        },
        {
          id: 'style-suggestions',
          type: 'style',
          title: 'Sugestões de estilo',
          description: 'Produtos que combinam com este item',
          icon: <Palette className="h-4 w-4" />,
          priority: 'medium',
          category: 'Estilo',
          action: {
            type: 'message',
            payload: 'Que produtos combinam bem com este item? Sugestões de decoração?'
          },
          metadata: { confidence: 0.85, relevance: 0.75 }
        },
        {
          id: 'similar-products',
          type: 'product',
          title: 'Produtos similares',
          description: 'Alternativas e opções relacionadas',
          icon: <TrendingUp className="h-4 w-4" />,
          priority: 'medium',
          category: 'Produtos',
          action: {
            type: 'search',
            payload: { category: ctx.product.category, exclude: ctx.product.id }
          },
          metadata: { confidence: 0.78, relevance: 0.7 }
        }
      )
    }
    
    // Sugestões baseadas na conversa
    if (ctx.conversation && ctx.conversation.length > 0) {
      const lastMessages = ctx.conversation.slice(-3)
      const hasQuestionAboutPrice = lastMessages.some(msg => 
        msg.content.toLowerCase().includes('preço') || 
        msg.content.toLowerCase().includes('custo')
      )
      
      if (hasQuestionAboutPrice) {
        baseSuggestions.push({
          id: 'price-comparison',
          type: 'action',
          title: 'Comparar preços',
          description: 'Ver opções com melhor custo-benefício',
          icon: <Target className="h-4 w-4" />,
          priority: 'high',
          category: 'Preço',
          action: {
            type: 'message',
            payload: 'Mostre opções mais econômicas ou com melhor custo-benefício'
          },
          metadata: { confidence: 0.9, relevance: 0.95 }
        })
      }
    }
    
    // Sugestões baseadas na mensagem atual
    if (ctx.currentMessage) {
      const message = ctx.currentMessage.toLowerCase()
      
      if (message.includes('medida') || message.includes('tamanho')) {
        baseSuggestions.push({
          id: 'measurement-help',
          type: 'tip',
          title: 'Ajuda com medidas',
          description: 'Como medir corretamente para seu projeto',
          icon: <Ruler className="h-4 w-4" />,
          priority: 'high',
          category: 'Medidas',
          action: {
            type: 'message',
            payload: 'Como devo medir para garantir que o produto serve no meu espaço?'
          },
          metadata: { confidence: 0.93, relevance: 0.9 }
        })
      }
      
      if (message.includes('cor') || message.includes('estilo')) {
        baseSuggestions.push({
          id: 'color-style-guide',
          type: 'style',
          title: 'Guia de cores e estilos',
          description: 'Dicas para harmonizar cores e estilos',
          icon: <Palette className="h-4 w-4" />,
          priority: 'medium',
          category: 'Design',
          action: {
            type: 'message',
            payload: 'Que cores e estilos funcionam bem juntos? Dicas de harmonização?'
          },
          metadata: { confidence: 0.87, relevance: 0.8 }
        })
      }
    }
    
    // Sugestões gerais sempre úteis
    baseSuggestions.push(
      {
        id: 'trending-products',
        type: 'product',
        title: 'Produtos em alta',
        description: 'Itens mais populares do momento',
        icon: <Star className="h-4 w-4" />,
        priority: 'low',
        category: 'Tendências',
        action: {
          type: 'message',
          payload: 'Quais são os produtos mais populares e tendências atuais?'
        },
        metadata: { confidence: 0.7, relevance: 0.6 }
      },
      {
        id: 'quick-tips',
        type: 'tip',
        title: 'Dicas rápidas',
        description: 'Conselhos úteis para seu projeto',
        icon: <Lightbulb className="h-4 w-4" />,
        priority: 'low',
        category: 'Dicas',
        action: {
          type: 'message',
          payload: 'Dê algumas dicas úteis para meu projeto de decoração/construção'
        },
        metadata: { confidence: 0.75, relevance: 0.65 }
      }
    )
    
    // Ordenar por prioridade e relevância
    return baseSuggestions
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        
        const relevanceA = a.metadata?.relevance || 0
        const relevanceB = b.metadata?.relevance || 0
        return relevanceB - relevanceA
      })
  }
  
  const categories = ['all', ...Array.from(new Set(suggestions.map(s => s.category)))]
  
  const filteredSuggestions = selectedCategory === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.category === selectedCategory)
  
  const handleSuggestionClick = (suggestion: Suggestion) => {
    onSuggestionClick(suggestion)
  }
  
  if (isLoading) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center space-x-2 text-gray-500">
          <Zap className="h-4 w-4 animate-pulse" />
          <span className="text-sm">Gerando sugestões...</span>
        </div>
      </Card>
    )
  }
  
  if (suggestions.length === 0) {
    return null
  }
  
  return (
    <Card className={cn('p-4 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold text-sm">Sugestões Inteligentes</h3>
        </div>
        
        <Badge variant="secondary" className="text-xs">
          {filteredSuggestions.length} sugestões
        </Badge>
      </div>
      
      {/* Category Filter */}
      <ScrollArea className="w-full">
        <div className="flex space-x-2 pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="text-xs whitespace-nowrap"
            >
              {category === 'all' ? 'Todas' : category}
            </Button>
          ))}
        </div>
      </ScrollArea>
      
      {/* Suggestions Grid */}
      <div className="grid grid-cols-1 gap-2">
        {filteredSuggestions.map((suggestion) => (
          <Button
            key={suggestion.id}
            variant="ghost"
            className={cn(
              'h-auto p-3 justify-start text-left border transition-all duration-200 hover:shadow-md',
              priorityColors[suggestion.priority]
            )}
            onClick={() => handleSuggestionClick(suggestion)}
          >
            <div className="flex items-start space-x-3 w-full">
              <div className={cn(
                'p-2 rounded-lg',
                suggestion.priority === 'high' ? 'bg-red-100 text-red-600' :
                suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                'bg-blue-100 text-blue-600'
              )}>
                {suggestionIcons[suggestion.type] || suggestion.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-sm truncate">{suggestion.title}</h4>
                  {suggestion.metadata?.confidence && (
                    <Badge variant="outline" className="text-xs ml-2">
                      {Math.round(suggestion.metadata.confidence * 100)}%
                    </Badge>
                  )}
                </div>
                
                <p className="text-xs text-gray-600 line-clamp-2">
                  {suggestion.description}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                  >
                    {suggestion.category}
                  </Badge>
                  
                  {suggestion.priority === 'high' && (
                    <div className="flex items-center space-x-1 text-red-500">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">Urgente</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </div>
      
      {filteredSuggestions.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma sugestão para esta categoria</p>
        </div>
      )}
    </Card>
  )
}