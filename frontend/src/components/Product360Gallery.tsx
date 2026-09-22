'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useTexture, Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  X, 
  Play, 
  Pause,
  RotateCw,
  Eye,
  Move3D
} from 'lucide-react';
import { designTokens } from '../styles/design-tokens';
import * as THREE from 'three';

interface Product360GalleryProps {
  images: Array<{
    id: string;
    url: string;
    alt: string;
    order: number;
  }>;
  productName: string;
  className?: string;
}

// Componente 3D do produto
function Product3DModel({ 
  images, 
  autoRotate, 
  rotationSpeed,
  currentView 
}: { 
  images: any[], 
  autoRotate: boolean, 
  rotationSpeed: number,
  currentView: string 
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  
  // Carregar texturas das imagens
  const textures = useTexture(images.map(img => img.url));
  
  useFrame((state, delta) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  // Ajustar posição da câmera baseado na visualização
  useEffect(() => {
    if (camera) {
      switch (currentView) {
        case 'front':
          camera.position.set(0, 0, 5);
          break;
        case 'side':
          camera.position.set(5, 0, 0);
          break;
        case 'top':
          camera.position.set(0, 5, 0);
          break;
        case 'back':
          camera.position.set(0, 0, -5);
          break;
        default:
          camera.position.set(3, 3, 3);
      }
      camera.lookAt(0, 0, 0);
    }
  }, [currentView, camera]);

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial 
        map={textures[0]} 
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

// Componente de loading 3D
function Loading3D() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-gray-600 text-sm">Carregando modelo 3D...</p>
      </div>
    </Html>
  );
}

export default function Product360Gallery({ 
  images, 
  productName, 
  className = '' 
}: Product360GalleryProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(0.5);
  const [currentView, setCurrentView] = useState('perspective');
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  const views = [
    { id: 'perspective', label: 'Perspectiva', icon: Move3D },
    { id: 'front', label: 'Frontal', icon: Eye },
    { id: 'side', label: 'Lateral', icon: RotateCw },
    { id: 'top', label: 'Superior', icon: Eye },
    { id: 'back', label: 'Traseira', icon: Eye }
  ];

  useEffect(() => {
    // Simular carregamento do modelo 3D
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
    setCurrentView('perspective');
    setAutoRotate(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleAutoRotate = () => {
    setAutoRotate(!autoRotate);
  };

  if (!images || images.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center h-96 ${className}`}>
        <div className="text-center text-gray-500">
          <Move3D className="h-12 w-12 mx-auto mb-2" />
          <p>Visualização 3D não disponível</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden ${className}`}>
        {/* Header com controles */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${designTokens.effects.glassmorphism.base}`}>
              Visualização 360°
            </div>
            {isLoading && (
              <div className="flex items-center gap-2 text-orange-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                <span className="text-xs">Carregando...</span>
              </div>
            )}
          </div>
          
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-lg transition-all ${designTokens.effects.glassmorphism.base} hover:bg-white/20`}
            title="Tela cheia"
          >
            <Maximize2 className="h-4 w-4 text-gray-700" />
          </button>
        </div>

        {/* Canvas 3D */}
        <div ref={canvasRef} className="h-96 w-full">
          <Canvas
            camera={{ position: [3, 3, 3], fov: 50 }}
            style={{ background: 'transparent' }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, -10, -5]} intensity={0.5} />
            
            <Suspense fallback={<Loading3D />}>
              <Product3DModel 
                images={images}
                autoRotate={autoRotate}
                rotationSpeed={rotationSpeed}
                currentView={currentView}
              />
            </Suspense>
            
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              autoRotate={autoRotate}
              autoRotateSpeed={rotationSpeed * 10}
              minDistance={2}
              maxDistance={10}
              minPolarAngle={0}
              maxPolarAngle={Math.PI}
            />
          </Canvas>
        </div>

        {/* Controles inferiores */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className={`p-4 rounded-lg ${designTokens.effects.glassmorphism.base}`}>
            {/* Visualizações */}
            <div className="flex justify-center gap-2 mb-4">
              {views.map((view) => {
                const IconComponent = view.icon;
                return (
                  <button
                    key={view.id}
                    onClick={() => setCurrentView(view.id)}
                    className={`p-2 rounded-lg transition-all ${
                      currentView === view.id
                        ? 'bg-orange-500 text-white'
                        : 'bg-white/20 text-gray-700 hover:bg-white/30'
                    }`}
                    title={view.label}
                  >
                    <IconComponent className="h-4 w-4" />
                  </button>
                );
              })}
            </div>

            {/* Controles principais */}
            <div className="flex justify-center items-center gap-3">
              <button
                onClick={handleZoomOut}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                title="Diminuir zoom"
              >
                <ZoomOut className="h-4 w-4 text-gray-700" />
              </button>
              
              <button
                onClick={toggleAutoRotate}
                className={`p-2 rounded-lg transition-all ${
                  autoRotate 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white/20 text-gray-700 hover:bg-white/30'
                }`}
                title={autoRotate ? 'Pausar rotação' : 'Iniciar rotação'}
              >
                {autoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              
              <button
                onClick={handleReset}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                title="Resetar visualização"
              >
                <RotateCcw className="h-4 w-4 text-gray-700" />
              </button>
              
              <button
                onClick={handleZoomIn}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                title="Aumentar zoom"
              >
                <ZoomIn className="h-4 w-4 text-gray-700" />
              </button>
            </div>

            {/* Controle de velocidade */}
            {autoRotate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center justify-center gap-3"
              >
                <span className="text-xs text-gray-600">Velocidade:</span>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={rotationSpeed}
                  onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
              </motion.div>
            )}
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
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full h-full max-w-6xl max-h-full">
              <button
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 z-10 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
              >
                <X className="h-6 w-6 text-white" />
              </button>
              
              <div className="w-full h-full">
                <Canvas
                  camera={{ position: [3, 3, 3], fov: 50 }}
                  style={{ background: 'transparent' }}
                >
                  <ambientLight intensity={0.6} />
                  <directionalLight position={[10, 10, 5]} intensity={1} />
                  <pointLight position={[-10, -10, -5]} intensity={0.5} />
                  
                  <Suspense fallback={<Loading3D />}>
                    <Product3DModel 
                      images={images}
                      autoRotate={autoRotate}
                      rotationSpeed={rotationSpeed}
                      currentView={currentView}
                    />
                  </Suspense>
                  
                  <OrbitControls 
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    autoRotate={autoRotate}
                    autoRotateSpeed={rotationSpeed * 10}
                    minDistance={2}
                    maxDistance={10}
                  />
                </Canvas>
              </div>
              
              {/* Controles fullscreen */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                <div className={`p-4 rounded-lg ${designTokens.effects.glassmorphism.base} bg-white/10`}>
                  <div className="flex justify-center items-center gap-3">
                    <button
                      onClick={handleZoomOut}
                      className="p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                    >
                      <ZoomOut className="h-5 w-5 text-white" />
                    </button>
                    
                    <button
                      onClick={toggleAutoRotate}
                      className={`p-3 rounded-lg transition-all ${
                        autoRotate 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {autoRotate ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </button>
                    
                    <button
                      onClick={handleReset}
                      className="p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                    >
                      <RotateCcw className="h-5 w-5 text-white" />
                    </button>
                    
                    <button
                      onClick={handleZoomIn}
                      className="p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                    >
                      <ZoomIn className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}