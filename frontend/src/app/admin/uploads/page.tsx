'use client';

import { useState, useEffect } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Download, 
  Eye, 
  RefreshCw,
  HardDrive,
  FileImage,
  TrendingUp
} from 'lucide-react';
import { useUpload } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toaster';
import AdvancedImageUpload from '../../components/ui/AdvancedImageUpload';
import Loading from '../../components/ui/Loading';

interface UploadStats {
  totalFiles: number;
  totalSize: number;
  byType: Record<string, number>;
}

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

export default function AdminUploadsPage() {
  const [stats, setStats] = useState<UploadStats | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const uploadApi = useUpload();
  const { addToast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const statsData = await uploadApi.getUploadStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      addToast({
        type: 'error',
        title: 'Erro ao carregar dados',
        message: 'Não foi possível carregar as estatísticas'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploaded = (image: UploadedImage) => {
    setImages(prev => [image, ...prev]);
    loadStats(); // Atualizar estatísticas
  };

  const handleImageRemove = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageId);
      return newSet;
    });
    loadStats(); // Atualizar estatísticas
  };

  const handleSelectImage = (imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map(img => img.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return;

    if (!confirm(`Tem certeza que deseja deletar ${selectedImages.size} imagem(s)?`)) {
      return;
    }

    const imagesToDelete = images.filter(img => selectedImages.has(img.id));
    
    try {
      for (const image of imagesToDelete) {
        await uploadApi.deleteImage(image.filename);
        handleImageRemove(image.id);
      }
      
      addToast({
        type: 'success',
        title: 'Imagens deletadas',
        message: `${imagesToDelete.length} imagem(s) removida(s) com sucesso`
      });
      
      setSelectedImages(new Set());
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erro ao deletar',
        message: error.message || 'Erro ao deletar imagens'
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (extension: string) => {
    const iconMap: Record<string, string> = {
      '.jpg': '📷',
      '.jpeg': '📷',
      '.png': '🖼️',
      '.gif': '🎞️',
      '.webp': '🖼️',
      '.svg': '🎨'
    };
    return iconMap[extension.toLowerCase()] || '📄';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="Carregando dados de upload..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Upload className="h-8 w-8 text-orange-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Uploads</h1>
              <p className="text-gray-600">Gerencie imagens e arquivos do sistema</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={loadStats}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
            
            {selectedImages.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                <Trash2 className="h-4 w-4" />
                Deletar ({selectedImages.size})
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Arquivos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
                </div>
                <FileImage className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Espaço Utilizado</p>
                  <p className="text-2xl font-bold text-gray-900">{formatFileSize(stats.totalSize)}</p>
                </div>
                <HardDrive className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tipos de Arquivo</p>
                  <div className="flex gap-2 mt-2">
                    {Object.entries(stats.byType).map(([ext, count]) => (
                      <span key={ext} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {getFileTypeIcon(ext)} {count}
                      </span>
                    ))}
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload de Imagens</h2>
          <AdvancedImageUpload
            onImageUploaded={handleImageUploaded}
            onImageRemove={handleImageRemove}
            currentImages={images}
            multiple={true}
            maxFiles={10}
            variants={['thumbnail', 'small', 'medium', 'large']}
          />
        </div>

        {/* Images Gallery */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Galeria de Imagens</h2>
              
              <div className="flex items-center gap-4">
                {images.length > 0 && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedImages.size === images.length && images.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                    Selecionar todas
                  </label>
                )}
                
                <div className="flex border border-gray-300 rounded">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <div className="grid grid-cols-2 gap-1 w-4 h-4">
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <div className="space-y-1 w-4 h-4">
                      <div className="bg-current h-1 rounded"></div>
                      <div className="bg-current h-1 rounded"></div>
                      <div className="bg-current h-1 rounded"></div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {images.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma imagem encontrada</h3>
              <p className="text-gray-600">Faça upload de imagens para começar</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={image.thumbnailUrl || image.url}
                        alt={image.originalName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Selection checkbox */}
                    <div className="absolute top-2 left-2">
                      <input
                        type="checkbox"
                        checked={selectedImages.has(image.id)}
                        onChange={() => handleSelectImage(image.id)}
                        className="rounded"
                      />
                    </div>
                    
                    {/* Actions overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.open(image.url, '_blank')}
                          className="bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleImageRemove(image.id)}
                          className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"
                          title="Deletar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {images.map((image) => (
                <div key={image.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedImages.has(image.id)}
                    onChange={() => handleSelectImage(image.id)}
                    className="rounded"
                  />
                  
                  <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={image.thumbnailUrl || image.url}
                      alt={image.originalName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{image.originalName}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>{formatFileSize(image.size)}</span>
                      {image.width && image.height && (
                        <span>{image.width} × {image.height}px</span>
                      )}
                      <span>{image.filename}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.open(image.url, '_blank')}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleImageRemove(image.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition"
                      title="Deletar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
