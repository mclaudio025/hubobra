'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bot, MessageSquare, Clock, Users, Settings, ArrowLeft, Zap, Heart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LiaStats {
  totalConversations: number;
  totalMessages: number;
  averageResponseTime: number;
  userSatisfaction: number;
  activeUsers: number;
  resolvedQueries: number;
}

export default function LiaPage() {
  const router = useRouter();
  const [stats, setStats] = useState<LiaStats>({
    totalConversations: 0,
    totalMessages: 0,
    averageResponseTime: 0,
    userSatisfaction: 0,
    activeUsers: 0,
    resolvedQueries: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de estatísticas da LIA
    const loadStats = async () => {
      try {
        // Aqui seria a chamada real para a API
        // const response = await fetch('/api/admin/lia/stats');
        // const data = await response.json();
        
        // Dados simulados para demonstração
        setTimeout(() => {
          setStats({
            totalConversations: 1247,
            totalMessages: 8934,
            averageResponseTime: 1.2,
            userSatisfaction: 94.5,
            activeUsers: 23,
            resolvedQueries: 1156
          });
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erro ao carregar estatísticas da LIA:', error);
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, description, color = 'purple' }: {
    title: string;
    value: string | number;
    icon: any;
    description: string;
    color?: string;
  }) => {
    const colorClasses = {
      purple: 'border-purple-200 bg-purple-50 text-purple-700',
      blue: 'border-blue-200 bg-blue-50 text-blue-700',
      indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
      violet: 'border-violet-200 bg-violet-50 text-violet-700'
    };

    return (
      <Card className={`${colorClasses[color as keyof typeof colorClasses]} border-2`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs opacity-70">{description}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/ia')}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para IA
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-purple-800">LIA - Atendente Virtual</h1>
            <p className="text-purple-600">Assistente inteligente para atendimento ao cliente</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Online
          </Badge>
        </div>
      </div>

      <Separator className="bg-purple-200" />

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Conversas Totais"
          value={isLoading ? '...' : stats.totalConversations.toLocaleString()}
          icon={MessageSquare}
          description="Total de conversas iniciadas"
          color="purple"
        />
        <StatCard
          title="Mensagens Enviadas"
          value={isLoading ? '...' : stats.totalMessages.toLocaleString()}
          icon={Bot}
          description="Mensagens processadas pela LIA"
          color="blue"
        />
        <StatCard
          title="Tempo de Resposta"
          value={isLoading ? '...' : `${stats.averageResponseTime}s`}
          icon={Clock}
          description="Tempo médio de resposta"
          color="indigo"
        />
        <StatCard
          title="Satisfação do Usuário"
          value={isLoading ? '...' : `${stats.userSatisfaction}%`}
          icon={Heart}
          description="Avaliação média dos usuários"
          color="violet"
        />
        <StatCard
          title="Usuários Ativos"
          value={isLoading ? '...' : stats.activeUsers}
          icon={Users}
          description="Usuários ativos no momento"
          color="purple"
        />
        <StatCard
          title="Consultas Resolvidas"
          value={isLoading ? '...' : stats.resolvedQueries.toLocaleString()}
          icon={Zap}
          description="Consultas resolvidas com sucesso"
          color="blue"
        />
      </div>

      {/* Ações Rápidas */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-800">Ações Rápidas</CardTitle>
          <CardDescription className="text-purple-600">
            Gerencie e configure a LIA - Atendente Virtual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/admin/ia/lia/configuracoes">
              <Button 
                variant="outline" 
                className="w-full h-20 flex flex-col items-center justify-center space-y-2 border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <Settings className="h-6 w-6" />
                <span>Configurações da LIA</span>
              </Button>
            </Link>
            
            <Link href="/admin/prompts">
              <Button 
                variant="outline" 
                className="w-full h-20 flex flex-col items-center justify-center space-y-2 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <MessageSquare className="h-6 w-6" />
                <span>Gerenciar Prompts</span>
              </Button>
            </Link>
            
            <Link href="/admin/ia">
              <Button 
                variant="outline" 
                className="w-full h-20 flex flex-col items-center justify-center space-y-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <Bot className="h-6 w-6" />
                <span>Painel de IA</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Informações da LIA */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-800 flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>Sobre a LIA</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold text-purple-700 mb-2">Funcionalidades Principais</h4>
              <ul className="text-sm text-purple-600 space-y-1">
                <li>• Atendimento automatizado 24/7</li>
                <li>• Respostas personalizadas por contexto</li>
                <li>• Integração com WhatsApp</li>
                <li>• Transferência inteligente para o Zé da Obra</li>
                <li>• Acompanhamento de pedidos</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-purple-700 mb-2">Capacidades</h4>
              <ul className="text-sm text-purple-600 space-y-1">
                <li>• Processamento de linguagem natural</li>
                <li>• Aprendizado contínuo</li>
                <li>• Análise de sentimentos</li>
                <li>• Suporte multilíngue</li>
                <li>• Relatórios de performance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}