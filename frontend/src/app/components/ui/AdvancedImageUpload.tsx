'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Check, AlertCircle } from 'lucide-react';
import { useUpload } from '../../hooks/useApi';
import { useToast } from './Toaster';

interface UploadedImage {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  width?: number;
  height?: number;
}

interface AdvancedImageUploadProps {
  onImageUploaded: (image: UploadedImage) => void;
  onImageRemove?: (imageId: string) => void;
  currentImages?: UploadedImage[];
  multiple?: boolean;
  maxFiles?: number;
  accept?: string;
  maxSize?: number; // em MB
  variants?: string[];
  className?: string;
  showPreview?: boolean;
}

export default function AdvancedImageUpload({
  onImageUploaded,
  onImageRemove,
  currentImages = [],
  multiple = false,
  maxFiles = 5,
  accept = "image/*",
  maxSize = 10,
  variants = ['thumbnail', 'medium'],
  className = "",
  showPreview = true
}: AdvancedImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadApi = useUpload();
  const { addToast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    // Validar número de arquivos
    if (!multiple && files.length > 1) {
      addToast({
        type: 'error',
        title: 'Muitos arquivos',
        message: 'Selecione apenas uma imagem'
      });
      return;
    }

    if (currentImages.length + files.length > maxFiles) {
      addToast({
        type: 'error',
        title: 'Limite excedido',
        message: `Máximo de ${maxFiles} imagens permitidas`
      });
      return;
    }

    // Validar cada arquivo
    const validFiles: File[] = [];
    for (const file of files) {
      if (!validateFile(file)) continue;
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      if (multiple && validFiles.length > 1) {
        // Upload múltiplo
        const results = await uploadApi.uploadMultipleImages(validFiles);
        results.forEach(result => onImageUploaded(result));
        
        addToast({
          type: 'success',
          title: 'Upload concluído',
          message: `${results.length} imagem(s) enviada(s) com sucesso`
        });
      } else {
        // Upload único
        for (const file of validFiles) {
          const result = await uploadApi.uploadImage(file, variants);
          onImageUploaded(result);
        }
        
        addToast({
          type: 'success',
          title: 'Upload concluído',
          message: 'Imagem enviada com sucesso'
        });
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erro no upload',
        message: error.message || 'Erro ao enviar imagem'
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const validateFile = (file: File): boolean => {
    // Validar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      addToast({
        type: 'error',
        title: 'Arquivo muito grande',
        message: `Tamanho máximo: ${maxSize}MB`
      });
      return false;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      addToast({
        type: 'error',
        title: 'Tipo inválido',
        message: 'Selecione apenas arquivos de imagem'
      });
      return false;
    }

    return true;
  };

  const handleRemove = async (imageId: string, filename: string) => {
    try {
      await uploadApi.deleteImage(filename);
      onImageRemove?.(imageId);
      
      addToast({
        type: 'success',
        title: 'Imagem removida',
        message: 'Imagem deletada com sucesso'
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erro ao remover',
        message: error.message || 'Erro ao deletar imagem'
      });
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-orange-500 bg-orange-50'
            : uploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!uploading ? openFileDialog : undefined}
      >
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-orange-600 animate-spin mb-4" />
            <p className="text-gray-600 mb-2">Enviando imagem(s)...</p>
            <p className="text-sm text-gray-500">Aguarde o processamento</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">
              {multiple 
                ? `Clique para selecionar ou arraste ${maxFiles > 1 ? 'até ' + maxFiles + ' ' : ''}imagens aqui`
                : 'Clique para selecionar ou arraste uma imagem aqui'
              }
            </p>
            <p className="text-sm text-gray-500">
              PNG, JPG, WebP, GIF até {maxSize}MB
            </p>
            {currentImages.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                {currentImages.length} de {maxFiles} imagem(s) carregada(s)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Image Preview Grid */}
      {showPreview && currentImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentImages.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={image.thumbnailUrl || image.url}
                  alt={image.originalName}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <button
                  onClick={() => handleRemove(image.id, image.filename)}
                  className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"
                  title="Remover imagem"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Image info */}
              <div className="mt-2">
                <p className="text-xs text-gray-600 truncate" title={image.originalName}>
                  {image.originalName}
                </p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formatFileSize(image.size)}</span>
                  {image.width && image.height && (
                    <span>{image.width}×{image.height}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Dicas para melhores resultados:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use imagens com boa resolução (mínimo 800x600px)</li>
              <li>• Formatos recomendados: JPG para fotos, PNG para imagens com transparência</li>
              <li>• As imagens serão automaticamente otimizadas e redimensionadas</li>
              {variants.includes('thumbnail') && (
                <li>• Miniaturas de 150x150px serão geradas automaticamente</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
