'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  disabled?: boolean;
  maxSize?: number; // em MB
  acceptedFormats?: string[];
  recommendedSize?: string;
}

export default function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  maxSize = 2,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  recommendedSize = '1920x500px'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validar tipo de arquivo
    if (!acceptedFormats.includes(file.type)) {
      alert(`Formato não suportado. Use: ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`);
      return;
    }

    // Validar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      alert(`Arquivo muito grande. Máximo: ${maxSize}MB`);
      return;
    }

    setUploading(true);

    try {
      // Simular upload - em produção, usar serviço real
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
        setUploading(false);
      };
      reader.readAsDataURL(file);

      // TODO: Implementar upload real para AWS S3, Cloudinary, etc.
      // const formData = new FormData();
      // formData.append('file', file);
      // const response = await fetch('/api/upload', {
      //   method: 'POST',
      //   body: formData
      // });
      // const { url } = await response.json();
      // onChange(url);
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload da imagem');
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  return (
    <div className="space-y-4">
      {/* Preview da imagem atual */}
      {value && (
        <div className="relative">
          <img
            src={value}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Área de upload */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          className="hidden"
          disabled={disabled}
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-sm text-gray-600">Fazendo upload...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {value ? (
              <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
            ) : (
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
            )}
            <p className="text-sm text-gray-600 mb-1">
              {value ? 'Clique para trocar a imagem' : 'Clique ou arraste uma imagem aqui'}
            </p>
            <p className="text-xs text-gray-500">
              Formatos: {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} • 
              Máximo: {maxSize}MB • 
              Recomendado: {recommendedSize}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
