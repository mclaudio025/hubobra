import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  X,
  Plus,
  Minus,
  CheckCircle2,
  Package,
  MapPin,
  Headphones,
  RotateCcw,
  ShoppingCart,
  Trash2,
  Search,
  Check,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { LocalProduct, SaleItem } from '../db/db';
import { parseNumberFromWords } from '../utils/voiceOrderParser';

interface VoiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableProducts: LocalProduct[];
  onAddItemsToOrder: (items: SaleItem[]) => void;
}

export const VoiceOrderModal: React.FC<VoiceOrderModalProps> = ({
  isOpen,
  onClose,
  availableProducts,
  onAddItemsToOrder,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [matchingProducts, setMatchingProducts] = useState<LocalProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<LocalProduct | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [sessionCart, setSessionCart] = useState<Array<{ product: LocalProduct; quantity: number }>>([]);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Efeito sonoro via Web Audio API para feedback auditivo no fone
  const playChime = (type: 'start' | 'match' | 'add' | 'success') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      if (type === 'start') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      } else if (type === 'match') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      } else if (type === 'add') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.09, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // AudioContext fallback silencioso
    }
  };

  // Motor de Busca Inteligente por Palavras-Chave Faladas
  const performSearch = (queryText: string) => {
    let clean = queryText
      .toLowerCase()
      .replace(/[,\.;\?!]/g, ' ')
      .replace(/\b(quero|coloca|coloque|adiciona|adicione|bota|bote|me vê|me passa|manda|preciso de|lança|lance|por favor)\b/gi, '')
      .trim();

    // Se o usuário falou um número isolado antes (ex: "5 cola tekbond"), extrai como sugestão de quantidade
    const numParsed = parseNumberFromWords(clean);
    if (numParsed && numParsed.value > 0) {
      setQuantity(numParsed.value);
      clean = numParsed.remainingText;
    }

    clean = clean
      .replace(/^\b(sacos?|scs?|barras?|caixas?|cxs?|latas?|peças?|pcs?|metros?|tubos?|unidades?|uns?|quilos?|kgs?)\s*(de|do|da)?\s*/i, '')
      .replace(/^\b(de|do|da|com)\s+/i, '')
      .trim();

    if (!clean) {
      setMatchingProducts([]);
      return;
    }

    const tokens = clean.split(/\s+/).filter((t) => t.length > 1);

    // Ranqueia os produtos do estoque por relevância de nome, categoria, sku e referência
    const scored = availableProducts
      .map((p) => {
        const name = p.name.toLowerCase();
        const cat = p.category.toLowerCase();
        const sku = p.sku.toLowerCase();
        const ref = (p.reference || '').toLowerCase();
        let score = 0;

        for (const t of tokens) {
          if (name.includes(t)) score += 5;
          if (ref.includes(t)) score += 4;
          if (sku.includes(t)) score += 6;
          if (cat.includes(t)) score += 2;
        }

        return { product: p, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const results = scored.map((s) => s.product);

    setMatchingProducts(results);

    // Se houver resultados, seleciona automaticamente o primeiro (mais relevante)
    if (results.length > 0) {
      setSelectedProduct(results[0]);
      playChime('match');
    }
  };

  const startListening = () => {
    setRecognitionError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecognitionError('Reconhecimento de voz não suportado pelo navegador. Digite no campo de busca ou clique nos exemplos.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        playChime('start');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        setSearchQuery(currentTranscript);
        performSearch(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        if (event.error !== 'no-speech') {
          setRecognitionError(`Aviso do microfone: ${event.error}. Use os atalhos rápidos ou digite o nome.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error(e);
      setRecognitionError('Permissão de microfone necessária ou erro ao inicializar.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignora
      }
      setIsListening(false);
    }
  };

  // Simular voz ao clicar em chips rápidos de palavras-chave
  const handleKeywordChip = (keyword: string) => {
    setTranscript(keyword);
    setSearchQuery(keyword);
    performSearch(keyword);
  };

  // Troca de variação via Dropdown / Lista Suspensa
  const handleSelectVariation = (productId: string) => {
    const found = availableProducts.find((p) => p.id === productId);
    if (found) {
      setSelectedProduct(found);
      playChime('match');
    }
  };

  // Efeito ao abrir/fechar o modal
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setSearchQuery('');
      setMatchingProducts([]);
      setSelectedProduct(null);
      setQuantity(1);
      setSessionCart([]);
      setRecognitionError(null);

      // Pré-carrega os produtos mais populares no dropdown se nenhum termo for falado
      if (availableProducts.length > 0) {
        const initialMatches = availableProducts.slice(0, 10);
        setMatchingProducts(initialMatches);
        setSelectedProduct(initialMatches[0]);
      }

      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Adicionar item atual à fila de lançamentos rápidos
  const handleAddCurrentToSession = () => {
    if (!selectedProduct) return;

    playChime('add');

    setSessionCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === selectedProduct.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }
      return [...prev, { product: selectedProduct, quantity }];
    });

    // Reseta quantidade para 1 para o próximo item
    setQuantity(1);
  };

  const handleRemoveFromSession = (idx: number) => {
    setSessionCart((prev) => prev.filter((_, i) => i !== idx));
  };

  // INSERIR DIRETO NO PEDIDO E FECHAR MODAL
  const handleInsertDirectlyToOrder = () => {
    let finalItems: Array<{ product: LocalProduct; quantity: number }> = [];

    if (sessionCart.length > 0) {
      finalItems = [...sessionCart];
    } else if (selectedProduct) {
      finalItems = [{ product: selectedProduct, quantity }];
    }

    if (finalItems.length === 0) {
      alert('Selecione um produto antes de inserir!');
      return;
    }

    const saleItems: SaleItem[] = finalItems.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      sku: item.product.sku,
      reference: item.product.reference,
      unit: item.product.unit,
      unitPrice: item.product.price,
      cost: item.product.cost,
      quantity: item.quantity,
      discount: 0,
      total: item.product.price * item.quantity,
      location: item.product.location || 'Galpão Central',
      packaging: item.product.packaging,
      observations: '🎙️ Lançado por Voz Inteligente',
    }));

    onAddItemsToOrder(saleItems);
    playChime('success');
    onClose();
  };

  const lineTotal = (selectedProduct ? selectedProduct.price : 0) * quantity;
  const sessionTotal = sessionCart.reduce((acc, i) => acc + i.product.price * i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col font-sans max-h-[94vh]">
        {/* HEADER */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Lançamento por Voz Inteligente</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Palavra-Chave + Dropdown
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Fale apenas o nome do material (ex: <em>"Cola Tekbond"</em>, <em>"Cimento"</em>) e escolha a gramatura na lista suspensa!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          {/* BARRA DO MICROFONE & PALAVRA-CHAVE FALADA */}
          <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-inner">
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl shrink-0 ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/40 animate-pulse ring-4 ring-red-500/20'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 shadow-amber-500/20'
                }`}
                title={isListening ? 'Clique para pausar microfone' : 'Clique para ativar microfone'}
              >
                {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isListening ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                    }`}
                  ></span>
                  <span className="text-xs font-bold text-slate-200">
                    {isListening ? 'Ouvindo microfone... Fale a palavra-chave do produto' : 'Microfone pausado (Clique no ícone para ouvir)'}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      performSearch(e.target.value);
                    }}
                    placeholder="Palavra-chave identificada pela voz ou digite aqui..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setTranscript('');
                        performSearch('');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ATALHOS RÁPIDOS DE PALAVRAS-CHAVES (TESTES RÁPIDOS) */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-900">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Palavras-chave rápidas:</span>
              {[
                { label: 'Cola Tekbond', q: 'cola tekbond' },
                { label: 'Cimento Poty', q: 'cimento poty' },
                { label: 'Argamassa Quartzolit', q: 'argamassa quartzolit' },
                { label: 'Adaptador Curto', q: 'adaptador curto' },
                { label: 'Bianco Adesivo', q: 'bianco' },
                { label: 'Tubo PVC Krona', q: 'tubo krona' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleKeywordChip(item.q)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-[11px] font-medium text-slate-300 hover:text-amber-300 rounded-xl transition-all"
                >
                  "{item.label}"
                </button>
              ))}
            </div>

            {recognitionError && (
              <p className="text-[11px] text-rose-400 font-medium bg-rose-950/40 p-2 rounded-xl border border-rose-800/40">
                {recognitionError}
              </p>
            )}
          </div>

          {/* PASSO 1: LISTA SUSPENSA DE MODELOS / GRAMATURAS */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>1. Escolha o Modelo / Gramatura / Tamanho (Lista Suspensa):</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {matchingProducts.length} opção(ões) encontrada(s)
              </span>
            </div>

            <div className="relative">
              <select
                value={selectedProduct ? selectedProduct.id : ''}
                onChange={(e) => handleSelectVariation(e.target.value)}
                className="w-full bg-slate-900 border-2 border-amber-500/60 hover:border-amber-500 focus:border-amber-400 rounded-2xl p-3.5 text-sm font-bold text-white focus:outline-none shadow-lg cursor-pointer transition-colors appearance-none"
              >
                {matchingProducts.length === 0 ? (
                  <option value="" disabled>
                    Nenhum produto encontrado. Fale ou digite outra palavra-chave.
                  </option>
                ) : (
                  matchingProducts.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white py-2">
                      {p.name} — R$ {p.price.toFixed(2)} [Estoque: {p.stock} {p.unit}] (SKU: {p.sku})
                    </option>
                  ))
                )}
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-amber-400">
                <ArrowRight className="w-4 h-4 rotate-90" />
              </div>
            </div>

            {/* CARD DE DETALHES DO PRODUTO SELECIONADO NA LISTA */}
            {selectedProduct && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-snug">{selectedProduct.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="font-mono text-amber-400 font-semibold">{selectedProduct.sku}</span>
                      <span>•</span>
                      <span>{selectedProduct.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-slate-300">
                        <MapPin className="w-2.5 h-2.5 text-slate-400" />
                        {selectedProduct.location || 'Galpão Central'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                  <span className="text-[10px] text-slate-400">Preço Unitário:</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    R$ {selectedProduct.price.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">/ {selectedProduct.unit}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Estoque: <strong className="text-emerald-400">{selectedProduct.stock} {selectedProduct.unit}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* PASSO 2: SELETOR DE QUANTIDADE (SEM PRECISAR DIGITAR) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>2. Selecione a Quantidade Desejada (Inicia em 1):</span>
              </label>
              <button
                type="button"
                onClick={() => setQuantity(1)}
                className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Resetar para 1
              </button>
            </div>

            {/* CONTADOR CENTRAL COM BOTÕES GRANDES */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-7 flex items-center justify-between bg-slate-900 border border-slate-700 rounded-2xl p-1.5">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center font-black text-xl transition-all shadow"
                  title="Diminuir 1"
                >
                  <Minus className="w-5 h-5 stroke-[2.5]" />
                </button>

                <div className="text-center px-4">
                  <span className="text-3xl font-black font-mono text-amber-400">{quantity}</span>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                    {selectedProduct ? selectedProduct.unit : 'UNIDADE(S)'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center font-black text-xl transition-all shadow"
                  title="Aumentar 1"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              {/* VALOR TOTAL DO ITEM */}
              <div className="sm:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center sm:text-right flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Deste Item:
                </span>
                <span className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                  R$ {lineTotal.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {quantity} x R$ {(selectedProduct ? selectedProduct.price : 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* BOTÕES RÁPIDOS DE INCREMENTO (+1, +2, +5, +10, +20, +50, +100) */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Botões de Ajuste Rápido (Clique para Somar):
              </span>
              <div className="grid grid-cols-7 gap-1.5">
                {[1, 2, 5, 10, 20, 50, 100].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => setQuantity((prev) => prev + inc)}
                    className="py-2 bg-slate-900 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500 text-xs font-mono font-bold text-slate-200 hover:text-amber-300 rounded-xl transition-all active:scale-95 shadow-sm"
                  >
                    +{inc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* LISTA TEMPORÁRIA DA SESSÃO SE O USUÁRIO LANÇOU VÁRIOS ITENS */}
          {sessionCart.length > 0 && (
            <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-3.5 space-y-2.5 animate-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center justify-between text-xs">
                <h5 className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Itens no Carrinho da Sessão de Voz ({sessionCart.length})</span>
                </h5>
                <span className="font-mono font-black text-emerald-300 text-sm">
                  Subtotal: R$ {sessionTotal.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sessionCart.map((it, cIdx) => (
                  <div
                    key={cIdx}
                    className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="truncate min-w-0 pr-2">
                      <p className="font-bold text-white truncate text-xs">{it.product.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        <strong className="text-amber-400">{it.quantity} {it.product.unit}</strong> x R$ {it.product.price.toFixed(2)} = <strong className="text-emerald-400 font-bold">R$ {(it.quantity * it.product.price).toFixed(2)}</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFromSession(cIdx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                      title="Remover da lista"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION FOOTER */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setTranscript('');
                setSearchQuery('');
                setQuantity(1);
                setSessionCart([]);
              }}
              className="px-3.5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors w-1/2 sm:w-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Limpar</span>
            </button>

            <button
              type="button"
              disabled={!selectedProduct}
              onClick={handleAddCurrentToSession}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-slate-700 w-1/2 sm:w-auto"
              title="Adiciona à lista e continua no fone para falar o próximo material"
            >
              <Plus className="w-4 h-4" />
              <span>+ Lançar Mais Itens</span>
            </button>
          </div>

          {/* BOTÃO PRINCIPAL: INSERIR NO PEDIDO */}
          <button
            type="button"
            disabled={!selectedProduct && sessionCart.length === 0}
            onClick={handleInsertDirectlyToOrder}
            className="w-full sm:flex-1 py-3.5 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all active:scale-[0.99]"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>
              {sessionCart.length > 0
                ? `Inserir ${sessionCart.length} Item(ns) no Pedido • Total R$ ${sessionTotal.toFixed(2)}`
                : selectedProduct
                ? `Inserir ${quantity}x ${selectedProduct.name.split('-')[0].trim()} no Pedido • R$ ${lineTotal.toFixed(2)}`
                : 'Selecione um Produto'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
