'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Trophy,
  Star,
  Target,
  Award,
  Zap,
  TrendingUp,
  Calendar,
  Gift,
  Crown,
  Medal,
  Flame,
  Users,
  ShoppingCart,
  Hammer,
  Eye,
  MessageCircle,
  Share2,
  Heart,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

// Interfaces
interface UserLevel {
  current: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  benefits: string[];
  color: string;
  icon: React.ReactNode;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'shopping' | 'social' | 'builder' | 'engagement' | 'milestone';
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
  isUnlocked: boolean;
}

interface UserStats {
  totalPoints: number;
  level: UserLevel;
  achievements: Achievement[];
  streak: number;
  projectsCompleted: number;
  productsViewed: number;
  socialInteractions: number;
  builderUsage: number;
  weeklyPoints: number;
  monthlyPoints: number;
  rank: number;
  totalUsers: number;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'discount' | 'feature' | 'cosmetic' | 'exclusive';
  icon: React.ReactNode;
  available: boolean;
  claimed: boolean;
}

const GamificationProfile: React.FC = () => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'rewards' | 'leaderboard'>('overview');
  const [loading, setLoading] = useState(true);

  // Níveis do usuário
  const levels: UserLevel[] = [
    {
      current: 1,
      name: 'Iniciante',
      minPoints: 0,
      maxPoints: 100,
      benefits: ['Acesso básico', 'Chat com assistentes'],
      color: 'bg-gray-500',
      icon: <Star className="w-4 h-4" />
    },
    {
      current: 2,
      name: 'Construtor',
      minPoints: 100,
      maxPoints: 500,
      benefits: ['Builder 3D básico', '5% desconto'],
      color: 'bg-blue-500',
      icon: <Hammer className="w-4 h-4" />
    },
    {
      current: 3,
      name: 'Arquiteto',
      minPoints: 500,
      maxPoints: 1500,
      benefits: ['Builder 3D avançado', '10% desconto', 'Suporte prioritário'],
      color: 'bg-purple-500',
      icon: <Award className="w-4 h-4" />
    },
    {
      current: 4,
      name: 'Mestre',
      minPoints: 1500,
      maxPoints: 5000,
      benefits: ['Todas as funcionalidades', '15% desconto', 'Acesso antecipado'],
      color: 'bg-orange-500',
      icon: <Crown className="w-4 h-4" />
    },
    {
      current: 5,
      name: 'Lenda',
      minPoints: 5000,
      maxPoints: Infinity,
      benefits: ['Status VIP', '20% desconto', 'Consultoria gratuita'],
      color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
      icon: <Trophy className="w-4 h-4" />
    }
  ];

  // Conquistas disponíveis
  const availableAchievements: Achievement[] = [
    {
      id: 'first-purchase',
      name: 'Primeira Compra',
      description: 'Realize sua primeira compra na plataforma',
      icon: <ShoppingCart className="w-5 h-5" />,
      category: 'shopping',
      points: 50,
      rarity: 'common',
      isUnlocked: true,
      unlockedAt: new Date('2024-01-15')
    },
    {
      id: 'builder-master',
      name: 'Mestre do Builder',
      description: 'Complete 10 projetos no Builder 3D',
      icon: <Hammer className="w-5 h-5" />,
      category: 'builder',
      points: 200,
      rarity: 'rare',
      isUnlocked: false,
      progress: 7,
      maxProgress: 10
    },
    {
      id: 'social-butterfly',
      name: 'Borboleta Social',
      description: 'Interaja com 50 outros usuários',
      icon: <Users className="w-5 h-5" />,
      category: 'social',
      points: 100,
      rarity: 'common',
      isUnlocked: false,
      progress: 23,
      maxProgress: 50
    },
    {
      id: 'streak-warrior',
      name: 'Guerreiro da Sequência',
      description: 'Mantenha uma sequência de 30 dias',
      icon: <Flame className="w-5 h-5" />,
      category: 'engagement',
      points: 300,
      rarity: 'epic',
      isUnlocked: false,
      progress: 12,
      maxProgress: 30
    },
    {
      id: 'legendary-builder',
      name: 'Construtor Lendário',
      description: 'Alcance 5000 pontos totais',
      icon: <Crown className="w-5 h-5" />,
      category: 'milestone',
      points: 1000,
      rarity: 'legendary',
      isUnlocked: false,
      progress: 2350,
      maxProgress: 5000
    }
  ];

  // Recompensas disponíveis
  const availableRewards: Reward[] = [
    {
      id: 'discount-5',
      name: 'Desconto 5%',
      description: 'Desconto de 5% em qualquer compra',
      cost: 100,
      type: 'discount',
      icon: <Gift className="w-5 h-5" />,
      available: true,
      claimed: false
    },
    {
      id: 'builder-premium',
      name: 'Builder Premium',
      description: 'Acesso a funcionalidades premium do Builder 3D por 30 dias',
      cost: 500,
      type: 'feature',
      icon: <Zap className="w-5 h-5" />,
      available: true,
      claimed: false
    },
    {
      id: 'exclusive-badge',
      name: 'Badge Exclusivo',
      description: 'Badge especial para seu perfil',
      cost: 200,
      type: 'cosmetic',
      icon: <Medal className="w-5 h-5" />,
      available: true,
      claimed: true
    },
    {
      id: 'vip-support',
      name: 'Suporte VIP',
      description: 'Acesso prioritário ao suporte por 90 dias',
      cost: 1000,
      type: 'exclusive',
      icon: <Crown className="w-5 h-5" />,
      available: false,
      claimed: false
    }
  ];

  useEffect(() => {
    // Simular carregamento dos dados do usuário
    const loadUserStats = async () => {
      setLoading(true);
      
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockStats: UserStats = {
        totalPoints: 2350,
        level: levels[2], // Arquiteto
        achievements: availableAchievements,
        streak: 12,
        projectsCompleted: 7,
        productsViewed: 156,
        socialInteractions: 23,
        builderUsage: 45,
        weeklyPoints: 180,
        monthlyPoints: 720,
        rank: 42,
        totalUsers: 1250
      };
      
      setUserStats(mockStats);
      setRewards(availableRewards);
      setLoading(false);
    };

    loadUserStats();
  }, []);

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRewardTypeColor = (type: Reward['type']) => {
    switch (type) {
      case 'discount': return 'bg-green-100 text-green-800';
      case 'feature': return 'bg-blue-100 text-blue-800';
      case 'cosmetic': return 'bg-purple-100 text-purple-800';
      case 'exclusive': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const claimReward = (rewardId: string) => {
    if (!userStats) return;
    
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward || !reward.available || reward.claimed || userStats.totalPoints < reward.cost) return;
    
    // Simular claim da recompensa
    setRewards(prev => prev.map(r => 
      r.id === rewardId ? { ...r, claimed: true } : r
    ));
    
    setUserStats(prev => prev ? {
      ...prev,
      totalPoints: prev.totalPoints - reward.cost
    } : null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando seu perfil...</p>
        </div>
      </div>
    );
  }

  if (!userStats) return null;

  const currentLevelProgress = ((userStats.totalPoints - userStats.level.minPoints) / (userStats.level.maxPoints - userStats.level.minPoints)) * 100;
  const nextLevel = levels.find(l => l.current === userStats.level.current + 1);
  const pointsToNextLevel = nextLevel ? nextLevel.minPoints - userStats.totalPoints : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header com informações principais */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${userStats.level.color} text-white`}>
                {userStats.level.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold">Nível {userStats.level.current} - {userStats.level.name}</h1>
                <p className="text-blue-100">{userStats.totalPoints.toLocaleString()} pontos totais</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <Flame className="w-5 h-5 text-orange-300" />
                <span className="text-lg font-semibold">{userStats.streak} dias</span>
              </div>
              <p className="text-blue-100">Sequência atual</p>
            </div>
          </div>
          
          {nextLevel && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso para {nextLevel.name}</span>
                <span>{pointsToNextLevel} pontos restantes</span>
              </div>
              <Progress value={currentLevelProgress} className="h-2 bg-blue-800" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Hammer className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{userStats.projectsCompleted}</div>
            <div className="text-sm text-gray-600">Projetos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{userStats.productsViewed}</div>
            <div className="text-sm text-gray-600">Produtos vistos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">{userStats.socialInteractions}</div>
            <div className="text-sm text-gray-600">Interações</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold">#{userStats.rank}</div>
            <div className="text-sm text-gray-600">Ranking</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
          <TabsTrigger value="rewards">Recompensas</TabsTrigger>
          <TabsTrigger value="leaderboard">Ranking</TabsTrigger>
        </TabsList>

        {/* Aba Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Conquistas recentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>Conquistas Recentes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userStats.achievements.filter(a => a.isUnlocked).slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-yellow-600">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{achievement.name}</div>
                        <div className="text-xs text-gray-600">{achievement.description}</div>
                      </div>
                      <Badge className={getRarityColor(achievement.rarity)}>
                        +{achievement.points}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Progresso semanal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Progresso Semanal</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Pontos desta semana</span>
                      <span className="font-semibold">{userStats.weeklyPoints}</span>
                    </div>
                    <Progress value={(userStats.weeklyPoints / 200) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Pontos deste mês</span>
                      <span className="font-semibold">{userStats.monthlyPoints}</span>
                    </div>
                    <Progress value={(userStats.monthlyPoints / 1000) * 100} className="h-2" />
                  </div>
                  <Separator />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">+{userStats.weeklyPoints}</div>
                    <div className="text-sm text-gray-600">pontos esta semana</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefícios do nível atual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-5 h-5" />
                <span>Benefícios do Nível {userStats.level.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {userStats.level.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Conquistas */}
        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle>Suas Conquistas</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {userStats.achievements.map((achievement) => (
                    <div key={achievement.id} className={`p-4 rounded-lg border-2 ${
                      achievement.isUnlocked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-full ${
                            achievement.isUnlocked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-400'
                          }`}>
                            {achievement.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold">{achievement.name}</h3>
                              <Badge className={getRarityColor(achievement.rarity)}>
                                {achievement.rarity}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                            
                            {!achievement.isUnlocked && achievement.progress !== undefined && achievement.maxProgress && (
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span>Progresso</span>
                                  <span>{achievement.progress}/{achievement.maxProgress}</span>
                                </div>
                                <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-2" />
                              </div>
                            )}
                            
                            {achievement.isUnlocked && achievement.unlockedAt && (
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>Desbloqueado em {achievement.unlockedAt.toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">+{achievement.points}</div>
                          <div className="text-xs text-gray-500">pontos</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Recompensas */}
        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Loja de Recompensas</span>
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="font-bold">{userStats.totalPoints} pontos</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {rewards.map((reward) => (
                  <div key={reward.id} className={`p-4 rounded-lg border-2 ${
                    reward.claimed ? 'bg-gray-50 border-gray-200 opacity-60' : 
                    reward.available && userStats.totalPoints >= reward.cost ? 'bg-white border-blue-200' : 
                    'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${
                          reward.claimed ? 'bg-gray-200 text-gray-400' :
                          reward.available ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'
                        }`}>
                          {reward.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold">{reward.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                          <Badge className={getRewardTypeColor(reward.type)}>
                            {reward.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-orange-600">
                        {reward.cost} pontos
                      </div>
                      <Button
                        size="sm"
                        disabled={!reward.available || reward.claimed || userStats.totalPoints < reward.cost}
                        onClick={() => claimReward(reward.id)}
                        variant={reward.claimed ? "outline" : "default"}
                      >
                        {reward.claimed ? 'Resgatado' : 
                         !reward.available ? 'Indisponível' :
                         userStats.totalPoints < reward.cost ? 'Pontos insuficientes' : 'Resgatar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Ranking */}
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Ranking Global</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sua posição */}
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl font-bold text-blue-600">#{userStats.rank}</div>
                      <div>
                        <div className="font-semibold">Sua Posição</div>
                        <div className="text-sm text-gray-600">{userStats.totalPoints} pontos</div>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      Top {Math.round((userStats.rank / userStats.totalUsers) * 100)}%
                    </Badge>
                  </div>
                </div>

                {/* Top 10 simulado */}
                <div className="space-y-2">
                  {[
                    { rank: 1, name: 'ArchMaster2024', points: 8750, level: 'Lenda' },
                    { rank: 2, name: 'BuilderPro', points: 7200, level: 'Mestre' },
                    { rank: 3, name: 'DesignGuru', points: 6800, level: 'Mestre' },
                    { rank: 4, name: 'ConstruçãoFácil', points: 5900, level: 'Mestre' },
                    { rank: 5, name: 'ArquitetoModerno', points: 5400, level: 'Mestre' }
                  ].map((user) => (
                    <div key={user.rank} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          user.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                          user.rank === 2 ? 'bg-gray-100 text-gray-800' :
                          user.rank === 3 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : user.rank}
                        </div>
                        <div>
                          <div className="font-semibold">{user.name}</div>
                          <div className="text-sm text-gray-600">{user.level}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{user.points.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">pontos</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GamificationProfile;