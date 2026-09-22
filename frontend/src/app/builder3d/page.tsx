'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  Save, 
  Download, 
  Share2, 
  Settings, 
  Layers, 
  Ruler, 
  Palette, 
  Calculator, 
  Eye, 
  Grid3X3, 
  Box,
  Home,
  Building,
  Hammer,
  Lightbulb,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move3D,
  MousePointer,
  Square,
  Circle,
  Triangle,
  Cube,
  Cylinder,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import Builder3D from '@/components/Builder3D'
import GamificationStatus from '@/components/GamificationStatus'

interface Project {
  id: string
  name: string
  description: string
  thumbnail: string
  lastModified: string
  status: 'draft' | 'in_progress' | 'completed'
  area: number
  estimatedCost: number
}

interface Template {
  id: string
  name: string
  category: string
  thumbnail: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export default function Builder3DPage() {
  const defaultProject: Project = {
    id: '1',
    name: 'Casa Moderna 120m²',
    description: 'Projeto residencial com 3 quartos',
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    lastModified: '2026-09-20',
    status: 'in_progress',
    area: 120,
    estimatedCost: 85000
  };

  const [activeProject, setActiveProject] = useState<Project | null>(defaultProject)
  const [projects, setProjects] = useState<Project[]>([defaultProject])
  const [templates, setTemplates] = useState<Template[]>([])
  const [activeTab, setActiveTab] = useState('workspace')
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d')
  const [selectedTool, setSelectedTool] = useState('select')

  useEffect(() => {
    setProjects([
      defaultProject,
      {
        id: '2',
        name: 'Reforma Cozinha & Varanda Gourmet',
        description: 'Modernização com porcelanatos e bancada',
        thumbnail: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
        lastModified: '2026-09-18',
        status: 'draft',
        area: 25,
        estimatedCost: 18000
      }
    ]);

    setTemplates([
      {
        id: 't1',
        name: 'Casa Térrea Básica',
        category: 'Residencial',
        thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        description: 'Template para casa térrea de 2-3 quartos',
        difficulty: 'beginner'
      },
      {
        id: 't2',
        name: 'Apartamento Compacto',
        category: 'Residencial',
        thumbnail: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
        description: 'Layout otimizado para apartamentos pequenos',
        difficulty: 'intermediate'
      },
      {
        id: 't3',
        name: 'Loja Comercial & Galpão',
        category: 'Comercial',
        thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
        description: 'Template para estabelecimentos comerciais',
        difficulty: 'advanced'
      }
    ]);
  }, [])

  const handleNewProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: 'Novo Projeto',
      description: 'Descrição do projeto',
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=empty%20blueprint%20template%20grid&image_size=square',
      lastModified: new Date().toISOString().split('T')[0],
      status: 'draft',
      area: 0,
      estimatedCost: 0
    }
    setActiveProject(newProject)
    setActiveTab('workspace')
  }

  const handleOpenProject = (project: Project) => {
    setActiveProject(project)
    setActiveTab('workspace')
  }

  const handleUseTemplate = (template: Template) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: `Projeto baseado em ${template.name}`,
      description: template.description,
      thumbnail: template.thumbnail,
      lastModified: new Date().toISOString().split('T')[0],
      status: 'draft',
      area: 0,
      estimatedCost: 0
    }
    setActiveProject(newProject)
    setActiveTab('workspace')
  }

  const tools = [
    { id: 'select', icon: MousePointer, label: 'Selecionar' },
    { id: 'move', icon: Move3D, label: 'Mover' },
    { id: 'wall', icon: Square, label: 'Parede' },
    { id: 'door', icon: Square, label: 'Porta' },
    { id: 'window', icon: Square, label: 'Janela' },
    { id: 'room', icon: Box, label: 'Ambiente' },
    { id: 'measure', icon: Ruler, label: 'Medir' },
    { id: 'text', icon: FileText, label: 'Texto' }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Box className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg font-medium text-gray-700">Carregando Builder 3D...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
                <span>Voltar</span>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <Box className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Builder 3D</h1>
                <Badge variant="secondary">Beta</Badge>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {activeProject && (
                <>
                  <Button variant="outline" size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="workspace" className="flex items-center space-x-2">
              <Box className="h-4 w-4" />
              <span>Workspace</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center space-x-2">
              <Layers className="h-4 w-4" />
              <span>Meus Projetos</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center space-x-2">
              <Grid3X3 className="h-4 w-4" />
              <span>Templates</span>
            </TabsTrigger>
            <TabsTrigger value="learn" className="flex items-center space-x-2">
              <Lightbulb className="h-4 w-4" />
              <span>Aprender</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workspace" className="space-y-6">
            {activeProject ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Toolbar */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Ferramentas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        {tools.map((tool) => (
                          <Button
                            key={tool.id}
                            variant={selectedTool === tool.id ? "default" : "outline"}
                            size="sm"
                            className="flex flex-col items-center p-3 h-auto"
                            onClick={() => setSelectedTool(tool.id)}
                          >
                            <tool.icon className="h-4 w-4 mb-1" />
                            <span className="text-xs">{tool.label}</span>
                          </Button>
                        ))}
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Modo de Visualização</Label>
                        <Select value={viewMode} onValueChange={(value: '2d' | '3d') => setViewMode(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2d">2D - Planta Baixa</SelectItem>
                            <SelectItem value="3d">3D - Visualização</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Controles</Label>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm">
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <ZoomOut className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Projeto Atual</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Label className="text-xs text-gray-500">Nome</Label>
                        <p className="text-sm font-medium">{activeProject.name}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Área</Label>
                        <p className="text-sm">{activeProject.area}m²</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Custo Estimado</Label>
                        <p className="text-sm">R$ {activeProject.estimatedCost.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Status</Label>
                        <Badge variant={activeProject.status === 'completed' ? 'default' : 'secondary'}>
                          {activeProject.status === 'draft' && 'Rascunho'}
                          {activeProject.status === 'in_progress' && 'Em Progresso'}
                          {activeProject.status === 'completed' && 'Concluído'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Canvas Principal */}
                <div className="lg:col-span-2">
                  <Card className="h-[600px]">
                    <CardContent className="p-0 h-full">
                      <Builder3D 
                        viewMode={viewMode}
                        selectedTool={selectedTool}
                        onToolChange={setSelectedTool}
                        project={activeProject}
                        onProjectUpdate={setActiveProject}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Painel Lateral */}
                <div className="lg:col-span-1 space-y-4">
                  <GamificationStatus variant="compact" />
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Materiais</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-32">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Tijolos</span>
                            <span>1.200 un</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Cimento</span>
                            <span>15 sacos</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Areia</span>
                            <span>3m³</span>
                          </div>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Camadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Eye className="h-4 w-4" />
                            <span className="text-sm">Estrutura</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Eye className="h-4 w-4" />
                            <span className="text-sm">Elétrica</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Eye className="h-4 w-4" />
                            <span className="text-sm">Hidráulica</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Box className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum projeto aberto</h3>
                <p className="text-gray-500 mb-6">Crie um novo projeto ou abra um existente para começar</p>
                <div className="flex justify-center space-x-4">
                  <Button onClick={handleNewProject}>
                    <Box className="h-4 w-4 mr-2" />
                    Novo Projeto
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('projects')}>
                    <Layers className="h-4 w-4 mr-2" />
                    Meus Projetos
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Meus Projetos</h2>
                <p className="text-gray-500">Gerencie seus projetos de construção</p>
              </div>
              <Button onClick={handleNewProject}>
                <Box className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleOpenProject(project)}>
                  <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                    <img 
                      src={project.thumbnail} 
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                        {project.status === 'draft' && 'Rascunho'}
                        {project.status === 'in_progress' && 'Em Progresso'}
                        {project.status === 'completed' && 'Concluído'}
                      </Badge>
                    </div>
                    <CardDescription>{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Área:</span>
                        <p className="font-medium">{project.area}m²</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Custo:</span>
                        <p className="font-medium">R$ {project.estimatedCost.toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Modificado em {project.lastModified}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Templates</h2>
              <p className="text-gray-500">Comece rapidamente com nossos templates pré-configurados</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                    <img 
                      src={template.thumbnail} 
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Dificuldade:</span>
                        <Badge variant={template.difficulty === 'beginner' ? 'secondary' : 
                                      template.difficulty === 'intermediate' ? 'default' : 'destructive'}>
                          {template.difficulty === 'beginner' && 'Iniciante'}
                          {template.difficulty === 'intermediate' && 'Intermediário'}
                          {template.difficulty === 'advanced' && 'Avançado'}
                        </Badge>
                      </div>
                      <Button size="sm" onClick={() => handleUseTemplate(template)}>
                        Usar Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="learn" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Centro de Aprendizado</h2>
              <p className="text-gray-500">Aprenda a usar o Builder 3D com nossos tutoriais e guias</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Play className="h-5 w-5 text-blue-600" />
                    <span>Tutoriais em Vídeo</span>
                  </CardTitle>
                  <CardDescription>Aprenda com nossos vídeos passo a passo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Primeiros Passos</p>
                      <p className="text-sm text-gray-500">5 min</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Criando sua primeira planta</p>
                      <p className="text-sm text-gray-500">12 min</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Ferramentas avançadas</p>
                      <p className="text-sm text-gray-500">18 min</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                    <span>Dicas e Truques</span>
                  </CardTitle>
                  <CardDescription>Maximize sua produtividade</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="font-medium text-yellow-800">Atalhos de Teclado</p>
                    <p className="text-sm text-yellow-700">Use Ctrl+Z para desfazer e Ctrl+Y para refazer</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-medium text-blue-800">Medições Precisas</p>
                    <p className="text-sm text-blue-700">Clique duas vezes para inserir medidas exatas</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-medium text-green-800">Salvamento Automático</p>
                    <p className="text-sm text-green-700">Seus projetos são salvos automaticamente a cada 30 segundos</p>
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