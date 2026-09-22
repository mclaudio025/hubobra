'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Upload, 
  FileText, 
  BarChart3, 
  Users, 
  Image,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Eye,
  Plus,
  Bot,
  Settings
} from 'lucide-react';
import AdminBreadcrumb from '../components/admin/AdminBreadcrumb';
import StatsCard from '../components/admin/StatsCard';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 1234,
    activeProducts: 1180,
    outOfStock: 54,
    categories: 28,
    totalOrders: 856,
    pendingOrders: 12,
    totalUsers: 2341,
    revenue: 125430.50
  });

  return (
    <div>
      <AdminBreadcrumb />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Visão geral do seu e-commerce</p>
      </div>
      
      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Receita Total"
          value={`R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<TrendingUp className="h-6 w-6" />}
          change={{ value: 12.5, type: 'increase', period: 'este mês' }}
          color="green"
        />
        
        <StatsCard
          title="Pedidos"
          value={stats.totalOrders}
          icon={<ShoppingCart className="h-6 w-6" />}
          change={{ value: 8.2, type: 'increase', period: 'esta semana' }}
          color="blue"
        />
        
        <StatsCard
          title="Produtos"
          value={stats.totalProducts}
          icon={<Package className="h-6 w-6" />}
          change={{ value: 3.1, type: 'increase', period: 'este mês' }}
          color="purple"
        />
        
        <StatsCard
          title="Usuários"
          value={stats.totalUsers}
          icon={<Users className="h-6 w-6" />}
          change={{ value: 15.3, type: 'increase', period: 'este mês' }}
          color="indigo"
        />
      </div>

      {/* Alertas */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div>
            <h3 className="font-semibold text-yellow-800">Atenção Necessária</h3>
            <p className="text-yellow-700 text-sm">
              {stats.outOfStock} produtos estão sem estoque • {stats.pendingOrders} pedidos pendentes
            </p>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Gestão de Produtos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 rounded-lg mr-3">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Produtos</h2>
              </div>
              <span className="text-sm text-gray-500">{stats.activeProducts} ativos</span>
            </div>
            <p className="text-gray-600 mb-4">Gerencie seu catálogo de produtos</p>
            <div className="space-y-2">
              <Link 
                href="/admin/produtos" 
                className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                <Eye className="h-4 w-4" />
                Ver Todos os Produtos
              </Link>
              <Link 
                href="/admin/produtos/novo" 
                className="flex items-center justify-center gap-2 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Adicionar Produto
              </Link>
            </div>
          </div>

          {/* Banners */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-pink-50 rounded-lg mr-3">
                  <Image className="h-6 w-6 text-pink-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Marketing</h2>
              </div>
              <span className="text-sm text-gray-500">5 ativos</span>
            </div>
            <p className="text-gray-600 mb-4">Gerencie banners e campanhas</p>
            <div className="space-y-2">
              <Link 
                href="/admin/banners" 
                className="flex items-center justify-center gap-2 w-full bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition text-sm font-medium"
              >
                <Eye className="h-4 w-4" />
                Ver Banners
              </Link>
              <Link 
                href="/admin/banners/novo" 
                className="flex items-center justify-center gap-2 w-full bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Criar Banner
              </Link>
            </div>
          </div>

          {/* Pedidos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-50 rounded-lg mr-3">
                  <ShoppingCart className="h-6 w-6 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Pedidos</h2>
              </div>
              <span className="text-sm text-red-600 font-medium">{stats.pendingOrders} pendentes</span>
            </div>
            <p className="text-gray-600 mb-4">Gerencie pedidos e vendas</p>
            <div className="space-y-2">
              <Link 
                href="/admin/pedidos" 
                className="flex items-center justify-center gap-2 w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition text-sm font-medium"
              >
                <Eye className="h-4 w-4" />
                Ver Pedidos
              </Link>
              <Link 
                href="/admin/pedidos?status=pending" 
                className="flex items-center justify-center gap-2 w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium"
              >
                <AlertTriangle className="h-4 w-4" />
                Pendentes ({stats.pendingOrders})
              </Link>
            </div>
          </div>

          {/* Relatórios */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-50 rounded-lg mr-3">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Relatórios</h2>
              </div>
            </div>
            <p className="text-gray-600 mb-4">Analytics e insights de vendas</p>
            <Link 
              href="/admin/relatorios" 
              className="flex items-center justify-center gap-2 w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
            >
              <BarChart3 className="h-4 w-4" />
              Ver Relatórios
            </Link>
          </div>

          {/* Usuários */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-50 rounded-lg mr-3">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Usuários</h2>
              </div>
              <span className="text-sm text-gray-500">{stats.totalUsers}</span>
            </div>
            <p className="text-gray-600 mb-4">Gerencie contas e permissões</p>
            <Link 
              href="/admin/usuarios" 
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
            >
              <Users className="h-4 w-4" />
              Gerenciar Usuários
            </Link>
          </div>

          {/* IA & Automação */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 rounded-lg mr-3">
                  <Bot className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">IA & Automação</h2>
              </div>
              <span className="text-sm text-gray-500">2 assistentes</span>
            </div>
            <p className="text-gray-600 mb-4">Gerencie assistentes virtuais</p>
            <div className="space-y-2">
              <Link 
                href="/admin/ia" 
                className="flex items-center justify-center gap-2 w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition text-sm font-medium"
              >
                <Bot className="h-4 w-4" />
                Zé da Obra
              </Link>
              <Link 
                href="/admin/ia/lia/configuracoes" 
                className="flex items-center justify-center gap-2 w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
              >
                <Settings className="h-4 w-4" />
                Configurar LIA
              </Link>
            </div>
          </div>

          {/* Ferramentas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-50 rounded-lg mr-3">
                  <Upload className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Ferramentas</h2>
              </div>
            </div>
            <p className="text-gray-600 mb-4">Importação e templates</p>
            <div className="space-y-2">
              <Link 
                href="/admin/importacao" 
                className="flex items-center justify-center gap-2 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                <Upload className="h-4 w-4" />
                Importar Dados
              </Link>
              <Link 
                href="/admin/templates" 
                className="flex items-center justify-center gap-2 w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition text-sm font-medium"
              >
                <FileText className="h-4 w-4" />
                Templates
              </Link>
            </div>
          </div>
        </div>

        {/* Atividade Recente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pedidos Recentes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pedidos Recentes</h3>
              <Link href="/admin/pedidos" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Ver todos
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { id: '#1234', customer: 'João Silva', value: 'R$ 299,90', status: 'Pendente', time: '2 min' },
                { id: '#1233', customer: 'Maria Santos', value: 'R$ 156,50', status: 'Confirmado', time: '15 min' },
                { id: '#1232', customer: 'Pedro Costa', value: 'R$ 89,90', status: 'Enviado', time: '1 hora' }
              ].map((order, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{order.id}</p>
                    <p className="text-sm text-gray-600">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{order.value}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'Confirmado' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {order.status}
                      </span>
                      <span className="text-xs text-gray-500">{order.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Produtos com Baixo Estoque */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Estoque Baixo</h3>
              <Link href="/admin/produtos?filter=low_stock" className="text-red-600 hover:text-red-700 text-sm font-medium">
                Ver todos
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Cimento Portland', sku: 'CIM001', stock: 5, min: 20 },
                { name: 'Tijolo Cerâmico', sku: 'TIJ002', stock: 12, min: 50 },
                { name: 'Areia Fina', sku: 'ARE003', stock: 8, min: 30 }
              ].map((product, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">{product.stock} unidades</p>
                    <p className="text-xs text-gray-500">Mín: {product.min}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
    </div>
  );
}
