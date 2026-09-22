'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { 
  Database, 
  Server, 
  Activity, 
  HardDrive, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Zap,
  BarChart3
} from 'lucide-react';

interface DatabaseInfo {
  version: string;
  host: string;
  port: number;
  database: string;
  user: string;
  ssl: boolean;
  maxConnections: number;
  activeConnections: number;
  idleConnections: number;
}

interface DatabaseStats {
  totalTables: number;
  totalRecords: number;
  databaseSize: string;
  tableStats: Array<{
    tableName: string;
    recordCount: number;
    size: string;
  }>;
}

interface DatabaseHealth {
  isHealthy: boolean;
  responseTime: number;
  error?: string;
}

interface HealthSummary {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  lastCheck: string;
  totalAlerts: number;
  criticalAlerts: number;
  avgResponseTime: number;
  connectionUsage: number;
}

interface SlowQuery {
  query: string;
  calls: number;
  totalTime: number;
  avgTime: number;
  rows: number;
}

interface DashboardData {
  info: DatabaseInfo;
  stats: DatabaseStats;
  health: DatabaseHealth;
  summary: HealthSummary;
  slowQueries: SlowQuery[];
  timestamp: string;
}

export default function DatabasePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/database/dashboard');
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do banco:', error);
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

  const handleBackup = async () => {
    setActionLoading('backup');
    try {
      const response = await fetch('/api/database/backup', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        alert(`Backup criado: ${result.filename} (${formatBytes(result.size)})`);
      } else {
        alert(`Erro no backup: ${result.error}`);
      }
    } catch (error) {
      alert('Erro ao criar backup');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOptimize = async () => {
    setActionLoading('optimize');
    try {
      const response = await fetch('/api/database/optimize', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        alert(`Otimização concluída em ${result.duration}ms: ${result.operations.join(', ')}`);
        fetchData(); // Atualizar dados
      } else {
        alert(`Erro na otimização: ${result.error}`);
      }
    } catch (error) {
      alert('Erro ao otimizar banco');
    } finally {
      setActionLoading(null);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Saudável
          </Badge>
        );
      case 'degraded':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Degradado
          </Badge>
        );
      case 'unhealthy':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Não Saudável
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            Desconhecido
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="ml-2">Carregando dados do banco...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Erro ao carregar dados</h2>
          <Button onClick={fetchData}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  const { info, stats, health, summary, slowQueries } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Monitoramento do Banco de Dados</h1>
          <p className="text-gray-600">
            Última atualização: {new Date(data.timestamp).toLocaleString()}
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

      {/* Status Geral */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Status Geral
          </h3>
          {getStatusBadge(summary.status)}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{formatUptime(summary.uptime)}</div>
            <div className="text-sm text-gray-600">Uptime</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${health.isHealthy ? 'text-green-600' : 'text-red-600'}`}>
              {health.responseTime}ms
            </div>
            <div className="text-sm text-gray-600">Tempo de Resposta</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{summary.totalAlerts}</div>
            <div className="text-sm text-gray-600">Alertas Ativos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{summary.connectionUsage.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Uso de Conexões</div>
          </div>
        </div>
      </Card>

      {/* Ações */}
      <div className="flex gap-4">
        <Button 
          onClick={handleBackup}
          disabled={actionLoading === 'backup'}
          variant="outline"
        >
          {actionLoading === 'backup' ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Criar Backup
        </Button>
        
        <Button 
          onClick={handleOptimize}
          disabled={actionLoading === 'optimize'}
          variant="outline"
        >
          {actionLoading === 'optimize' ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 mr-2" />
          )}
          Otimizar Banco
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações da Conexão */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Server className="w-5 h-5 mr-2" />
            Informações da Conexão
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Versão</span>
              <span className="font-medium">{info.version.split(' ')[0]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Host</span>
              <span className="font-medium">{info.host}:{info.port}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Banco</span>
              <span className="font-medium">{info.database}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Usuário</span>
              <span className="font-medium">{info.user}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">SSL</span>
              <span className={`font-medium ${info.ssl ? 'text-green-600' : 'text-red-600'}`}>
                {info.ssl ? 'Habilitado' : 'Desabilitado'}
              </span>
            </div>
          </div>
        </Card>

        {/* Conexões */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Conexões
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Uso de Conexões</span>
                <span className="font-medium">{summary.connectionUsage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    summary.connectionUsage > 80 ? 'bg-red-500' : 
                    summary.connectionUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${summary.connectionUsage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">{info.activeConnections}</div>
                <div className="text-xs text-gray-600">Ativas</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-600">{info.idleConnections}</div>
                <div className="text-xs text-gray-600">Inativas</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{info.maxConnections}</div>
                <div className="text-xs text-gray-600">Máximo</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Estatísticas */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <HardDrive className="w-5 h-5 mr-2" />
            Armazenamento
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tamanho do Banco</span>
              <span className="font-medium">{stats.databaseSize}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total de Tabelas</span>
              <span className="font-medium">{stats.totalTables}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total de Registros</span>
              <span className="font-medium">{stats.totalRecords.toLocaleString()}</span>
            </div>
          </div>
          
          {stats.tableStats.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Maiores Tabelas</h4>
              <div className="space-y-2">
                {stats.tableStats.slice(0, 5).map((table, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{table.tableName}</span>
                    <div className="text-right">
                      <div className="font-medium">{table.size}</div>
                      <div className="text-xs text-gray-500">
                        {table.recordCount.toLocaleString()} registros
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Queries Lentas */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Queries Lentas
          </h3>
          
          {slowQueries.length > 0 ? (
            <div className="space-y-3">
              {slowQueries.slice(0, 5).map((query, index) => (
                <div key={index} className="border-l-4 border-yellow-400 pl-3">
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-sm font-medium">
                      Tempo médio: {query.avgTime.toFixed(2)}ms
                    </div>
                    <div className="text-xs text-gray-500">
                      {query.calls} execuções
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
                    {query.query.length > 100 
                      ? query.query.substring(0, 100) + '...' 
                      : query.query
                    }
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma query lenta detectada</p>
              <p className="text-xs">ou pg_stat_statements não está habilitado</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
