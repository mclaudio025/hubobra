'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Calendar, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Truck,
  AlertCircle
} from 'lucide-react';
import { useUsers } from '../../hooks/useApi';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'MANAGER' | 'USER' | 'EXPEDITION';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  managers: number;
  users: number;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const { getUsers, getUserStats, createUser, updateUser, deleteUser, activateUser } = useUsers();

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await getUsers();
      const rawList = Array.isArray(response)
        ? response
        : (response?.users || response?.data || []);
      
      const normalizedUsers: User[] = rawList.map((u: any) => ({
        id: u.id,
        name: u.name || u.email?.split('@')[0] || 'Usuário',
        email: u.email || '',
        phone: u.phone || '',
        role: ((u.role || 'USER').toUpperCase()) as any,
        isActive: u.isActive !== undefined ? Boolean(u.isActive) : (u.active !== undefined ? Boolean(u.active) : true),
        createdAt: u.createdAt || new Date().toISOString(),
        lastLogin: u.lastLogin || u.updatedAt,
        avatar: u.avatar,
      }));

      setUsers(normalizedUsers);

      // Atualizar stats de fallback caso a API de stats demore
      if (!stats && normalizedUsers.length > 0) {
        setStats({
          total: normalizedUsers.length,
          active: normalizedUsers.filter(u => u.isActive).length,
          inactive: normalizedUsers.filter(u => !u.isActive).length,
          admins: normalizedUsers.filter(u => u.role === 'ADMIN').length,
          managers: normalizedUsers.filter(u => u.role === 'MANAGER').length,
          users: normalizedUsers.filter(u => u.role === 'USER' || u.role === 'EXPEDITION').length,
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      setErrorMsg(error?.message || 'Erro ao carregar usuários. Verifique se está autenticado como Administrador.');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getUserStats();
      if (response && typeof response.total === 'number') {
        setStats(response);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      const payload: any = {
        name: userData.name?.trim(),
        email: userData.email?.trim(),
        password: userData.password?.trim(),
        role: userData.role,
        active: userData.isActive !== undefined ? Boolean(userData.isActive) : true,
      };
      if (userData.phone?.trim()) {
        payload.phone = userData.phone.trim();
      }

      await createUser(payload);
      await loadUsers();
      await loadStats();
      setShowCreateModal(false);
      alert('Usuário cadastrado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      alert(error?.message || 'Erro ao criar usuário. Verifique se o e-mail já não está cadastrado.');
    }
  };

  const handleUpdateUser = async (userId: string, userData: any) => {
    try {
      const payload: any = {
        name: userData.name?.trim(),
        email: userData.email?.trim(),
        role: userData.role,
        active: userData.isActive !== undefined ? Boolean(userData.isActive) : true,
      };
      if (userData.password?.trim()) {
        payload.password = userData.password.trim();
      }
      if (userData.phone?.trim()) {
        payload.phone = userData.phone.trim();
      }

      await updateUser(userId, payload);
      await loadUsers();
      await loadStats();
      setShowEditModal(false);
      setSelectedUser(null);
      alert('Usuário atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      alert(error?.message || 'Erro ao atualizar usuário');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await deleteUser(userId);
        await loadUsers();
        await loadStats();
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert('Erro ao excluir usuário');
      }
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await deleteUser(userId); // Desativar
      } else {
        await activateUser(userId); // Ativar
      }
      await loadUsers();
      await loadStats();
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      alert('Erro ao alterar status do usuário');
    }
  };

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
                         (user.name && user.name.toLowerCase().includes(term)) ||
                         (user.email && user.email.toLowerCase().includes(term)) ||
                         (user.phone && user.phone.includes(term));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));

  const getRoleColor = (role: string) => {
    const colors = {
      ADMIN: 'bg-red-100 text-red-800 border border-red-200',
      MANAGER: 'bg-blue-100 text-blue-800 border border-blue-200',
      EXPEDITION: 'bg-orange-100 text-orange-800 border border-orange-200 font-semibold',
      USER: 'bg-green-100 text-green-800 border border-green-200'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <ShieldCheck className="h-4 w-4 text-red-600" />;
      case 'MANAGER':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'EXPEDITION':
        return <Truck className="h-4 w-4 text-orange-600" />;
      default:
        return <Users className="h-4 w-4 text-green-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600 mt-1">Gerencie contas e permissões</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              loadUsers();
              loadStats();
            }}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Alerta de Erro */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
          <button
            onClick={loadUsers}
            className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inativos</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <EyeOff className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-red-600">{stats.admins}</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Managers</p>
                <p className="text-2xl font-bold text-blue-600">{stats.managers}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuários</p>
                <p className="text-2xl font-bold text-green-600">{stats.users}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              >
                <option value="all">Todas as funções</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="EXPEDITION">Expedição (Depósito)</option>
                <option value="USER">Usuário / Cliente</option>
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm bg-white"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                      <span>Carregando usuários...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium">Nenhum usuário encontrado.</p>
                    <p className="text-xs text-gray-400 mt-1">Tente ajustar os filtros de busca ou cadastre um novo usuário.</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-700">
                              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">ID: {user.id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail className="h-4 w-4 mr-1.5 text-gray-400" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          {user.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span className="ml-1">{user.role}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin 
                        ? new Date(user.lastLogin).toLocaleDateString('pt-BR')
                        : 'Nunca'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1.5 rounded hover:bg-blue-50 transition cursor-pointer"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                          className={`p-1.5 rounded transition cursor-pointer ${
                            user.isActive 
                              ? 'text-amber-600 hover:text-amber-900 hover:bg-amber-50' 
                              : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                          }`}
                          title={user.isActive ? 'Desativar' : 'Ativar'}
                        >
                          {user.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 p-1.5 rounded hover:bg-red-50 transition cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                  </span>{' '}
                  de <span className="font-medium">{filteredUsers.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium cursor-pointer ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                  >
                    Próximo
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criar Usuário */}
      {showCreateModal && (
        <UserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
          title="Criar Novo Usuário"
        />
      )}

      {/* Modal de Editar Usuário */}
      {showEditModal && selectedUser && (
        <UserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSubmit={(userData) => handleUpdateUser(selectedUser.id, userData)}
          user={selectedUser}
          title="Editar Usuário"
        />
      )}
    </div>
  );
}

// Componente Modal para Criar/Editar Usuário
interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: Partial<User>) => void;
  user?: User;
  title: string;
}

function UserModal({ isOpen, onClose, onSubmit, user, title }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    role: user?.role || 'USER',
    isActive: user?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend: any = { ...formData };
    if (!dataToSend.password && user) {
      delete dataToSend.password;
    }
    onSubmit(dataToSend);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: João da Expedição"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              E-mail de Login
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="expedicao@hubobra.com.br"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {user ? 'Nova Senha / PIN (Opcional)' : 'Senha / PIN de Acesso (Mín. 6 dígitos)'}
            </label>
            <div className="relative">
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder={user ? 'Deixe em branco para não alterar' : '••••••••'}
                minLength={user ? 0 : 6}
                required={!user}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            {!user && (
              <p className="text-[11px] text-gray-500 mt-1">
                Esta senha será usada pelo operador para entrar no app de expedição ou painel.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Telefone / WhatsApp (Opcional)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(85) 99999-9999"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Função / Nível de Acesso
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white font-medium"
            >
              <option value="EXPEDITION">🚚 Expedição (Operador de Depósito)</option>
              <option value="USER">👤 Usuário / Cliente Comum</option>
              <option value="MANAGER">👔 Manager (Gerente de Loja)</option>
              <option value="ADMIN">🛡️ Admin (Acesso Completo)</option>
            </select>
          </div>
          <div className="flex items-center pt-1">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-800 cursor-pointer">
              Usuário ativo e liberado para acesso
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              {user ? 'Salvar Alterações' : 'Cadastrar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
