'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Save, 
  RefreshCw, 
  MessageSquare,
  Clock,
  Heart,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Bot,
  Phone,
  Calendar,
  Smile
} from 'lucide-react';

interface LiaSettings {
  // Personalidade
  personality_tone: 'formal' | 'casual' | 'amigavel';
  personality_style: 'profissional' | 'descontraido' | 'empático';
  
  // Mensagens
  greeting_message: string;
  transfer_message: string;
  unavailable_message: string;
  
  // Horários
  business_hours_enabled: boolean;
  business_start: string;
  business_end: string;
  business_days: string[];
  
  // Mensagens automáticas
  order_confirmation_enabled: boolean;
  order_confirmation_message: string;
  delivery_notification_enabled: boolean;
  delivery_notification_message: string;
  
  // WhatsApp específico da LIA
  whatsapp_lia_enabled: boolean;
  whatsapp_lia_number: string;
  whatsapp_auto_response: boolean;
  whatsapp_response_delay: number;
}

export default function LiaConfiguracoes() {
  const [activeTab, setActiveTab] = useState('personalidade');
  const [settings, setSettings] = useState<LiaSettings>({
    personality_tone: 'amigavel',
    personality_style: 'empático',
    greeting_message: 'Olá! Sou a LIA, sua atendente virtual. Como posso ajudá-lo hoje?',
    transfer_message: 'Vou transferir você para o Zé da Obra, nosso especialista em materiais de construção.',
    unavailable_message: 'No momento estou indisponível. Deixe sua mensagem que retorno assim que possível!',
    business_hours_enabled: true,
    business_start: '08:00',
    business_end: '18:00',
    business_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    order_confirmation_enabled: true,
    order_confirmation_message: 'Seu pedido foi confirmado! Número: {order_number}. Previsão de entrega: {delivery_date}.',
    delivery_notification_enabled: true,
    delivery_notification_message: 'Seu pedido {order_number} está a caminho! Chegará em aproximadamente {estimated_time}.',
    whatsapp_lia_enabled: false,
    whatsapp_lia_number: '',
    whatsapp_auto_response: true,
    whatsapp_response_delay: 2
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings?category=LIA');
      
      if (response.ok) {
        const data = await response.json();
        const settingsMap: any = {};
        
        data.forEach((setting: any) => {
          settingsMap[setting.key] = setting.value;
        });
        
        setSettings(prev => ({ ...prev, ...settingsMap }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações da LIA:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: Array.isArray(value) ? JSON.stringify(value) : value.toString(),
        category: 'LIA'
      }));

      const response = await fetch('/api/settings/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: updates }),
      });

      if (response.ok) {
        setTestResult({ success: true, message: 'Configurações da LIA salvas com sucesso!' });
        setTimeout(() => setTestResult(null), 3000);
      } else {
        throw new Error('Erro ao salvar configurações');
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Erro ao salvar configurações da LIA' });
      setTimeout(() => setTestResult(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      personality_tone: 'amigavel',
      personality_style: 'empático',
      greeting_message: 'Olá! Sou a LIA, sua atendente virtual. Como posso ajudá-lo hoje?',
      transfer_message: 'Vou transferir você para o Zé da Obra, nosso especialista em materiais de construção.',
      unavailable_message: 'No momento estou indisponível. Deixe sua mensagem que retorno assim que possível!',
      business_hours_enabled: true,
      business_start: '08:00',
      business_end: '18:00',
      business_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      order_confirmation_enabled: true,
      order_confirmation_message: 'Seu pedido foi confirmado! Número: {order_number}. Previsão de entrega: {delivery_date}.',
      delivery_notification_enabled: true,
      delivery_notification_message: 'Seu pedido {order_number} está a caminho! Chegará em aproximadamente {estimated_time}.',
      whatsapp_lia_enabled: false,
      whatsapp_lia_number: '',
      whatsapp_auto_response: true,
      whatsapp_response_delay: 2
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Carregando configurações da LIA...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'personalidade', label: 'Personalidade', icon: Smile },
    { id: 'mensagens', label: 'Mensagens', icon: MessageSquare },
    { id: 'horarios', label: 'Horários', icon: Clock },
    { id: 'automaticas', label: 'Automáticas', icon: Bot },
    { id: 'whatsapp', label: 'WhatsApp', icon: Phone }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configurações da LIA</h1>
              <p className="text-gray-600">Configure o comportamento da atendente virtual</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition disabled:opacity-50"
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

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Tab: Personalidade */}
            {activeTab === 'personalidade' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personalidade da LIA</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tom de Voz
                    </label>
                    <select
                      value={settings.personality_tone}
                      onChange={(e) => setSettings({ ...settings, personality_tone: e.target.value as any })}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="formal">Formal</option>
                      <option value="casual">Casual</option>
                      <option value="amigavel">Amigável</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estilo de Atendimento
                    </label>
                    <select
                      value={settings.personality_style}
                      onChange={(e) => setSettings({ ...settings, personality_style: e.target.value as any })}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="profissional">Profissional</option>
                      <option value="descontraido">Descontraído</option>
                      <option value="empático">Empático</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Mensagens */}
            {activeTab === 'mensagens' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mensagens Personalizadas</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem de Saudação
                  </label>
                  <textarea
                    value={settings.greeting_message}
                    onChange={(e) => setSettings({ ...settings, greeting_message: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Mensagem inicial para novos usuários..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem de Transferência
                  </label>
                  <textarea
                    value={settings.transfer_message}
                    onChange={(e) => setSettings({ ...settings, transfer_message: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Mensagem ao transferir para o Zé da Obra..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem de Indisponibilidade
                  </label>
                  <textarea
                    value={settings.unavailable_message}
                    onChange={(e) => setSettings({ ...settings, unavailable_message: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Mensagem quando fora do horário de atendimento..."
                  />
                </div>
              </div>
            )}

            {/* Tab: Horários */}
            {activeTab === 'horarios' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Horários de Atendimento</h3>
                
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="business_hours_enabled"
                    checked={settings.business_hours_enabled}
                    onChange={(e) => setSettings({ ...settings, business_hours_enabled: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="business_hours_enabled" className="text-sm text-gray-700">
                    Habilitar horário de funcionamento
                  </label>
                </div>

                {settings.business_hours_enabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horário de Início
                        </label>
                        <input
                          type="time"
                          value={settings.business_start}
                          onChange={(e) => setSettings({ ...settings, business_start: e.target.value })}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horário de Término
                        </label>
                        <input
                          type="time"
                          value={settings.business_end}
                          onChange={(e) => setSettings({ ...settings, business_end: e.target.value })}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dias de Funcionamento
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { id: 'monday', label: 'Segunda' },
                          { id: 'tuesday', label: 'Terça' },
                          { id: 'wednesday', label: 'Quarta' },
                          { id: 'thursday', label: 'Quinta' },
                          { id: 'friday', label: 'Sexta' },
                          { id: 'saturday', label: 'Sábado' },
                          { id: 'sunday', label: 'Domingo' }
                        ].map((day) => (
                          <label key={day.id} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={settings.business_days.includes(day.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSettings({
                                    ...settings,
                                    business_days: [...settings.business_days, day.id]
                                  });
                                } else {
                                  setSettings({
                                    ...settings,
                                    business_days: settings.business_days.filter(d => d !== day.id)
                                  });
                                }
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">{day.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Tab: Mensagens Automáticas */}
            {activeTab === 'automaticas' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mensagens Automáticas</h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="order_confirmation_enabled"
                        checked={settings.order_confirmation_enabled}
                        onChange={(e) => setSettings({ ...settings, order_confirmation_enabled: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="order_confirmation_enabled" className="text-sm font-medium text-gray-700">
                        Confirmação de Pedidos
                      </label>
                    </div>
                    
                    {settings.order_confirmation_enabled && (
                      <textarea
                        value={settings.order_confirmation_message}
                        onChange={(e) => setSettings({ ...settings, order_confirmation_message: e.target.value })}
                        rows={3}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Use {order_number} e {delivery_date} como variáveis..."
                      />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="delivery_notification_enabled"
                        checked={settings.delivery_notification_enabled}
                        onChange={(e) => setSettings({ ...settings, delivery_notification_enabled: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="delivery_notification_enabled" className="text-sm font-medium text-gray-700">
                        Notificações de Entrega
                      </label>
                    </div>
                    
                    {settings.delivery_notification_enabled && (
                      <textarea
                        value={settings.delivery_notification_message}
                        onChange={(e) => setSettings({ ...settings, delivery_notification_message: e.target.value })}
                        rows={3}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Use {order_number} e {estimated_time} como variáveis..."
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: WhatsApp */}
            {activeTab === 'whatsapp' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações WhatsApp da LIA</h3>
                
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="whatsapp_lia_enabled"
                    checked={settings.whatsapp_lia_enabled}
                    onChange={(e) => setSettings({ ...settings, whatsapp_lia_enabled: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="whatsapp_lia_enabled" className="text-sm text-gray-700">
                    Habilitar LIA no WhatsApp
                  </label>
                </div>

                {settings.whatsapp_lia_enabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número do WhatsApp da LIA
                      </label>
                      <input
                        type="tel"
                        value={settings.whatsapp_lia_number}
                        onChange={(e) => setSettings({ ...settings, whatsapp_lia_number: e.target.value })}
                        placeholder="+55 11 99999-9999"
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="whatsapp_auto_response"
                        checked={settings.whatsapp_auto_response}
                        onChange={(e) => setSettings({ ...settings, whatsapp_auto_response: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="whatsapp_auto_response" className="text-sm text-gray-700">
                        Resposta automática habilitada
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delay de Resposta (segundos): {settings.whatsapp_response_delay}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={settings.whatsapp_response_delay}
                        onChange={(e) => setSettings({ ...settings, whatsapp_response_delay: parseInt(e.target.value) })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Imediato</span>
                        <span>Mais natural</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-between">
          <button
            onClick={resetToDefaults}
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition"
          >
            Restaurar Padrões
          </button>
          
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
}