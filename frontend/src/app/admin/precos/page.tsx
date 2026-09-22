'use client';

import { useState, useEffect } from 'react';
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
  FileSpreadsheet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PriceEditModal from '@/app/components/admin/PriceEditModal';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  promotionalPrice?: number;
  stock: number;
  category: { name: string };
  brand?: { name: string };
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
  const [categoryFilter, setCategoryFilter] = useState('');
  const [bulkUpdateType, setBulkUpdateType] = useState<'percentage' | 'fixed'>('percentage');
  const [bulkUpdateValue, setBulkUpdateValue] = useState('');
  const [bulkUpdateReason, setBulkUpdateReason] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPriceReport();
  }, []);

  const loadPriceReport = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/price-management/report');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
        setStats(data.stats);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar relatório de preços',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Selecione pelo menos um produto',
        variant: 'destructive'
      });
      return;
    }

    if (!bulkUpdateValue || !bulkUpdateReason) {
      toast({
        title: 'Atenção',
        description: 'Preencha o valor e o motivo da alteração',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('/api/price-management/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: selectedProducts,
          updateType: bulkUpdateType,
          value: parseFloat(bulkUpdateValue),
          reason: bulkUpdateReason,
          applyToPromotional: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Sucesso',
          description: result.message
        });
        loadPriceReport();
        setSelectedProducts([]);
        setBulkUpdateValue('');
        setBulkUpdateReason('');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar preços',
        variant: 'destructive'
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await fetch('/api/price-management/export/excel');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-precos-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Sucesso',
          description: 'Relatório exportado com sucesso'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao exportar relatório',
        variant: 'destructive'
      });
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/price-management/import/excel', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Sucesso',
          description: result.message
        });
        loadPriceReport();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao importar arquivo',
        variant: 'destructive'
      });
    }

    // Limpar input
    event.target.value = '';
  };

  const handleSinglePriceUpdate = async (productId: string, newPrice: number, reason: string) => {
    try {
      const response = await fetch('/api/price-management/update-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          newPrice,
          reason
        })
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Preço atualizado com sucesso'
        });
        loadPriceReport();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar preço',
        variant: 'destructive'
      });
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category.name === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Preços</h1>
        <p className="text-gray-600 mt-2">
          Gerencie preços de produtos de forma individual ou em massa
        </p>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Preço Médio</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averagePrice)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Com Promoção</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.productsWithPromotion}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sem Estoque</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.outOfStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ações em Massa */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Ações em Massa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Atualização em Massa */}
            <div className="space-y-4">
              <h3 className="font-semibold">Atualizar Preços Selecionados</h3>
              <div className="flex gap-2">
                <select
                  value={bulkUpdateType}
                  onChange={(e) => setBulkUpdateType(e.target.value as 'percentage' | 'fixed')}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="percentage">Percentual (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                </select>
                <Input
                  type="number"
                  placeholder={bulkUpdateType === 'percentage' ? 'Ex: 10 (para +10%)' : 'Ex: 50.00'}
                  value={bulkUpdateValue}
                  onChange={(e) => setBulkUpdateValue(e.target.value)}
                  className="flex-1"
                />
              </div>
              <Input
                placeholder="Motivo da alteração"
                value={bulkUpdateReason}
                onChange={(e) => setBulkUpdateReason(e.target.value)}
              />
              <Button 
                onClick={handleBulkUpdate}
                disabled={selectedProducts.length === 0}
                className="w-full"
              >
                Atualizar {selectedProducts.length} produto(s)
              </Button>
            </div>

            {/* Import/Export */}
            <div className="space-y-4">
              <h3 className="font-semibold">Importar/Exportar</h3>
              <div className="space-y-2">
                <Button
                  onClick={handleExportExcel}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar para Excel
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportExcel}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Importar do Excel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(filteredProducts.map(p => p.id));
                        } else {
                          setSelectedProducts([]);
                        }
                      }}
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    />
                  </th>
                  <th className="text-left p-2">Produto</th>
                  <th className="text-left p-2">SKU</th>
                  <th className="text-left p-2">Categoria</th>
                  <th className="text-left p-2">Preço</th>
                  <th className="text-left p-2">Promoção</th>
                  <th className="text-left p-2">Estoque</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts([...selectedProducts, product.id]);
                          } else {
                            setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                          }
                        }}
                      />
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.brand?.name}</p>
                      </div>
                    </td>
                    <td className="p-2 font-mono text-sm">{product.sku}</td>
                    <td className="p-2">
                      <Badge variant="outline">{product.category.name}</Badge>
                    </td>
                    <td className="p-2 font-semibold">{formatCurrency(product.price)}</td>
                    <td className="p-2">
                      {product.promotionalPrice ? (
                        <span className="text-green-600 font-semibold">
                          {formatCurrency(product.promotionalPrice)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-2">
                      <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                        {product.stock}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingProduct(product)}
                      >
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      {editingProduct && (
        <PriceEditModal
          product={editingProduct}
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleSinglePriceUpdate}
        />
      )}
    </div>
  );
}
