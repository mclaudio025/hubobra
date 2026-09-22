'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Save, Edit, Eye, TestTube, Copy, User, Wrench, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  category: string;
  active: boolean;
}

export default function PromptsPage() {
  const [liaPrompts, setLiaPrompts] = useState<PromptTemplate[]>([]);
  const [zePrompts, setZePrompts] = useState<PromptTemplate[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});
  const [previewContent, setPreviewContent] = useState('');
  const [activeTab, setActiveTab] = useState('lia');
  const { toast } = useToast();

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const response = await fetch('/api/prompts');
      if (response.ok) {
        const data = await response.json();
        
        // Separar prompts por persona
        const lia = data.filter((p: PromptTemplate) => p.category === 'LIA');
        const ze = data.filter((p: PromptTemplate) => p.category === 'ZE_DA_OBRA');
        
        setLiaPrompts(lia);
        setZePrompts(ze);
        
        // Selecionar primeiro prompt da aba ativa
        if (activeTab === 'lia' && lia.length > 0) {
          setSelectedPrompt(lia[0]);
        } else if (activeTab === 'ze' && ze.length > 0) {
          setSelectedPrompt(ze[0]);
        }
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar prompts',
        variant: 'destructive'
      });
    }
  };

  const savePrompt = async () => {
    if (!selectedPrompt) return;

    try {
      const response = await fetch(`/api/prompts/${selectedPrompt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: selectedPrompt.content })
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Prompt salvo com sucesso!'
        });
        setEditMode(false);
        loadPrompts();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar prompt',
        variant: 'destructive'
      });
    }
  };

  const testPrompt = () => {
    if (!selectedPrompt) return;
    
    let content = selectedPrompt.content;
    
    // Substituir variáveis
    selectedPrompt.variables.forEach(variable => {
      const value = testVariables[variable] || `[${variable}]`;
      const regex = new RegExp(`{{${variable}}}`, 'g');
      content = content.replace(regex, value);
    });
    
    setPreviewContent(content);
  };

  const copyPrompt = () => {
    if (previewContent) {
      navigator.clipboard.writeText(previewContent);
      toast({
        title: 'Copiado!',
        description: 'Prompt copiado para a área de transferência'
      });
    }
  };

  const getCurrentPrompts = () => {
    return activeTab === 'lia' ? liaPrompts : zePrompts;
  };

  const getPersonaInfo = (persona: string) => {
    if (persona === 'lia') {
      return {
        name: 'Lia',
        role: 'Atendente Virtual',
        icon: <User className="w-5 h-5" />,
        color: 'bg-blue-500',
        description: 'Responsável pelo atendimento geral, informações sobre pedidos, entregas e suporte básico.'
      };
    } else {
      return {
        name: 'Zé da Obra',
        role: 'Especialista Técnico',
        icon: <Wrench className="w-5 h-5" />,
        color: 'bg-green-600',
        description: 'Especialista em materiais de construção, cálculos técnicos e recomendações especializadas.'
      };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-orange-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Prompts</h1>
              <p className="text-gray-600">Configure o comportamento das personas de IA</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="lia" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Lia (Atendente)
            </TabsTrigger>
            <TabsTrigger value="ze" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Zé da Obra (Especialista)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lia">
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500 text-white rounded-lg">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Lia - Atendente Virtual</h3>
                  <p className="text-sm text-blue-700">
                    Responsável pelo atendimento geral, informações sobre pedidos, entregas e suporte básico.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ze">
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-600 text-white rounded-lg">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Zé da Obra - Especialista Técnico</h3>
                  <p className="text-sm text-green-700">
                    Especialista em materiais de construção, cálculos técnicos e recomendações especializadas.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Prompts */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getPersonaInfo(activeTab).icon}
                  Prompts - {getPersonaInfo(activeTab).name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getCurrentPrompts().map((prompt) => (
                    <div
                      key={prompt.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedPrompt?.id === prompt.id
                          ? 'bg-orange-100 border border-orange-300'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedPrompt(prompt)}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{prompt.name}</h4>
                        <Badge variant={prompt.active ? 'default' : 'secondary'}>
                          {prompt.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      {prompt.variables.length > 0 && (
                        <div className="mt-1">
                          <div className="flex flex-wrap gap-1">
                            {prompt.variables.map((variable) => (
                              <span
                                key={variable}
                                className="text-xs bg-blue-100 text-blue-800 px-1 rounded"
                              >
                                {variable}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Editor de Prompt */}
          <div className="lg:col-span-2">
            {selectedPrompt ? (
              <div className="space-y-6">
                {/* Informações do Prompt */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{selectedPrompt.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditMode(!editMode)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          {editMode ? 'Cancelar' : 'Editar'}
                        </Button>
                        {editMode && (
                          <Button size="sm" onClick={savePrompt}>
                            <Save className="w-4 h-4 mr-1" />
                            Salvar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editMode ? (
                      <Textarea
                        value={selectedPrompt.content}
                        onChange={(e) =>
                          setSelectedPrompt({
                            ...selectedPrompt,
                            content: e.target.value,
                          })
                        }
                        rows={15}
                        className="font-mono text-sm"
                      />
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm">
                          {selectedPrompt.content}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Teste de Variáveis */}
                {selectedPrompt.variables.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TestTube className="w-5 h-5" />
                        Teste de Variáveis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedPrompt.variables.map((variable) => (
                            <div key={variable}>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {variable}
                              </label>
                              <Input
                                value={testVariables[variable] || ''}
                                onChange={(e) =>
                                  setTestVariables({
                                    ...testVariables,
                                    [variable]: e.target.value,
                                  })
                                }
                                placeholder={`Valor para ${variable}`}
                              />
                            </div>
                          ))}
                        </div>
                        <Button onClick={testPrompt}>
                          <Eye className="w-4 h-4 mr-1" />
                          Visualizar Resultado
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Preview */}
                {previewContent && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Eye className="w-5 h-5" />
                          Preview
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={copyPrompt}>
                          <Copy className="w-4 h-4 mr-1" />
                          Copiar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm text-green-800">
                          {previewContent}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <p className="text-gray-500">
                    Selecione um prompt para editar
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
