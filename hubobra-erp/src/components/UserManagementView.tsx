import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  KeyRound,
  UserCheck,
  UserX,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Smartphone,
  CheckCircle2,
  Laptop,
  Boxes,
  Percent,
  Layers,
  Sparkles,
  Server,
  Settings2,
  Sliders,
  DollarSign,
  FileCheck,
  Package,
  Printer,
  ShieldAlert,
  Save,
  CheckSquare,
  Square,
} from 'lucide-react';

export interface UserPermissions {
  allowedTabs: string[]; // Lista de IDs das abas que o usuário pode ver
  canViewCostPrice: boolean; // Pode ver custo e margem de lucro
  canEditPrices: boolean; // Pode alterar preço de venda
  canGiveExtraDiscount: boolean; // Pode dar desconto acima da alçada
  canCancelOrders: boolean; // Pode cancelar pedidos enviados
  canPerformCashBleed: boolean; // Pode fazer sangria/suprimento
  canManageCreditLimit: boolean; // Pode alterar limite de crediário
}

export interface SystemUser {
  id: string;
  name: string;
  role: 'ADMIN' | 'VENDEDOR' | 'CAIXA' | 'EXPEDICAO' | 'COMPRADOR';
  code: string;
  pin: string;
  commissionPercent?: number;
  maxDiscountPercent?: number;
  assignedTerminal?: string;
  active: boolean;
  lastLogin?: string;
  permissions: UserPermissions;
}

export const ALL_SYSTEM_MODULES = [
  { id: 'VENDEDOR_PEDIDOS', label: 'Balcão Vendedor (Emissão de Pedidos)', category: 'Vendas' },
  { id: 'VENDEDOR_MOBILE', label: 'App Vendedor Mobile (Showroom / Externo)', category: 'Vendas' },
  { id: 'CALCULADORA', label: 'Calculadora de Obras & Materiais', category: 'Vendas' },
  { id: 'COMPRAS', label: 'Gestão de Compras, Cotações & Fornecedores', category: 'Suprimentos & Compras' },
  { id: 'CAIXA_CENTRAL', label: 'Caixa Central (Fila de Pagamentos)', category: 'Financeiro' },
  { id: 'PDV_RAPIDO', label: 'PDV Direto (Modo Supermercado)', category: 'Financeiro' },
  { id: 'EXPEDICAO_DIGITAL', label: 'Expedição Galpão (Separação & Carga)', category: 'Estoque & Galpão' },
  { id: 'PRODUTOS', label: 'Consulta & Cadastro de Estoque', category: 'Estoque & Galpão' },
  { id: 'CLIENTES', label: 'Clientes & Crediário da Loja', category: 'Cadastros' },
  { id: 'FISCAL', label: 'Emissão Fiscal NFC-e & SEFAZ', category: 'Fiscal' },
  { id: 'IMPRESSORAS', label: 'Configuração de Impressoras (LX-300 / L7)', category: 'Hardware' },
  { id: 'USUARIOS_ADMIN', label: 'Painel Admin & Permissões', category: 'Administração' },
  { id: 'CONFIG', label: 'Configurações do Servidor & Backup', category: 'Administração' },
];

export const DEFAULT_PERMISSIONS_BY_ROLE: Record<string, UserPermissions> = {
  ADMIN: {
    allowedTabs: ALL_SYSTEM_MODULES.map((m) => m.id),
    canViewCostPrice: true,
    canEditPrices: true,
    canGiveExtraDiscount: true,
    canCancelOrders: true,
    canPerformCashBleed: true,
    canManageCreditLimit: true,
  },
  VENDEDOR: {
    allowedTabs: ['VENDEDOR_PEDIDOS', 'VENDEDOR_MOBILE', 'CALCULADORA', 'PRODUTOS', 'CLIENTES'],
    canViewCostPrice: false,
    canEditPrices: false,
    canGiveExtraDiscount: false,
    canCancelOrders: false,
    canPerformCashBleed: false,
    canManageCreditLimit: false,
  },
  CAIXA: {
    allowedTabs: ['CAIXA_CENTRAL', 'PDV_RAPIDO', 'CLIENTES', 'FISCAL', 'IMPRESSORAS'],
    canViewCostPrice: false,
    canEditPrices: false,
    canGiveExtraDiscount: false,
    canCancelOrders: true,
    canPerformCashBleed: true,
    canManageCreditLimit: false,
  },
  EXPEDICAO: {
    allowedTabs: ['EXPEDICAO_DIGITAL', 'PRODUTOS'],
    canViewCostPrice: false,
    canEditPrices: false,
    canGiveExtraDiscount: false,
    canCancelOrders: false,
    canPerformCashBleed: false,
    canManageCreditLimit: false,
  },
  COMPRADOR: {
    allowedTabs: ['COMPRAS', 'PRODUTOS', 'CALCULADORA'],
    canViewCostPrice: true,
    canEditPrices: true,
    canGiveExtraDiscount: false,
    canCancelOrders: false,
    canPerformCashBleed: false,
    canManageCreditLimit: false,
  },
};

export const DEFAULT_SYSTEM_USERS: SystemUser[] = [
  {
    id: 'u-1',
    name: 'Administrador Geral (Diretoria)',
    role: 'ADMIN',
    code: 'admin',
    pin: '8899',
    active: true,
    assignedTerminal: 'Servidor Principal',
    lastLogin: 'Agora mesmo',
    permissions: DEFAULT_PERMISSIONS_BY_ROLE.ADMIN,
  },
  {
    id: 'u-2',
    name: 'Carlos Eduardo',
    role: 'VENDEDOR',
    code: '01',
    pin: '1001',
    commissionPercent: 1.5,
    maxDiscountPercent: 5.0,
    active: true,
    assignedTerminal: 'Balcão 01 + Celular Mobile',
    lastLogin: 'Há 5 min',
    permissions: DEFAULT_PERMISSIONS_BY_ROLE.VENDEDOR,
  },
  {
    id: 'u-3',
    name: 'Marcos Vinícius',
    role: 'VENDEDOR',
    code: '02',
    pin: '1002',
    commissionPercent: 1.5,
    maxDiscountPercent: 5.0,
    active: true,
    assignedTerminal: 'Balcão 02 + Celular Mobile',
    lastLogin: 'Há 12 min',
    permissions: DEFAULT_PERMISSIONS_BY_ROLE.VENDEDOR,
  },
  {
    id: 'u-4',
    name: 'Roberto Lima',
    role: 'VENDEDOR',
    code: '03',
    pin: '1003',
    commissionPercent: 1.5,
    maxDiscountPercent: 5.0,
    active: true,
    assignedTerminal: 'Balcão 03',
    lastLogin: 'Há 1 hora',
    permissions: DEFAULT_PERMISSIONS_BY_ROLE.VENDEDOR,
  },
  {
    id: 'u-5',
    name: 'Amanda Sousa',
    role: 'VENDEDOR',
    code: '04',
    pin: '1004',
    commissionPercent: 2.0,
    maxDiscountPercent: 7.0,
    active: true,
    assignedTerminal: 'Televendas / WhatsApp',
    lastLogin: 'Há 2 min',
    permissions: DEFAULT_PERMISSIONS_BY_ROLE.VENDEDOR,
  },
  {
    id: 'u-6',
    name: 'Fernando Costa',
    role: 'VENDEDOR',
    code: '05',
    pin: '1005',
    commissionPercent: 2.0,
    maxDiscountPercent: 8.0,
    active: true,
    assignedTerminal: 'Vendas Externas / Obras (Mobile)',
    lastLogin: 'Há 20 min',
    permissions: DEFAULT_PERMISSIONS_BY_ROLE.VENDEDOR,
  },
  {
    id: 'u-7',
    name: 'Mariana Alves',
    role: 'CAIXA',
    code: 'cx01',
    pin: '2001',
    active: true,
    assignedTerminal: 'Caixa Central (L7/L9)',
    lastLogin: 'Agora mesmo',
    permissions: DEFAULT_PERMISSIONS_BY_ROLE.CAIXA,
  },
  {
    id: 'u-8',
    name: 'Tiago Santos',
    role: 'EXPEDICAO',
    code: 'exp01',
    pin: '3001',
    active: true,
    assignedTerminal: 'Tablet Pátio Galpão',
    lastLogin: 'Há 8 min',
    permissions: DEFAULT_PERMISSIONS_BY_ROLE.EXPEDICAO,
  },
  {
    id: 'u-9',
    name: 'Juliana Mendes',
    role: 'COMPRADOR',
    code: 'compras',
    pin: '7788',
    active: true,
    assignedTerminal: 'Estação de Compras & Suprimentos',
    lastLogin: 'Há 10 min',
    permissions: DEFAULT_PERMISSIONS_BY_ROLE.COMPRADOR,
  },
];

export const UserManagementView: React.FC = () => {
  const [users, setUsers] = useState<SystemUser[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('hubobra_system_users') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const existingIds = new Set(parsed.map((u: any) => u.id));
        const missing = DEFAULT_SYSTEM_USERS.filter((du) => !existingIds.has(du.id));
        const merged = [...parsed, ...missing];
        return merged.map((u: any) => ({
          ...u,
          permissions: u.permissions || DEFAULT_PERMISSIONS_BY_ROLE[u.role] || DEFAULT_PERMISSIONS_BY_ROLE.VENDEDOR,
        }));
      } catch (e) {
        return DEFAULT_SYSTEM_USERS;
      }
    }
    return DEFAULT_SYSTEM_USERS;
  });

  const [activeAdminTab, setActiveAdminTab] = useState<'USERS_LIST' | 'PERMISSIONS_MATRIX' | 'STORE_SETTINGS'>('PERMISSIONS_MATRIX');
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<SystemUser>(users[1] || users[0]);
  const [filterRole, setFilterRole] = useState<'ALL' | 'VENDEDOR' | 'CAIXA' | 'EXPEDICAO' | 'COMPRADOR' | 'ADMIN'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<Partial<SystemUser> | null>(null);

  const saveUsersToStorage = (updatedList: SystemUser[]) => {
    setUsers(updatedList);
    localStorage.setItem('hubobra_system_users', JSON.stringify(updatedList));
  };

  const handleSaveUser = (user: Partial<SystemUser>) => {
    let updated: SystemUser[];
    const roleDefaultPerms = DEFAULT_PERMISSIONS_BY_ROLE[user.role || 'VENDEDOR'];

    if (user.id) {
      updated = users.map((u) =>
        u.id === user.id
          ? ({
              ...u,
              ...user,
              permissions: user.permissions || u.permissions || roleDefaultPerms,
            } as SystemUser)
          : u
      );
    } else {
      const newUser: SystemUser = {
        id: `u-${Date.now()}`,
        name: user.name || 'Novo Usuário',
        role: user.role || 'VENDEDOR',
        code: user.code || `${Math.floor(10 + Math.random() * 90)}`,
        pin: user.pin || '1234',
        commissionPercent: user.commissionPercent || 1.5,
        maxDiscountPercent: user.maxDiscountPercent || 5.0,
        assignedTerminal: user.assignedTerminal || 'Terminal Balcão',
        active: true,
        permissions: roleDefaultPerms,
      };
      updated = [...users, newUser];
    }
    saveUsersToStorage(updated);
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Deseja realmente remover este usuário do sistema?')) {
      const updated = users.filter((u) => u.id !== id);
      saveUsersToStorage(updated);
    }
  };

  // Alternar permissão de aba/módulo para o usuário selecionado
  const toggleTabPermission = (tabId: string) => {
    if (!selectedUserForPerms) return;
    if (selectedUserForPerms.role === 'ADMIN' && tabId === 'USUARIOS_ADMIN') {
      alert('O perfil de Administrador não pode perder acesso ao Painel Admin.');
      return;
    }

    const currentAllowed = selectedUserForPerms.permissions?.allowedTabs || [];
    const newAllowed = currentAllowed.includes(tabId)
      ? currentAllowed.filter((t) => t !== tabId)
      : [...currentAllowed, tabId];

    const updatedUser = {
      ...selectedUserForPerms,
      permissions: {
        ...selectedUserForPerms.permissions,
        allowedTabs: newAllowed,
      },
    };

    setSelectedUserForPerms(updatedUser);
    const updatedUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    saveUsersToStorage(updatedUsers);
  };

  // Alternar permissão de ação especial (ex: ver custo, dar desconto extra)
  const toggleSpecialPermission = (permKey: keyof Omit<UserPermissions, 'allowedTabs'>) => {
    if (!selectedUserForPerms) return;

    const updatedUser = {
      ...selectedUserForPerms,
      permissions: {
        ...selectedUserForPerms.permissions,
        [permKey]: !selectedUserForPerms.permissions[permKey],
      },
    };

    setSelectedUserForPerms(updatedUser);
    const updatedUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    saveUsersToStorage(updatedUsers);
  };

  const filteredUsers = users.filter((u) => {
    if (filterRole === 'ALL') return true;
    return u.role === filterRole;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-lg border border-amber-400/20 font-bold uppercase">
              Painel do Administrador
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-500" />
            <span>Administração, Configurações & Controle de Acesso (RBAC)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Defina exatamente quais telas, relatórios e alçadas financeiras cada vendedor, caixa ou estoquista pode acessar.
          </p>
        </div>

        {/* Abas Superiores do Painel Admin */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveAdminTab('PERMISSIONS_MATRIX')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeAdminTab === 'PERMISSIONS_MATRIX'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Matriz de Acessos & Telas</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('USERS_LIST')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeAdminTab === 'USERS_LIST'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuários & PINs ({users.length})</span>
          </button>
        </div>
      </div>

      {/* ABA 1: MATRIZ VISUAL DE PERMISSÕES & SELEÇÃO DE TELAS */}
      {activeAdminTab === 'PERMISSIONS_MATRIX' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Seletor Lateral do Usuário para Configuração */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-500" />
              <span>1. Selecione o Usuário</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Escolha quem você deseja configurar as permissões de acesso:
            </p>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {users.map((u) => {
                const isSelected = selectedUserForPerms?.id === u.id;
                const allowedCount = u.permissions?.allowedTabs?.length || 0;
                return (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUserForPerms(u)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white truncate max-w-[150px]">{u.name}</span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-500/20 text-purple-400'
                            : u.role === 'VENDEDOR'
                            ? 'bg-amber-500/20 text-amber-400'
                            : u.role === 'CAIXA'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-cyan-500/20 text-cyan-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Login: <strong className="font-mono text-slate-300">{u.code}</strong></span>
                      <span className="text-amber-400 font-bold">{allowedCount} de {ALL_SYSTEM_MODULES.length} Telas</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Painel Central de Checkboxes por Módulo e Ações */}
          <div className="lg:col-span-8 space-y-6">
            {selectedUserForPerms ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
                {/* Header do Usuário Selecionado */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                      Configurando Permissões Para:
                    </span>
                    <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                      <span>{selectedUserForPerms.name}</span>
                      <span className="text-xs text-slate-400 font-normal">({selectedUserForPerms.assignedTerminal})</span>
                    </h3>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const defaultPerms = DEFAULT_PERMISSIONS_BY_ROLE[selectedUserForPerms.role];
                        const updatedUser = { ...selectedUserForPerms, permissions: defaultPerms };
                        setSelectedUserForPerms(updatedUser);
                        const updatedUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
                        saveUsersToStorage(updatedUsers);
                        alert(`Permissões padrão de ${selectedUserForPerms.role} restauradas!`);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
                    >
                      Restaurar Padrão
                    </button>
                  </div>
                </div>

                {/* 1. Módulos / Telas Permitidas */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-500" />
                    <span>Telas & Módulos Visíveis na Barra Superior</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Marque as telas que este usuário pode ver e utilizar no seu computador ou celular:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {ALL_SYSTEM_MODULES.map((mod) => {
                      const isAllowed = selectedUserForPerms.permissions?.allowedTabs?.includes(mod.id);
                      return (
                        <div
                          key={mod.id}
                          onClick={() => toggleTabPermission(mod.id)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                            isAllowed
                              ? 'bg-slate-950 border-emerald-500/40 text-white'
                              : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${isAllowed ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                              {isAllowed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className={`text-xs font-bold ${isAllowed ? 'text-white' : 'text-slate-400'}`}>{mod.label}</p>
                              <span className="text-[9px] text-slate-500 uppercase">{mod.category}</span>
                            </div>
                          </div>

                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                              isAllowed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-600'
                            }`}
                          >
                            {isAllowed ? 'LIBERADO' : 'BLOQUEADO'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Alçadas Financeiras & Restrições Especiais */}
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>Alçadas de Segurança & Ações Restritas</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div
                      onClick={() => toggleSpecialPermission('canViewCostPrice')}
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between ${
                        selectedUserForPerms.permissions?.canViewCostPrice
                          ? 'bg-slate-950 border-amber-500/40 text-white'
                          : 'bg-slate-950/40 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-white">Visualizar Custo & Margem</p>
                        <p className="text-[10px] text-slate-400">Ver quanto a loja pagou pelo produto</p>
                      </div>
                      <div className={`p-1.5 rounded-lg ${selectedUserForPerms.permissions?.canViewCostPrice ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-600'}`}>
                        {selectedUserForPerms.permissions?.canViewCostPrice ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </div>
                    </div>

                    <div
                      onClick={() => toggleSpecialPermission('canEditPrices')}
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between ${
                        selectedUserForPerms.permissions?.canEditPrices
                          ? 'bg-slate-950 border-amber-500/40 text-white'
                          : 'bg-slate-950/40 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-white">Alterar Preço de Venda</p>
                        <p className="text-[10px] text-slate-400">Pode modificar o preço base no cadastro</p>
                      </div>
                      <div className={`p-1.5 rounded-lg ${selectedUserForPerms.permissions?.canEditPrices ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-600'}`}>
                        {selectedUserForPerms.permissions?.canEditPrices ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </div>
                    </div>

                    <div
                      onClick={() => toggleSpecialPermission('canGiveExtraDiscount')}
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between ${
                        selectedUserForPerms.permissions?.canGiveExtraDiscount
                          ? 'bg-slate-950 border-amber-500/40 text-white'
                          : 'bg-slate-950/40 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-white">Desconto Acima da Alçada</p>
                        <p className="text-[10px] text-slate-400">Pode dar mais de {selectedUserForPerms.maxDiscountPercent || 5}% de desconto</p>
                      </div>
                      <div className={`p-1.5 rounded-lg ${selectedUserForPerms.permissions?.canGiveExtraDiscount ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-600'}`}>
                        {selectedUserForPerms.permissions?.canGiveExtraDiscount ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </div>
                    </div>

                    <div
                      onClick={() => toggleSpecialPermission('canCancelOrders')}
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between ${
                        selectedUserForPerms.permissions?.canCancelOrders
                          ? 'bg-slate-950 border-amber-500/40 text-white'
                          : 'bg-slate-950/40 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-white">Cancelar Pedidos / Vendas</p>
                        <p className="text-[10px] text-slate-400">Pode estornar pedidos e devolver estoque</p>
                      </div>
                      <div className={`p-1.5 rounded-lg ${selectedUserForPerms.permissions?.canCancelOrders ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-600'}`}>
                        {selectedUserForPerms.permissions?.canCancelOrders ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 text-slate-500 text-xs">
                Selecione um usuário à esquerda para ver e editar suas permissões.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 2: CADASTRO COMPLETO DE USUÁRIOS & PINS */}
      {activeAdminTab === 'USERS_LIST' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {(['ALL', 'VENDEDOR', 'CAIXA', 'EXPEDICAO', 'ADMIN'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setFilterRole(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterRole === r
                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {r === 'ALL'
                    ? 'Todos'
                    : r === 'VENDEDOR'
                    ? 'Vendedores (5)'
                    : r === 'CAIXA'
                    ? 'Caixas'
                    : r === 'EXPEDICAO'
                    ? 'Expedição'
                    : 'Admins'}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setEditingUser({ role: 'VENDEDOR', active: true, commissionPercent: 1.5, maxDiscountPercent: 5 });
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Usuário</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="p-3.5">Usuário / Nome</th>
                  <th className="p-3.5">Função</th>
                  <th className="p-3.5">Login / PIN</th>
                  <th className="p-3.5">Comissão & Desc.</th>
                  <th className="p-3.5">Telas Liberadas</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-xs">{u.name}</h4>
                          <p className="text-[10px] text-slate-500">{u.assignedTerminal}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : u.role === 'VENDEDOR'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : u.role === 'CAIXA'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono">
                      <span className="text-white font-bold">{u.code}</span>
                      <span className="text-slate-500 mx-1">/</span>
                      <span className="text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        ••••
                      </span>
                    </td>

                    <td className="p-3.5">
                      {u.role === 'VENDEDOR' ? (
                        <div className="text-[11px]">
                          <span className="text-emerald-400 font-bold">{u.commissionPercent}% comissão</span>
                          <p className="text-[10px] text-slate-500">Máx. {u.maxDiscountPercent}% desc.</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[10px]">—</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className="text-amber-400 font-bold text-[11px]">
                        {u.permissions?.allowedTabs?.length || 0} de {ALL_SYSTEM_MODULES.length} Telas
                      </span>
                    </td>

                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUserForPerms(u);
                          setActiveAdminTab('PERMISSIONS_MATRIX');
                        }}
                        className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold"
                        title="Editar Permissões"
                      >
                        Permissões
                      </button>
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                        title="Editar Usuário"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Criação / Edição de Usuário */}
      {isModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <span>{editingUser.id ? 'Editar Usuário' : 'Cadastrar Usuário'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  placeholder="Ex: Carlos Eduardo ou Roberto Lima"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Função / Perfil</label>
                  <select
                    value={editingUser.role || 'VENDEDOR'}
                    onChange={(e: any) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-semibold"
                  >
                    <option value="VENDEDOR">Vendedor Balcão/Mobile</option>
                    <option value="CAIXA">Operador de Caixa</option>
                    <option value="EXPEDICAO">Conferente Galpão</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Código de Login</label>
                  <input
                    type="text"
                    value={editingUser.code || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, code: e.target.value })}
                    placeholder="Ex: 01, 02 ou cx01"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Senha / PIN Rápido</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={editingUser.pin || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, pin: e.target.value })}
                    placeholder="Ex: 1001"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Terminal Vinculado</label>
                  <input
                    type="text"
                    value={editingUser.assignedTerminal || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, assignedTerminal: e.target.value })}
                    placeholder="Ex: Balcão 01 + Mobile"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              {editingUser.role === 'VENDEDOR' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <div>
                    <label className="text-slate-400 block mb-1">Comissão (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingUser.commissionPercent ?? 1.5}
                      onChange={(e) => setEditingUser({ ...editingUser, commissionPercent: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-bold text-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Desc. Máximo Permitido (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editingUser.maxDiscountPercent ?? 5.0}
                      onChange={(e) => setEditingUser({ ...editingUser, maxDiscountPercent: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-bold text-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveUser(editingUser)}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20"
              >
                Salvar Usuário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
