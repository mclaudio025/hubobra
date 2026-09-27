'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import {
  Search,
  Bot,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Building2,
  Tag,
  Barcode,
  Layers,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExtractedProduct {
  store: string;
  storeLogo: string;
  productId: string;
  name: string;
  brand: string;
  ean: string;
  price: number;
  listPrice: number;
  available: boolean;
  url: string;
  image: string;
  categories: string[];
  description: string;
  alreadyInCatalog?: boolean;
  existingProduct?: {
    id: string;
    sku: string;
    price: number;
  };
}

const QUICK_SEARCH_PILLS = [
  'Tinta Suvinil 18L',
  'Cimento CP II 50kg',
  'Argamassa Quartzolit AC3',
  'Porcelanato 80x80',
  'Tubo Tigre 100mm',
  'Disjuntor Bipolar Steck',
  'Válvula Hydra Max',
  'Torneira Docol',
];

export default function ExtractorAdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importingBulk, setImportingBulk] = useState(false);
  const [products, setProducts] = useState<ExtractedProduct[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

  const handleSearch = async (queryToSearch?: string) => {
    const query = queryToSearch !== undefined ? queryToSearch : searchTerm;
    if (!query.trim()) {
      toast({
        title: 'Digite um termo de busca',
        description: 'Ex: Tinta Suvinil, Argamassa, Cimento, Tubo Tigre...',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res = await fetch(
        `${API_URL}/products/extractor/search?query=${encodeURIComponent(query.trim())}`,
        { headers }
      );

      // Fallback para rota local se necessário
      if (!res.ok) {
        res = await fetch(
          `/api/products/extractor/search?query=${encodeURIComponent(query.trim())}`,
          { headers }
        );
      }

      if (!res.ok) throw new Error('Falha ao consultar Home Centers');

      const data = await res.json();
      setProducts(data.products || []);
      setSelectedItems([]);

      if (!data.products || data.products.length === 0) {
        toast({
          title: 'Nenhum produto encontrado',
          description: `Nenhum item localizado nas lojas para "${query}". Tente outro termo.`,
        });
      } else {
        toast({
          title: 'Varredura Concluída!',
          description: `${data.products.length} produtos de referência encontrados nas grandes redes.`,
        });
      }
    } catch (err: any) {
      toast({
        title: 'Erro na varredura',
        description: err.message || 'Falha ao conectar com os Home Centers.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportSingle = async (item: ExtractedProduct) => {
    setImportingId(item.productId);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        items: [
          {
            name: item.name,
            brand: item.brand,
            ean: item.ean,
            sku: item.ean || `EAN-${Date.now()}`,
            price: item.price,
            comparePrice: item.listPrice > item.price ? item.listPrice : Math.round(item.price * 1.15 * 100) / 100,
            cost: Math.round(item.price * 0.70 * 100) / 100,
            stock: 50,
            image: item.image,
            description: item.description,
            categoryName: item.categories?.[0] || '',
            store: item.store,
          },
        ],
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res = await fetch(`${API_URL}/products/extractor/import`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        res = await fetch('/api/products/extractor/import', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error('Falha ao importar produto');
      const data = await res.json();

      if (data.imported > 0) {
        setImportedIds((prev) => new Set(prev).add(item.productId));
        toast({
          title: '✅ Produto Importado!',
          description: `"${item.name}" foi cadastrado no seu catálogo com foto HD e estoque inicial.`,
        });
      } else if (data.skipped > 0) {
        toast({
          title: 'Item já existente',
          description: 'Este produto já consta no seu catálogo.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao importar',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setImportingId(null);
    }
  };

  const handleImportBulk = async () => {
    const itemsToImport = filteredProducts.filter((p) =>
      selectedItems.includes(p.productId)
    );

    if (itemsToImport.length === 0) {
      toast({
        title: 'Selecione produtos',
        description: 'Marque pelo menos um produto para importar.',
        variant: 'destructive',
      });
      return;
    }

    setImportingBulk(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        items: itemsToImport.map((item) => ({
          name: item.name,
          brand: item.brand,
          ean: item.ean,
          sku: item.ean || `EAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          price: item.price,
          comparePrice: item.listPrice > item.price ? item.listPrice : Math.round(item.price * 1.15 * 100) / 100,
          cost: Math.round(item.price * 0.70 * 100) / 100,
          stock: 50,
          image: item.image,
          description: item.description,
          categoryName: item.categories?.[0] || '',
          store: item.store,
        })),
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res = await fetch(`${API_URL}/products/extractor/import`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        res = await fetch('/api/products/extractor/import', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error('Falha na importação em massa');
      const data = await res.json();

      const newImported = new Set(importedIds);
      itemsToImport.forEach((it) => newImported.add(it.productId));
      setImportedIds(newImported);
      setSelectedItems([]);

      toast({
        title: '🎉 Importação Concluída!',
        description: `${data.imported} novos produtos adicionados ao seu catálogo com sucesso!`,
      });
    } catch (err: any) {
      toast({
        title: 'Erro na importação em massa',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setImportingBulk(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredProducts.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredProducts.map((p) => p.productId));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const normalize = (str: string) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const filteredProducts = products.filter((p) => {
    if (selectedStore === 'all') return true;
    return normalize(p.store).includes(normalize(selectedStore));
  });

  const carajasCount = products.filter((p) => normalize(p.store).includes('carajas')).length;
  const acalCount = products.filter((p) => normalize(p.store).includes('acal')).length;
  const normatelCount = products.filter((p) => normalize(p.store).includes('normatel')).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-6 rounded-2xl border border-emerald-800/40 text-white shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Bot className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Robô Extrator de Home Centers
              <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black">
                Inteligência 3-Lojas
              </span>
            </h1>
          </div>
          <p className="text-slate-300 text-sm max-w-2xl">
            Conectado às APIs oficiais de <strong>Carajás</strong>, <strong>Acal</strong> e <strong>Normatel</strong>. 
            Importe produtos com fotos HD originais do CDN VTEX, código EAN oficial, marca e preços de referência para seu catálogo em 1 clique.
          </p>
        </div>
      </div>

      {/* Search Controls */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Search className="h-4 w-4 text-emerald-600" />
            Pesquisa Unificada nos Concorrentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="Digite o nome do produto, marca ou código de barras EAN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-4 pr-10 py-6 text-base rounded-xl border-slate-300 shadow-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <Button
              onClick={() => handleSearch()}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 rounded-xl font-semibold shadow-md flex items-center gap-2 text-base transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Varrendo Lojas...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Buscar Produtos
                </>
              )}
            </Button>
          </div>

          {/* Quick Search Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Tag className="h-3 w-3" /> Sugestões Rápidas:
            </span>
            {QUICK_SEARCH_PILLS.map((pill) => (
              <button
                key={pill}
                onClick={() => {
                  setSearchTerm(pill);
                  handleSearch(pill);
                }}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-slate-600 transition-all"
              >
                {pill}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results Header & Filters */}
      {products.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          {/* Store Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedStore('all')}
              className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all ${
                selectedStore === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todas ({products.length})
            </button>
            <button
              onClick={() => setSelectedStore('carajas')}
              className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all ${
                selectedStore === 'carajas'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🔵 Carajás ({carajasCount})
            </button>
            <button
              onClick={() => setSelectedStore('acal')}
              className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all ${
                selectedStore === 'acal'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🟢 Acal ({acalCount})
            </button>
            <button
              onClick={() => setSelectedStore('normatel')}
              className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all ${
                selectedStore === 'normatel'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🟠 Normatel ({normatelCount})
            </button>
          </div>

          {/* Bulk Action Controls */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              className="text-xs border-slate-300"
            >
              {selectedItems.length === filteredProducts.length
                ? 'Desmarcar Todos'
                : 'Marcar Todos'}
            </Button>
            {selectedItems.length > 0 && (
              <Button
                size="sm"
                onClick={handleImportBulk}
                disabled={importingBulk}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
              >
                {importingBulk ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Importar Selecionados ({selectedItems.length})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((item) => {
            const isSelected = selectedItems.includes(item.productId);
            const isImported =
              importedIds.has(item.productId) || item.alreadyInCatalog;
            const isImporting = importingId === item.productId;

            return (
              <Card
                key={`${item.store}-${item.productId}`}
                className={`relative flex flex-col justify-between overflow-hidden transition-all duration-200 border ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Store & Selection Header */}
                <div className="p-3.5 pb-0 flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      item.store === 'Carajás'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : item.store === 'Acal'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {item.store}
                  </Badge>

                  <div className="flex items-center gap-2">
                    {isImported && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-semibold flex items-center gap-1">
                        <Check className="h-3 w-3" /> No Catálogo
                      </Badge>
                    )}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(item.productId)}
                      className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Product Image */}
                <div className="relative h-44 w-full bg-slate-50 flex items-center justify-center p-3 my-2">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain rounded-md"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-slate-400 text-xs flex flex-col items-center gap-1">
                      <Layers className="h-8 w-8 text-slate-300" />
                      Sem foto
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <CardContent className="p-4 pt-1 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{item.brand}</span>
                      {item.ean && (
                        <span className="flex items-center gap-1 text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                          <Barcode className="h-3 w-3" /> {item.ean}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug" title={item.name}>
                      {item.name}
                    </h3>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500">Preço {item.store}:</span>
                      <span className="text-base font-black text-slate-900">
                        R$ {item.price.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Custo Est. (70%):</span>
                      <span className="font-medium text-emerald-700">
                        R$ {(item.price * 0.7).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Preço De/Por:</span>
                      <span className="line-through">
                        R$ {(item.listPrice > item.price ? item.listPrice : item.price * 1.15).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      onClick={() => handleImportSingle(item)}
                      disabled={isImporting || isImported}
                      size="sm"
                      className={`w-full text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        isImported
                          ? 'bg-slate-100 text-slate-500 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      }`}
                    >
                      {isImporting ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : isImported ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Já Cadastrado
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5" />
                          Importar para Catálogo
                        </>
                      )}
                    </Button>

                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                        title="Ver no site original"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        !loading && (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              Pronto para Varredura de Catálogo
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Digite qualquer termo acima (ou clique nas sugestões rápidas) para pesquisar nas bases da Carajás, Acal e Normatel e popular sua loja com facilidade.
            </p>
          </div>
        )
      )}
    </div>
  );
}
