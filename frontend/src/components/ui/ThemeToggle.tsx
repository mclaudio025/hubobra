'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { designTokens } from '@/styles/design-tokens';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className, 
  size = 'md', 
  variant = 'default' 
}) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  const isDark = theme === 'dark';
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };
  
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };
  
  const baseClasses = cn(
    'relative inline-flex items-center justify-center',
    'rounded-full cursor-pointer',
    'transition-all duration-300 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    'hover:scale-105 active:scale-95',
    sizeClasses[size],
    className
  );
  
  const variantClasses = {
    default: cn(
      'bg-secondary-100 hover:bg-secondary-200',
      'dark:bg-secondary-800 dark:hover:bg-secondary-700',
      'border border-secondary-200 dark:border-secondary-700'
    ),
    glass: cn(
      'glass backdrop-blur-md',
      'hover:bg-white/20 dark:hover:bg-black/20'
    ),
  };
  
  return (
    <motion.button
      onClick={toggleTheme}
      className={cn(baseClasses, variantClasses[variant])}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        duration: 0.2,
        ease: designTokens.animation.easing.easeOut,
      }}
      aria-label={`Alternar para tema ${isDark ? 'claro' : 'escuro'}`}
    >
      {/* Background animado */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
        initial={false}
        animate={{
          opacity: isDark ? 1 : 0,
          scale: isDark ? 1 : 0.8,
        }}
        transition={{
          duration: 0.3,
          ease: designTokens.animation.easing.easeInOut,
        }}
      />
      
      {/* Ícones */}
      <div className="relative z-10 flex items-center justify-center">
        <motion.div
          initial={false}
          animate={{
            opacity: isDark ? 0 : 1,
            rotate: isDark ? 180 : 0,
            scale: isDark ? 0.5 : 1,
          }}
          transition={{
            duration: 0.3,
            ease: designTokens.animation.easing.spring,
          }}
          className="absolute"
        >
          <Sun 
            size={iconSizes[size]} 
            className="text-primary-600 dark:text-primary-400" 
          />
        </motion.div>
        
        <motion.div
          initial={false}
          animate={{
            opacity: isDark ? 1 : 0,
            rotate: isDark ? 0 : -180,
            scale: isDark ? 1 : 0.5,
          }}
          transition={{
            duration: 0.3,
            ease: designTokens.animation.easing.spring,
          }}
          className="absolute"
        >
          <Moon 
            size={iconSizes[size]} 
            className="text-white" 
          />
        </motion.div>
      </div>
      
      {/* Efeito de brilho */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-400/20 to-primary-600/20"
        initial={false}
        animate={{
          opacity: isDark ? 0.5 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: designTokens.animation.easing.easeInOut,
        }}
      />
    </motion.button>
  );
};

export { ThemeToggle };
export type { ThemeToggleProps };
