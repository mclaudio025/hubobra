'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Box, Sphere, Cylinder, Cone } from '@react-three/drei';
import { Mesh, Vector3 } from 'three';
import { motion } from 'framer-motion';
import { designTokens } from '../../styles/design-tokens';

interface Product3DModelProps {
  category: string;
  isHovered?: boolean;
  autoRotate?: boolean;
  enableControls?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

// Componente do modelo 3D baseado na categoria
function CategoryModel({ category, isHovered, color }: { category: string; isHovered: boolean; color: string }) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Rotação automática
      meshRef.current.rotation.y += 0.01;
      
      // Animação de hover
      if (isHovered || hovered) {
        meshRef.current.scale.setScalar(1.1);
        meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      } else {
        meshRef.current.scale.setScalar(1);
        meshRef.current.rotation.x = 0;
      }
    }
  });

  const getModelByCategory = () => {
    const commonProps = {
      ref: meshRef,
      onPointerOver: () => setHovered(true),
      onPointerOut: () => setHovered(false),
    };

    switch (category.toLowerCase()) {
      case 'eletrônicos':
      case 'eletronicos':
      case 'tecnologia':
        return (
          <Box {...commonProps} args={[2, 1.2, 0.3]}>
            <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
          </Box>
        );
      
      case 'casa':
      case 'decoração':
      case 'decoracao':
      case 'móveis':
      case 'moveis':
        return (
          <Cylinder {...commonProps} args={[1, 1, 2, 8]}>
            <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
          </Cylinder>
        );
      
      case 'ferramentas':
      case 'construção':
      case 'construcao':
      case 'jardim':
        return (
          <Cone {...commonProps} args={[1, 2, 6]}>
            <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
          </Cone>
        );
      
      case 'esporte':
      case 'fitness':
      case 'lazer':
        return (
          <Sphere {...commonProps} args={[1.2, 16, 16]}>
            <meshStandardMaterial color={color} metalness={0.1} roughness={0.9} />
          </Sphere>
        );
      
      default:
        return (
          <Box {...commonProps} args={[1.5, 1.5, 1.5]}>
            <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
          </Box>
        );
    }
  };

  return (
    <group>
      {getModelByCategory()}
      {/* Luzes */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4f46e5" />
    </group>
  );
}

// Componente de controles da câmera
function CameraControls({ enableControls }: { enableControls: boolean }) {
  const { camera, gl } = useThree();
  
  useEffect(() => {
    if (enableControls) {
      camera.position.set(0, 0, 5);
    }
  }, [camera, enableControls]);

  if (!enableControls) return null;

  return (
    <OrbitControls
      args={[camera, gl.domElement]}
      enableZoom={true}
      enablePan={false}
      enableRotate={true}
      autoRotate={false}
      maxPolarAngle={Math.PI / 2}
      minPolarAngle={Math.PI / 4}
    />
  );
}

export default function Product3DModel({
  category,
  isHovered = false,
  autoRotate = true,
  enableControls = true,
  size = 'medium',
  color = designTokens.colors.primary[500]
}: Product3DModelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const sizeMap = {
    small: { width: 120, height: 120 },
    medium: { width: 200, height: 200 },
    large: { width: 300, height: 300 }
  };

  const currentSize = sizeMap[size];

  useEffect(() => {
    // Simular carregamento do modelo 3D
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ width: currentSize.width, height: currentSize.height }}
      >
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📦</div>
          <div className="text-sm">Modelo 3D indisponível</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg"
        style={{ width: currentSize.width, height: currentSize.height }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-lg overflow-hidden"
      style={{ 
        width: currentSize.width, 
        height: currentSize.height,
        background: `linear-gradient(135deg, ${designTokens.colors.background.gradient.start}, ${designTokens.colors.background.gradient.end})`
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        onCreated={() => setIsLoading(false)}
        onError={() => setError(true)}
      >
        <CategoryModel 
          category={category} 
          isHovered={isHovered} 
          color={color}
        />
        <CameraControls enableControls={enableControls} />
      </Canvas>
      
      {/* Overlay com informações */}
      {enableControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute bottom-2 left-2 right-2 text-center"
        >
          <div 
            className="text-xs text-white px-2 py-1 rounded"
            style={{ 
              background: designTokens.effects.glassmorphism.base.background,
              backdropFilter: designTokens.effects.glassmorphism.base.backdropFilter
            }}
          >
            Arraste para rotacionar • Scroll para zoom
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Hook para usar o modelo 3D
export function useProduct3D(category: string) {
  const [isSupported, setIsSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Verificar suporte a WebGL
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    setIsSupported(!!gl);
  }, []);

  const loadModel = async () => {
    setIsLoading(true);
    // Simular carregamento de modelo específico
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  return {
    isSupported,
    isLoading,
    loadModel
  };
}