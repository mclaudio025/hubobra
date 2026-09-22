'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, RotateCcw, ZoomIn, ZoomOut, Move3D } from 'lucide-react';
import { designTokens } from '../../styles/design-tokens';
import Product3DModel from './Product3DModel';

interface ARViewerProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    category: string;
    image: string;
    price: number;
  };
}

interface ARControls {
  scale: number;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number };
}

export default function ARViewer({ isOpen, onClose, product }: ARViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [arSupported, setArSupported] = useState(false);
  const [controls, setControls] = useState<ARControls>({
    scale: 1,
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0 }
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      checkARSupport();
      requestCameraPermission();
    }
  }, [isOpen]);

  const checkARSupport = () => {
    // Simular verificação de suporte AR
    // Em um app real, verificaria WebXR ou ARCore/ARKit
    const hasWebXR = 'xr' in navigator;
    const hasUserMedia = 'mediaDevices' in navigator;
    setArSupported(hasWebXR || hasUserMedia);
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Câmera traseira
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setCameraPermission('granted');
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      setCameraPermission('denied');
      setIsLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setControls(prev => ({
      ...prev,
      position: {
        x: prev.position.x + deltaX * 0.5,
        y: prev.position.y + deltaY * 0.5
      },
      rotation: {
        ...prev.rotation,
        y: prev.rotation.y + deltaX * 0.01,
        x: prev.rotation.x - deltaY * 0.01
      }
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetControls = () => {
    setControls({
      scale: 1,
      rotation: { x: 0, y: 0, z: 0 },
      position: { x: 0, y: 0 }
    });
  };

  const adjustScale = (delta: number) => {
    setControls(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale + delta))
    }));
  };

  const closeViewer = () => {
    // Parar stream da câmera
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-0 left-0 right-0 z-10 p-4"
          style={{
            background: designTokens.effects.glassmorphism.base.background,
            backdropFilter: designTokens.effects.glassmorphism.base.backdropFilter
          }}
        >
          <div className="flex items-center justify-between text-white">
            <div>
              <h2 className="text-lg font-semibold">{product.name}</h2>
              <p className="text-sm opacity-80">Visualização AR</p>
            </div>
            <button
              onClick={closeViewer}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </motion.div>

        {/* Conteúdo principal */}
        <div className="relative w-full h-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-white border-t-transparent rounded-full"
              />
              <p className="text-white ml-4">Iniciando câmera...</p>
            </div>
          ) : cameraPermission === 'denied' ? (
            <div className="flex flex-col items-center justify-center h-full text-white text-center p-8">
              <Camera size={64} className="mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Câmera não disponível</h3>
              <p className="opacity-80 mb-6">Para usar a visualização AR, permita o acesso à câmera.</p>
              <button
                onClick={requestCameraPermission}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              {/* Vídeo da câmera */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              
              {/* Overlay do produto 3D */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{ pointerEvents: 'auto' }}
              >
                <motion.div
                  animate={{
                    scale: controls.scale,
                    rotateX: controls.rotation.x,
                    rotateY: controls.rotation.y,
                    rotateZ: controls.rotation.z,
                    x: controls.position.x,
                    y: controls.position.y
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="cursor-move"
                >
                  <Product3DModel
                    category={product.category}
                    size="large"
                    enableControls={false}
                    color={designTokens.colors.primary[400]}
                  />
                </motion.div>
              </motion.div>
              
              {/* Instruções */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="absolute bottom-20 left-4 right-4 text-center"
              >
                <div 
                  className="text-white text-sm px-4 py-2 rounded-lg"
                  style={{
                    background: designTokens.effects.glassmorphism.base.background,
                    backdropFilter: designTokens.effects.glassmorphism.base.backdropFilter
                  }}
                >
                  Arraste para mover • Use os controles para ajustar
                </div>
              </motion.div>
            </>
          )}
        </div>

        {/* Controles */}
        {cameraPermission === 'granted' && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-0 left-0 right-0 p-4"
            style={{
              background: designTokens.effects.glassmorphism.base.background,
              backdropFilter: designTokens.effects.glassmorphism.base.backdropFilter
            }}
          >
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => adjustScale(-0.2)}
                className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
              >
                <ZoomOut size={20} />
              </button>
              
              <button
                onClick={() => adjustScale(0.2)}
                className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
              >
                <ZoomIn size={20} />
              </button>
              
              <button
                onClick={resetControls}
                className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
              >
                <RotateCcw size={20} />
              </button>
              
              <div className="flex items-center space-x-2 text-white text-sm">
                <Move3D size={16} />
                <span>Escala: {Math.round(controls.scale * 100)}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Hook para verificar suporte AR
export function useARSupport() {
  const [isSupported, setIsSupported] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      // Verificar WebXR
      const hasWebXR = 'xr' in navigator;
      
      // Verificar câmera
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoInput = devices.some(device => device.kind === 'videoinput');
        setHasCamera(hasVideoInput);
      } catch (error) {
        setHasCamera(false);
      }
      
      setIsSupported(hasWebXR || hasCamera);
    };

    checkSupport();
  }, []);

  return { isSupported, hasCamera };
}