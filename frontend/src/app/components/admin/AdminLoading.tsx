'use client';

import { Loader2 } from 'lucide-react';

interface AdminLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export default function AdminLoading({ 
  message = "Carregando...",
  size = 'md',
  fullScreen = false
}: AdminLoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50'
    : 'flex items-center justify-center py-12';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <Loader2 className={`${sizeClasses[size]} text-blue-600 animate-spin mx-auto mb-4`} />
        <p className={`${textSizeClasses[size]} text-gray-600 font-medium`}>
          {message}
        </p>
      </div>
    </div>
  );
}
