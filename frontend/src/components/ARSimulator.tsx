'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useTexture, Html, Environment } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Move, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Home, 
  Maximize2, 
  X, 
  Settings, 
  Download, 
  Share2,
  RefreshCw,
  Grid3X3,
  Sun,
  Moon
} from 'lucide-react';
import { designTokens } from '../styles/design-tokens';
import * as THREE from 'three';

interface ARSimulatorProps {
  productImage: string;
  productName: string;
  productDimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  className?: string;
}

// Componente do produto em AR
function ARProduct({ 
  productImage, 
  position, 
  rotation, 
  scale,
  dimensions 
}: { 
  productImage: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  dimensions?: { width: number; height: number; depth: number };
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(productImage);
  
  const boxSize = dimensions 
    ? [dimensions.width / 100, dimensions.height / 100, dimensions.depth / 100] 
    : [1, 1, 1];

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
      <boxGeometry args={boxSize} />
      <meshStandardMaterial 
        map={texture} 
        transparent
        opacity={0.9}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  );
}

// Ambiente da sala
function RoomEnvironment({ lightingMode }: { lightingMode: 'day' | 'night' }) {
  return (
    <>
      {/* Chão */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial 
          color={lightingMode === 'day' ? '#f5f5f5' : '#2a2a2a'} 
          roughness={0.8}
        />
      </mesh>
      
      {/* Paredes */}
      <mesh position={[0, 0, -10]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial 
          color={lightingMode === 'day' ? '#ffffff' : '#3a3a3a'} 
          roughness={0.9}
        />
      </mesh>
      
      <mesh position={[-10, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial 
          color={lightingMode === 'day' ? '#fafafa' : '#353535'} 
          roughness={0.9}
        />
      </mesh>
      
      {/* Iluminação */}
      <ambientLight intensity={lightingMode === 'day' ? 0.6 : 0.3} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={lightingMode === 'day' ? 1 : 0.5}
        castShadow
      />
      <pointLight 
        position={[0, 5, 0]} 
        intensity={lightingMode === 'day' ? 0.5 : 0.8}
        color={lightingMode === 'day' ? '#ffffff' : '#ffa500'}
      />
    </>
  );
}

// Grid de referência
function ReferenceGrid({ visible }: { visible: boolean }) {
  if (!visible) return null;
  
  return (
    <gridHelper 
      args={[10, 10, '#888888', '#cccccc']} 
      position={[0, -1.99, 0]}
    />
  );
}

// Loading component
function ARLoading() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-pulse">
          <Camera className="h-12 w-12 text-orange-500 mb-4" />
        </div>
        <p className="text-gray-600 text-sm">Iniciando simulador AR...</p>
      </div>
    </Html>
  );
}

export default function ARSimulator({ 
  productImage, 
  productName, 
  productDimensions,
  className = '' 
}: ARSimulatorProps) {
  const [isActive, setIsActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [productPosition, setProductPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [productRotation, setProductRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [productScale, setProductScale] = useState<[number, number, number]>([1, 1, 1]);
  const [lightingMode, setLightingMode] = useState<'day' | 'night'>('day');
  const [showGrid, setShowGrid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const environments = [
    { id: 'living-room', label: 'Sala de Estar', icon: Home },
    { id: 'bedroom', label: 'Quarto', icon: Home },
    { id: 'kitchen', label: 'Cozinha', icon: Home },
    { id: 'office', label: 'Escritório', icon: Home }
  ];

  const startARSimulation = async () => {
    setIsLoading(true);
    
    // Simular inicialização do AR
    setTimeout(() => {
      setIsActive(true);
      setIsLoading(false);
    }, 2000);
  };

  const stopARSimulation = () => {
    setIsActive(false);
    resetProductTransform();
  };

  const resetProductTransform = () => {
    setProductPosition([0, 0, 0]);
    setProductRotation([0, 0, 0]);
    setProductScale([1, 1, 1]);
  };

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    setProductPosition(prev => {
      const newPos = [...prev] as [number, number, number];
      const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
      newPos[axisIndex] = value;
      return newPos;
    });
  };

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    setProductRotation(prev => {
      const newRot = [...prev] as [number, number, number];
      const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
      newRot[axisIndex] = (value * Math.PI) / 180; // Converter para radianos
      return newRot;
    });
  };

  const handleScaleChange = (value: number) => {
    const scale = value / 100;
    setProductScale([scale, scale, scale]);
  };

  const captureARScene = () => {
    // Simular captura de tela
    console.log('Capturando cena AR...');
  };

  const shareARScene = () => {
    // Simular compartilhamento
    console.log('Compartilhando cena AR...');
  };

  if (!isActive && !isLoading) {
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8 text-center ${className}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
            <Camera className="h-10 w-10 text-white" />
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Simulador de Realidade Aumentada
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Visualize como o produto ficará no seu ambiente antes de comprar. 
              Experimente diferentes posições e ângulos.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Move className="h-4 w-4 text-orange-500" />
              <span>Posicionamento</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCw className="h-4 w-4 text-orange-500" />
              <span>Rotação 360°</span>
            </div>
            <div className="flex items-center gap-2">
              <ZoomIn className="h-4 w-4 text-orange-500" />
              <span>Escala ajustável</span>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-orange-500" />
              <span>Iluminação real</span>
            </div>
          </div>
          
          <button
            onClick={startARSimulation}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 font-medium"
          >
            Iniciar Simulação AR
          </button>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`bg-gray-900 rounded-xl h-96 flex items-center justify-center ${className}`}>
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Iniciando simulador AR...</p>
          <p className="text-sm text-gray-400 mt-2">Preparando ambiente virtual</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`relative bg-gray-900 rounded-xl overflow-hidden ${className}`}>
        {/* Header AR */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500 rounded-full text-white text-xs font-medium">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              AR ATIVO
            </div>
            <span className="text-white text-sm">{productName}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
              title="Tela cheia"
            >
              <Maximize2 className="h-4 w-4 text-white" />
            </button>
            
            <button
              onClick={stopARSimulation}
              className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-all"
              title="Parar AR"
            >
              <X className="h-4 w-4 text-red-400" />
            </button>
          </div>
        </div>

        {/* Canvas AR */}
        <div ref={canvasRef} className="h-96 w-full">
          <Canvas
            camera={{ position: [5, 5, 5], fov: 50 }}
            shadows
          >
            <Suspense fallback={<ARLoading />}>
              <RoomEnvironment lightingMode={lightingMode} />
              <ReferenceGrid visible={showGrid} />
              
              <ARProduct
                productImage={productImage}
                position={productPosition}
                rotation={productRotation}
                scale={productScale}
                dimensions={productDimensions}
              />
            </Suspense>
            
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={3}
              maxDistance={15}
            />
          </Canvas>
        </div>

        {/* Controles AR */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className={`p-4 rounded-lg ${designTokens.effects.glassmorphism.base} bg-black/20`}>
            {/* Controles principais */}
            <div className="flex justify-center items-center gap-3 mb-4">
              <button
                onClick={() => setLightingMode(lightingMode === 'day' ? 'night' : 'day')}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                title={`Modo ${lightingMode === 'day' ? 'noturno' : 'diurno'}`}
              >
                {lightingMode === 'day' ? 
                  <Moon className="h-4 w-4 text-white" /> : 
                  <Sun className="h-4 w-4 text-white" />
                }
              </button>
              
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 rounded-lg transition-all ${
                  showGrid 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title="Grid de referência"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              
              <button
                onClick={resetProductTransform}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                title="Resetar posição"
              >
                <RefreshCw className="h-4 w-4 text-white" />
              </button>
              
              <button
                onClick={captureARScene}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                title="Capturar cena"
              >
                <Download className="h-4 w-4 text-white" />
              </button>
              
              <button
                onClick={shareARScene}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                title="Compartilhar"
              >
                <Share2 className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Controles de transformação */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white text-xs">
              {/* Posição */}
              <div>
                <label className="block mb-2 font-medium">Posição</label>
                <div className="space-y-2">
                  {(['x', 'y', 'z'] as const).map((axis) => (
                    <div key={axis} className="flex items-center gap-2">
                      <span className="w-4 uppercase">{axis}:</span>
                      <input
                        type="range"
                        min="-5"
                        max="5"
                        step="0.1"
                        value={productPosition[axis === 'x' ? 0 : axis === 'y' ? 1 : 2]}
                        onChange={(e) => handlePositionChange(axis, parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Rotação */}
              <div>
                <label className="block mb-2 font-medium">Rotação (°)</label>
                <div className="space-y-2">
                  {(['x', 'y', 'z'] as const).map((axis) => (
                    <div key={axis} className="flex items-center gap-2">
                      <span className="w-4 uppercase">{axis}:</span>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="5"
                        value={(productRotation[axis === 'x' ? 0 : axis === 'y' ? 1 : 2] * 180) / Math.PI}
                        onChange={(e) => handleRotationChange(axis, parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Escala */}
              <div>
                <label className="block mb-2 font-medium">Escala (%)</label>
                <div className="flex items-center gap-2">
                  <span className="w-8">Tam:</span>
                  <input
                    type="range"
                    min="25"
                    max="200"
                    step="5"
                    value={productScale[0] * 100}
                    onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="w-8 text-right">{Math.round(productScale[0] * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Fullscreen */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50"
          >
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 z-10 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            
            <div className="w-full h-full">
              <Canvas
                camera={{ position: [5, 5, 5], fov: 50 }}
                shadows
              >
                <Suspense fallback={<ARLoading />}>
                  <RoomEnvironment lightingMode={lightingMode} />
                  <ReferenceGrid visible={showGrid} />
                  
                  <ARProduct
                    productImage={productImage}
                    position={productPosition}
                    rotation={productRotation}
                    scale={productScale}
                    dimensions={productDimensions}
                  />
                </Suspense>
                
                <OrbitControls 
                  enablePan={true}
                  enableZoom={true}
                  enableRotate={true}
                  minDistance={3}
                  maxDistance={15}
                />
              </Canvas>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}