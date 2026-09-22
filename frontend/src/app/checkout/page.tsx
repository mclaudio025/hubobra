'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CreditCard, 
  MapPin, 
  ShoppingBag, 
  Store, 
  Truck, 
  CheckCircle2, 
  Sparkles,
  Info,
  Clock,
  Building2,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../hooks/useApi';
import { useToast } from '../components/ui/Toaster';
import { STORE_CONFIG } from '@/config/store.config';
import { calculateShippingRates, ShippingRateResult, SHIPPING_CONFIG } from '@/config/shipping.config';

interface DeliveryAddress {
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface PaymentData {
  method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'BANK_SLIP' | 'CASH';
  cardNumber?: string;
  cardName?: string;
  cardExpiry?: string;
  cardCvv?: string;
}

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    street: '',
    number: '',
    complement: '',
    district: '',
    city: 'Fortaleza',
    state: 'CE',
    zipCode: '',
    country: 'Brasil'
  });
  
  const [shippingRate, setShippingRate] = useState<ShippingRateResult>(() => 
    calculateShippingRates({ city: 'Fortaleza', state: 'CE' })
  );

  const [paymentData, setPaymentData] = useState<PaymentData>({
    method: 'PIX'
  });
  const [deliveryMethod, setDeliveryMethod] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [notes, setNotes] = useState('');

  const { items, total, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const ordersApi = useOrders();
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }

    if (items.length === 0) {
      router.push('/carrinho');
      return;
    }
  }, [isAuthenticated, items, router]);

  // Recalcular taxa de frete sempre que o endereço ou subtotal mudar
  const recomputeShipping = (addr: Partial<DeliveryAddress>) => {
    const rate = calculateShippingRates({
      cep: addr.zipCode || deliveryAddress.zipCode,
      city: addr.city || deliveryAddress.city,
      neighborhood: addr.district || deliveryAddress.district,
      state: addr.state || deliveryAddress.state,
      subtotal: total
    });
    setShippingRate(rate);
    return rate;
  };

  const getShippingFee = () => {
    if (deliveryMethod === 'PICKUP') return 0;
    return shippingRate.fee;
  };

  const calculateTotal = () => {
    return total + getShippingFee();
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryMethod === 'PICKUP' || validateAddress()) {
      setCurrentStep(2);
    }
  };

  const validateAddress = () => {
    if (deliveryMethod === 'PICKUP') {
      return true;
    }
    
    const required = ['street', 'number', 'district', 'city', 'state', 'zipCode'];
    for (const field of required) {
      if (!deliveryAddress[field as keyof DeliveryAddress]) {
        addToast({
          type: 'error',
          title: 'Endereço incompleto',
          message: 'Por favor, preencha todos os campos obrigatórios'
        });
        return false;
      }
    }
    return true;
  };

  const searchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      return;
    }

    setLoadingCep(true);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        addToast({
          type: 'error',
          title: 'CEP não encontrado',
          message: 'Verifique o CEP informado ou preencha o endereço manualmente'
        });
        return;
      }

      // Verifica se o CEP é do Ceará
      if (data.uf !== 'CE') {
        addToast({
          type: 'warning',
          title: 'Atenção para entrega fora do Ceará',
          message: 'Atendemos via transportadora com cotação sob consulta no WhatsApp.'
        });
      }

      const updatedAddress = {
        street: data.logradouro || deliveryAddress.street,
        district: data.bairro || deliveryAddress.district,
        city: data.localidade || deliveryAddress.city,
        state: data.uf || 'CE',
        zipCode: cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2'),
        complement: deliveryAddress.complement,
        number: deliveryAddress.number,
        country: 'Brasil'
      };

      setDeliveryAddress(updatedAddress);
      const computed = recomputeShipping(updatedAddress);

      if (computed.isFree) {
        addToast({
          type: 'success',
          title: '✨ Frete Grátis Aplicado!',
          message: `O bairro ${data.bairro || 'indicado'} possui entrega gratuita pela HubConstruções.`
        });
      } else {
        addToast({
          type: 'info',
          title: 'Frete Calculado',
          message: `Taxa de entrega: ${computed.feeFormatted} (${computed.zoneName})`
        });
      }

    } catch {
      addToast({
        type: 'error',
        title: 'Erro ao buscar CEP',
        message: 'Preencha os campos de endereço manualmente'
      });
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    let formattedValue = cleanValue;
    
    if (cleanValue.length > 5) {
      formattedValue = `${cleanValue.slice(0, 5)}-${cleanValue.slice(5, 8)}`;
    }
    
    setDeliveryAddress(prev => ({
      ...prev,
      zipCode: formattedValue
    }));

    if (cleanValue.length === 8) {
      searchCep(cleanValue);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePayment()) {
      return;
    }

    setLoading(true);
    try {
      const finalShippingCost = getShippingFee();

      // Criar pedido no backend
      const orderData = {
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price
        })),
        shippingAddress: deliveryMethod === 'DELIVERY' ? deliveryAddress : {
          street: 'Ponto de Retirada Parceiro',
          number: 'S/N',
          district: 'Centro de Distribuição',
          city: 'Fortaleza',
          state: 'CE',
          zipCode: '60000-000',
          country: 'Brasil'
        },
        deliveryMethod,
        payment: {
          method: mapPaymentMethod(paymentData.method),
          amount: calculateTotal(),
          transactionId: paymentData.method === 'PIX' ? undefined : `${paymentData.method}_${Date.now()}`
        },
        shipping: finalShippingCost,
        tax: 0,
        notes: notes.trim() ? notes : (deliveryMethod === 'PICKUP' ? 'Cliente optou por retirada no CD parceiro de Fortaleza' : undefined)
      };

      const order = await ordersApi.createOrder(orderData);
      
      let paymentResult;
      
      if (paymentData.method === 'PIX') {
        paymentResult = await fetch('/api/payments/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            amount: calculateTotal(),
            customerName: user?.name,
            customerEmail: user?.email,
            description: `Pedido #${order.orderNumber} - HubConstruções`
          })
        }).then(res => res.json());
        
        if (paymentResult.error) {
          throw new Error(paymentResult.error);
        }
        
        clearCart();
        router.push(`/pagamento/pix/${paymentResult.id}`);
        return;
      }
      
      clearCart();
      
      addToast({
        type: 'success',
        title: 'Pedido realizado com sucesso!',
        message: `Pedido #${order.orderNumber} registrado na HubConstruções`
      });

      router.push(`/pedidos/${order.id}`);
      
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erro ao registrar pedido',
        message: error.message || 'Tente novamente ou fale com o suporte'
      });
    } finally {
      setLoading(false);
    }
  };

  const validatePayment = () => {
    return true;
  };

  const mapPaymentMethod = (method: string) => {
    const methodMap = {
      'PIX': 'PIX',
      'STORE_PICKUP': 'CASH',
      'PAYMENT_LINK': 'CREDIT_CARD',
      'CASH_ON_DELIVERY': 'CASH'
    };
    return methodMap[method as keyof typeof methodMap] || 'CASH';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!isAuthenticated || items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/carrinho"
              className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-orange-600 transition font-medium text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Carrinho
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Checkout Seguro</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all ${
                  currentStep >= 1 ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30' : 'bg-slate-200 text-slate-600'
                }`}>
                  <Truck className="h-5 w-5" />
                </div>
                <span className={`ml-2 text-sm font-bold ${currentStep >= 1 ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                  1. Entrega & Obra
                </span>
              </div>
              
              <div className={`w-16 h-1 mx-4 rounded-full transition-all ${currentStep >= 2 ? 'bg-orange-600' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
              
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all ${
                  currentStep >= 2 ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30' : 'bg-slate-200 text-slate-600 dark:bg-slate-800'
                }`}>
                  <CreditCard className="h-5 w-5" />
                </div>
                <span className={`ml-2 text-sm font-bold ${currentStep >= 2 ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                  2. Pagamento
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Step 1: Delivery Method */}
              {currentStep === 1 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-orange-600" />
                    Como você deseja receber seus materiais?
                  </h2>

                  <form onSubmit={handleAddressSubmit} className="space-y-6">
                    {/* Delivery Method Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Opção 1: Entrega na Obra */}
                      <label 
                        onClick={() => setDeliveryMethod('DELIVERY')}
                        className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          deliveryMethod === 'DELIVERY'
                            ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                            <Truck className="h-5 w-5 text-orange-600" />
                            <span>Entrega na Obra</span>
                          </div>
                          {deliveryMethod === 'DELIVERY' && (
                            <CheckCircle2 className="w-5 h-5 text-orange-600" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Despacho direto para o endereço da sua obra em Fortaleza e Região.
                        </p>
                        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          Frete Grátis para bairros selecionados
                        </div>
                      </label>
                      
                      {/* Opção 2: Retirada no Centro de Distribuição */}
                      <label 
                        onClick={() => setDeliveryMethod('PICKUP')}
                        className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          deliveryMethod === 'PICKUP'
                            ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                            <Store className="h-5 w-5 text-orange-600" />
                            <span>Retirada no Ponto de Coleta</span>
                          </div>
                          {deliveryMethod === 'PICKUP' && (
                            <CheckCircle2 className="w-5 h-5 text-orange-600" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Retire diretamente no Centro de Distribuição parceiro em Fortaleza.
                        </p>
                        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sem taxa de frete (R$ 0,00)
                        </div>
                      </label>
                    </div>

                    {/* Address Form - Only show if delivery is selected */}
                    {deliveryMethod === 'DELIVERY' && (
                      <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-orange-600" />
                            Endereço de Entrega da Obra
                          </h3>
                          <span className="text-xs text-slate-500">Atendimento CE</span>
                        </div>

                        {/* CEP com Busca Automática */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                            CEP da Obra *
                          </label>
                          <div className="relative max-w-xs">
                            <input
                              type="text"
                              value={deliveryAddress.zipCode}
                              onChange={(e) => handleCepChange(e.target.value)}
                              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                              placeholder="60000-000"
                              required={deliveryMethod === 'DELIVERY'}
                              maxLength={9}
                            />
                            {loadingCep && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Digite o CEP de Fortaleza ou região para calcular o frete automaticamente.
                          </p>
                        </div>

                        {/* Status Card do Frete Calculado */}
                        {deliveryAddress.zipCode.length >= 8 && (
                          <div className={`p-4 rounded-xl border transition-all ${
                            shippingRate.isFree
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                              : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                          }`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                {shippingRate.isFree ? (
                                  <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                ) : (
                                  <Truck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                )}
                                <div>
                                  <div className="font-bold text-sm">
                                    {shippingRate.isFree ? '✨ Frete Grátis Aplicado!' : `Taxa de Entrega: ${shippingRate.feeFormatted}`}
                                  </div>
                                  <p className="text-xs opacity-90 mt-0.5">
                                    {shippingRate.description}
                                  </p>
                                  <div className="flex items-center gap-3 mt-2 text-[11px] font-medium opacity-80">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" />
                                      Prazo estimado: {shippingRate.estimatedDays}
                                    </span>
                                    <span>• Região: {shippingRate.zoneName}</span>
                                  </div>
                                </div>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-black shrink-0 ${
                                shippingRate.isFree
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-blue-600 text-white'
                              }`}>
                                {shippingRate.isFree ? 'GRÁTIS' : shippingRate.feeFormatted}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                              Rua / Avenida *
                            </label>
                            <input
                              type="text"
                              value={deliveryAddress.street}
                              onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="Ex: Av. Santos Dumont"
                              required={deliveryMethod === 'DELIVERY'}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                              Número *
                            </label>
                            <input
                              type="text"
                              value={deliveryAddress.number}
                              onChange={(e) => setDeliveryAddress({ ...deliveryAddress, number: e.target.value })}
                              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="123"
                              required={deliveryMethod === 'DELIVERY'}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                              Complemento / Referência
                            </label>
                            <input
                              type="text"
                              value={deliveryAddress.complement}
                              onChange={(e) => setDeliveryAddress({ ...deliveryAddress, complement: e.target.value })}
                              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="Apto, Lote, Obra..."
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                              Bairro *
                            </label>
                            <input
                              type="text"
                              value={deliveryAddress.district}
                              onChange={(e) => {
                                const district = e.target.value;
                                setDeliveryAddress(prev => ({ ...prev, district }));
                                recomputeShipping({ district });
                              }}
                              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="Ex: Aldeota, Meireles, Papicu"
                              required={deliveryMethod === 'DELIVERY'}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                              Cidade / UF *
                            </label>
                            <input
                              type="text"
                              value={`${deliveryAddress.city} - ${deliveryAddress.state}`}
                              readOnly
                              className="w-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-600 dark:text-slate-400 cursor-not-allowed font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Store Pickup Info */}
                    {deliveryMethod === 'PICKUP' && (
                      <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold">
                          <Building2 className="w-5 h-5 text-blue-600" />
                          <span>Ponto de Coleta Regional — Fortaleza (CE)</span>
                        </div>
                        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                          {SHIPPING_CONFIG.pickup.instructions}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900">
                          <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                          <span>Horário de Atendimento no Galpão: Seg a Sex das 08h às 17h | Sáb das 08h às 12h</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <span>Continuar para Forma de Pagamento</span>
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </form>
                </div>
              )}

              {/* Step 2: Payment */}
              {currentStep === 2 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-orange-600" />
                      Escolha como deseja pagar
                    </h2>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Alterar Entrega
                    </button>
                  </div>

                  <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    {/* Opções de Pagamento */}
                    <div className="space-y-3">
                      {/* PIX */}
                      <label 
                        onClick={() => setPaymentData({ method: 'PIX' })}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          paymentData.method === 'PIX'
                            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="PIX"
                            checked={paymentData.method === 'PIX'}
                            onChange={() => setPaymentData({ method: 'PIX' })}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>📱 PIX Instantâneo</span>
                              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
                                Liberação Imediata
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              QR Code gerado na hora com confirmação automática do seu pedido
                            </div>
                          </div>
                        </div>
                      </label>

                      {/* Pagar na Entrega / Retirada */}
                      <label 
                        onClick={() => setPaymentData({ method: 'CASH_ON_DELIVERY' })}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          paymentData.method === 'CASH_ON_DELIVERY'
                            ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="CASH_ON_DELIVERY"
                            checked={paymentData.method === 'CASH_ON_DELIVERY'}
                            onChange={() => setPaymentData({ method: 'CASH_ON_DELIVERY' })}
                            className="text-orange-600 focus:ring-orange-500"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>💵 Pagar no Recebimento / Retirada</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Pague em dinheiro, PIX ou cartão com a maquininha do entregador
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Observações do Pedido */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Observações da Entrega ou Contato da Obra
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        rows={3}
                        placeholder="Ex: Falar com o mestre de obras na portaria, descarregar no térreo..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black py-4 px-6 rounded-xl shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2 text-base"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processando Pedido...</span>
                        </div>
                      ) : (
                        <span>Confirmar Pedido — {formatCurrency(calculateTotal())}</span>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 sticky top-4 space-y-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-orange-600" />
                  Resumo dos Materiais ({items.reduce((acc, i) => acc + i.quantity, 0)} itens)
                </h3>

                {/* Lista compacta de itens */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                      <div className="flex items-center gap-2 truncate max-w-[65%]">
                        <span className="font-bold text-orange-600 shrink-0">{item.quantity}x</span>
                        <span className="text-slate-800 dark:text-slate-200 truncate">{item.product.name}</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white shrink-0">
                        {formatCurrency(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(total)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      {deliveryMethod === 'PICKUP' ? <Store className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                      {deliveryMethod === 'PICKUP' ? 'Retirada no Galpão' : 'Frete para Obra'}
                    </span>
                    <span className={`font-bold text-xs ${
                      getShippingFee() === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                    }`}>
                      {getShippingFee() === 0 ? 'GRÁTIS' : formatCurrency(getShippingFee())}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-lg font-black border-t border-slate-200 dark:border-slate-800 pt-3 text-slate-900 dark:text-white">
                    <span>Total</span>
                    <span className="text-orange-600">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>

                {/* Informação sobre o Frete da Região */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    <span>Base Operacional: Fortaleza - CE</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {deliveryMethod === 'PICKUP' 
                      ? 'Retirada com autorização no Centro de Distribuição parceiro.' 
                      : (shippingRate.isFree 
                          ? '✨ Entrega gratuita aplicada para o seu bairro.' 
                          : `Taxa de frete regional: ${shippingRate.feeFormatted}`)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
