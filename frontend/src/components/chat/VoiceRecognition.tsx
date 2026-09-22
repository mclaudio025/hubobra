'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoiceRecognitionProps {
  onTranscript: (text: string) => void
  onError?: (error: string) => void
  className?: string
  language?: string
}

interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string
        confidence: number
      }
    }
    length: number
  }
  resultIndex: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export function VoiceRecognition({ 
  onTranscript, 
  onError, 
  className, 
  language = 'pt-BR' 
}: VoiceRecognitionProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    // Verificar suporte do navegador
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (SpeechRecognition) {
      setIsSupported(true)
      
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = language
      
      recognition.onstart = () => {
        setIsListening(true)
        setTranscript('')
        setConfidence(0)
      }
      
      recognition.onend = () => {
        setIsListening(false)
      }
      
      recognition.onerror = (event: any) => {
        setIsListening(false)
        const errorMessage = getErrorMessage(event.error)
        onError?.(errorMessage)
      }
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i][0]
          
          if (event.results[i].isFinal) {
            finalTranscript += result.transcript
            setConfidence(result.confidence)
          } else {
            interimTranscript += result.transcript
          }
        }
        
        const currentTranscript = finalTranscript || interimTranscript
        setTranscript(currentTranscript)
        
        if (finalTranscript) {
          onTranscript(finalTranscript.trim())
          
          // Auto-stop após receber resultado final
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }
          
          timeoutRef.current = setTimeout(() => {
            stopListening()
          }, 1000)
        }
      }
      
      recognitionRef.current = recognition
    } else {
      setIsSupported(false)
      onError?.('Reconhecimento de voz não é suportado neste navegador')
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [language, onTranscript, onError])
  
  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'no-speech':
        return 'Nenhuma fala detectada. Tente falar mais alto.'
      case 'audio-capture':
        return 'Erro ao capturar áudio. Verifique seu microfone.'
      case 'not-allowed':
        return 'Permissão negada. Permita o acesso ao microfone.'
      case 'network':
        return 'Erro de rede. Verifique sua conexão.'
      case 'language-not-supported':
        return 'Idioma não suportado.'
      default:
        return 'Erro no reconhecimento de voz.'
    }
  }
  
  const startListening = () => {
    if (!isSupported || !recognitionRef.current) return
    
    try {
      recognitionRef.current.start()
    } catch (error) {
      console.error('Erro ao iniciar reconhecimento:', error)
      onError?.('Erro ao iniciar reconhecimento de voz')
    }
  }
  
  const stopListening = () => {
    if (!recognitionRef.current) return
    
    try {
      recognitionRef.current.stop()
    } catch (error) {
      console.error('Erro ao parar reconhecimento:', error)
    }
  }
  
  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }
  
  // Text-to-Speech
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Parar qualquer fala anterior
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = language
      utterance.rate = 0.9
      utterance.pitch = 1
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      
      window.speechSynthesis.speak(utterance)
    }
  }
  
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }
  
  if (!isSupported) {
    return (
      <Badge variant="destructive" className={className}>
        Voz não suportada
      </Badge>
    )
  }
  
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {/* Botão de reconhecimento de voz */}
      <Button
        variant={isListening ? 'destructive' : 'outline'}
        size="sm"
        onClick={toggleListening}
        className={cn(
          'relative transition-all duration-200',
          isListening && 'animate-pulse shadow-lg'
        )}
      >
        {isListening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        
        {isListening && (
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
        )}
      </Button>
      
      {/* Botão de text-to-speech */}
      <Button
        variant={isSpeaking ? 'destructive' : 'outline'}
        size="sm"
        onClick={isSpeaking ? stopSpeaking : () => speakText(transcript)}
        disabled={!transcript}
        className={cn(
          'transition-all duration-200',
          isSpeaking && 'animate-pulse'
        )}
      >
        {isSpeaking ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
      
      {/* Indicador de transcrição */}
      {transcript && (
        <div className="flex items-center space-x-2">
          <Badge 
            variant={confidence > 0.8 ? 'default' : confidence > 0.5 ? 'secondary' : 'destructive'}
            className="text-xs"
          >
            {Math.round(confidence * 100)}%
          </Badge>
          
          <div className="max-w-32 truncate text-xs text-gray-600">
            {transcript}
          </div>
        </div>
      )}
    </div>
  )
}

// Hook para usar reconhecimento de voz
export function useVoiceRecognition(language = 'pt-BR') {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const startListening = () => {
    setIsListening(true)
    setError(null)
  }
  
  const stopListening = () => {
    setIsListening(false)
  }
  
  const handleTranscript = (text: string) => {
    setTranscript(text)
    setIsListening(false)
  }
  
  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setIsListening(false)
  }
  
  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    handleTranscript,
    handleError,
    clearTranscript: () => setTranscript(''),
    clearError: () => setError(null)
  }
}