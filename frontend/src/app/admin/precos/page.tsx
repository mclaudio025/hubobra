'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { 
  Download, 
  Upload, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  FileSpreadsheet,
  CheckSquare,
  Square,
  RefreshCw,
  X,
  Layers,
  Sparkles,
  Percent,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PriceEditModal from '@/app/components/admin/PriceEditModal';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  promotionalPrice?: number;
  comparePrice?: number;
  stock: number;
  category: { name: string };
  brand?: { name: string } | string;
  updatedAt: string;
}

interface PriceStats {
  totalProducts: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  productsWithPromotion: number;
  outOfStock: number;
  inactive: number;
}

export default function PriceManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<PriceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bulkUpdateType, setBulkUpdateType] = useState<'percentage' | 'fixed'>('percentage');
  const [bulkUpdateValue, setBulkUpdateValue] = useState('');
  const [bulkUpdateReason, setBulkUpdateReason] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

  useEffect(() => {
    loadPriceReport();
  }, []);

  const loadPriceReport = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let res = await fetch('/api/price-management/report', { headers });
      if (!res.ok && API_URL) {
        res = await fetch(`${API_URL}/price-management/report`, { headers });
      }

      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar relatório de preços',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Lista única de categorias ordenadas com contagens
  const { categories, categoryCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category?.name?.trim() || 'Sem Categoria';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const uniqueCats = Object.keys(counts).sort((a, b) => a.localeCompare(b));
    return { categories: uniqueCats, categoryCounts: counts };
  }, [products]);

  // Produtos filtrados por termo, categoria e status
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term) ||
        (product.barcode && product.barcode.includes(term));

      const productCat = product.category?.name?.trim() || 'Sem Categoria';
      const matchesCategory =
        categoryFilter === 'all' || productCat.toLowerCase() === categoryFilter.toLowerCase();

      let matchesStatus = true;
      if (statusFilter === 'promo') {
        matchesStatus = Boolean(
          (product.promotionalPrice && product.promotionalPrice > 0) ||
          (product.comparePrice && product.comparePrice > product.price)
        );
      } else if (statusFilter === 'out_of_stock') {
        matchesStatus = product.stock <= 0;
      } else if (statusFilter === 'in_stock') {
        matchesStatus = product.stock > 0;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  const handleSelectAllFiltered = () => {
    if (selectedProducts.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: 'Selecione produtos',
        description: 'Marque pelo menos um produto para atualizar o preço em massa.',
        variant: 'destructive',
      });
      return;
    }

    if (!bulkUpdateValue || !bulkUpdateReason.trim()) {
      toast({
        title: 'Campos Obrigatórios',
        description: 'Informe o valor do reajuste e o motivo da alteração.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setBulkUpdating(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: any = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const payload = {
        productIds: selectedProducts,
        updateType: bulkUpdateType,
        value: parseFloat(bulkUpdateValue),
        reason: bulkUpdateReason.trim(),
        applyToComparePrice: true,
      };

      let response = await fetch('/api/price-management/bulk-update', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok && API_URL) {
        response = await fetch(`${API_URL}/price-management/bulk-update`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        const result = await response.json();
        toast({
          title: '✅ Reajuste Concluído!',
          description: result.message || `${selectedProducts.length} produtos atualizados com sucesso.`,
        });
        loadPriceReport();
        setSelectedProducts([]);
        setBulkUpdateValue('');
        setBulkUpdateReason('');
      } else {
        throw new Error('Falha na atualização em massa');
      }
    } catch (error: any) {
      toast({
        title: 'Erro na Atualização',
        description: error.message || 'Erro ao atualizar preços em lote',
        variant: 'destructive',
      });
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = new URLSearchParams();
      if (selectedProducts.length > 0) {
        params.append('productIds', selectedProducts.join(','));
      } else if (categoryFilter && categoryFilter !== 'all') {
        params.append('categoryName', categoryFilter);
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      let response = await fetch(`/api/price-management/export/excel${queryString}`, { headers });
      if (!response.ok && API_URL) {
        response = await fetch(`${API_URL}/price-management/export/excel${queryString}`, { headers });
      }

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const slugName = categoryFilter !== 'all' 
          ? categoryFilter.toLowerCase().replace(/[^a-z0-9]/gi, '-') 
          : 'catalogo-completo';
        
        const selectionTag = selectedProducts.length > 0 ? `-${selectedProducts.length}-itens-selecionados` : '';
        a.download = `precos-${slugName}${selectionTag}-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        const exportedContext = selectedProducts.length > 0
          ? `${selectedProducts.length} produtos selecionados`
          : categoryFilter !== 'all'
          ? `categoria "${categoryFilter}" (${filteredProducts.length} itens)`
          : `todos os ${products.length} produtos`;

        toast({
          title: '📊 Planilha Exportada!',
          description: `Arquivo Excel com ${exportedContext} baixado com sucesso. Edite os preços e importe de volta a qualquer momento.`,
        });
      } else {
        throw new Error('Falha ao exportar planilha');
      }
    } catch (error: any) {
      toast({
        title: 'Erro na Exportação',
        description: error.message || 'Erro ao exportar planilha Excel',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let response = await fetch('/api/price-management/import/excel', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok && API_URL) {
        response = await fetch(`${API_URL}/price-management/import/excel`, {
          method: 'POST',
          headers,
          body: formData,
        });
      }

      if (response.ok) {
        const result = await response.json();
        toast({
          title: '🎉 Planilha Importada!',
          description: result.message || 'Preços e dados sincronizados com sucesso.',
        });
        loadPriceReport();
      } else {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Erro ao processar arquivo Excel');
      }
    } catch (error: any) {
      toast({
        title: 'Erro na Importação',
        description: error.message || 'Erro ao importar arquivo Excel',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const handleSinglePriceUpdate = async (productId: string, newPrice: number, reason: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch('/api/price-management/update-single', {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId, newPrice, reason }),
      });

      if (response.ok) {
        toast({
          title: '✅ Preço Atualizado!',
          description: 'O novo valor já está ativo na loja virtual.',
        });
        loadPriceReport();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar preço individual.',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-slate-600">Carregando painel de preços...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-7xl">
      {/* Header com Visual Moderno */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl border border-slate-800 text-white shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <DollarSign className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Gestão de Preços & Margens
            </h1>
          </div>
          <p className="text-slate-300 text-sm max-w-2xl">
            Ajuste preços individualmente ou em massa, filtre por categoria e exporte planilhas segmentadas em formato Excel (.xlsx).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportExcel}
            disabled={exporting}
            variant="outline"
            className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 rounded-xl shadow-xs flex items-center gap-2 text-xs"
          >
            {exporting ? (
              <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
            ) : (
              <Download className="h-4 w-4 text-blue-400" />
            )}
            {categoryFilter !== 'all' ? `Exportar ${categoryFilter}` : 'Exportar Excel'}
          </Button>

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              disabled={importing}
              className="hidden"
            />
            <span className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all">
              {importing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Importar Planilha
            </span>
          </label>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total de Produtos</p>
                <p className="text-xl font-bold text-slate-900">{stats.totalProducts}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Preço Médio</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(stats.averagePrice)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Com Promoção (De/Por)</p>
                <p className="text-xl font-bold text-slate-900">{stats.productsWithPromotion}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Sem Estoque</p>
                <p className="text-xl font-bold text-slate-900">{stats.outOfStock}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ações em Massa com Seleção Inteligente */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Reajuste e Ações em Massa
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {selectedProducts.length} de {filteredProducts.length} produtos selecionados
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
            {/* Tipo de Ajuste */}
            <div className="lg:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Tipo de Reajuste</label>
              <select
                value={bulkUpdateType}
                onChange={(e) => setBulkUpdateType(e.target.value as 'percentage' | 'fixed')}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl bg-white shadow-xs focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
              >
                <option value="percentage">Percentual (%) - Ex: +10% ou -5%</option>
                <option value="fixed">Valor Fixo (R$) - Ex: +R$ 2,00</option>
              </select>
            </div>

            {/* Valor */}
            <div className="lg:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">
                {bulkUpdateType === 'percentage' ? 'Percentual (%)' : 'Valor (R$)'}
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder={bulkUpdateType === 'percentage' ? 'Ex: 10 (para aumentar 10%)' : 'Ex: 5.00'}
                value={bulkUpdateValue}
                onChange={(e) => setBulkUpdateValue(e.target.value)}
                className="rounded-xl py-2.5"
              />
            </div>

            {/* Motivo */}
            <div className="lg:col-span-4 space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Motivo da Alteração</label>
              <Input
                placeholder="Ex: Reajuste de tabela, Promoção da Semana..."
                value={bulkUpdateReason}
                onChange={(e) => setBulkUpdateReason(e.target.value)}
                className="rounded-xl py-2.5"
              />
            </div>

            {/* Botão de Aplicar */}
            <div className="lg:col-span-2">
              <Button
                onClick={handleBulkUpdate}
                disabled={selectedProducts.length === 0 || bulkUpdating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-semibold text-xs shadow-xs"
              >
                {bulkUpdating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  `Aplicar a (${selectedProducts.length})`
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FILTROS SEGMENTADOS POR CATEGORIA & BUSCA */}
      <div className="space-y-3">
        {/* Barra de Abas de Categorias com Contagens */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-blue-600" />
              Filtrar por Categoria ({categories.length}):
            </span>
            {categoryFilter !== 'all' && (
              <button
                onClick={() => setCategoryFilter('all')}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
              >
                <X className="h-3 w-3" /> Ver Todas as Categorias
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Botão Todas */}
            <button
              onClick={() => setCategoryFilter('all')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold border transition-all ${
                categoryFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todas ({products.length})
            </button>

            {/* Pílulas de Cada Categoria */}
            {categories.map((cat) => {
              const isSelected = categoryFilter.toLowerCase() === cat.toLowerCase();
              const count = categoryCounts[cat] || 0;

              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(isSelected ? 'all' : cat)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Barra de Busca e Filtros Complementares */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome do produto, SKU ou código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm rounded-xl border-slate-300"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-700 font-medium"
            >
              <option value="all">Todos os Status</option>
              <option value="promo">Com Promoção (De/Por)</option>
              <option value="in_stock">Em Estoque</option>
              <option value="out_of_stock">Sem Estoque</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAllFiltered}
              className="text-xs rounded-xl border-slate-300"
            >
              {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0
                ? 'Desmarcar Todos'
                : `Marcar Todos (${filteredProducts.length})`}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardHeader className="py-3.5 px-4 sm:px-6 bg-slate-50/70 border-b border-slate-200 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-bold text-slate-900">
              Listagem de Produtos
            </CardTitle>
            <Badge variant="outline" className="text-xs bg-white">
              {filteredProducts.length} itens exibidos
            </Badge>
            {categoryFilter !== 'all' && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                Categoria: {categoryFilter}
              </Badge>
            )}
          </div>

          {selectedProducts.length > 0 && (
            <Button
              size="sm"
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Exportar {selectedProducts.length} Selecionados
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3.5 pl-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedProducts.length === filteredProducts.length &&
                        filteredProducts.length > 0
                      }
                      onChange={handleSelectAllFiltered}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5">Produto</th>
                  <th className="p-3.5">SKU / EAN</th>
                  <th className="p-3.5">Categoria</th>
                  <th className="p-3.5">Preço Venda</th>
                  <th className="p-3.5">Preço De (Ref.)</th>
                  <th className="p-3.5">Estoque</th>
                  <th className="p-3.5 text-right pr-4">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const isSelected = selectedProducts.includes(product.id);
                    const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;

                    return (
                      <tr
                        key={product.id}
                        className={`hover:bg-blue-50/40 transition-colors ${
                          isSelected ? 'bg-blue-50/60' : ''
                        }`}
                      >
                        <td className="p-3.5 pl-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts((prev) => [...prev, product.id]);
                              } else {
                                setSelectedProducts((prev) =>
                                  prev.filter((id) => id !== product.id)
                                );
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3.5">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-900 leading-snug">
                              {product.name}
                            </p>
                            {brandName && (
                              <p className="text-xs text-slate-500 font-medium">
                                Marca: {brandName}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-xs text-slate-600">
                          <div>{product.sku}</div>
                          {product.barcode && (
                            <span className="text-[10px] text-slate-400">EAN: {product.barcode}</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <Badge
                            variant="outline"
                            className="text-xs bg-slate-50 text-slate-700 border-slate-200 font-medium cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                            onClick={() => setCategoryFilter(product.category?.name || 'all')}
                          >
                            {product.category?.name || 'Sem Categoria'}
                          </Badge>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="p-3.5">
                          {product.comparePrice && product.comparePrice > product.price ? (
                            <span className="text-xs font-semibold text-slate-400 line-through">
                              {formatCurrency(product.comparePrice)}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <Badge
                            variant="outline"
                            className={`text-xs font-bold ${
                              product.stock > 10
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : product.stock > 0
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {product.stock} un
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right pr-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingProduct(product)}
                            className="text-xs font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-2xs"
                          >
                            Editar
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      Nenhum produto encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Moderno de Edição */}
      {editingProduct && (
        <PriceEditModal
          product={editingProduct}
          isOpen={Boolean(editingProduct)}
          onClose={() => setEditingProduct(null)}
          onSave={handleSinglePriceUpdate}
        />
      )}
    </div>
  );
}
