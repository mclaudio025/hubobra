'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { 
  Activity, 
  Server, 
  Database, 
  HardDrive, 
  Cpu, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface SystemMetrics {
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
    formatted: {
      used: string;
      total: string;
    };
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  requests: {
    total: number;
    perMinute: number;
    errors: number;
    errorRate: number;
  };
  database: {
    connections: number;
    queries: number;
    avgResponseTime: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  uploads: {
    total: number;
    totalSize: number;
    avgSize: number;
  };
}

interface DashboardData {
  current: SystemMetrics;
  history: SystemMetrics[];
  alerts: {
    highMemoryUsage: boolean;
    highErrorRate: boolean;
    slowResponseTime: boolean;
    lowCacheHitRate: boolean;
  };
  summary: {
    totalRequests: number;
    errorRate: number;
    avgResponseTime: number;
    uptime: string;
  };
}

export default function MonitoramentoPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/metrics/dashboard');
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // Atualizar a cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusBadge = (isHealthy: boolean) => {
    return isHealthy ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Saudável
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Alerta
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="ml-2">Carregando métricas...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Erro ao carregar métricas</h2>
          <Button onClick={fetchData}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  const { current, alerts, summary } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Monitoramento do Sistema</h1>
          <p className="text-gray-600">
            Última atualização: {new Date(current.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {(alerts.highMemoryUsage || alerts.highErrorRate || alerts.slowResponseTime || alerts.lowCacheHitRate) && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="font-semibold text-red-800">Alertas Ativos</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {alerts.highMemoryUsage && (
              <div className="text-red-700">• Alto uso de memória</div>
            )}
            {alerts.highErrorRate && (
              <div className="text-red-700">• Alta taxa de erros</div>
            )}
            {alerts.slowResponseTime && (
              <div className="text-red-700">• Tempo de resposta lento</div>
            )}
            {alerts.lowCacheHitRate && (
              <div className="text-red-700">• Baixa taxa de cache hit</div>
            )}
          </div>
        </Card>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="text-2xl font-bold">{summary.uptime}</p>
            </div>
            <Server className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold">{summary.totalRequests.toLocaleString()}</p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Erro</p>
              <p className={`text-2xl font-bold ${getStatusColor(summary.errorRate, { warning: 2, critical: 5 })}`}>
                {summary.errorRate.toFixed(2)}%
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tempo Médio</p>
              <p className={`text-2xl font-bold ${getStatusColor(summary.avgResponseTime, { warning: 500, critical: 1000 })}`}>
                {summary.avgResponseTime.toFixed(0)}ms
              </p>
            </div>
            <Database className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Métricas Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memória e CPU */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Cpu className="w-5 h-5 mr-2" />
            Sistema
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Uso de Memória</span>
                {getStatusBadge(!alerts.highMemoryUsage)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    current.memory.percentage > 80 ? 'bg-red-500' : 
                    current.memory.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${current.memory.percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{current.memory.formatted.used}</span>
                <span>{current.memory.percentage.toFixed(1)}%</span>
                <span>{current.memory.formatted.total}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">CPU Load Average</span>
                <span className="text-sm font-medium">{current.cpu.loadAverage[0].toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Requests */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Requests
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total</span>
              <span className="font-medium">{current.requests.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Por Minuto</span>
              <span className="font-medium">{current.requests.perMinute.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Erros</span>
              <span className="font-medium text-red-600">{current.requests.errors}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Taxa de Erro</span>
              <span className={`font-medium ${getStatusColor(current.requests.errorRate, { warning: 2, critical: 5 })}`}>
                {current.requests.errorRate.toFixed(2)}%
              </span>
            </div>
          </div>
        </Card>

        {/* Database */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Database
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Conexões Ativas</span>
              <span className="font-medium">{current.database.connections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Queries</span>
              <span className="font-medium">{current.database.queries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tempo Médio</span>
              <span className={`font-medium ${getStatusColor(current.database.avgResponseTime, { warning: 100, critical: 500 })}`}>
                {current.database.avgResponseTime.toFixed(0)}ms
              </span>
            </div>
          </div>
        </Card>

        {/* Cache e Uploads */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <HardDrive className="w-5 h-5 mr-2" />
            Cache & Uploads
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Cache Hit Rate</span>
                {getStatusBadge(!alerts.lowCacheHitRate)}
              </div>
              <div className="flex justify-between text-sm">
                <span>Hits: {current.cache.hits}</span>
                <span>Misses: {current.cache.misses}</span>
                <span className="font-medium">{current.cache.hitRate.toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Uploads</span>
                <span className="font-medium">{current.uploads.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tamanho Total</span>
                <span className="font-medium">{formatBytes(current.uploads.totalSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tamanho Médio</span>
                <span className="font-medium">{formatBytes(current.uploads.avgSize)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
