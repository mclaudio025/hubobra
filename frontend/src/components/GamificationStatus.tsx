import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Star,
  Target,
  Zap,
  Award,
  TrendingUp
} from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface GamificationStatusProps {
  userLevel: number;
  currentXP: number;
  nextLevelXP: number;
  totalProjects: number;
  achievements: Achievement[];
  className?: string;
}

const GamificationStatus: React.FC<GamificationStatusProps> = ({
  userLevel = 1,
  currentXP = 150,
  nextLevelXP = 500,
  totalProjects = 3,
  achievements = [],
  className = ''
}) => {
  const xpProgress = (currentXP / nextLevelXP) * 100;
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;

  const defaultAchievements: Achievement[] = [
    {
      id: '1',
      name: 'Primeiro Projeto',
      description: 'Crie seu primeiro projeto 3D',
      icon: <Trophy className="h-4 w-4" />,
      unlocked: totalProjects >= 1
    },
    {
      id: '2',
      name: 'Construtor Experiente',
      description: 'Complete 5 projetos',
      icon: <Star className="h-4 w-4" />,
      unlocked: totalProjects >= 5,
      progress: totalProjects,
      maxProgress: 5
    },
    {
      id: '3',
      name: 'Mestre Builder',
      description: 'Alcance o nível 10',
      icon: <Award className="h-4 w-4" />,
      unlocked: userLevel >= 10,
      progress: userLevel,
      maxProgress: 10
    },
    {
      id: '4',
      name: 'Inovador',
      description: 'Use 10 materiais diferentes',
      icon: <Zap className="h-4 w-4" />,
      unlocked: false,
      progress: 3,
      maxProgress: 10
    }
  ];

  const displayAchievements = achievements.length > 0 ? achievements : defaultAchievements;

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Status do Jogador
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nível e XP */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Nível {userLevel}
              </Badge>
              <span className="text-sm text-gray-600">
                {currentXP} / {nextLevelXP} XP
              </span>
            </div>
            <Target className="h-4 w-4 text-gray-400" />
          </div>
          <Progress value={xpProgress} className="h-2" />
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalProjects}</div>
            <div className="text-sm text-gray-600">Projetos</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{unlockedAchievements}</div>
            <div className="text-sm text-gray-600">Conquistas</div>
          </div>
        </div>

        {/* Conquistas Recentes */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Conquistas</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {displayAchievements.slice(0, 4).map((achievement) => (
              <div
                key={achievement.id}
                className={`flex items-center gap-3 p-2 rounded-lg border ${
                  achievement.unlocked
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`p-1 rounded ${
                  achievement.unlocked
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {achievement.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {achievement.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {achievement.description}
                  </div>
                  {achievement.progress !== undefined && achievement.maxProgress && (
                    <div className="mt-1">
                      <Progress 
                        value={(achievement.progress / achievement.maxProgress) * 100} 
                        className="h-1"
                      />
                      <div className="text-xs text-gray-400 mt-1">
                        {achievement.progress}/{achievement.maxProgress}
                      </div>
                    </div>
                  )}
                </div>
                {achievement.unlocked && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    ✓
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GamificationStatus;