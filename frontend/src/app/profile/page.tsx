'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Settings,
  ShoppingBag,
  Heart,
  Bell,
  Shield,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Edit3,
  Save,
  Camera,
  Trophy,
  Star,
  Package,
  Clock,
  Eye,
  Download
} from 'lucide-react';
import Link from 'next/link';
import GamificationStatus from '@/app/components/GamificationStatus';

// Interfaces
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  birthDate: string;
  gender: string;
  cpf: string;
  joinDate: string;
  lastLogin: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

interface UserAddress {
  id: string;
  type: 'home' | 'work' | 'other';
  name: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

interface UserOrder {
  id: string;
  date: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  itemsCount: number;
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [recentOrders, setRecentOrders] = useState<UserOrder[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento dos dados do usuário
    const loadUserData = async () => {
      setLoading(true);
      
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockProfile: UserProfile = {
        id: '1',
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '(11) 99999-9999',
        avatar: '/api/placeholder/150/150',
        birthDate: '1985-03-15',
        gender: 'Masculino',
        cpf: '123.456.789-00',
        joinDate: '2023-01-15',
        lastLogin: '2024-01-15T10:30:00Z',
        emailVerified: true,
        phoneVerified: false
      };
      
      const mockAddresses: UserAddress[] = [
        {
          id: '1',
          type: 'home',
          name: 'Casa',
          street: 'Rua das Flores',
          number: '123',
          complement: 'Apto 45',
          neighborhood: 'Meireles',
          city: 'Fortaleza',
          state: 'CE',
          zipCode: '60160-230',
          isDefault: true
        },
        {
          id: '2',
          type: 'work',
          name: 'Trabalho',
          street: 'Av. Paulista',
          number: '1000',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          isDefault: false
        }
      ];
      
      const mockOrders: UserOrder[] = [
        {
          id: 'ORD-001',
          date: '2024-01-10',
          status: 'delivered',
          total: 1250.00,
          itemsCount: 3
        },
        {
          id: 'ORD-002',
          date: '2024-01-05',
          status: 'shipped',
          total: 890.50,
          itemsCount: 2
        },
        {
          id: 'ORD-003',
          date: '2023-12-28',
          status: 'delivered',
          total: 2100.00,
          itemsCount: 5
        }
      ];
      
      setProfile(mockProfile);
      setAddresses(mockAddresses);
      setRecentOrders(mockOrders);
      setLoading(false);
    };

    loadUserData();
  }, []);

  const handleSaveProfile = () => {
    // Implementar salvamento do perfil
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando seu perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
                <p className="text-gray-600">Gerencie suas informações e preferências</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className={profile.emailVerified ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}>
                {profile.emailVerified ? '✓ Verificado' : '⚠ Não verificado'}
              </Badge>
              <Button
                variant={isEditing ? 'default' : 'outline'}
                onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}
              >
                {isEditing ? (
                  <><Save className="w-4 h-4 mr-2" />Salvar</>
                ) : (
                  <><Edit3 className="w-4 h-4 mr-2" />Editar</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna principal */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="addresses">Endereços</TabsTrigger>
                <TabsTrigger value="orders">Pedidos</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Resumo da conta */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Resumo da Conta</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <User className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{profile.name}</h3>
                          <p className="text-gray-600">{profile.email}</p>
                          <p className="text-sm text-gray-500">Membro desde {new Date(profile.joinDate).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Último acesso:</span>
                          <span className="text-sm font-medium">{new Date(profile.lastLogin).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Email verificado:</span>
                          <Badge className={profile.emailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {profile.emailVerified ? 'Sim' : 'Não'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Telefone verificado:</span>
                          <Badge className={profile.phoneVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {profile.phoneVerified ? 'Sim' : 'Não'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Estatísticas rápidas */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <ShoppingBag className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{recentOrders.length}</div>
                      <div className="text-sm text-gray-600">Pedidos realizados</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">12</div>
                      <div className="text-sm text-gray-600">Produtos favoritos</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">8</div>
                      <div className="text-sm text-gray-600">Avaliações feitas</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nome completo</Label>
                        <Input
                          id="name"
                          value={profile.name}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-50' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          value={profile.email}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-50' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={profile.phone}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-50' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                          id="cpf"
                          value={profile.cpf}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="birthDate">Data de nascimento</Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={profile.birthDate}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-50' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="gender">Gênero</Label>
                        <Input
                          id="gender"
                          value={profile.gender}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-50' : ''}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="addresses" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Meus Endereços</h3>
                  <Button>
                    <MapPin className="w-4 h-4 mr-2" />
                    Adicionar Endereço
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <Card key={address.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold">{address.name}</h4>
                              {address.isDefault && (
                                <Badge className="bg-blue-100 text-blue-800">Padrão</Badge>
                              )}
                            </div>
                            <p className="text-gray-600">
                              {address.street}, {address.number}
                              {address.complement && `, ${address.complement}`}
                            </p>
                            <p className="text-gray-600">
                              {address.neighborhood}, {address.city} - {address.state}
                            </p>
                            <p className="text-gray-600">CEP: {address.zipCode}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            {!address.isDefault && (
                              <Button variant="outline" size="sm">
                                Definir como padrão
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="orders" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Meus Pedidos</h3>
                  <Link href="/pedidos">
                    <Button variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver todos
                    </Button>
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold">Pedido #{order.id}</h4>
                              <Badge className={getStatusColor(order.status)}>
                                {getStatusText(order.status)}
                              </Badge>
                            </div>
                            <p className="text-gray-600">
                              {new Date(order.date).toLocaleDateString('pt-BR')} • {order.itemsCount} {order.itemsCount === 1 ? 'item' : 'itens'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">R$ {order.total.toFixed(2)}</div>
                            <Button variant="outline" size="sm" className="mt-2">
                              <Package className="w-4 h-4 mr-1" />
                              Detalhes
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status de gamificação */}
            <GamificationStatus compact={false} showRecentAchievement={true} />

            {/* Links rápidos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acesso Rápido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/favoritos" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Heart className="w-4 h-4 mr-2" />
                    Meus Favoritos
                  </Button>
                </Link>
                <Link href="/pedidos" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Meus Pedidos
                  </Button>
                </Link>
                <Link href="/carrinho" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="w-4 h-4 mr-2" />
                    Meu Carrinho
                  </Button>
                </Link>
                <Separator className="my-3" />
                <Link href="/profile/gamification" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Trophy className="w-4 h-4 mr-2" />
                    Gamificação
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="w-4 h-4 mr-2" />
                  Notificações
                </Button>
              </CardContent>
            </Card>

            {/* Segurança */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Segurança</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Autenticação em duas etapas</span>
                  <Badge className="bg-red-100 text-red-800">Inativa</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Última alteração de senha</span>
                  <span className="text-sm text-gray-600">30 dias atrás</span>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Alterar Senha
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;