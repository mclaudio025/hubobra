'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Volume2, 
  Play, 
  Pause, 
  Sparkles, 
  HardHat, 
  User, 
  ArrowLeft, 
  Send, 
  RefreshCw, 
  Download,
  CheckCircle2,
  Zap,
  Radio,
  Sliders,
  Key,
  ShieldCheck,
  Flame,
  Layers,
  Wand2
} from 'lucide-react';

interface VoiceOption {
  id: string;
  name: string;
  gender: 'female' | 'male';
  badge: string;
  description: string;
  recommendedPersona?: 'lia' | 'ze';
}

const GEMINI_VOICES: VoiceOption[] = [
  { id: 'Aoede', name: 'Aoede', gender: 'female', badge: 'Recomendada ⭐', description: 'Melódica, elegante e expressiva (Ideal para Lia)', recommendedPersona: 'lia' },
  { id: 'Puck', name: 'Puck', gender: 'male', badge: 'Comercial 🔥', description: 'Jovem, animado e enérgico (Promoções e Vendas)', recommendedPersona: 'ze' },
  { id: 'Charon', name: 'Charon', gender: 'male', badge: 'Técnico 👷‍♂️', description: 'Grave, firme e confiável (Ideal para Zé da Obra)', recommendedPersona: 'ze' },
  { id: 'Kore', name: 'Kore', gender: 'female', badge: 'Acolhedora ✨', description: 'Suave, calma e cristalina (Suporte e Pós-venda)', recommendedPersona: 'lia' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'male', badge: 'Direto ⚡', description: 'Voz marcante, rápida e impositiva' },
  { id: 'Zephyr', name: 'Zephyr', gender: 'male', badge: 'Informal ☕', description: 'Descontraído, tom de conversa amigável' },
  { id: 'Leda', name: 'Leda', gender: 'female', badge: 'Executiva 💼', description: 'Firme, dinâmica e corporativa' },
  { id: 'Despina', name: 'Despina', gender: 'female', badge: 'Moderna 🎧', description: 'Tom jovem, natural e despojado' },
];

const PRESETS = [
  {
    title: '🛒 Oferta de Cimento no PIX (Lia)',
    persona: 'lia' as const,
    voice: 'Aoede',
    tone: 'comercial',
    text: 'Olá Claudio! Vi que você adicionou 50 sacos de cimento Poty ao carrinho na HubObra. Com pagamento no PIX você ganha 10% de desconto e frete grátis direto para sua obra em Fortaleza! Quer que eu envie a chave copia e cola agora?'
  },
  {
    title: '👷‍♂️ Cálculo Técnico de Reboco (Zé)',
    persona: 'ze' as const,
    voice: 'Charon',
    tone: 'tecnico',
    text: 'Fala parceiro! Zé da Obra na área. Pra esse reboco de 100 metros quadrados, o traço recomendado é 1 saco de cimento para 3 carrinhos de areia média lavada e 100 ml de aditivo plastificante. Já deixei a quantidade exata para você não ter desperdício.'
  },
  {
    title: '🚚 Rastreio e Entrega Rápida',
    persona: 'lia' as const,
    voice: 'Kore',
    tone: 'calmo',
    text: 'Olá! Seu pedido de materiais na HubObra já foi conferido e o caminhão acabou de sair para entrega. O prazo estimado de chegada no seu endereço é de até 2 horas!'
  },
  {
    title: '🔥 Promoção Relâmpago de Pisos (Puck)',
    persona: 'ze' as const,
    voice: 'Puck',
    tone: 'comercial',
    text: 'Atenção mestre! Porcelanato Elizabeth 84 por 84 retificado por apenas 59 reais e 90 centavos o metro quadrado na HubObra! Estoque limitado, garanta o seu antes que acabe!'
  }
];

export default function VoicePlaygroundPage() {
  // Engine and Voice Selection
  const [engine, setEngine] = useState<'gemini' | 'elevenlabs'>('gemini');
  const [selectedVoice, setSelectedVoice] = useState<string>('Aoede');
  const [persona, setPersona] = useState<'lia' | 'ze'>('lia');
  const [tone, setTone] = useState<string>('comercial');

  // Input Text
  const [customText, setCustomText] = useState(PRESETS[0].text);
  
  // API Key management (saved in localStorage for convenience)
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  // Audio Playback & Generation State
  const [generating, setGenerating] = useState(false);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load API Key from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hubobra_kie_gemini_key');
    if (saved) {
      setApiKey(saved);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('hubobra_kie_gemini_key', key);
  };

  const handleSelectPersona = (p: 'lia' | 'ze') => {
    setPersona(p);
    if (p === 'lia') {
      setSelectedVoice('Aoede');
      setTone('comercial');
    } else {
      setSelectedVoice('Charon');
      setTone('tecnico');
    }
  };

  const handleGenerateAudio = async () => {
    if (!customText.trim()) return;

    try {
      setGenerating(true);
      if (customAudioUrl) {
        URL.revokeObjectURL(customAudioUrl);
        setCustomAudioUrl(null);
      }
      setIsPlaying(false);

      const endpoint = engine === 'gemini' ? '/api/ai/tts-gemini' : '/api/ai/tts-elevenlabs';
      const payload: any = {
        text: customText,
        persona,
        voice: selectedVoice,
        tone,
      };

      if (apiKey.trim()) {
        payload.apiKey = apiKey.trim();
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Falha na requisição' }));
        throw new Error(errorData.error || errorData.details || 'Erro ao gerar áudio');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setCustomAudioUrl(url);

      // Reproduzir automaticamente
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.warn('Autoplay bloqueado pelo navegador:', e));
          setIsPlaying(true);
        }
      }, 100);

    } catch (err: any) {
      alert(`⚠️ ${err.message || 'Erro ao gerar áudio'}`);
      if (err.message?.includes('Chave de API') || err.message?.includes('401')) {
        setShowKeyInput(true);
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 selection:bg-amber-500 selection:text-slate-950">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-400 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a Loja HubObra
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 rounded-xl transition"
            >
              <Key className="h-3.5 w-3.5 text-amber-400" />
              {apiKey ? 'Chave Kie/Gemini Configurada ✓' : 'Configurar Chave Kie/Gemini'}
            </button>

            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full">
              <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
              Gemini Studio TTS (20x Mais Econômico)
            </div>
          </div>
        </div>

        {/* Inline Key Configuration Modal/Drawer */}
        {showKeyInput && (
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Key className="h-4 w-4" />
                Configurar Chave da API (Kie.ai ou Google Gemini)
              </div>
              <button 
                onClick={() => setShowKeyInput(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Fechar
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Cole sua chave da Kie ou do Google AI Studio aqui. Ela é salva de forma segura apenas no navegador (localStorage) para seus testes:
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
                placeholder="Cole sua chave aqui (ex: AIzaSy... ou sua chave da Kie)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={() => {
                  alert('Chave salva com sucesso!');
                  setShowKeyInput(false);
                }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition"
              >
                Salvar
              </button>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 rounded-2xl shadow-xl shadow-amber-500/20 text-slate-950 mb-2">
            <Volume2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Estúdio de Voz com IA &bull; HubObra
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Síntese de voz com as 30 vozes de estúdio do Gemini. Entonação humana, normalização de termos de construção e custo pay-as-you-go.
          </p>
        </div>

        {/* Engine and Persona Selector Bar */}
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-3xl p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Engine Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Wand2 className="h-3.5 w-3.5 text-amber-400" />
                Motor de Voz (Engine)
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setEngine('gemini')}
                  className={`p-3 rounded-xl text-left transition flex items-center justify-between ${
                    engine === 'gemini'
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold flex items-center gap-1">
                      Gemini Flash TTS
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">20x Barato</span>
                    </p>
                    <p className="text-[11px] text-slate-400">30 Vozes &bull; Pay-as-you-go</p>
                  </div>
                </button>

                <button
                  onClick={() => setEngine('elevenlabs')}
                  className={`p-3 rounded-xl text-left transition flex items-center justify-between ${
                    engine === 'elevenlabs'
                      ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold">ElevenLabs</p>
                    <p className="text-[11px] text-slate-400">Multilingual v2</p>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Persona Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-amber-400" />
                Persona da HubObra
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  onClick={() => handleSelectPersona('lia')}
                  className={`p-3 rounded-xl text-left transition flex items-center gap-3 ${
                    persona === 'lia'
                      ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/40 text-orange-300 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    🙋‍♀️
                  </div>
                  <div>
                    <p className="text-xs font-bold">Lia da HubObra</p>
                    <p className="text-[11px] text-slate-400">Atendimento & Vendas</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectPersona('ze')}
                  className={`p-3 rounded-xl text-left transition flex items-center gap-3 ${
                    persona === 'ze'
                      ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm shrink-0">
                    👷‍♂️
                  </div>
                  <div>
                    <p className="text-xs font-bold">Zé da Obra</p>
                    <p className="text-[11px] text-slate-400">Especialista Técnico</p>
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* Voice Selector Grid (Gemini) */}
          {engine === 'gemini' && (
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-amber-400" />
                  Escolha o Timbre de Voz (Gemini Studio Voices)
                </label>
                <span className="text-[11px] text-amber-400 font-medium">
                  Voz Ativa: <strong>{selectedVoice}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {GEMINI_VOICES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVoice(v.id)}
                    className={`p-3 rounded-2xl border text-left transition relative overflow-hidden group ${
                      selectedVoice === v.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-slate-950 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">{v.name}</span>
                      <span className="text-[9px] bg-slate-800/80 text-slate-300 font-mono px-1.5 py-0.5 rounded">
                        {v.gender === 'female' ? 'Feminina' : 'Masculina'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                      {v.description}
                    </p>
                    <div className="mt-2 text-[10px] text-amber-400/90 font-medium">
                      {v.badge}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tone Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Tom / Estilo de Interpretação
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'comercial', label: '🛒 Comercial & Vendedor', desc: 'Entusiasta e acolhedor' },
                { id: 'tecnico', label: '👷‍♂️ Mestre de Obras', desc: 'Seguro, firme e técnico' },
                { id: 'calmo', label: '✨ Atendimento Suave', desc: 'Calmo, claro e empático' },
                { id: 'natural', label: '🎙️ Natural / Neutro', desc: 'Leitura direta e fluida' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    tone === t.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs">{t.label}</p>
                  <p className="text-[10px] text-slate-500 font-normal">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Quick Presets */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            Exemplos Prontos para Testar (1 Clique):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCustomText(p.text);
                  setPersona(p.persona);
                  setSelectedVoice(p.voice);
                  setTone(p.tone);
                }}
                className="p-3.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl text-left transition space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition">
                    {p.title}
                  </span>
                  <span className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-800">
                    Voz: {p.voice}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                  &ldquo;{p.text}&rdquo;
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Live Audio Synthesizer */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              Texto para Síntese de Voz (Pronúncia Fonética Automática)
            </h2>
            <span className="text-xs text-slate-500">
              {customText.length} caracteres
            </span>
          </div>

          <textarea
            rows={4}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Digite qualquer texto que a IA deve falar (suporta unidades como m², kg, valores em R$, Pix, HubObra)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition font-sans leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Normalização fonética ativa para termos de obras e e-commerce</span>
            </div>

            <button
              onClick={handleGenerateAudio}
              disabled={generating || !customText.trim()}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
                  Gerando Áudio no {engine === 'gemini' ? 'Gemini' : 'ElevenLabs'}...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-slate-950" />
                  Gerar e Ouvir Áudio Agora
                </>
              )}
            </button>
          </div>

          {/* Generated Audio Player */}
          {customAudioUrl && (
            <div className="p-5 bg-slate-950 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-2">
                    Áudio Gerado com Sucesso! 
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                      {engine === 'gemini' ? `Gemini (${selectedVoice})` : 'ElevenLabs'}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400">Pronto para atendimento e envio no WhatsApp</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <audio 
                  ref={audioRef}
                  controls 
                  src={customAudioUrl} 
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  className="h-10 w-full sm:w-64 accent-amber-500" 
                />

                <a
                  href={customAudioUrl}
                  download={`audio_${selectedVoice.toLowerCase()}_hubobra.wav`}
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition text-xs flex items-center gap-1.5 shrink-0"
                  title="Baixar Áudio (.wav)"
                >
                  <Download className="h-4 w-4 text-amber-400" />
                  <span className="hidden sm:inline">Baixar</span>
                </a>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}