'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminBreadcrumbProps {
  items?: BreadcrumbItem[];
}

export default function AdminBreadcrumb({ items }: AdminBreadcrumbProps) {
  const pathname = usePathname();

  // Gerar breadcrumb automaticamente baseado na URL se não fornecido
  const generateBreadcrumb = (): BreadcrumbItem[] => {
    if (items) return items;

    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbItems: BreadcrumbItem[] = [];

    // Sempre começar com Dashboard
    breadcrumbItems.push({ label: 'Dashboard', href: '/admin' });

    // Mapear segmentos para labels amigáveis
    const segmentLabels: Record<string, string> = {
      admin: 'Dashboard',
      produtos: 'Produtos',
      pedidos: 'Pedidos',
      usuarios: 'Usuários',
      banners: 'Banners',
      templates: 'Templates',
      relatorios: 'Relatórios',
      ia: 'IA & Automação',
      lia: 'LIA',
      uploads: 'Arquivos',
      settings: 'Configurações',
      importacao: 'Importação',
      'cadastro-massa': 'Cadastro em Massa',
      novo: 'Novo',
      editar: 'Editar',
      configuracoes: 'Configurações'
    };

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Pular o primeiro segmento 'admin' pois já foi adicionado
      if (index === 0 && segment === 'admin') return;

      const label = segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Se é o último segmento, não adicionar href (página atual)
      if (index === segments.length - 1) {
        breadcrumbItems.push({ label });
      } else {
        breadcrumbItems.push({ label, href: currentPath });
      }
    });

    return breadcrumbItems;
  };

  const breadcrumbItems = generateBreadcrumb();

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <Home className="h-4 w-4" />
      
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
          
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-blue-600 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
