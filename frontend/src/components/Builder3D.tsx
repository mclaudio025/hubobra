'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Builder3DTools from './Builder3DTools';
import Builder3DMaterials from './Builder3DMaterials';
import Builder3DCalculator from './Builder3DCalculator';
import {
  Box,
  Move3D,
  RotateCcw,
  Maximize,
  Minimize,
  Grid3X3,
  Ruler,
  Palette,
  Save,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  Layers,
  Circle,
  Square,
  Triangle,
  Hammer,
  Package,
  Calculator
} from 'lucide-react';

interface Material {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  color: string;
  texture: string;
  price: number;
  unit: string;
  coverage: number;
  thickness?: number;
  weight?: number;
  durability: number;
  waterproof: boolean;
  fireResistant: boolean;
  ecoFriendly: boolean;
  image: string;
  description: string;
  specifications: Record<string, any>;
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviews: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  weight: number;
  material: string;
  color: string;
  style: string;
  image: string;
  description: string;
  specifications: Record<string, any>;
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviews: number;
  installation: {
    difficulty: 'easy' | 'medium' | 'hard';
    timeRequired: number;
    toolsRequired: string[];
    instructions: string;
  };
}

interface Measurement {
  id: string;
  type: 'distance' | 'area' | 'angle' | 'volume';
  points: any[];
  value: number;
  unit: string;
  label: string;
  visible: boolean;
}

interface DrawingElement {
  id: string;
  type: 'line' | 'rectangle' | 'circle' | 'polygon' | 'freehand';
  points: THREE.Vector3[];
  style: {
    color: string;
    thickness: number;
    opacity: number;
    dashed?: boolean;
  };
  visible: boolean;
  locked: boolean;
}

interface CalculationItem {
  id: string;
  type: 'material' | 'product';
  item: Material | Product;
  quantity: number;
  area?: number;
  waste: number;
  totalCost: number;
}

interface BuilderObject {
  id: string;
  type: 'wall' | 'floor' | 'ceiling' | 'object';
  geometry: THREE.BufferGeometry;
  material: Material;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  mesh?: THREE.Mesh;
}

interface Builder3DProps {
  onProjectChange?: (project: any) => void;
  initialProject?: any;
  className?: string;
  onMaterialSelect?: (material: Material) => void;
  onProductSelect?: (product: Product) => void;
}

const Builder3D: React.FC<Builder3DProps> = ({
  onProjectChange,
  initialProject,
  className = '',
  onMaterialSelect,
  onProductSelect
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState<'select' | 'wall' | 'floor' | 'object'>('select');
  const [selectedObject, setSelectedObject] = useState<BuilderObject | null>(null);
  const [objects, setObjects] = useState<BuilderObject[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [drawings, setDrawings] = useState<DrawingElement[]>([]);
  const [calculationItems, setCalculationItems] = useState<CalculationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'tools' | 'materials' | 'scene' | 'calculator'>('scene');

  // Materiais disponíveis
  const availableMaterials: Material[] = [
    {
      id: 'ceramic-white',
      name: 'Cerâmica Branca',
      type: 'ceramic',
      color: '#ffffff',
      price: 25.90,
      dimensions: { width: 30, height: 30 }
    },
    {
      id: 'porcelain-gray',
      name: 'Porcelanato Cinza',
      type: 'porcelain',
      color: '#808080',
      price: 45.90,
      dimensions: { width: 60, height: 60 }
    },
    {
      id: 'stone-marble',
      name: 'Mármore Carrara',
      type: 'stone',
      color: '#f8f8ff',
      price: 120.00,
      dimensions: { width: 40, height: 40 }
    },
    {
      id: 'wood-oak',
      name: 'Madeira Carvalho',
      type: 'wood',
      color: '#deb887',
      price: 85.50,
      dimensions: { width: 20, height: 100 }
    }
  ];

  // Inicializar Three.js
  const initThreeJS = useCallback(() => {
    if (!mountRef.current) return;

    // Limpar nós filhos existentes para evitar canvas duplicados
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.set(10, 10, 10);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Transform Controls
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.addEventListener('change', () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    });
    transformControls.addEventListener('dragging-changed', (event) => {
      if (controlsRef.current) {
        controlsRef.current.enabled = !event.value;
      }
    });
    scene.add(transformControls);
    transformControlsRef.current = transformControls;

    // Grid
    const gridHelper = new THREE.GridHelper(20, 20);
    gridHelper.name = 'grid';
    scene.add(gridHelper);

    // Axes Helper
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.name = 'axes';
    scene.add(axesHelper);

    setIsLoading(false);
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    animationIdRef.current = requestAnimationFrame(animate);

    if (controlsRef.current) {
      controlsRef.current.update();
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, []);

  // Handle window resize
  const handleResize = useCallback(() => {
    if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  }, []);

  // Adicionar objeto à cena
  const addObject = useCallback((type: 'wall' | 'floor' | 'object', material: Material) => {
    if (!sceneRef.current) return;

    let geometry: THREE.BufferGeometry;
    
    switch (type) {
      case 'wall':
        geometry = new THREE.BoxGeometry(0.2, 3, 4);
        break;
      case 'floor':
        geometry = new THREE.PlaneGeometry(4, 4);
        break;
      case 'object':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    const threeMaterial = new THREE.MeshLambertMaterial({ color: material.color });
    const mesh = new THREE.Mesh(geometry, threeMaterial);
    
    if (type === 'floor') {
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0;
    } else {
      mesh.position.y = 1.5;
    }
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    const newObject: BuilderObject = {
      id: `${type}-${Date.now()}`,
      type,
      geometry,
      material,
      position: mesh.position.clone(),
      rotation: mesh.rotation.clone(),
      scale: mesh.scale.clone(),
      mesh
    };

    sceneRef.current.add(mesh);
    setObjects(prev => [...prev, newObject]);
    setSelectedObject(newObject);
    
    if (transformControlsRef.current) {
      transformControlsRef.current.attach(mesh);
    }
  }, []);

  // Remover objeto
  const removeObject = useCallback((objectId: string) => {
    if (!sceneRef.current) return;

    const objectToRemove = objects.find(obj => obj.id === objectId);
    if (objectToRemove && objectToRemove.mesh) {
      sceneRef.current.remove(objectToRemove.mesh);
      setObjects(prev => prev.filter(obj => obj.id !== objectId));
      
      if (selectedObject?.id === objectId) {
        setSelectedObject(null);
        if (transformControlsRef.current) {
          transformControlsRef.current.detach();
        }
      }
    }
  }, [objects, selectedObject]);

  // Toggle grid visibility
  const toggleGrid = useCallback(() => {
    if (!sceneRef.current) return;
    
    const grid = sceneRef.current.getObjectByName('grid');
    if (grid) {
      grid.visible = !showGrid;
      setShowGrid(!showGrid);
    }
  }, [showGrid]);

  // Callbacks para ferramentas
  const handleMeasurementChange = useCallback((newMeasurements: Measurement[]) => {
    setMeasurements(newMeasurements);
  }, []);

  const handleDrawingChange = useCallback((newDrawings: DrawingElement[]) => {
    setDrawings(newDrawings);
  }, []);

  const handleCalculationUpdate = useCallback((newItems: CalculationItem[]) => {
    setCalculationItems(newItems);
  }, []);

  // Importar projeto
  const importProject = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target?.result as string);
        
        // Restaurar dados do projeto
        if (projectData.scene) {
          setObjects(projectData.scene.objects || []);
          setShowGrid(projectData.scene.showGrid ?? true);
        }
        
        if (projectData.measurements) {
          setMeasurements(projectData.measurements);
        }
        
        if (projectData.drawings) {
          setDrawings(projectData.drawings);
        }
        
        if (projectData.calculations) {
          setCalculationItems(projectData.calculations);
        }
        
        console.log('Projeto importado com sucesso:', projectData.name);
      } catch (error) {
        console.error('Erro ao importar projeto:', error);
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  }, []);

  const handleMaterialSelect = useCallback((material: Material) => {
    onMaterialSelect?.(material);
    // Adicionar lógica para aplicar material ao objeto selecionado
  }, [onMaterialSelect]);

  const handleProductSelect = useCallback((product: Product) => {
    onProductSelect?.(product);
    // Adicionar lógica para inserir produto na cena
  }, [onProductSelect]);

  // Export project
  const exportProject = useCallback(() => {
    const projectData = {
      id: Date.now().toString(),
      name: `Projeto ${new Date().toLocaleDateString('pt-BR')}`,
      created: new Date().toISOString(),
      scene: {
        objects: objects.map(obj => ({
          id: obj.id,
          type: obj.type,
          material: obj.material,
          position: obj.position.toArray(),
          rotation: obj.rotation.toArray(),
          scale: obj.scale.toArray()
        })),
        showGrid: showGrid
      },
      measurements,
      drawings,
      calculations: calculationItems,
      metadata: {
        version: '1.0',
        software: 'Builder3D',
        totalCost: calculationItems.reduce((sum, item) => sum + item.totalCost, 0)
      }
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projeto-builder3d-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [objects, measurements, drawings, calculationItems, showGrid]);

  // Effects
  useEffect(() => {
    initThreeJS();
    animate();

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
      
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [initThreeJS, animate, handleResize]);

  return (
    <div className={`flex h-screen bg-gray-50 ${className}`}>
      {/* Toolbar Lateral */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Tabs de Navegação */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 m-4 mb-2">
            <TabsTrigger value="scene" className="flex items-center gap-1">
              <Box className="h-4 w-4" />
              Cena
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-1">
              <Hammer className="h-4 w-4" />
              Ferramentas
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              Materiais
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-1">
              <Calculator className="h-4 w-4" />
              Cálculos ({calculationItems.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="scene" className="flex-1 px-4 pb-4">
            {/* Ferramentas de Cena */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  Objetos da Cena
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Button
                    variant={selectedTool === 'select' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('select')}
                    className="flex items-center gap-2"
                  >
                    <Move3D className="h-4 w-4" />
                    Selecionar
                  </Button>
                  <Button
                    variant={selectedTool === 'wall' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('wall')}
                    className="flex items-center gap-2"
                  >
                    <Square className="h-4 w-4" />
                    Parede
                  </Button>
                  <Button
                    variant={selectedTool === 'floor' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('floor')}
                    className="flex items-center gap-2"
                  >
                    <Box className="h-4 w-4" />
                    Piso
                  </Button>
                  <Button
                    variant={selectedTool === 'object' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('object')}
                    className="flex items-center gap-2"
                  >
                    <Box className="h-4 w-4" />
                    Objeto
                  </Button>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleGrid}
                    className="flex items-center gap-1"
                  >
                    {showGrid ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    Grid
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Ruler className="h-4 w-4" />
                    Medir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportProject}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Objetos */}
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Objetos ({objects.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {objects.map((object) => (
                      <div
                        key={object.id}
                        className={`flex items-center justify-between p-2 rounded text-sm ${
                          selectedObject?.id === object.id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex-1 truncate">
                          {object.type} - {object.material.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeObject(object.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {objects.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Nenhum objeto adicionado
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Resumo de Cálculos */}
            {calculationItems.length > 0 && (
              <Card className="mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Resumo de Custos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Itens:</span>
                      <span>{calculationItems.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total:</span>
                      <span className="font-bold">
                        R$ {calculationItems.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="tools" className="flex-1 px-4 pb-4">
            <Builder3DTools
              scene={sceneRef.current}
              camera={cameraRef.current}
              onMeasurementChange={handleMeasurementChange}
              onDrawingChange={handleDrawingChange}
            />
          </TabsContent>
          
          <TabsContent value="materials" className="flex-1 px-4 pb-4">
            <Builder3DMaterials
              onMaterialSelect={handleMaterialSelect}
              onProductSelect={handleProductSelect}
              onCalculationUpdate={handleCalculationUpdate}
            />
          </TabsContent>
          
          <TabsContent value="calculator" className="flex-1 px-4 pb-4">
             <Builder3DCalculator
               items={calculationItems}
               onItemsChange={setCalculationItems}
               onExportCalculation={(calculation) => {
                 console.log('Cálculo exportado:', calculation);
               }}
             />
           </TabsContent>
        </Tabs>

        {/* Ações Globais */}
        <Card className="m-4 mt-2">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-1" />
                Desfazer
              </Button>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-1" />
                Refazer
              </Button>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-1" />
                Salvar
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={importProject}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="import-project"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  asChild
                >
                  <label htmlFor="import-project" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-1" />
                    Importar
                  </label>
                </Button>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportProject}
              >
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Área de Visualização 3D */}
      <div className="flex-1 relative">
        <div ref={mountRef} className="w-full h-full" />
        
        {/* Controles de Visualização */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>

        {/* Status Bar */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Objetos: {objects.length}
              </Badge>
              <Badge variant="outline">
                Ferramenta: {selectedTool}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-1" />
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Builder3D;