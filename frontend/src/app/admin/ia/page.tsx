'use client';

// Página de gerenciamento de IA - Zé da Obra e LIA
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bot, 
  MessageSquare, 
  Calculator, 
  TrendingUp, 
  Settings, 
  RefreshCw,
  MessageCircle,
  Send,
  Clock,
  Heart,
  User,
  Wrench,
  Zap,
  HelpCircle,
  BarChart3
} from 'lucide-react';

interface ChatStats {
  totalConversations: number;
  totalMessages: number;
  averageResponseTime: number;
  topQuestions: Array<{ question: string; count: number }>;
  userSatisfaction: number;
}

interface AIConfig {
  maxTokens: number;
  temperature: number;
  model: string;
  responseTimeout: number;
  enableRecommendations: boolean;
  enableCalculator: boolean;
}

export default function IAPage() {
  const [stats, setStats] = useState<ChatStats>({
    totalConversations: 0,
    totalMessages: 0,
    averageResponseTime: 0,
    topQuestions: [],
    userSatisfaction: 0
  });
  
  const [config, setConfig] = useState<AIConfig>({
    maxTokens: 1000,
    temperature: 0.7,
    model: 'gpt-3.5-turbo',
    responseTimeout: 30,
    enableRecommendations: true,
    enableCalculator: true
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStats();
    loadConfig();
  }, []);

  const loadStats = async () => {
    try {
      // Simulando dados de estatísticas
      setStats({
        totalConversations: 1247,
        totalMessages: 8934,
        averageResponseTime: 1.2,
        topQuestions: [
          { question: "Como calcular materiais para uma casa?", count: 156 },
          { question: "Qual o melhor cimento?", count: 134 },
          { question: "Quanto custa uma reforma?", count: 98 },
          { question: "Dicas para construir um muro", count: 87 },
          { question: "Materiais para piso", count: 76 }
        ],
        userSatisfaction: 4.6
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      // Em produção, carregar configurações da API
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      // Em produção, salvar configurações na API
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Gerenciamento de IA</h1>
          <p className="text-gray-600">Gerenciamento e configurações dos assistentes de IA</p>
        </div>

        {/* Seção Zé da Obra */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3">
              <Wrench className="h-8 w-8 text-white" />
              <h2 className="text-2xl font-bold text-white">Zé da Obra 2.0</h2>
            </div>
            <p className="text-orange-100 mt-2">Assistente especializado em construção e materiais</p>
          </div>

          {/* Estatísticas Zé da Obra */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversas Hoje</p>
                  <p className="text-2xl font-bold text-gray-900">127</p>
                </div>
                <MessageCircle className="h-8 w-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mensagens</p>
                  <p className="text-2xl font-bold text-gray-900">1,234</p>
                </div>
                <Send className="h-8 w-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tempo Resposta</p>
                  <p className="text-2xl font-bold text-gray-900">1.2s</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Satisfação</p>
                  <p className="text-2xl font-bold text-gray-900">94%</p>
                </div>
                <Heart className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Seção LIA */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8 text-white" />
              <h2 className="text-2xl font-bold text-white">LIA - Atendente Virtual</h2>
            </div>
            <p className="text-purple-100 mt-2">Assistente de atendimento ao cliente e vendas</p>
          </div>

          {/* Estatísticas LIA */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Atendimentos Hoje</p>
                  <p className="text-2xl font-bold text-gray-900">89</p>
                </div>
                <MessageCircle className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mensagens</p>
                  <p className="text-2xl font-bold text-gray-900">756</p>
                </div>
                <Send className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tempo Resposta</p>
                  <p className="text-2xl font-bold text-gray-900">0.8s</p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Satisfação</p>
                  <p className="text-2xl font-bold text-gray-900">96%</p>
                </div>
                <Heart className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Ações Rápidas LIA */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Zap className="h-5 w-5 text-purple-500 mr-2" />
              Ações Rápidas - LIA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/admin/ia/lia" className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <User className="h-5 w-5 text-purple-500 mr-3" />
                <span className="text-gray-700">Painel da LIA</span>
              </Link>
              <Link href="/admin/ia/lia/configuracoes" className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <Settings className="h-5 w-5 text-purple-500 mr-3" />
                <span className="text-gray-700">Configurações</span>
              </Link>
              <button className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <BarChart3 className="h-5 w-5 text-purple-500 mr-3" />
                <span className="text-gray-700">Relatórios</span>
              </button>
            </div>
          </div>
        </div>

        {/* Perguntas Frequentes e Configurações */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <HelpCircle className="h-5 w-5 text-orange-500 mr-2" />
              Perguntas Frequentes - Zé da Obra
            </h3>
            <div className="space-y-4">
              {stats.topQuestions.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">
                      {index + 1}
                    </span>
                    <span className="text-gray-900">{item.question}</span>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Configurações de IA - Zé da Obra */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Settings className="h-5 w-5 text-orange-500 mr-2" />
              Configurações de IA - Zé da Obra
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo de IA
                </label>
                <select
                  value={config.model}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="local-model">Modelo Local</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Máximo de Tokens: {config.maxTokens}
                </label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  value={config.maxTokens}
                  onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperatura (Criatividade): {config.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeout de Resposta (segundos)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={config.responseTimeout}
                  onChange={(e) => setConfig({ ...config, responseTimeout: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="recommendations"
                    checked={config.enableRecommendations}
                    onChange={(e) => setConfig({ ...config, enableRecommendations: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="recommendations" className="text-sm text-gray-700">
                    Habilitar recomendações de produtos
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="calculator"
                    checked={config.enableCalculator}
                    onChange={(e) => setConfig({ ...config, enableCalculator: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="calculator" className="text-sm text-gray-700">
                    Habilitar calculadora de materiais
                  </label>
                </div>
              </div>

              <button
                onClick={saveConfig}
                disabled={saving}
                className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </div>
        </div>

        {/* Ações Rápidas - Zé da Obra */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Zap className="h-5 w-5 text-orange-500 mr-2" />
            Ações Rápidas - Zé da Obra
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded hover:bg-gray-50 transition">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <p className="font-medium">Reiniciar IA</p>
                <p className="text-sm text-gray-600">Reinicia o serviço de IA</p>
              </div>
            </button>

            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded hover:bg-gray-50 transition">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <p className="font-medium">Limpar Conversas</p>
                <p className="text-sm text-gray-600">Remove conversas antigas</p>
              </div>
            </button>

            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded hover:bg-gray-50 transition">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div className="text-left">
                <p className="font-medium">Gerar Relatório</p>
                <p className="text-sm text-gray-600">Relatório de performance</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
