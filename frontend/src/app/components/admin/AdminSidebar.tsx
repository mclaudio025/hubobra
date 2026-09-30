'use client';

import { useState, useEffect } from 'react';
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
  CreditCard,
  BookOpen,
  Sparkles
} from 'lucide-react';

interface MenuItem {
  title: string;
  href?: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
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
        title: 'Robô Extrator',
        href: '/admin/extrator',
        icon: <Bot className="h-4 w-4 text-emerald-600" />,
        badge: 'NOVO',
        badgeColor: 'bg-emerald-500'
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
    badge: '12',
    badgeColor: 'bg-rose-500'
  },
  {
    title: 'Orçamentos (Lia)',
    href: '/admin/orcamentos',
    icon: <FileText className="h-5 w-5" />
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
    icon: <Bot className="h-5 w-5 text-indigo-600" />,
    children: [
      {
        title: 'Dashboard IA',
        href: '/admin/ia',
        icon: <Bot className="h-4 w-4 text-indigo-500" />
      },
      {
        title: 'Treinadores da Lia',
        href: '/admin/ia/treinadores',
        icon: <UserCheck className="h-4 w-4 text-emerald-600" />,
        badge: 'TREINAR',
        badgeColor: 'bg-emerald-600'
      },
      {
        title: 'Dicionário de Obra',
        href: '/admin/ia/dicionario',
        icon: <BookOpen className="h-4 w-4 text-amber-600" />,
        badge: 'CEARÊS',
        badgeColor: 'bg-amber-600'
      },
      {
        title: 'Atendente LIA',
        href: '/admin/ia/lia',
        icon: <Sparkles className="h-4 w-4 text-purple-600" />
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
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Produtos', 'IA & Automação']);

  // Expand category automatically if current route is within it
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.children && item.children.some(child => child.href && pathname.startsWith(child.href))) {
        setExpandedItems(prev => (prev.includes(item.title) ? prev : [...prev, item.title]));
      }
    });
  }, [pathname]);

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
    return pathname === href || (href !== '/admin/ia' && pathname.startsWith(href));
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const active = item.href ? isActive(item.href) : false;

    if (hasChildren) {
      return (
        <div key={item.title} className="mb-0.5">
          <button
            onClick={() => toggleExpanded(item.title)}
            type="button"
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
              level === 0
                ? 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
                : 'text-gray-600 hover:bg-gray-100/70 ml-2 pl-3'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{item.title}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {item.badge && (
                <span className={`${item.badgeColor || 'bg-red-500'} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider`}>
                  {item.badge}
                </span>
              )}
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </button>

          {isExpanded && (
            <div className="mt-0.5 space-y-0.5 border-l-2 border-gray-100 ml-5 pl-1">
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
        className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all ${
          level === 0 ? 'mb-0.5' : 'ml-1'
        } ${
          active
            ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs border-r-2 border-blue-600'
            : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0">{item.icon}</span>
          <span className="truncate">{item.title}</span>
        </div>
        {item.badge && (
          <span className={`${item.badgeColor || 'bg-blue-600'} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0`}>
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="admin-sidebar fixed left-0 top-20 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col z-30 select-none shadow-xs">
      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 overscroll-contain">
        <nav className="space-y-0.5 pb-6">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>
      </div>

      {/* Footer da Sidebar - Fixed at bottom of flex, never overlaps items */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/90 shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-semibold text-gray-700">HubObra Admin</span>
          <span className="text-[11px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full">v1.5.2</span>
        </div>
      </div>
    </aside>
  );
}

