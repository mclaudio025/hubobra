'use client';

import React, { useState } from 'react';
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
  Radio
} from 'lucide-react';

export default function VoicePlaygroundPage() {
  // Static test audio states
  const [playingLia, setPlayingLia] = useState(false);
  const [playingZe, setPlayingZe] = useState(false);

  // Custom text synthesizer state
  const [customText, setCustomText] = useState(
    'Olá Claudio! Vi que você adicionou 50 sacos de cimento Poty ao carrinho. Quer que eu verifique a entrega com frete grátis para sua obra agora mesmo?'
  );
  const [persona, setPersona] = useState<'lia' | 'ze'>('lia');
  const [generating, setGenerating] = useState(false);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);

  const handlePlayStatic = (type: 'lia' | 'ze') => {
    const audioPath = type === 'lia' ? '/audio/lia_elevenlabs.mp3' : '/audio/ze_elevenlabs.mp3';
    const audio = new Audio(audioPath);
    
    if (type === 'lia') {
      setPlayingLia(true);
      audio.onended = () => setPlayingLia(false);
    } else {
      setPlayingZe(true);
      audio.onended = () => setPlayingZe(false);
    }

    audio.play().catch(e => {
      console.error('Erro ao reproduzir áudio:', e);
      if (type === 'lia') setPlayingLia(false);
      else setPlayingZe(false);
    });
  };

  const handleGenerateCustomAudio = async () => {
    if (!customText.trim()) return;

    try {
      setGenerating(true);
      setCustomAudioUrl(null);

      const res = await fetch('/api/ai/tts-elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: customText, persona })
      });

      if (!res.ok) {
        throw new Error('Falha ao gerar áudio com ElevenLabs');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setCustomAudioUrl(url);

      const audio = new Audio(url);
      audio.play().catch(e => console.warn('Autoplay bloqueado pelo navegador:', e));
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar áudio');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-orange-400 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a Loja
          </Link>

          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1 rounded-full">
            <Radio className="h-3.5 w-3.5 animate-pulse text-orange-400" />
            ElevenLabs Multilingual v2 Ativo
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl shadow-lg shadow-orange-500/20 text-white mb-2">
            <Volume2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Voice Playground &bull; HubObra AI
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Ouça a naturalidade das vozes geradas com a sua chave ElevenLabs e teste novas frases de vendas em tempo real.
          </p>
        </div>

        {/* Generated Sample Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Lia */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-orange-500/50 transition relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-bold text-xl text-white shadow-md">
                  🙋‍♀️
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Lia da HubObra</h3>
                  <p className="text-xs text-orange-400 font-medium">Vendedora Consultiva & Atendente</p>
                </div>
              </div>

              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                Voz: Sarah/Bella
              </span>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans italic">
              &ldquo;Olá, Claudio! Tudo bem? Aqui é a Lia da HubObra! Separei os 30 sacos de cimento e a argamassa que você pediu com 10% de desconto no PIX. Já organizei tudo e consigo colocar no caminhão que sai hoje à tarde para sua obra em Fortaleza! Quer que eu envie a chave copia e cola?&rdquo;
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => handlePlayStatic('lia')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition active:scale-95"
              >
                {playingLia ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
                {playingLia ? 'Reproduzindo...' : 'Ouvir Áudio da Lia'}
              </button>

              <a
                href="/audio/lia_elevenlabs.mp3"
                download="lia_hubobra_elevenlabs.mp3"
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition text-xs flex items-center gap-1"
                title="Baixar MP3"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Card 2: Zé da Obra */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-amber-500/50 transition relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 flex items-center justify-center font-bold text-xl text-white shadow-md">
                  👷‍♂️
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Zé da Obra</h3>
                  <p className="text-xs text-amber-400 font-medium">Especialista Técnico de Engenharia</p>
                </div>
              </div>

              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                Voz: Adam
              </span>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans italic">
              &ldquo;Fala parceiro! Zé da Obra na área. Pra esse reboco de 100 metros quadrados, o traço ideal é 1 saco de cimento para 3 carrinhos de areia média lavada e 100 ml de aditivo plastificante. Já deixei a conta certinha pra não faltar material nem ter desperdício!&rdquo;
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => handlePlayStatic('ze')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-95"
              >
                {playingZe ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-slate-950" />}
                {playingZe ? 'Reproduzindo...' : 'Ouvir Áudio do Zé'}
              </button>

              <a
                href="/audio/ze_elevenlabs.mp3"
                download="ze_hubobra_elevenlabs.mp3"
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition text-xs flex items-center gap-1"
                title="Baixar MP3"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          </div>

        </div>

        {/* Live Synthesizer Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-400" />
                Gerador de Áudio ao Vivo (Qualquer Frase)
              </h2>
              <p className="text-xs text-slate-400">
                Digite qualquer texto de orçamento ou dúvida de obra para gerar o áudio na hora via ElevenLabs.
              </p>
            </div>

            {/* Persona Selector */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                onClick={() => setPersona('lia')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  persona === 'lia'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🙋‍♀️ Lia
              </button>
              <button
                onClick={() => setPersona('ze')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  persona === 'ze'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👷‍♂️ Zé da Obra
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <textarea
              rows={3}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Digite o texto que a IA deve falar..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition font-sans"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <span className="text-xs text-slate-500">
                {customText.length} caracteres (~{(customText.length / 15).toFixed(0)} segundos de áudio)
              </span>

              <button
                onClick={handleGenerateCustomAudio}
                disabled={generating || !customText.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Gerando Áudio no ElevenLabs...
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4" />
                    Gerar & Reproduzir Áudio Agora
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Audio Player for generated custom audio */}
          {customAudioUrl && (
            <div className="p-4 bg-slate-950 border border-orange-500/30 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/20 text-orange-400 rounded-xl">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Áudio Gerado com Sucesso!</p>
                  <p className="text-[11px] text-slate-400">Pronto para envio no WhatsApp</p>
                </div>
              </div>

              <audio controls src={customAudioUrl} className="h-10 max-w-xs" />
            </div>
          )}

        </div>

      </div>
    </div>
  );
}