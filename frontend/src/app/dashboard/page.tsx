'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Trophy,
  Star,
  Target,
  TrendingUp,
  ShoppingCart,
  Package,
  Calendar,
  Award,
  Zap,
  Heart,
  Eye,
  Clock,
  CheckCircle,
  ArrowRight,
  Plus,
  Settings,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Project {
  id: string
  name: string
  description: string
  progress: number
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold'
  category: string
  estimatedCost: number
  createdAt: Date
  updatedAt: Date
  materials: string[]
  images: string[]
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedAt?: Date
  progress?: number
  maxProgress?: number
}

interface Purchase {
  id: string
  productName: string
  category: string
  price: number
  quantity: number
  date: Date
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled'
  rating?: number
}

interface UserStats {
  level: number
  xp: number
  nextLevelXp: number
  totalProjects: number
  completedProjects: number
  totalSpent: number
  favoriteCategory: string
  joinDate: Date
}

const Dashboard = () => {
  const [userStats, setUserStats] = useState<UserStats>({
    level: 12,
    xp: 2450,
    nextLevelXp: 3000,
    totalProjects: 8,
    completedProjects: 5,
    totalSpent: 15420.50,
    favoriteCategory: 'Construção',
    joinDate: new Date('2023-06-15')
  })

  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'Reforma da Cozinha',
      description: 'Renovação completa da cozinha com novos armários e bancada',
      progress: 75,
      status: 'in_progress',
      category: 'Reforma',
      estimatedCost: 8500,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      materials: ['Armários', 'Bancada de Granito', 'Torneira', 'Pia'],
      images: []
    },
    {
      id: '2',
      name: 'Deck da Área Externa',
      description: 'Construção de deck de madeira na área externa',
      progress: 100,
      status: 'completed',
      category: 'Construção',
      estimatedCost: 3200,
      createdAt: new Date('2023-11-10'),
      updatedAt: new Date('2023-12-05'),
      materials: ['Madeira Tratada', 'Parafusos', 'Verniz'],
      images: []
    },
    {
      id: '3',
      name: 'Jardim Vertical',
      description: 'Criação de jardim vertical na parede da sala',
      progress: 30,
      status: 'planning',
      category: 'Paisagismo',
      estimatedCost: 1200,
      createdAt: new Date('2024-01-22'),
      updatedAt: new Date('2024-01-22'),
      materials: ['Estrutura Metálica', 'Vasos', 'Plantas', 'Sistema de Irrigação'],
      images: []
    }
  ])

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'Primeiro Projeto',
      description: 'Complete seu primeiro projeto',
      icon: '🏆',
      rarity: 'common',
      unlockedAt: new Date('2023-07-01')
    },
    {
      id: '2',
      title: 'Mestre Construtor',
      description: 'Complete 5 projetos de construção',
      icon: '🏗️',
      rarity: 'rare',
      unlockedAt: new Date('2023-12-15')
    },
    {
      id: '3',
      title: 'Economista',
      description: 'Economize R$ 1.000 em um projeto',
      icon: '💰',
      rarity: 'epic',
      progress: 750,
      maxProgress: 1000
    },
    {
      id: '4',
      title: 'Visionário',
      description: 'Use IA para 10 projetos',
      icon: '🤖',
      rarity: 'legendary',
      progress: 7,
      maxProgress: 10
    }
  ])

  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([
    {
      id: '1',
      productName: 'Furadeira Bosch GSB 550 RE',
      category: 'Ferramentas',
      price: 189.90,
      quantity: 1,
      date: new Date('2024-01-18'),
      status: 'delivered',
      rating: 5
    },
    {
      id: '2',
      productName: 'Tinta Acrílica Branca 18L',
      category: 'Tintas',
      price: 85.50,
      quantity: 2,
      date: new Date('2024-01-15'),
      status: 'delivered',
      rating: 4
    },
    {
      id: '3',
      productName: 'Parafusos Philips 4x40mm',
      category: 'Fixação',
      price: 12.90,
      quantity: 5,
      date: new Date('2024-01-12'),
      status: 'shipped'
    }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      case 'planning': return 'bg-yellow-500'
      case 'on_hold': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído'
      case 'in_progress': return 'Em Andamento'
      case 'planning': return 'Planejamento'
      case 'on_hold': return 'Pausado'
      default: return 'Desconhecido'
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50'
      case 'rare': return 'border-blue-300 bg-blue-50'
      case 'epic': return 'border-purple-300 bg-purple-50'
      case 'legendary': return 'border-yellow-300 bg-yellow-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const xpProgress = (userStats.xp / userStats.nextLevelXp) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Bem-vindo de volta! Vamos continuar seus projetos.</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Nível Atual</p>
                  <p className="text-3xl font-bold">{userStats.level}</p>
                </div>
                <Trophy className="h-8 w-8 text-blue-200" />
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-blue-100 mb-1">
                  <span>XP: {userStats.xp}</span>
                  <span>{userStats.nextLevelXp}</span>
                </div>
                <Progress value={xpProgress} className="h-2 bg-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Projetos</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {userStats.completedProjects}/{userStats.totalProjects}
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {Math.round((userStats.completedProjects / userStats.totalProjects) * 100)}% concluídos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Investido</p>
                  <p className="text-3xl font-bold text-gray-900">
                    R$ {userStats.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-sm text-gray-500 mt-2">Em {userStats.totalProjects} projetos</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Categoria Favorita</p>
                  <p className="text-xl font-bold text-gray-900">{userStats.favoriteCategory}</p>
                </div>
                <Heart className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-sm text-gray-500 mt-2">Mais utilizada</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="projects">Projetos</TabsTrigger>
            <TabsTrigger value="achievements">Conquistas</TabsTrigger>
            <TabsTrigger value="purchases">Compras</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Meus Projetos
                    </CardTitle>
                    <CardDescription>
                      Acompanhe o progresso dos seus projetos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {projects.map((project) => (
                        <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold text-gray-900">{project.name}</h3>
                                <Badge 
                                  variant="secondary" 
                                  className={cn('text-white', getStatusColor(project.status))}
                                >
                                  {getStatusText(project.status)}
                                </Badge>
                              </div>
                              <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Progresso</span>
                                <span className="text-sm font-medium">{project.progress}%</span>
                              </div>
                              <Progress value={project.progress} className="h-2 mb-3" />
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>Orçamento: R$ {project.estimatedCost.toLocaleString('pt-BR')}</span>
                                <span>{project.materials.length} materiais</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Atividade Recente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Projeto "Deck" concluído</p>
                          <p className="text-xs text-gray-500">2 dias atrás</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Materiais adicionados à cozinha</p>
                          <p className="text-xs text-gray-500">3 dias atrás</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Novo projeto criado</p>
                          <p className="text-xs text-gray-500">5 dias atrás</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="h-5 w-5 mr-2" />
                      Ações Rápidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Projeto
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Lista de Compras
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Relatório
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Conquistas
                </CardTitle>
                <CardDescription>
                  Suas conquistas e progresso no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement) => (
                    <div 
                      key={achievement.id} 
                      className={cn(
                        'border-2 rounded-lg p-4 transition-all hover:shadow-md',
                        getRarityColor(achievement.rarity),
                        achievement.unlockedAt ? 'opacity-100' : 'opacity-60'
                      )}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{achievement.icon}</div>
                        <h3 className="font-semibold text-gray-900 mb-1">{achievement.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                        
                        {achievement.unlockedAt ? (
                          <div className="flex items-center justify-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">Desbloqueado</span>
                          </div>
                        ) : achievement.progress !== undefined ? (
                          <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>{achievement.progress}</span>
                              <span>{achievement.maxProgress}</span>
                            </div>
                            <Progress 
                              value={(achievement.progress / (achievement.maxProgress || 1)) * 100} 
                              className="h-2" 
                            />
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            <Clock className="h-3 w-3 inline mr-1" />
                            Em progresso
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Histórico de Compras
                </CardTitle>
                <CardDescription>
                  Suas compras recentes e avaliações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPurchases.map((purchase) => (
                    <div key={purchase.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{purchase.productName}</h3>
                            <Badge variant="outline">{purchase.category}</Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Qtd: {purchase.quantity}</span>
                            <span>R$ {purchase.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span>{purchase.date.toLocaleDateString('pt-BR')}</span>
                          </div>
                          {purchase.rating && (
                            <div className="flex items-center mt-2">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={cn(
                                    'h-4 w-4',
                                    i < purchase.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  )} 
                                />
                              ))}
                              <span className="text-sm text-gray-500 ml-2">Avaliado</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={purchase.status === 'delivered' ? 'default' : 'secondary'}
                            className={cn(
                              purchase.status === 'delivered' && 'bg-green-500',
                              purchase.status === 'shipped' && 'bg-blue-500',
                              purchase.status === 'pending' && 'bg-yellow-500'
                            )}
                          >
                            {purchase.status === 'delivered' && 'Entregue'}
                            {purchase.status === 'shipped' && 'Enviado'}
                            {purchase.status === 'pending' && 'Pendente'}
                            {purchase.status === 'cancelled' && 'Cancelado'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Produtos Recomendados
                  </CardTitle>
                  <CardDescription>
                    Baseado nos seus projetos e preferências
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">Parafusadeira Bosch</h3>
                          <p className="text-sm text-gray-600">Ideal para seu projeto de deck</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-lg font-bold text-green-600">R$ 299,90</span>
                            <Badge variant="outline">15% OFF</Badge>
                          </div>
                        </div>
                        <Button size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">Kit de Irrigação</h3>
                          <p className="text-sm text-gray-600">Perfeito para jardim vertical</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-lg font-bold text-green-600">R$ 89,90</span>
                            <Badge variant="outline">Novo</Badge>
                          </div>
                        </div>
                        <Button size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Próximos Passos
                  </CardTitle>
                  <CardDescription>
                    Sugestões para seus projetos ativos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold text-gray-900">Reforma da Cozinha</h3>
                      <p className="text-sm text-gray-600 mb-2">Próxima etapa: Instalação da bancada</p>
                      <Button size="sm" variant="outline">
                        Ver Detalhes
                      </Button>
                    </div>
                    
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h3 className="font-semibold text-gray-900">Jardim Vertical</h3>
                      <p className="text-sm text-gray-600 mb-2">Recomendação: Consulte um especialista</p>
                      <Button size="sm" variant="outline">
                        Falar com Zé da Obra
                      </Button>
                    </div>
                    
                    <div className="border-l-4 border-green-500 pl-4">
                      <h3 className="font-semibold text-gray-900">Novo Projeto</h3>
                      <p className="text-sm text-gray-600 mb-2">Que tal uma área de lazer?</p>
                      <Button size="sm" variant="outline">
                        Explorar Ideias
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Dashboard