'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { designTokens, getGlass } from '@/styles/design-tokens';
import { useTheme } from 'next-themes';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  variant?: 'base' | 'intense' | 'subtle';
  hover?: boolean;
  glow?: boolean;
  className?: string;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ 
    children, 
    variant = 'base', 
    hover = true, 
    glow = false, 
    className, 
    ...props 
  }, ref) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    const glassStyles = getGlass(variant, isDark);
    
    const baseStyles = {
      background: glassStyles.background,
      backdropFilter: glassStyles.backdropFilter,
      WebkitBackdropFilter: glassStyles.backdropFilter, // Safari support
      border: glassStyles.border,
      borderRadius: glassStyles.borderRadius,
    };
    
    const glowStyles = glow ? {
      boxShadow: isDark 
        ? '0 0 20px rgba(249, 115, 22, 0.2), 0 0 40px rgba(249, 115, 22, 0.1)'
        : designTokens.shadows.glow,
    } : {};
    
    const hoverVariants = hover ? {
      hover: {
        scale: 1.05,
        y: -8,
        rotateY: 5,
        rotateX: 2,
        z: 50,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 20,
          mass: 0.8
        },
      },
      tap: {
        scale: 0.95,
        rotateY: -2,
        rotateX: 1,
        transition: {
          duration: 0.1,
          ease: designTokens.animation.easing.easeInOut,
        },
      },
    } : {};
    
    return (
      <motion.div
        ref={ref}
        style={{
          ...baseStyles,
          ...glowStyles,
        }}
        variants={hoverVariants}
        whileHover={hover ? 'hover' : undefined}
        whileTap={hover ? 'tap' : undefined}
        initial={{ opacity: 0, y: 30, scale: 0.9, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        transition={{
          duration: 0.6,
          type: "spring",
          stiffness: 100,
          damping: 20
        }}
        style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px'
        }}
        className={cn(
          'relative overflow-hidden group transform-gpu',
          'before:absolute before:inset-0 before:rounded-[inherit]',
          'before:bg-gradient-to-br before:from-white/10 before:to-transparent',
          'before:opacity-0 hover:before:opacity-100',
          'before:transition-opacity before:duration-500',
          isDark && 'before:from-white/5',
          className
        )}
        {...props}
      >
        {/* Enhanced background glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-red-500/10 rounded-[inherit] opacity-0 group-hover:opacity-100 -z-10"
          initial={{ scale: 0.8 }}
          whileHover={{ 
            scale: 1.2,
            transition: { duration: 0.6 }
          }}
        />
        
        {/* Dynamic overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-[inherit] opacity-0 group-hover:opacity-100"
          initial={{ scale: 0.9, rotate: 0 }}
          whileHover={{
            scale: 1.05,
            rotate: 1,
            transition: {
              type: "spring",
              stiffness: 200,
              damping: 25
            }
          }}
        />
        
        {/* Efeito de brilho interno */}
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/5 to-transparent opacity-50" />
        
        {/* Enhanced shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 rounded-[inherit]"
          initial={{ x: '-120%', skewX: -25 }}
          whileHover={{ x: '120%' }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
        
        {/* Floating background particles */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-orange-400/40 rounded-full opacity-0 group-hover:opacity-60 blur-sm"
            style={{
              left: `${20 + i * 20}%`,
              top: `${15 + i * 25}%`
            }}
            animate={{
              y: [-5, -15, -5],
              opacity: [0, 0.6, 0],
              scale: [0.5, 1.2, 0.5]
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3
            }}
          />
        ))}
        
        {/* Conteúdo */}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* Enhanced glow effect */}
        {glow && (
          <motion.div 
            className="absolute inset-0 rounded-[inherit] bg-gradient-to-r from-orange-500/20 via-red-500/15 to-orange-500/20 opacity-0 group-hover:opacity-100"
            animate={{
              backgroundImage: [
                'linear-gradient(90deg, rgba(249,115,22,0.2) 0%, rgba(239,68,68,0.15) 50%, rgba(249,115,22,0.2) 100%)',
                'linear-gradient(90deg, rgba(239,68,68,0.2) 0%, rgba(249,115,22,0.15) 50%, rgba(239,68,68,0.2) 100%)',
                'linear-gradient(90deg, rgba(249,115,22,0.2) 0%, rgba(239,68,68,0.15) 50%, rgba(249,115,22,0.2) 100%)'
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
        
        {/* Pulsing ring effect */}
        <motion.div
          className="absolute inset-0 rounded-[inherit] border border-orange-400/30 opacity-0 group-hover:opacity-100"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export { GlassCard };
export type { GlassCardProps };
