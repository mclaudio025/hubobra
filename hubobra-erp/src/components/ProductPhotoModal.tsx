import React, { useState, useEffect } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Package,
  MapPin,
  Tag,
  DollarSign,
  Layers,
  Copy,
  Check,
  Image as ImageIcon,
  ExternalLink,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export interface ProductPhotoData {
  id?: string;
  name: string;
  sku: string;
  brand?: string;
  category?: string;
  price?: number;
  stock?: number;
  unit?: string;
  location?: string;
  packaging?: string;
  description?: string;
  image?: string;
}

interface ProductPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductPhotoData | null;
}

export const ProductPhotoModal: React.FC<ProductPhotoModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);

  // Resetar erro ao trocar produto
  useEffect(() => {
    setImgError(false);
    setIsFullscreen(false);
  }, [product?.id, product?.image]);

  // Fechar no ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const hasValidImage = Boolean(product.image && product.image.trim() !== '' && !imgError);

  const handleCopyLink = () => {
    if (product.image) {
      navigator.clipboard.writeText(product.image);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Container Principal do Modal */}
      <div
        className={`bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isFullscreen
            ? 'w-full h-full max-w-none max-h-none rounded-none'
            : 'w-full max-w-4xl max-h-[90vh]'
        }`}
      >
        {/* Cabeçalho do Modal */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  SKU: {product.sku}
                </span>
                {product.brand && (
                  <span className="text-[10px] text-slate-300 font-semibold bg-slate-800 px-1.5 py-0.5 rounded">
                    {product.brand}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white truncate mt-0.5">
                {product.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {hasValidImage && (
              <>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Copiar link da foto"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title={isFullscreen ? 'Reduzir tela' : 'Expandir tela inteira'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-amber-400" />}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500 text-slate-400 hover:text-white transition-colors"
              title="Fechar (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Corpo do Modal: Grid com Foto e Detalhes de Balcão */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Coluna da Imagem (Visualização Ampla) */}
          <div className={`${isFullscreen ? 'md:col-span-8' : 'md:col-span-7'} flex items-center justify-center`}>
            <div className="relative w-full aspect-square max-h-[460px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-3 shadow-inner group">
              {hasValidImage ? (
                <>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain drop-shadow-xl transition-transform duration-300 group-hover:scale-105"
                    onError={() => setImgError(true)}
                  />
                  {/* Badge de Foto Conectada */}
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur border border-slate-700/80 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Catálogo Oficial</span>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 flex flex-col items-center justify-center max-w-sm">
                  <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 shadow-md">
                    <Package className="w-10 h-10 text-slate-600 stroke-[1.5]" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">Foto Não Cadastrada</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Este material ainda não possui fotografia cadastrada no catálogo do Supabase.
                  </p>
                  <div className="mt-4 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Pode ser anexada no cadastro de produtos</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Coluna de Ficha Rápida do Balcão */}
          <div className={`${isFullscreen ? 'md:col-span-4' : 'md:col-span-5'} flex flex-col justify-between h-full space-y-4`}>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Material
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                  {product.name}
                </h2>
                {product.category && (
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 border border-blue-500/30 text-blue-300">
                    {product.category}
                  </span>
                )}
              </div>

              {/* Bloco de Preço Oficial */}
              {product.price !== undefined && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-md">
                  <span className="text-[10px] uppercase font-bold text-emerald-400/90 block">
                    Preço Unitário de Venda
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xs text-emerald-400 font-bold">R$</span>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                      {product.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold ml-1">
                      / {product.unit || 'UN'}
                    </span>
                  </div>
                </div>
              )}

              {/* Informações de Galpão e Estoque */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {product.stock !== undefined && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Estoque Local</span>
                    <span className="text-sm font-black text-cyan-400 font-mono mt-0.5 block">
                      {product.stock} {product.unit || 'UN'}
                    </span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Local no Depósito</span>
                  <span className="text-xs font-bold text-slate-200 mt-0.5 block truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                    {product.location || 'Pátio Central'}
                  </span>
                </div>
              </div>

              {product.packaging && (
                <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Embalagem / Apresentação</span>
                  <span className="font-semibold text-slate-200">{product.packaging}</span>
                </div>
              )}

              {product.description && (
                <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Aplicação / Detalhes</span>
                  <p className="text-slate-300 line-clamp-4 leading-relaxed">{product.description}</p>
                </div>
              )}
            </div>

            {/* Ações Rápidas no Rodapé */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px] font-mono">
                Pressione <kbd className="px-1.5 py-0.5 bg-slate-800 text-amber-400 rounded border border-slate-700 font-bold">ESC</kbd> para fechar
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
              >
                Concluído
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
