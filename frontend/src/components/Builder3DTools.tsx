'use client';

import React, { useState, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Ruler,
  Square,
  Circle,
  Triangle,
  Pen,
  Eraser,
  Move,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Layers,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Undo,
  Redo,
  Save,
  Settings
} from 'lucide-react';

interface DrawingTool {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  type: 'line' | 'rectangle' | 'circle' | 'polygon' | 'freehand';
  cursor: string;
}

interface MeasurementPoint {
  id: string;
  position: THREE.Vector3;
  label?: string;
}

interface Measurement {
  id: string;
  type: 'distance' | 'area' | 'angle' | 'volume';
  points: MeasurementPoint[];
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

interface Builder3DToolsProps {
  scene: THREE.Scene | null;
  camera: THREE.Camera | null;
  onMeasurementChange?: (measurements: Measurement[]) => void;
  onDrawingChange?: (drawings: DrawingElement[]) => void;
  className?: string;
}

const Builder3DTools: React.FC<Builder3DToolsProps> = ({
  scene,
  camera,
  onMeasurementChange,
  onDrawingChange,
  className = ''
}) => {
  const [activeMode, setActiveMode] = useState<'select' | 'draw' | 'measure'>('select');
  const [selectedTool, setSelectedTool] = useState<DrawingTool | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [drawings, setDrawings] = useState<DrawingElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<THREE.Vector3[]>([]);
  const [measurementMode, setMeasurementMode] = useState<'distance' | 'area' | 'angle' | 'volume'>('distance');
  const [gridSize, setGridSize] = useState(1);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [showDrawings, setShowDrawings] = useState(true);

  const drawingTools: DrawingTool[] = [
    {
      id: 'line',
      name: 'Linha',
      icon: Pen,
      type: 'line',
      cursor: 'crosshair'
    },
    {
      id: 'rectangle',
      name: 'Retângulo',
      icon: Square,
      type: 'rectangle',
      cursor: 'crosshair'
    },
    {
      id: 'circle',
      name: 'Círculo',
      icon: Circle,
      type: 'circle',
      cursor: 'crosshair'
    },
    {
      id: 'polygon',
      name: 'Polígono',
      icon: Triangle,
      type: 'polygon',
      cursor: 'crosshair'
    },
    {
      id: 'freehand',
      name: 'Mão Livre',
      icon: Pen,
      type: 'freehand',
      cursor: 'crosshair'
    }
  ];

  // Função para calcular distância entre dois pontos
  const calculateDistance = useCallback((point1: THREE.Vector3, point2: THREE.Vector3): number => {
    return point1.distanceTo(point2);
  }, []);

  // Função para calcular área de um polígono
  const calculateArea = useCallback((points: THREE.Vector3[]): number => {
    if (points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].z - points[j].x * points[i].z;
    }
    return Math.abs(area) / 2;
  }, []);

  // Função para calcular ângulo entre três pontos
  const calculateAngle = useCallback((point1: THREE.Vector3, vertex: THREE.Vector3, point2: THREE.Vector3): number => {
    const v1 = new THREE.Vector3().subVectors(point1, vertex).normalize();
    const v2 = new THREE.Vector3().subVectors(point2, vertex).normalize();
    return Math.acos(v1.dot(v2)) * (180 / Math.PI);
  }, []);

  // Função para snap to grid
  const snapToGridPoint = useCallback((point: THREE.Vector3): THREE.Vector3 => {
    if (!snapToGrid) return point;
    
    return new THREE.Vector3(
      Math.round(point.x / gridSize) * gridSize,
      Math.round(point.y / gridSize) * gridSize,
      Math.round(point.z / gridSize) * gridSize
    );
  }, [snapToGrid, gridSize]);

  // Adicionar medição
  const addMeasurement = useCallback((points: THREE.Vector3[], type: 'distance' | 'area' | 'angle' | 'volume') => {
    let value = 0;
    let unit = 'm';
    let label = '';

    switch (type) {
      case 'distance':
        if (points.length >= 2) {
          value = calculateDistance(points[0], points[1]);
          label = `Distância: ${value.toFixed(2)}${unit}`;
        }
        break;
      case 'area':
        if (points.length >= 3) {
          value = calculateArea(points);
          unit = 'm²';
          label = `Área: ${value.toFixed(2)}${unit}`;
        }
        break;
      case 'angle':
        if (points.length >= 3) {
          value = calculateAngle(points[0], points[1], points[2]);
          unit = '°';
          label = `Ângulo: ${value.toFixed(1)}${unit}`;
        }
        break;
      case 'volume':
        // Implementação simplificada para volume
        if (points.length >= 4) {
          const area = calculateArea(points.slice(0, 3));
          const height = Math.abs(points[3].y - points[0].y);
          value = area * height;
          unit = 'm³';
          label = `Volume: ${value.toFixed(2)}${unit}`;
        }
        break;
    }

    const newMeasurement: Measurement = {
      id: `measurement-${Date.now()}`,
      type,
      points: points.map((point, index) => ({
        id: `point-${index}`,
        position: point.clone(),
        label: `P${index + 1}`
      })),
      value,
      unit,
      label,
      visible: true
    };

    setMeasurements(prev => {
      const updated = [...prev, newMeasurement];
      onMeasurementChange?.(updated);
      return updated;
    });
  }, [calculateDistance, calculateArea, calculateAngle, onMeasurementChange]);

  // Adicionar desenho
  const addDrawing = useCallback((points: THREE.Vector3[], type: DrawingTool['type']) => {
    const newDrawing: DrawingElement = {
      id: `drawing-${Date.now()}`,
      type,
      points: points.map(p => p.clone()),
      style: {
        color: '#3b82f6',
        thickness: 2,
        opacity: 1,
        dashed: false
      },
      visible: true,
      locked: false
    };

    setDrawings(prev => {
      const updated = [...prev, newDrawing];
      onDrawingChange?.(updated);
      return updated;
    });
  }, [onDrawingChange]);

  // Remover medição
  const removeMeasurement = useCallback((id: string) => {
    setMeasurements(prev => {
      const updated = prev.filter(m => m.id !== id);
      onMeasurementChange?.(updated);
      return updated;
    });
  }, [onMeasurementChange]);

  // Remover desenho
  const removeDrawing = useCallback((id: string) => {
    setDrawings(prev => {
      const updated = prev.filter(d => d.id !== id);
      onDrawingChange?.(updated);
      return updated;
    });
  }, [onDrawingChange]);

  // Toggle visibilidade de medição
  const toggleMeasurementVisibility = useCallback((id: string) => {
    setMeasurements(prev => {
      const updated = prev.map(m => 
        m.id === id ? { ...m, visible: !m.visible } : m
      );
      onMeasurementChange?.(updated);
      return updated;
    });
  }, [onMeasurementChange]);

  // Toggle visibilidade de desenho
  const toggleDrawingVisibility = useCallback((id: string) => {
    setDrawings(prev => {
      const updated = prev.map(d => 
        d.id === id ? { ...d, visible: !d.visible } : d
      );
      onDrawingChange?.(updated);
      return updated;
    });
  }, [onDrawingChange]);

  // Limpar todas as medições
  const clearAllMeasurements = useCallback(() => {
    setMeasurements([]);
    onMeasurementChange?.([]);
  }, [onMeasurementChange]);

  // Limpar todos os desenhos
  const clearAllDrawings = useCallback(() => {
    setDrawings([]);
    onDrawingChange?.([]);
  }, [onDrawingChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Modo de Ferramenta */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Modo de Ferramenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={activeMode === 'select' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveMode('select')}
              className="flex items-center gap-2"
            >
              <Move className="h-4 w-4" />
              Selecionar
            </Button>
            <Button
              variant={activeMode === 'draw' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveMode('draw')}
              className="flex items-center gap-2"
            >
              <Pen className="h-4 w-4" />
              Desenhar
            </Button>
            <Button
              variant={activeMode === 'measure' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveMode('measure')}
              className="flex items-center gap-2"
            >
              <Ruler className="h-4 w-4" />
              Medir
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ferramentas de Desenho */}
      {activeMode === 'draw' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Pen className="h-5 w-5" />
              Ferramentas de Desenho
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {drawingTools.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <Button
                    key={tool.id}
                    variant={selectedTool?.id === tool.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool(tool)}
                    className="flex items-center gap-2"
                  >
                    <IconComponent className="h-4 w-4" />
                    {tool.name}
                  </Button>
                );
              })}
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Snap to Grid</Label>
                <Button
                  variant={snapToGrid ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSnapToGrid(!snapToGrid)}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm">Tamanho do Grid (m)</Label>
                <Input
                  type="number"
                  value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
                  min="0.1"
                  max="10"
                  step="0.1"
                  className="h-8"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ferramentas de Medição */}
      {activeMode === 'measure' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Ferramentas de Medição
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={measurementMode === 'distance' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMeasurementMode('distance')}
              >
                Distância
              </Button>
              <Button
                variant={measurementMode === 'area' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMeasurementMode('area')}
              >
                Área
              </Button>
              <Button
                variant={measurementMode === 'angle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMeasurementMode('angle')}
              >
                Ângulo
              </Button>
              <Button
                variant={measurementMode === 'volume' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMeasurementMode('volume')}
              >
                Volume
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllMeasurements}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMeasurements(!showMeasurements)}
              >
                {showMeasurements ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Medições */}
      {measurements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Medições ({measurements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {measurements.map((measurement) => (
                  <div
                    key={measurement.id}
                    className="flex items-center justify-between p-2 border rounded text-sm"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{measurement.label}</p>
                      <Badge variant="outline" className="text-xs">
                        {measurement.type}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMeasurementVisibility(measurement.id)}
                        className="h-6 w-6 p-0"
                      >
                        {measurement.visible ? 
                          <Eye className="h-3 w-3" /> : 
                          <EyeOff className="h-3 w-3" />
                        }
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMeasurement(measurement.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Lista de Desenhos */}
      {drawings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Pen className="h-5 w-5" />
              Desenhos ({drawings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {drawings.map((drawing) => (
                  <div
                    key={drawing.id}
                    className="flex items-center justify-between p-2 border rounded text-sm"
                  >
                    <div className="flex-1">
                      <p className="font-medium capitalize">{drawing.type}</p>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded border"
                          style={{ backgroundColor: drawing.style.color }}
                        />
                        <Badge variant="outline" className="text-xs">
                          {drawing.points.length} pontos
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleDrawingVisibility(drawing.id)}
                        className="h-6 w-6 p-0"
                      >
                        {drawing.visible ? 
                          <Eye className="h-3 w-3" /> : 
                          <EyeOff className="h-3 w-3" />
                        }
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDrawing(drawing.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="mt-3 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllDrawings}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpar Todos os Desenhos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações Rápidas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm">
              <Undo className="h-4 w-4 mr-1" />
              Desfazer
            </Button>
            <Button variant="outline" size="sm">
              <Redo className="h-4 w-4 mr-1" />
              Refazer
            </Button>
            <Button variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-1" />
              Copiar
            </Button>
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Builder3DTools;