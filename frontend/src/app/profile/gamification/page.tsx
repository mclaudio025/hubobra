'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import GamificationProfile from '@/app/components/GamificationProfile';
import GamificationStatus from '@/app/components/GamificationStatus';

const GamificationPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Perfil
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sistema de Gamificação</h1>
                <p className="text-gray-600">Acompanhe seu progresso e conquistas</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
              Versão Beta
            </Badge>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna principal - Perfil de gamificação */}
          <div className="lg:col-span-2">
            <GamificationProfile />
          </div>

          {/* Sidebar - Status e informações rápidas */}
          <div className="space-y-6">
            {/* Status compacto */}
            <GamificationStatus compact={false} showRecentAchievement={true} />

            {/* Dicas e informações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">💡 Dicas para Ganhar Pontos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-sm">Complete seu perfil</div>
                    <div className="text-xs text-gray-600">+100 pontos</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-sm">Faça sua primeira compra</div>
                    <div className="text-xs text-gray-600">+200 pontos</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-sm">Use o Builder 3D</div>
                    <div className="text-xs text-gray-600">+50 pontos por projeto</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-sm">Avalie produtos</div>
                    <div className="text-xs text-gray-600">+25 pontos por avaliação</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-sm">Compartilhe projetos</div>
                    <div className="text-xs text-gray-600">+30 pontos por compartilhamento</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Próximos eventos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🎯 Próximos Eventos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <div className="font-medium text-sm text-blue-900">Semana do Construtor</div>
                  <div className="text-xs text-blue-700">Pontos em dobro no Builder 3D</div>
                  <div className="text-xs text-blue-600 mt-1">Termina em 3 dias</div>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                  <div className="font-medium text-sm text-purple-900">Desafio Mensal</div>
                  <div className="text-xs text-purple-700">Complete 5 projetos</div>
                  <div className="text-xs text-purple-600 mt-1">Recompensa: 500 pontos</div>
                </div>
              </CardContent>
            </Card>

            {/* Links rápidos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🚀 Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/builder3d" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    Abrir Builder 3D
                  </Button>
                </Link>
                <Link href="/products" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    Explorar Produtos
                  </Button>
                </Link>
                <Link href="/profile" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    Editar Perfil
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationPage;