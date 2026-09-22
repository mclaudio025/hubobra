'use client';

import { useState, useEffect } from 'react';
import { 
  Bot, 
  Settings, 
  Save, 
  RefreshCw, 
  Key, 
  Sliders, 
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface AISettings {
  ai_provider: 'openai' | 'gemini' | 'anthropic';
  openai_api_key: string;
  gemini_api_key: string;
  ai_model: string;
  ai_temperature: number;
  ai_max_tokens: number;
  system_prompt: string;
  whatsapp_enabled: boolean;
  whatsapp_api_url: string;
  whatsapp_api_token: string;
  whatsapp_welcome_message: string;
}

export default function IAConfiguracoes() {
  const [settings, setSettings] = useState<AISettings>({
    ai_provider: 'openai',
    openai_api_key: '',
    gemini_api_key: '',
    ai_model: 'gpt-3.5-turbo',
    ai_temperature: 0.7,
    ai_max_tokens: 1000,
    system_prompt: '',
    whatsapp_enabled: false,
    whatsapp_api_url: '',
    whatsapp_api_token: '',
    whatsapp_welcome_message: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings?category=AI');
      
      if (response.ok) {
        const data = await response.json();
        const settingsMap: any = {};
        
        data.forEach((setting: any) => {
          settingsMap[setting.key] = setting.value;
        });
        
        setSettings(prev => ({ ...prev, ...settingsMap }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: typeof value === 'boolean' ? value.toString() : value.toString()
      }));

      const response = await fetch('/api/settings/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: updates }),
      });

      if (response.ok) {
        setTestResult({ success: true, message: 'Configurações salvas com sucesso!' });
        setTimeout(() => setTestResult(null), 3000);
      } else {
        throw new Error('Erro ao salvar configurações');
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Erro ao salvar configurações' });
      setTimeout(() => setTestResult(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      
      const response = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: settings.ai_provider,
          api_key: settings.ai_provider === 'openai' ? settings.openai_api_key : settings.gemini_api_key,
          model: settings.ai_model
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult({ success: true, message: 'Conexão com IA funcionando!' });
      } else {
        setTestResult({ success: false, message: 'Erro na conexão com IA' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Erro ao testar conexão' });
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      ai_provider: 'openai',
      openai_api_key: '',
      gemini_api_key: '',
      ai_model: 'gpt-3.5-turbo',
      ai_temperature: 0.7,
      ai_max_tokens: 1000,
      system_prompt: `Você é o Zé da Obra 2.0, um assistente especializado em materiais de construção e reformas. Você trabalha para uma loja de materiais de construção e deve:

1. Ser sempre prestativo e educado
2. Fornecer informações técnicas precisas sobre materiais de construção
3. Ajudar com cálculos de materiais para projetos
4. Recomendar produtos da loja quando apropriado
5. Dar dicas práticas de construção e reforma
6. Manter um tom amigável e profissional
7. Sempre priorizar a segurança nas recomendações

Quando não souber algo específico, seja honesto e sugira que o cliente consulte um profissional qualificado.`,
      whatsapp_enabled: false,
      whatsapp_api_url: '',
      whatsapp_api_token: '',
      whatsapp_welcome_message: 'Olá! Sou o Zé da Obra 2.0, seu assistente especializado em materiais de construção!'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-orange-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configurações de IA</h1>
              <p className="text-gray-600">Configure o comportamento do assistente Zé da Obra 2.0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={testConnection}
              disabled={testing}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Bot className="h-4 w-4" />
              {testing ? 'Testando...' : 'Testar IA'}
            </button>
            
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>

        {/* Alert de resultado */}
        {testResult && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            testResult.success 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {testResult.success ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configurações do Provedor */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              Provedor de IA
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provedor
                </label>
                <select
                  value={settings.ai_provider}
                  onChange={(e) => setSettings({ ...settings, ai_provider: e.target.value as any })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="openai">OpenAI (GPT)</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="anthropic">Anthropic Claude</option>
                </select>
              </div>

              {settings.ai_provider === 'openai' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chave API OpenAI
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKeys ? 'text' : 'password'}
                      value={settings.openai_api_key}
                      onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
                      placeholder="sk-..."
                      className="w-full border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKeys(!showApiKeys)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {settings.ai_provider === 'gemini' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chave API Gemini
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKeys ? 'text' : 'password'}
                      value={settings.gemini_api_key}
                      onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                      placeholder="AIza..."
                      className="w-full border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKeys(!showApiKeys)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo
                </label>
                <select
                  value={settings.ai_model}
                  onChange={(e) => setSettings({ ...settings, ai_model: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {settings.ai_provider === 'openai' && (
                    <>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    </>
                  )}
                  {settings.ai_provider === 'gemini' && (
                    <>
                      <option value="gemini-pro">Gemini Pro</option>
                      <option value="gemini-pro-vision">Gemini Pro Vision</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Parâmetros da IA */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-green-600" />
              Parâmetros
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperatura: {settings.ai_temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.ai_temperature}
                  onChange={(e) => setSettings({ ...settings, ai_temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Mais preciso</span>
                  <span>Mais criativo</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Máximo de Tokens
                </label>
                <input
                  type="number"
                  min="100"
                  max="4000"
                  value={settings.ai_max_tokens}
                  onChange={(e) => setSettings({ ...settings, ai_max_tokens: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Controla o tamanho máximo das respostas
                </p>
              </div>
            </div>
          </div>

          {/* Prompt do Sistema */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Prompt do Sistema
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instruções para o assistente
              </label>
              <textarea
                value={settings.system_prompt}
                onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
                rows={10}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Digite as instruções que definem o comportamento do assistente..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Este prompt define como o assistente deve se comportar e responder
              </p>
            </div>
          </div>

          {/* Configurações WhatsApp */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              Integração WhatsApp
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="whatsapp_enabled"
                  checked={settings.whatsapp_enabled}
                  onChange={(e) => setSettings({ ...settings, whatsapp_enabled: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="whatsapp_enabled" className="text-sm text-gray-700">
                  Habilitar integração com WhatsApp
                </label>
              </div>

              {settings.whatsapp_enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL da API WhatsApp
                    </label>
                    <input
                      type="url"
                      value={settings.whatsapp_api_url}
                      onChange={(e) => setSettings({ ...settings, whatsapp_api_url: e.target.value })}
                      placeholder="https://api.whatsapp.com/..."
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Token da API
                    </label>
                    <input
                      type="password"
                      value={settings.whatsapp_api_token}
                      onChange={(e) => setSettings({ ...settings, whatsapp_api_token: e.target.value })}
                      placeholder="Token de acesso..."
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensagem de Boas-vindas
                    </label>
                    <textarea
                      value={settings.whatsapp_welcome_message}
                      onChange={(e) => setSettings({ ...settings, whatsapp_welcome_message: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Mensagem enviada quando o usuário inicia uma conversa..."
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={resetToDefaults}
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition"
          >
            Restaurar Padrões
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={testConnection}
              disabled={testing}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {testing ? 'Testando...' : 'Testar Conexão'}
            </button>
            
            <button
              onClick={saveSettings}
              disabled={saving}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
