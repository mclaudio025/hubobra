'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { CalendarIcon, TrendingUpIcon, DollarSignIcon, ShoppingCartIcon, DownloadIcon } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';

interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
  growthRate: number;
}

interface TopProduct {
  id: string;
  name: string;
  totalSold: number;
  revenue: number;
  category: string;
}

interface SalesByPeriod {
  period: string;
  sales: number;
  revenue: number;
  orders: number;
}

export default function RelatoriosVendasPage() {
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [salesByPeriod, setSalesByPeriod] = useState<SalesByPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { toast } = useToast();

  useEffect(() => {
    fetchSalesData();
  }, [selectedPeriod]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      
      // Buscar estatísticas gerais de vendas
      const statsResponse = await fetch(`/api/sales/stats?period=${selectedPeriod}`);
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setSalesStats(stats);
      }

      // Buscar produtos mais vendidos
      const topProductsResponse = await fetch(`/api/sales/top-products?period=${selectedPeriod}`);
      if (topProductsResponse.ok) {
        const products = await topProductsResponse.json();
        setTopProducts(products);
      }

      // Buscar vendas por período
      const salesPeriodResponse = await fetch(`/api/sales/by-period?period=${selectedPeriod}`);
      if (salesPeriodResponse.ok) {
        const salesData = await salesPeriodResponse.json();
        setSalesByPeriod(salesData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de vendas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados de vendas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    toast({
      title: 'Exportando relatório',
      description: 'O relatório de vendas será baixado em breve.',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando dados de vendas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios de Vendas</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho das vendas e análise de receita
          </p>
        </div>
        <Button onClick={exportReport} className="flex items-center gap-2">
          <DownloadIcon className="h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="month">Mês</TabsTrigger>
          <TabsTrigger value="quarter">Trimestre</TabsTrigger>
          <TabsTrigger value="year">Ano</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPeriod} className="space-y-6">
          {/* Estatísticas Gerais */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesStats ? formatCurrency(salesStats.totalRevenue) : 'R$ 0,00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {salesStats && salesStats.growthRate > 0 ? '+' : ''}
                  {salesStats?.growthRate?.toFixed(1) || 0}% em relação ao período anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesStats?.totalSales || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Produtos vendidos no período
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                <ShoppingCartIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesStats?.totalOrders || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pedidos realizados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesStats ? formatCurrency(salesStats.averageOrderValue) : 'R$ 0,00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor médio por pedido
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Produtos Mais Vendidos */}
          <Card>
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
              <CardDescription>
                Top 10 produtos com melhor desempenho no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.length > 0 ? (
                  topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">#{index + 1}</Badge>
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">{typeof product.category === 'object' ? product.category?.name || 'Sem categoria' : product.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(product.revenue)}</p>
                        <p className="text-sm text-muted-foreground">{product.totalSold} vendidos</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum produto vendido no período selecionado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vendas por Período */}
          <Card>
            <CardHeader>
              <CardTitle>Vendas por Período</CardTitle>
              <CardDescription>
                Evolução das vendas ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesByPeriod.length > 0 ? (
                  salesByPeriod.map((period, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{period.period}</h4>
                        <p className="text-sm text-muted-foreground">{period.orders} pedidos</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(period.revenue)}</p>
                        <p className="text-sm text-muted-foreground">{period.sales} produtos</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma venda registrada no período selecionado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
