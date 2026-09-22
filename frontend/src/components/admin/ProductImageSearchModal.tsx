'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  Check, 
  Loader2, 
  Image as ImageIcon, 
  ExternalLink, 
  Barcode, 
  Sparkles,
  Download,
  ZoomIn
} from 'lucide-react';
import { useProducts } from '../../app/hooks/useApi';
import { getImageUrl } from '../../utils/imageUrl';

export interface ImageSearchResult {
  url: string;
  title: string;
  source: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

export interface UploadedImage {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  cardUrl?: string;
  mediumUrl?: string;
  size?: number;
  width?: number;
  height?: number;
}

interface ProductImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImages: (images: UploadedImage[]) => void;
  initialQuery?: string;
  initialEan?: string;
  initialBrand?: string;
  productId?: string;
}

export default function ProductImageSearchModal({
  isOpen,
  onClose,
  onSelectImages,
  initialQuery = '',
  initialEan = '',
  initialBrand = '',
  productId,
}: ProductImageSearchModalProps) {
  const { searchProductImages, downloadProductImageFromUrl } = useProducts();

  const [query, setQuery] = useState(initialQuery);
  const [ean, setEan] = useState(initialEan);
  const [brand, setBrand] = useState(initialBrand);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<ImageSearchResult[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<ImageSearchResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar dados iniciais ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setEan(initialEan);
      setBrand(initialBrand);
      setSelectedUrls(new Set());
      setError(null);
      setPreviewImage(null);

      // Se tiver termo ou EAN, faz a busca automaticamente na abertura
      if (initialQuery.trim() || initialEan.trim()) {
        executeSearch(initialQuery, initialEan, initialBrand);
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }
  }, [isOpen, initialQuery, initialEan, initialBrand]);

  const executeSearch = async (searchQuery: string, searchEan: string, searchBrand: string) => {
    if (!searchQuery.trim() && !searchEan.trim()) {
      setError('Informe o nome do produto ou o código de barras para pesquisar.');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);
    setSelectedUrls(new Set());

    try {
      const data = await searchProductImages({
        query: searchQuery.trim(),
        ean: searchEan.trim(),
        brand: searchBrand.trim(),
        limit: 20,
      });

      setResults(data || []);
      if (!data || data.length === 0) {
        setError('Nenhuma imagem encontrada para este produto. Tente ajustar os termos de busca.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao pesquisar imagens.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query, ean, brand);
  };

  const toggleSelectUrl = (url: string) => {
    setSelectedUrls((prev) => {
      const updated = new Set(prev);
      if (updated.has(url)) {
        updated.delete(url);
      } else {
        updated.add(url);
      }
      return updated;
    });
  };

  const handleSelectAll = () => {
    if (selectedUrls.size === results.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(results.map((r) => r.url)));
    }
  };

  const handleImportSelected = async () => {
    if (selectedUrls.size === 0) return;

    setDownloading(true);
    setError(null);
    const urlsToDownload = Array.from(selectedUrls);
    setDownloadProgress({ current: 0, total: urlsToDownload.length });

    const importedImages: UploadedImage[] = [];

    try {
      for (let i = 0; i < urlsToDownload.length; i++) {
        const url = urlsToDownload[i];
        setDownloadProgress({ current: i + 1, total: urlsToDownload.length });

        try {
          const res = await downloadProductImageFromUrl({
            imageUrl: url,
            productId,
            alt: query || 'Imagem do produto',
            isMain: i === 0,
          });

          if (res?.uploadResult) {
            importedImages.push({
              id: res.uploadResult.id,
              filename: res.uploadResult.filename,
              originalName: res.uploadResult.originalName,
              url: getImageUrl(res.uploadResult.url),
              thumbnailUrl: getImageUrl(res.uploadResult.thumbnailUrl || res.uploadResult.url),
              cardUrl: getImageUrl(res.uploadResult.cardUrl || res.uploadResult.url),
              mediumUrl: getImageUrl(res.uploadResult.mediumUrl || res.uploadResult.url),
              size: res.uploadResult.size,
              width: res.uploadResult.width,
              height: res.uploadResult.height,
            });
          }
        } catch (downloadErr: any) {
          console.error(`Erro ao baixar imagem (${url}):`, downloadErr);
        }
      }

      if (importedImages.length > 0) {
        onSelectImages(importedImages);
        onClose();
      } else {
        setError('Não foi possível processar nenhuma das imagens selecionadas.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro durante o download e otimização das fotos.');
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Modal */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Buscar Imagens do Produto</h2>
              <p className="text-xs text-gray-500">
                Pesquise por código de barras EAN, nome do produto ou marca para encontrar fotos oficiais
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={downloading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário de Busca */}
        <form onSubmit={handleSearchSubmit} className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5 text-blue-600" />
                Código de Barras (EAN-13)
              </label>
              <input
                type="text"
                value={ean}
                onChange={(e) => setEan(e.target.value)}
                placeholder="Ex: 7891435043761"
                className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
              />
            </div>

            <div className="md:col-span-5">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Nome do Produto / Descrição
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: Placa Cega 4x2 Lux2 Tramontina"
                className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="md:col-span-3 flex gap-2">
              <button
                type="submit"
                disabled={loading || downloading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Buscar
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Mensagem de Erro / Alerta */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Grade de Resultados */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-medium text-gray-600">Pesquisando catálogos e imagens na internet...</p>
              <p className="text-xs text-gray-400">Consultando bases de fabricantes e distribuidores</p>
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {results.length} imagens encontradas — Clique para selecionar
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {selectedUrls.size === results.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                  </button>
                  <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                    {selectedUrls.size} selecionada(s)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {results.map((img, idx) => {
                  const isSelected = selectedUrls.has(img.url);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSelectUrl(img.url)}
                      className={`group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 bg-white hover:shadow-lg flex flex-col ${
                        isSelected
                          ? 'border-blue-600 ring-2 ring-blue-500/30 shadow-md'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {/* Badge de Seleção */}
                      <div
                        className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white/80 backdrop-blur-sm text-transparent group-hover:text-gray-400 border border-gray-300'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>

                      {/* Botão de Zoom */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(img);
                        }}
                        className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        title="Visualizar em tamanho real"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>

                      {/* Imagem */}
                      <div className="w-full aspect-square bg-gray-50 flex items-center justify-center p-3 overflow-hidden">
                        <img
                          src={img.thumbnailUrl || img.url}
                          alt={img.title}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>

                      {/* Rodapé do Card */}
                      <div className="p-2.5 bg-gray-50/80 border-t border-gray-100 flex-1 flex flex-col justify-between">
                        <p className="text-xs text-gray-700 font-medium line-clamp-2 leading-snug" title={img.title}>
                          {img.title}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                          <span className="truncate max-w-[100px]">{img.source}</span>
                          {img.width && img.height && (
                            <span className="font-mono">{img.width}x{img.height}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : hasSearched ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-2">
              <ImageIcon className="w-10 h-10 stroke-[1.5] text-gray-300" />
              <p className="text-sm font-semibold text-gray-600">Nenhum resultado encontrado</p>
              <p className="text-xs text-gray-400 text-center max-w-sm">
                Tente simplificar o nome do produto ou conferir se o código de barras (EAN) está correto.
              </p>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Search className="w-10 h-10 stroke-[1.5] text-gray-300" />
              <p className="text-sm font-semibold text-gray-600">Pesquise para ver as imagens</p>
              <p className="text-xs text-gray-400">Digite o nome ou EAN do produto e clique em "Buscar".</p>
            </div>
          )}
        </div>

        {/* Footer com Ações */}
        <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={downloading}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-3">
            {downloading && (
              <span className="text-xs text-blue-600 font-medium flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Baixando e otimizando {downloadProgress.current} de {downloadProgress.total}...
              </span>
            )}
            <button
              type="button"
              onClick={handleImportSelected}
              disabled={selectedUrls.size === 0 || downloading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Importar {selectedUrls.size > 0 ? `(${selectedUrls.size})` : ''} Imagem(ns)
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Preview Ampliado */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] p-4 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 truncate pr-4">{previewImage.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-50 min-h-[300px]">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[60vh] max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="pt-3 flex items-center justify-between text-xs text-gray-500">
              <span>Fonte: {previewImage.source}</span>
              <a
                href={previewImage.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                Abrir imagem original <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
