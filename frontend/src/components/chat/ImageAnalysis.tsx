'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  X, 
  Eye, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageAnalysisProps {
  onAnalysisComplete: (analysis: ImageAnalysisResult) => void
  onError?: (error: string) => void
  className?: string
  maxFileSize?: number // em MB
  acceptedFormats?: string[]
}

interface ImageAnalysisResult {
  id: string
  imageUrl: string
  analysis: {
    description: string
    objects: Array<{
      name: string
      confidence: number
      category: string
    }>
    colors: Array<{
      color: string
      percentage: number
      hex: string
    }>
    style: {
      category: string
      confidence: number
      tags: string[]
    }
    materials: Array<{
      name: string
      confidence: number
      properties: string[]
    }>
    suggestions: string[]
    metadata: {
      dimensions?: { width: number; height: number }
      fileSize: number
      format: string
      timestamp: Date
    }
  }
}

interface UploadedImage {
  id: string
  file: File
  url: string
  status: 'uploading' | 'analyzing' | 'completed' | 'error'
  progress: number
  analysis?: ImageAnalysisResult['analysis']
  error?: string
}

export function ImageAnalysis({ 
  onAnalysisComplete, 
  onError, 
  className,
  maxFileSize = 10, // 10MB
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp']
}: ImageAnalysisProps) {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `Formato não suportado. Use: ${acceptedFormats.join(', ')}`
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo: ${maxFileSize}MB`
    }
    
    return null
  }
  
  const processImage = async (file: File): Promise<void> => {
    const validation = validateFile(file)
    if (validation) {
      onError?.(validation)
      return
    }
    
    const imageId = Date.now().toString()
    const imageUrl = URL.createObjectURL(file)
    
    const newImage: UploadedImage = {
      id: imageId,
      file,
      url: imageUrl,
      status: 'uploading',
      progress: 0
    }
    
    setImages(prev => [...prev, newImage])
    
    try {
      // Simular upload
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setImages(prev => prev.map(img => 
          img.id === imageId ? { ...img, progress } : img
        ))
      }
      
      // Iniciar análise
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, status: 'analyzing', progress: 0 } : img
      ))
      
      setIsAnalyzing(true)
      
      // Análise da imagem
      const analysis = await analyzeImage(file, imageUrl)
      
      setImages(prev => prev.map(img => 
        img.id === imageId ? { 
          ...img, 
          status: 'completed', 
          progress: 100,
          analysis 
        } : img
      ))
      
      const result: ImageAnalysisResult = {
        id: imageId,
        imageUrl,
        analysis
      }
      
      onAnalysisComplete(result)
      
    } catch (error) {
      console.error('Erro na análise:', error)
      setImages(prev => prev.map(img => 
        img.id === imageId ? { 
          ...img, 
          status: 'error', 
          error: 'Erro na análise da imagem'
        } : img
      ))
      onError?.('Erro ao analisar imagem')
    } finally {
      setIsAnalyzing(false)
    }
  }
  
  const analyzeImage = async (file: File, imageUrl: string): Promise<ImageAnalysisResult['analysis']> => {
    // Simular análise de IA (em produção, seria uma chamada para API)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Análise simulada baseada no tipo de arquivo e nome
    const mockAnalysis: ImageAnalysisResult['analysis'] = {
      description: 'Ambiente interno com móveis modernos e decoração contemporânea',
      objects: [
        { name: 'Sofá', confidence: 0.95, category: 'Móveis' },
        { name: 'Mesa de centro', confidence: 0.88, category: 'Móveis' },
        { name: 'Luminária', confidence: 0.82, category: 'Iluminação' },
        { name: 'Plantas', confidence: 0.76, category: 'Decoração' }
      ],
      colors: [
        { color: 'Branco', percentage: 35, hex: '#FFFFFF' },
        { color: 'Cinza', percentage: 25, hex: '#808080' },
        { color: 'Bege', percentage: 20, hex: '#F5F5DC' },
        { color: 'Verde', percentage: 15, hex: '#228B22' },
        { color: 'Marrom', percentage: 5, hex: '#8B4513' }
      ],
      style: {
        category: 'Moderno',
        confidence: 0.92,
        tags: ['minimalista', 'contemporâneo', 'clean', 'escandinavo']
      },
      materials: [
        { name: 'Madeira', confidence: 0.89, properties: ['natural', 'sustentável'] },
        { name: 'Tecido', confidence: 0.85, properties: ['confortável', 'durável'] },
        { name: 'Metal', confidence: 0.78, properties: ['resistente', 'moderno'] }
      ],
      suggestions: [
        'Adicione almofadas coloridas para mais personalidade',
        'Uma luminária pendente criaria um ponto focal interessante',
        'Considere um tapete para delimitar o espaço',
        'Quadros na parede complementariam a decoração'
      ],
      metadata: {
        fileSize: file.size,
        format: file.type,
        timestamp: new Date()
      }
    }
    
    return mockAnalysis
  }
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    files.forEach(processImage)
  }
  
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(event.dataTransfer.files)
    files.forEach(processImage)
  }, [])
  
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])
  
  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
  }, [])
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error)
      onError?.('Erro ao acessar câmera')
    }
  }
  
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
            processImage(file)
          }
        }, 'image/jpeg', 0.9)
      }
      
      // Parar stream
      const stream = video.srcObject as MediaStream
      stream?.getTracks().forEach(track => track.stop())
      video.srcObject = null
    }
  }
  
  const removeImage = (imageId: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === imageId)
      if (image) {
        URL.revokeObjectURL(image.url)
      }
      return prev.filter(img => img.id !== imageId)
    })
  }
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          'border-2 border-dashed transition-all duration-200 cursor-pointer',
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="p-8 text-center">
          <div className="flex justify-center space-x-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <ImageIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          
          <h3 className="text-lg font-semibold mb-2">Análise Inteligente de Imagens</h3>
          <p className="text-gray-600 mb-4">
            Arraste imagens aqui ou clique para selecionar
          </p>
          
          <div className="flex justify-center space-x-2 mb-4">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Selecionar Arquivo
            </Button>
            <Button variant="outline" size="sm" onClick={(e) => {
              e.stopPropagation()
              startCamera()
            }}>
              <Camera className="h-4 w-4 mr-2" />
              Usar Câmera
            </Button>
          </div>
          
          <p className="text-xs text-gray-500">
            Formatos: JPG, PNG, WebP • Máximo: {maxFileSize}MB
          </p>
        </div>
      </Card>
      
      {/* Camera View */}
      <div className="hidden">
        <video ref={videoRef} className="w-full rounded-lg" />
        <canvas ref={canvasRef} className="hidden" />
        <Button onClick={capturePhoto} className="w-full mt-2">
          <Camera className="h-4 w-4 mr-2" />
          Capturar Foto
        </Button>
      </div>
      
      {/* Images List */}
      {images.length > 0 && (
        <div className="space-y-3">
          {images.map((image) => (
            <Card key={image.id} className="p-4">
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <img 
                    src={image.url} 
                    alt="Uploaded" 
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                    onClick={() => removeImage(image.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{image.file.name}</h4>
                    <Badge 
                      variant={image.status === 'completed' ? 'default' : 
                              image.status === 'error' ? 'destructive' : 'secondary'}
                    >
                      {image.status === 'uploading' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      {image.status === 'analyzing' && <Eye className="h-3 w-3 mr-1" />}
                      {image.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {image.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                      
                      {image.status === 'uploading' && 'Enviando'}
                      {image.status === 'analyzing' && 'Analisando'}
                      {image.status === 'completed' && 'Concluído'}
                      {image.status === 'error' && 'Erro'}
                    </Badge>
                  </div>
                  
                  {(image.status === 'uploading' || image.status === 'analyzing') && (
                    <Progress value={image.progress} className="h-2" />
                  )}
                  
                  {image.status === 'error' && image.error && (
                    <p className="text-sm text-red-600">{image.error}</p>
                  )}
                  
                  {image.status === 'completed' && image.analysis && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">{image.analysis.description}</p>
                      
                      <div className="flex flex-wrap gap-1">
                        {image.analysis.objects.slice(0, 3).map((obj, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {obj.name} ({Math.round(obj.confidence * 100)}%)
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {image.analysis.style.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}