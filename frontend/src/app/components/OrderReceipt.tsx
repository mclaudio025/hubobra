'use client';

import React from 'react';
import { 
  Building2, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Package,
  Receipt
} from 'lucide-react';
import { STORE_CONFIG } from '@/config/store.config';

interface OrderItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  total: number;
}

interface OrderReceiptProps {
  order: {
    id: string;
    orderNumber: string;
    createdAt: string;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    deliveryMethod: 'DELIVERY' | 'PICKUP';
    items: OrderItem[];
    subtotal: number;
    shipping: number;
    total: number;
    customer?: {
      name: string;
      email: string;
      phone?: string;
    };
    user?: {
      name: string;
      email: string;
      phone?: string;
    };
    deliveryAddress?: {
      street: string;
      number: string;
      complement?: string;
      district: string;
      city: string;
      state: string;
      zipCode: string;
    };
    notes?: string;
  };
  companyInfo?: {
    name: string;
    cnpj: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
  };
}

export default function OrderReceipt({ order, companyInfo }: OrderReceiptProps) {
  const defaultCompanyInfo = {
    name: `${STORE_CONFIG.name} - ${STORE_CONFIG.tagline}`,
    cnpj: STORE_CONFIG.cnpj,
    address: STORE_CONFIG.contact.address,
    phone: STORE_CONFIG.contact.whatsappFormatted,
    email: STORE_CONFIG.contact.email,
    website: STORE_CONFIG.domain
  };

  const company = companyInfo || defaultCompanyInfo;

  // Determinar método de entrega baseado no endereço
  const getDeliveryMethod = () => {
    if (!order.deliveryAddress) {
      return 'PICKUP';
    }
    
    const address = order.deliveryAddress;
    if (address && address.street === 'Retirada na loja') {
      return 'PICKUP';
    }
    
    return order.deliveryMethod || 'DELIVERY';
  };

  const deliveryMethod = getDeliveryMethod();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      'PIX': 'PIX',
      'STORE_PICKUP': 'Pagar na Entrega',
      'PAYMENT_LINK': 'Pagar na Entrega',
      'CASH_ON_DELIVERY': 'Pagar na Entrega',
      'CREDIT_CARD': 'Cartão de Crédito',
      'DEBIT_CARD': 'Cartão de Débito'
    };
    return methods[method as keyof typeof methods] || 'Pagar na Entrega';
  };

  const getStatusLabel = (status: string) => {
    const statuses = {
      'PENDING': 'Pendente',
      'CONFIRMED': 'Confirmado',
      'PROCESSING': 'Processando',
      'SHIPPED': 'Enviado',
      'DELIVERED': 'Entregue',
      'CANCELLED': 'Cancelado'
    };
    return statuses[status as keyof typeof statuses] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'PENDING': 'text-yellow-600 bg-yellow-50',
      'CONFIRMED': 'text-blue-600 bg-blue-50',
      'PROCESSING': 'text-orange-600 bg-orange-50',
      'SHIPPED': 'text-purple-600 bg-purple-50',
      'DELIVERED': 'text-green-600 bg-green-50',
      'CANCELLED': 'text-red-600 bg-red-50'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="max-w-4xl mx-auto bg-white print:max-w-none print:mx-0 print:text-xs print:leading-tight" id="order-receipt">
      {/* Header da Empresa */}
      <div className="border-b-2 border-orange-600 pb-4 mb-4 print:pb-2 print:mb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 print:text-lg">
              <Building2 className="h-6 w-6 text-orange-600 print:h-4 print:w-4" />
              {company.name}
            </h1>
            <p className="text-sm text-gray-600 mt-1 print:text-xs print:mt-0.5">{company.address}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 print:text-xs print:mt-1 print:gap-2">
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4 print:h-3 print:w-3" />
                {company.phone}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4 print:h-3 print:w-3" />
                {company.email}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 print:text-[10px] print:mt-0.5">CNPJ: {company.cnpj}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-orange-600 mb-2 print:mb-1">
              <Receipt className="h-6 w-6 print:h-4 print:w-4" />
              <span className="text-lg font-semibold print:text-base">RECIBO</span>
            </div>
            <p className="text-sm text-gray-600 print:text-xs">
              Pedido #{order.orderNumber}
            </p>
            <p className="text-xs text-gray-500 print:text-[10px]">
              {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Informações do Pedido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:gap-2 print:mb-2">
        {/* Dados do Cliente */}
        <div className="bg-gray-50 p-3 rounded-lg print:p-2 print:bg-gray-100">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 print:text-xs print:mb-1">
            <Package className="h-5 w-5 text-orange-600 print:h-3 print:w-3" />
            Dados do Cliente
          </h3>
          <div className="space-y-1 text-sm print:text-xs print:space-y-0">
            <p><strong>Nome:</strong> {order.customer?.name || order.user?.name || 'N/A'}</p>
            <p><strong>Email:</strong> {order.customer?.email || order.user?.email || 'N/A'}</p>
            {(order.customer?.phone || order.user?.phone) && (
              <p><strong>Telefone:</strong> {order.customer?.phone || order.user?.phone}</p>
            )}
          </div>
        </div>

        {/* Status do Pedido */}
        <div className="bg-gray-50 p-3 rounded-lg print:p-2 print:bg-gray-100">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 print:text-xs print:mb-1">
            <Calendar className="h-5 w-5 text-orange-600 print:h-3 print:w-3" />
            Status do Pedido
          </h3>
          <div className="space-y-1 text-sm print:text-xs print:space-y-0">
            <p>
              <strong>Status:</strong> 
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)} print:px-1 print:py-0 print:text-[10px]`}>
                {getStatusLabel(order.status)}
              </span>
            </p>
            <p><strong>Pagamento:</strong> {getPaymentMethodLabel(order.paymentMethod)}</p>
            <p><strong>Entrega:</strong> {deliveryMethod === 'DELIVERY' ? 'Entrega em Casa' : 'Retirar na Loja'}</p>
          </div>
        </div>
      </div>

      {/* Endereço de Entrega */}
      {deliveryMethod === 'DELIVERY' && order.deliveryAddress && (
        <div className="bg-blue-50 p-3 rounded-lg mb-4 print:p-2 print:mb-2 print:bg-blue-100">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 print:text-xs print:mb-1">
            <MapPin className="h-5 w-5 text-blue-600 print:h-3 print:w-3" />
            Endereço de Entrega
          </h3>
          <div className="text-sm text-gray-700 print:text-xs">
            <p>
              {order.deliveryAddress.street}, {order.deliveryAddress.number}
              {order.deliveryAddress.complement && ` - ${order.deliveryAddress.complement}`}
            </p>
            <p>
              {order.deliveryAddress.district} - {order.deliveryAddress.city}/{order.deliveryAddress.state}
            </p>
            <p>CEP: {order.deliveryAddress.zipCode}</p>
          </div>
        </div>
      )}

      {/* Itens do Pedido */}
      <div className="mb-4 print:mb-2">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 print:text-xs print:mb-1">
          <Package className="h-5 w-5 text-orange-600 print:h-3 print:w-3" />
          Itens do Pedido
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 print:text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-1.5 text-left text-sm print:px-1 print:py-0.5 print:text-xs">Produto</th>
                <th className="border border-gray-300 px-3 py-1.5 text-left text-sm print:px-1 print:py-0.5 print:text-xs">Descrição</th>
                <th className="border border-gray-300 px-3 py-1.5 text-center text-sm print:px-1 print:py-0.5 print:text-xs">Qtd</th>
                <th className="border border-gray-300 px-3 py-1.5 text-right text-sm print:px-1 print:py-0.5 print:text-xs">Valor Unit.</th>
                <th className="border border-gray-300 px-3 py-1.5 text-right text-sm print:px-1 print:py-0.5 print:text-xs">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="border border-gray-300 px-3 py-1.5 text-sm print:px-1 print:py-0.5 print:text-xs">{item.name}</td>
                  <td className="border border-gray-300 px-3 py-1.5 text-sm print:px-1 print:py-0.5 print:text-xs">{item.description || 'N/A'}</td>
                  <td className="border border-gray-300 px-3 py-1.5 text-center text-sm print:px-1 print:py-0.5 print:text-xs">{item.quantity}</td>
                  <td className="border border-gray-300 px-3 py-1.5 text-right text-sm print:px-1 print:py-0.5 print:text-xs">{formatCurrency(item.price)}</td>
                  <td className="border border-gray-300 px-3 py-1.5 text-right font-medium text-sm print:px-1 print:py-0.5 print:text-xs">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totais */}
      <div className="bg-gray-50 p-3 rounded-lg mb-4 print:p-2 print:mb-2 print:bg-gray-100">
        <div className="flex justify-end">
          <div className="w-64 space-y-1 print:w-48 print:space-y-0">
            <div className="flex justify-between text-sm print:text-xs">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.shipping > 0 && (
              <div className="flex justify-between text-sm print:text-xs">
                <span>Frete:</span>
                <span>{formatCurrency(order.shipping)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-1.5 print:text-sm print:pt-0.5">
              <span>Total:</span>
              <span className="text-orange-600">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Observações */}
      {order.notes && (
        <div className="bg-yellow-50 p-3 rounded-lg mb-4 print:p-2 print:mb-2 print:bg-yellow-100">
          <h3 className="font-semibold text-gray-900 mb-1.5 print:text-xs print:mb-0.5">Observações:</h3>
          <p className="text-sm text-gray-700 print:text-xs">{order.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t pt-3 text-center text-xs text-gray-500 print:pt-1 print:text-[10px]">
        <p>Este é um recibo eletrônico gerado automaticamente.</p>
        <p className="mt-0.5">
          Para dúvidas, entre em contato: {company.phone} | {company.email}
        </p>
        {company.website && (
          <p className="mt-0.5">{company.website}</p>
        )}
        <p className="mt-1 text-gray-400">
          Recibo gerado em {formatDate(new Date().toISOString())}
        </p>
      </div>
    </div>
  );
}
