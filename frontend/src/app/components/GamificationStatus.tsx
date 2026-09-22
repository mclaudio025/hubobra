'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Star,
  Flame,
  Gift,
  TrendingUp,
  ChevronRight,
  Zap
} from 'lucide-react';
import Link from 'next/link';

// Interface simplificada para o status
interface GamificationStatusData {
  level: {
    current: number;
    name: string;
    color: string;
    progress: number;
  };
  totalPoints: number;
  streak: number;
  weeklyPoints: number;
  unclaimedRewards: number;
  recentAchievement?: {
    name: string;
    points: number;
  };
}

interface GamificationStatusProps {
  compact?: boolean;
  showRecentAchievement?: boolean;
}

const GamificationStatus: React.FC<GamificationStatusProps> = ({ 
  compact = false, 
  showRecentAchievement = true 
}) => {
  const [statusData, setStatusData] = useState<GamificationStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento dos dados
    const loadStatus = async () => {
      setLoading(true);
      
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockData: GamificationStatusData = {
        level: {
          current: 3,
          name: 'Arquiteto',
          color: 'bg-purple-500',
          progress: 67 // Progresso para o próximo nível
        },
        totalPoints: 2350,
        streak: 12,
        weeklyPoints: 180,
        unclaimedRewards: 2,
        recentAchievement: {
          name: 'Primeira Compra',
          points: 50
        }
      };
      
      setStatusData(mockData);
      setLoading(false);
    };

    loadStatus();
  }, []);

  if (loading) {
    return (
      <Card className={compact ? "" : "mb-4"}>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statusData) return null;

  if (compact) {
    return (
      <div className="flex items-center space-x-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
        <div className={`p-2 rounded-full ${statusData.level.color} text-white`}>
          <Star className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm">Nível {statusData.level.current}</span>
            <Badge variant="outline" className="text-xs">{statusData.level.name}</Badge>
          </div>
          <div className="flex items-center space-x-3 text-xs text-gray-600">
            <span>{statusData.totalPoints} pts</span>
            <div className="flex items-center space-x-1">
              <Flame className="w-3 h-3 text-orange-500" />
              <span>{statusData.streak}d</span>
            </div>
          </div>
        </div>
        <Link href="/profile/gamification">
          <Button variant="ghost" size="sm" className="p-2">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Card className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${statusData.level.color} bg-white bg-opacity-20`}>
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Nível {statusData.level.current} - {statusData.level.name}</h3>
              <p className="text-blue-100">{statusData.totalPoints.toLocaleString()} pontos totais</p>
            </div>
          </div>
          <Link href="/profile/gamification">
            <Button variant="outline" size="sm" className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-30">
              Ver Perfil
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Progresso do nível */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Progresso para o próximo nível</span>
            <span>{statusData.level.progress}%</span>
          </div>
          <Progress value={statusData.level.progress} className="h-2 bg-blue-800" />
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Flame className="w-4 h-4 text-orange-300 mr-1" />
              <span className="text-lg font-bold">{statusData.streak}</span>
            </div>
            <div className="text-xs text-blue-100">Dias seguidos</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="w-4 h-4 text-green-300 mr-1" />
              <span className="text-lg font-bold">{statusData.weeklyPoints}</span>
            </div>
            <div className="text-xs text-blue-100">Pts esta semana</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Gift className="w-4 h-4 text-yellow-300 mr-1" />
              <span className="text-lg font-bold">{statusData.unclaimedRewards}</span>
            </div>
            <div className="text-xs text-blue-100">Recompensas</div>
          </div>
        </div>

        {/* Conquista recente */}
        {showRecentAchievement && statusData.recentAchievement && (
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-yellow-300" />
                <div>
                  <div className="text-sm font-semibold">Nova Conquista!</div>
                  <div className="text-xs text-blue-100">{statusData.recentAchievement.name}</div>
                </div>
              </div>
              <Badge className="bg-yellow-500 text-yellow-900">
                +{statusData.recentAchievement.points}
              </Badge>
            </div>
          </div>
        )}

        {/* Ações rápidas */}
        <div className="flex space-x-2 mt-4">
          <Link href="/profile/gamification?tab=achievements" className="flex-1">
            <Button variant="outline" size="sm" className="w-full bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-30">
              <Trophy className="w-4 h-4 mr-1" />
              Conquistas
            </Button>
          </Link>
          <Link href="/profile/gamification?tab=rewards" className="flex-1">
            <Button variant="outline" size="sm" className="w-full bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-30">
              <Gift className="w-4 h-4 mr-1" />
              Recompensas
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default GamificationStatus;