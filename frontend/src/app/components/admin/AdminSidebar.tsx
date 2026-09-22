'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Image,
  FileText,
  BarChart3,
  Settings,
  Upload,
  Bot,
  ChevronDown,
  ChevronRight,
  Plus,
  List,
  FolderOpen,
  Palette,
  UserCheck,
  TrendingUp,
  Database,
  CreditCard
} from 'lucide-react';

interface MenuItem {
  title: string;
  href?: string;
  icon: React.ReactNode;
  badge?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: <LayoutDashboard className="h-5 w-5" />
  },
  {
    title: 'Produtos',
    icon: <Package className="h-5 w-5" />,
    children: [
      {
        title: 'Todos os Produtos',
        href: '/admin/produtos',
        icon: <List className="h-4 w-4" />
      },
      {
        title: 'Adicionar Produto',
        href: '/admin/produtos/novo',
        icon: <Plus className="h-4 w-4" />
      },
      {
        title: 'Categorias',
        href: '/admin/categorias',
        icon: <FolderOpen className="h-4 w-4" />
      },
      {
        title: 'Importação',
        href: '/admin/importacao',
        icon: <Upload className="h-4 w-4" />
      },
      {
        title: 'Cadastro em Massa',
        href: '/admin/produtos/cadastro-massa',
        icon: <Database className="h-4 w-4" />
      },
      {
        title: 'Gestão de Preços',
        href: '/admin/precos',
        icon: <TrendingUp className="h-4 w-4" />
      },
      {
        title: 'Importar Produtos',
        href: '/admin/produtos/importar',
        icon: <Upload className="h-4 w-4" />
      }
    ]
  },
  {
    title: 'Pedidos',
    href: '/admin/pedidos',
    icon: <ShoppingCart className="h-5 w-5" />,
    badge: '12'
  },
  {
    title: 'Pagamentos',
    href: '/admin/pagamentos',
    icon: <CreditCard className="h-5 w-5" />
  },
  {
    title: 'Usuários',
    href: '/admin/usuarios',
    icon: <Users className="h-5 w-5" />
  },
  {
    title: 'Marketing',
    icon: <Palette className="h-5 w-5" />,
    children: [
      {
        title: 'Banners',
        href: '/admin/banners',
        icon: <Image className="h-4 w-4" />
      },
      {
        title: 'Novo Banner',
        href: '/admin/banners/novo',
        icon: <Plus className="h-4 w-4" />
      },
      {
        title: 'Templates',
        href: '/admin/templates',
        icon: <FileText className="h-4 w-4" />
      }
    ]
  },
  {
    title: 'Relatórios',
    icon: <BarChart3 className="h-5 w-5" />,
    children: [
      {
        title: 'Vendas',
        href: '/admin/relatorios/vendas',
        icon: <TrendingUp className="h-4 w-4" />
      },
      {
        title: 'Produtos',
        href: '/admin/relatorios/produtos',
        icon: <Package className="h-4 w-4" />
      },
      {
        title: 'Usuários',
        href: '/admin/relatorios/usuarios',
        icon: <UserCheck className="h-4 w-4" />
      }
    ]
  },
  {
    title: 'IA & Automação',
    icon: <Bot className="h-5 w-5" />,
    children: [
      {
        title: 'Dashboard IA',
        href: '/admin/ia',
        icon: <Bot className="h-4 w-4" />
      },
      {
        title: 'Configurações IA',
        href: '/admin/ia/configuracoes',
        icon: <Settings className="h-4 w-4" />
      },
      {
        title: 'Prompts',
        href: '/admin/prompts',
        icon: <FileText className="h-4 w-4" />
      }
    ]
  },
  {
    title: 'Arquivos',
    href: '/admin/uploads',
    icon: <Upload className="h-5 w-5" />
  },
  {
    title: 'Sistema',
    icon: <Settings className="h-5 w-5" />,
    children: [
      {
        title: 'Monitoramento',
        href: '/admin/monitoramento',
        icon: <BarChart3 className="h-4 w-4" />
      },
      {
        title: 'Banco de Dados',
        href: '/admin/database',
        icon: <Database className="h-4 w-4" />
      },
      {
        title: 'Configurações',
        href: '/admin/settings',
        icon: <Settings className="h-4 w-4" />
      }
    ]
  }
];

export default function AdminSidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>(['Produtos', 'Marketing']);
  const pathname = usePathname();

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const active = item.href ? isActive(item.href) : false;

    if (hasChildren) {
      return (
        <div key={item.title}>
          <button
            onClick={() => toggleExpanded(item.title)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${level === 0
              ? 'text-gray-700 hover:bg-gray-100'
              : 'text-gray-600 hover:bg-gray-50 ml-4'
              }`}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span>{item.title}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.badge && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </button>

          {isExpanded && (
            <div className="mt-1 space-y-1">
              {item.children?.map(child => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.title}
        href={item.href!}
        className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${level === 0 ? '' : 'ml-4'
          } ${active
            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
            : 'text-gray-700 hover:bg-gray-100'
          }`}
      >
        <div className="flex items-center gap-3">
          {item.icon}
          <span>{item.title}</span>
        </div>
        {item.badge && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="admin-sidebar fixed left-0 top-20 w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <nav className="space-y-2">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>
      </div>

      {/* Footer da Sidebar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
        <div className="text-center">
          <p className="text-xs text-gray-500">Loja Moderna Admin</p>
          <p className="text-xs text-gray-400">v1.5.1</p>
        </div>
      </div>
    </aside>
  );
}
