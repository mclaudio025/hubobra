'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { designTokens, getGlass } from '@/styles/design-tokens';
import { useTheme } from 'next-themes';

interface GlassOverlayProps {
  children: React.ReactNode;
  variant?: 'base' | 'intense' | 'subtle';
  className?: string;
  animate?: boolean;
  delay?: number;
}

export default function GlassOverlay({
  children,
  variant = 'base',
  className = '',
  animate = true,
  delay = 0
}: GlassOverlayProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const glassStyles = getGlass(variant, isDark);
  
  const baseStyles = {
    background: glassStyles.background,
    backdropFilter: glassStyles.backdropFilter,
    WebkitBackdropFilter: glassStyles.backdropFilter,
    border: glassStyles.border,
    borderRadius: glassStyles.borderRadius,
  };

  const animationVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        delay,
        ease: designTokens.animation.easing.easeOut
      }
    }
  };

  const Component = animate ? motion.div : 'div';
  const motionProps = animate ? {
    variants: animationVariants,
    initial: 'hidden',
    animate: 'visible'
  } : {};

  return (
    <Component
      style={baseStyles}
      className={cn(
        'relative overflow-hidden',
        'before:absolute before:inset-0 before:rounded-[inherit]',
        'before:bg-gradient-to-br before:from-white/5 before:to-transparent',
        isDark && 'before:from-white/3',
        className
      )}
      {...motionProps}
    >
      {/* Efeito de brilho sutil */}
      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/3 to-transparent opacity-50" />
      
      {/* Conteúdo */}
      <div className="relative z-10">
        {children}
      </div>
    </Component>
  );
}