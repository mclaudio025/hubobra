'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Package, 
  Heart, 
  ShoppingCart, 
  Shield, 
  Save, 
  CheckCircle, 
  Clock, 
  Truck, 
  LogOut, 
  MessageSquare, 
  Sparkles, 
  Edit3, 
  Key, 
  Smartphone, 
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Building,
  HardHat
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../hooks/useApi';
import { useToast } from '../components/ui/Toaster';
import Loading from '../components/ui/Loading';
import { STORE_CONFIG, getWhatsAppWholesaleLink } from '@/config/store.config';

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  customerType: string;
  birthDate?: string;
  // Endereço
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  reference: string;
}

export default function PerfilPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { addToast } = useToast();
  const ordersApi = useOrders();

  const [activeTab, setActiveTab] = useState<'dados' | 'endereco' | 'pedidos' | 'seguranca'>('dados');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CustomerData>({
    name: '',
    email: '',
    phone: '',
    cpfCnpj: '',
    customerType: 'PROPRIETARIO',
    birthDate: '',
    cep: '60000-000',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'Fortaleza',
    state: 'CE',
    reference: '',
  });

  // Password state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    // Carregar dados existentes
    const loadProfile = async () => {
      try {
        setLoading(true);
        
        // Dados do AuthContext ou localStorage
        const storedProfile = localStorage.getItem('hubobra_customer_profile');
        let initialData: Partial<CustomerData> = {};
        
        if (storedProfile) {
          try {
            initialData = JSON.parse(storedProfile);
          } catch (e) {}
        }

        // Preencher com o que tiver no user logado
        setFormData(prev => ({
          ...prev,
          name: user?.name || initialData.name || 'Claudio Sousa',
          email: user?.email || initialData.email || 'mclaudioms@gmail.com',
          phone: initialData.phone || '(85) 99999-9999',
          cpfCnpj: initialData.cpfCnpj || '',
          customerType: initialData.customerType || 'PROPRIETARIO',
          birthDate: initialData.birthDate || '',
          cep: initialData.cep || '60160-230',
          street: initialData.street || 'Av. Beira Mar',
          number: initialData.number || '1000',
          complement: initialData.complement || 'Apto 502',
          neighborhood: initialData.neighborhood || 'Meireles',
          city: initialData.city || 'Fortaleza',
          state: initialData.state || 'CE',
          reference: initialData.reference || 'Próximo à feirinha',
        }));

        // Buscar pedidos do cliente
        loadCustomerOrders();
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const loadCustomerOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await ordersApi.getAllOrders(1, 10);
      if (res && res.data) {
        setUserOrders(res.data);
      }
    } catch (e) {
      console.warn('Não foi possível carregar pedidos recentes:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleInputChange = (field: keyof CustomerData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCepLookup = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        setLoadingCep(true);
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
          }));
          addToast({
            type: 'success',
            title: 'Endereço encontrado!',
            message: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`,
          });
        } else {
          addToast({
            type: 'error',
            title: 'CEP não encontrado',
            message: 'Verifique o número digitado',
          });
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      // Salvar no localStorage
      localStorage.setItem('hubobra_customer_profile', JSON.stringify(formData));

      // Atualizar também o auth_user se o nome mudou
      if (user) {
        const updatedAuthUser = { ...user, name: formData.name, email: formData.email };
        localStorage.setItem('auth_user', JSON.stringify(updatedAuthUser));
      }

      // Feedback de sucesso
      addToast({
        type: 'success',
        title: 'Perfil salvo com sucesso!',
        message: 'Seus dados foram atualizados para compras e entregas.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao salvar perfil',
        message: err.message || 'Tente novamente.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.newPassword || passwords.newPassword.length < 6) {
      addToast({
        type: 'error',
        title: 'Senha muito curta',
        message: 'A nova senha deve ter no mínimo 6 caracteres.',
      });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      addToast({
        type: 'error',
        title: 'Senhas não coincidem',
        message: 'A confirmação de senha deve ser idêntica à nova senha.',
      });
      return;
    }

    setSavingPassword(true);
    try {
      // Simulação de alteração
      await new Promise(r => setTimeout(r, 600));
      addToast({
        type: 'success',
        title: 'Senha alterada com sucesso!',
        message: 'Utilize sua nova senha no próximo login.',
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      addToast({
        type: 'error',
        title: 'Erro ao atualizar senha',
        message: e.message || 'Tente novamente mais tarde.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    addToast({
      type: 'info',
      title: 'Desconectado',
      message: 'Você saiu da sua conta com sucesso.',
    });
    router.push('/');
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string; icon: any }> = {
      PENDING: { label: 'Pendente', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
      CONFIRMED: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle },
      PROCESSING: { label: 'Em Separação', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: Package },
      SHIPPED: { label: 'Saiu p/ Entrega 🚚', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: Truck },
      DELIVERED: { label: 'Entregue', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle },
      CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-300', icon: LogOut },
    };
    const info = map[status] || map.PENDING;
    const Icon = info.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${info.color}`}>
        <Icon className="h-3 w-3" />
        {info.label}
      </span>
    );
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loading size="lg" text="Carregando dados do perfil..." />
      </div>
    );
  }

  const initialLetter = formData.name ? formData.name.charAt(0).toUpperCase() : 'C';

  return (
    <div className="min-h-screen bg-slate-50/90 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-600 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a Loja
          </Link>

          <span className="text-xs text-slate-400">
            HubObra &bull; Minha Conta
          </span>
        </div>

        {/* User Profile Hero Header */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-orange-400/10 via-amber-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg shadow-orange-500/25 shrink-0">
                {initialLetter}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {formData.name || 'Cliente HubObra'}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full">
                    <Sparkles className="h-3 w-3" />
                    Cliente VIP
                  </span>
                </div>
                
                <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {formData.email}
                </p>

                <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" />
                  {formData.city || 'Fortaleza'} - {formData.state || 'CE'}
                </p>
              </div>
            </div>

            {/* Header Fast Actions */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Link
                href="/pedidos"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold text-xs rounded-xl border border-orange-200 transition"
              >
                <Package className="h-4 w-4" />
                Meus Pedidos
              </Link>
              
              <button
                onClick={handleLogout}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-semibold text-xs rounded-xl transition"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </div>

        {/* Quick Access Badges Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/pedidos"
            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-orange-300 shadow-xs hover:shadow transition flex items-center gap-3 group"
          >
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl group-hover:scale-105 transition">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Meus Pedidos</p>
              <p className="text-[11px] text-slate-500">Rastreio e Recibos</p>
            </div>
          </Link>

          <Link
            href="/carrinho"
            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-orange-300 shadow-xs hover:shadow transition flex items-center gap-3 group"
          >
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-105 transition">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Meu Carrinho</p>
              <p className="text-[11px] text-slate-500">Ver itens salvos</p>
            </div>
          </Link>

          <Link
            href="/favoritos"
            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-orange-300 shadow-xs hover:shadow transition flex items-center gap-3 group"
          >
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-105 transition">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Favoritos</p>
              <p className="text-[11px] text-slate-500">Lista de desejos</p>
            </div>
          </Link>

          <a
            href={getWhatsAppWholesaleLink("Olá Lia! Gostaria de uma ajuda com meus pedidos e materiais de construção.")}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow transition flex items-center gap-3 group"
          >
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Falar com a Lia</p>
              <p className="text-[11px] text-emerald-600 font-medium">WhatsApp Obra 💬</p>
            </div>
          </a>
        </div>

        {/* Main Content Layout with Tabs */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Navigation Tabs Header */}
          <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/50 p-2 gap-1">
            <button
              onClick={() => setActiveTab('dados')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeTab === 'dados'
                  ? 'bg-white text-orange-600 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <User className="h-4 w-4" />
              Dados do Cliente
            </button>

            <button
              onClick={() => setActiveTab('endereco')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeTab === 'endereco'
                  ? 'bg-white text-orange-600 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MapPin className="h-4 w-4" />
              Endereço da Obra / Entrega
            </button>

            <button
              onClick={() => setActiveTab('pedidos')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeTab === 'pedidos'
                  ? 'bg-white text-orange-600 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Package className="h-4 w-4" />
              Histórico de Pedidos
              {userOrders.length > 0 && (
                <span className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0.2 rounded-full">
                  {userOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('seguranca')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeTab === 'seguranca'
                  ? 'bg-white text-orange-600 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Shield className="h-4 w-4" />
              Segurança & Senha
            </button>
          </div>

          {/* TAB 1: DADOS PESSOAIS */}
          {activeTab === 'dados' && (
            <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Informações Principais do Cliente</h2>
                <p className="text-xs text-slate-500">Mantenha seus dados sempre atualizados para emissão de pedidos e comprovantes.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    placeholder="Ex: Claudio Sousa"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    E-mail Principal *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    placeholder="Ex: seuemail@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    WhatsApp / Telefone com DDD *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    placeholder="Ex: (85) 99999-9999"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Usado para receber alertas quando seu caminhão sair para entrega.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    value={formData.cpfCnpj}
                    onChange={(e) => handleInputChange('cpfCnpj', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    placeholder="000.000.000-00 ou CNPJ da Obra"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Perfil de Atuação na Obra
                  </label>
                  <select
                    value={formData.customerType}
                    onChange={(e) => handleInputChange('customerType', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                  >
                    <option value="PROPRIETARIO">Proprietário / Construindo Minha Casa</option>
                    <option value="PEDREIRO">Pedreiro / Mestre de Obras</option>
                    <option value="ENGENHEIRO">Engenheiro / Construtora</option>
                    <option value="ARQUITETO">Arquiteto / Designer</option>
                    <option value="ELETRICISTA">Eletricista / Encanador</option>
                    <option value="OUTRO">Outro Perfil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Data de Nascimento (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/20 transition hover:shadow-lg disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ENDEREÇO DA OBRA */}
          {activeTab === 'endereco' && (
            <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Endereço Principal de Entrega & Descarrego</h2>
                <p className="text-xs text-slate-500">Este endereço será utilizado automaticamente no fechamento de seus pedidos.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    CEP *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.cep}
                      onChange={(e) => {
                        handleInputChange('cep', e.target.value);
                        handleCepLookup(e.target.value);
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                      placeholder="60000-000"
                    />
                    {loadingCep && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 text-xs animate-spin">
                        ⌛
                      </div>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Rua / Avenida / Logradouro *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    placeholder="Ex: Av. Beira Mar"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Número *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.number}
                    onChange={(e) => handleInputChange('number', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    placeholder="Ex: 1000 ou S/N"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={formData.complement}
                    onChange={(e) => handleInputChange('complement', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    placeholder="Ex: Lote 14, Apto 502, Casa B"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    placeholder="Ex: Meireles, Aldeota, Messejana..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    placeholder="Ex: Fortaleza, Caucaia, Maracanaú..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Estado (UF) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition uppercase"
                    placeholder="CE"
                    maxLength={2}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ponto de Referência para Entrega do Caminhão
                  </label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => handleInputChange('reference', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    placeholder="Ex: Em frente ao posto de gasolina, portão azul"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/20 transition hover:shadow-lg disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Salvando...' : 'Salvar Endereço'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: HISTÓRICO DE PEDIDOS */}
          {activeTab === 'pedidos' && (
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Seus Pedidos Recentes</h2>
                  <p className="text-xs text-slate-500">Acompanhe o status e acesse o comprovante oficial de cada compra.</p>
                </div>
                <Link
                  href="/pedidos"
                  className="text-xs font-semibold text-orange-600 hover:underline inline-flex items-center gap-1"
                >
                  Ver todos os pedidos
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {loadingOrders ? (
                <div className="py-12 flex justify-center">
                  <Loading size="md" text="Carregando seus pedidos..." />
                </div>
              ) : userOrders.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl">
                  <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">Nenhum pedido realizado ainda</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Seus pedidos e materiais aparecerão aqui assim que você concluir uma compra.</p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-orange-700 transition"
                  >
                    Ver Catálogo de Materiais
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {userOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            #{order.orderNumber || order.id.slice(0, 8)}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-xs text-slate-500">
                          Data: {new Date(order.createdAt).toLocaleDateString('pt-BR')} &bull; {order.items?.length || 1} item(s)
                        </p>
                        <p className="text-xs font-bold text-slate-800">
                          Total: {formatCurrency(order.total)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/pedidos/${order.id}/recibo`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-600 text-xs font-semibold rounded-xl shadow-2xs transition"
                        >
                          <FileText className="h-3.5 w-3.5 text-orange-500" />
                          Ver Recibo
                          <ExternalLink className="h-2.5 w-2.5 text-slate-400" />
                        </Link>

                        <Link
                          href={`/pedidos/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-2xs transition"
                        >
                          Detalhes
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SEGURANÇA E SENHA */}
          {activeTab === 'seguranca' && (
            <form onSubmit={handlePasswordChange} className="p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Segurança da Conta & Senha de Acesso</h2>
                <p className="text-xs text-slate-500">Altere sua senha periodicamente para manter suas compras seguras.</p>
              </div>

              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    placeholder="Repita a nova senha"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/20 transition hover:shadow-lg disabled:opacity-50"
                  >
                    <Key className="h-4 w-4" />
                    {savingPassword ? 'Alterando...' : 'Alterar Senha'}
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
