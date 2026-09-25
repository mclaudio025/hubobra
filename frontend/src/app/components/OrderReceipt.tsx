'use client';

import React from 'react';
import { 
  Building2, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Package,
  Receipt,
  Truck,
  CreditCard,
  User,
  CheckCircle,
  Clock,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { STORE_CONFIG } from '@/config/store.config';

interface OrderItem {
  id?: string;
  name?: string;
  description?: string;
  quantity: number;
  price: number;
  total?: number;
  product?: {
    id?: string;
    name?: string;
    sku?: string;
    unit?: string;
  };
}

interface OrderReceiptProps {
  order: {
    id: string;
    orderNumber: string;
    createdAt: string;
    status: string;
    paymentMethod?: string;
    deliveryMethod?: string;
    items: OrderItem[];
    subtotal: number;
    shipping: number;
    tax?: number;
    total: number;
    notes?: string;
    customer?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    user?: {
      name?: string;
      email?: string;
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
      country?: string;
    };
    shippingAddress?: {
      street: string;
      number: string;
      complement?: string;
      district: string;
      city: string;
      state: string;
      zipCode: string;
      country?: string;
    };
    payment?: {
      method?: string;
      status?: string;
      amount?: number;
      transactionId?: string;
      paidAt?: string;
    };
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
    name: STORE_CONFIG.name,
    tagline: STORE_CONFIG.tagline,
    cnpj: STORE_CONFIG.cnpj,
    address: STORE_CONFIG.contact.address,
    phone: STORE_CONFIG.contact.whatsappFormatted,
    email: STORE_CONFIG.contact.email,
    website: STORE_CONFIG.domain
  };

  const company = companyInfo || defaultCompanyInfo;

  const address = order.shippingAddress || order.deliveryAddress;
  const isPickup = !address || address.street === 'Retirada na loja' || address.street === 'Ponto de Retirada Parceiro' || order.deliveryMethod === 'PICKUP';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
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

  const getPaymentMethodLabel = (method?: string) => {
    const rawMethod = method || order.payment?.method || order.paymentMethod;
    const methods: Record<string, string> = {
      'PIX': 'PIX Instantâneo',
      'STORE_PICKUP': 'Pagar na Retirada (Dinheiro/Cartão)',
      'PAYMENT_LINK': 'Pagar no Recebimento / Maquininha',
      'CASH_ON_DELIVERY': 'Pagar no Recebimento / Maquininha',
      'CASH': 'Pagar no Recebimento (Dinheiro / Maquininha)',
      'CREDIT_CARD': 'Cartão de Crédito',
      'DEBIT_CARD': 'Cartão de Débito',
      'BANK_SLIP': 'Boleto Bancário'
    };
    return methods[rawMethod as string] || rawMethod || 'Pagar no Recebimento';
  };

  const getStatusInfo = (status: string) => {
    const statuses: Record<string, { label: string; color: string; printBadge: string }> = {
      'PENDING': { label: 'Pendente', color: 'text-amber-700 bg-amber-50 border-amber-200', printBadge: 'PENDENTE' },
      'CONFIRMED': { label: 'Confirmado', color: 'text-blue-700 bg-blue-50 border-blue-200', printBadge: 'CONFIRMADO' },
      'PROCESSING': { label: 'Em Separação', color: 'text-orange-700 bg-orange-50 border-orange-200', printBadge: 'EM SEPARAÇÃO' },
      'SHIPPED': { label: 'Em Transporte', color: 'text-sky-700 bg-sky-50 border-sky-200', printBadge: 'EM TRANSPORTE' },
      'DELIVERED': { label: 'Entregue', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', printBadge: 'ENTREGUE' },
      'CANCELLED': { label: 'Cancelado', color: 'text-red-700 bg-red-50 border-red-200', printBadge: 'CANCELADO' }
    };
    return statuses[status] || { label: status, color: 'text-slate-700 bg-slate-50 border-slate-200', printBadge: status };
  };

  const customerName = order.customer?.name || order.user?.name || 'Cliente';
  const customerEmail = order.customer?.email || order.user?.email || 'N/A';
  const customerPhone = order.customer?.phone || order.user?.phone || 'N/A';
  const statusInfo = getStatusInfo(order.status);
  const paymentStatus = order.payment?.status || (order.status === 'PAID' ? 'PAID' : 'PENDING');

  return (
    <div className="max-w-4xl mx-auto bg-white text-slate-800 p-6 sm:p-10 font-sans print:p-4 print:max-w-none print:text-black print:bg-white" id="order-receipt">
      {/* Top Header: Brand & Document Title */}
      <div className="border-b-2 border-orange-600 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:pb-3 print:mb-4">
        {/* Company Identity */}
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm print:w-7 print:h-7 print:rounded print:text-sm">
              H
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight print:text-lg">
                Hub<span className="text-orange-600">Obra</span>
              </h1>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold print:text-[9px]">
                Marketplace & Materiais de Construção
              </p>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-slate-600 space-y-0.5 print:text-[10px]">
            <p className="font-medium text-slate-700">{company.address}</p>
            <p>CNPJ: <span className="font-mono">{company.cnpj}</span> | WhatsApp: {company.phone}</p>
            <p>E-mail: {company.email} | Site: {company.website}</p>
          </div>
        </div>

        {/* Document Voucher Box */}
        <div className="sm:text-right bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 sm:min-w-[220px] print:bg-white print:border-black print:p-2">
          <div className="text-xs font-black uppercase tracking-wider text-orange-600 print:text-black">
            Comprovante de Pedido
          </div>
          <div className="text-xl font-black text-slate-900 font-mono mt-0.5 print:text-base">
            #{order.orderNumber}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 print:text-[9px]">
            Emissão: {formatDate(order.createdAt)}
          </div>
          <div className="mt-2">
            <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.color} print:border-black print:text-black print:px-1 print:py-0 print:text-[9px]`}>
              {statusInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 print:gap-2 print:mb-3">
        {/* Comprador & Obra */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 print:bg-white print:border-black print:p-2 print:rounded-none">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5 pb-1.5 border-b border-slate-200 print:text-[10px] print:mb-1">
            <User className="w-3.5 h-3.5 text-orange-600 print:hidden" />
            <span>Dados do Comprador</span>
          </h3>
          <div className="text-xs space-y-1 text-slate-700 print:text-[10px] print:space-y-0.5">
            <p><strong>Nome:</strong> <span className="text-slate-900 font-semibold">{customerName}</span></p>
            <p><strong>E-mail:</strong> {customerEmail}</p>
            <p><strong>WhatsApp / Fone:</strong> {customerPhone}</p>
          </div>
        </div>

        {/* Entrega & Logística */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 print:bg-white print:border-black print:p-2 print:rounded-none">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5 pb-1.5 border-b border-slate-200 print:text-[10px] print:mb-1">
            <Truck className="w-3.5 h-3.5 text-orange-600 print:hidden" />
            <span>Modalidade de Entrega</span>
          </h3>
          <div className="text-xs space-y-1 text-slate-700 print:text-[10px] print:space-y-0.5">
            <p>
              <strong>Tipo:</strong>{' '}
              <span className="font-bold text-slate-900">
                {isPickup ? 'Retirada no Centro de Distribuição' : 'Entrega no Endereço da Obra'}
              </span>
            </p>
            {address && !isPickup ? (
              <>
                <p>
                  <strong>Endereço:</strong> {address.street}, {address.number}
                  {address.complement && ` (${address.complement})`}
                </p>
                <p>
                  <strong>Bairro / Cidade:</strong> {address.district} - {address.city}/{address.state}
                </p>
                <p><strong>CEP:</strong> {address.zipCode}</p>
              </>
            ) : (
              <p className="text-slate-500">Ponto de Retirada Parceiro - Fortaleza / CE</p>
            )}
          </div>
        </div>
      </div>

      {/* Pagamento Info Banner */}
      <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs print:bg-white print:border-black print:p-2 print:mb-3 print:text-[10px]">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-orange-600 print:hidden flex-shrink-0" />
          <span>
            <strong>Forma de Pagamento:</strong> {getPaymentMethodLabel()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>
            <strong>Status Pagamento:</strong>{' '}
            <span className={paymentStatus === 'PAID' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
              {paymentStatus === 'PAID' ? 'Confirmado / Pago ✅' : 'Pendente (A receber na entrega / PIX)'}
            </span>
          </span>
        </div>
      </div>

      {/* Itens do Pedido (Tabela de Materiais) */}
      <div className="mb-6 print:mb-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5 print:text-[10px] print:mb-1">
          <Package className="w-3.5 h-3.5 text-orange-600 print:hidden" />
          <span>Relação de Materiais de Construção</span>
        </h3>
        
        <div className="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden print:border-black print:rounded-none">
          <table className="w-full text-left text-xs border-collapse print:text-[10px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-200 print:bg-slate-200 print:border-black">
                <th className="py-2.5 px-3 w-12 text-center">Item</th>
                <th className="py-2.5 px-3">Código / SKU</th>
                <th className="py-2.5 px-3">Discriminação do Material</th>
                <th className="py-2.5 px-3 text-center w-16">Qtd</th>
                <th className="py-2.5 px-3 text-right w-24">Valor Unit.</th>
                <th className="py-2.5 px-3 text-right w-28">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-black">
              {order.items.map((item, index) => {
                const itemName = item.name || item.product?.name || 'Material de Construção';
                const sku = item.product?.sku || '00' + (index + 1);
                const itemTotal = item.total || item.price * item.quantity;

                return (
                  <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40 print:bg-white'}>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-bold">{index + 1}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{sku}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{itemName}</td>
                    <td className="py-2.5 px-3 text-center font-black text-slate-900 bg-orange-50/50 print:bg-white">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatCurrency(item.price)}</td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900">{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Observações da Obra */}
      {order.notes && (
        <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-3 mb-6 text-xs text-slate-700 print:border-black print:bg-white print:p-2 print:mb-2 print:text-[9px]">
          <span className="font-bold text-amber-900 block mb-0.5 print:text-black">Instruções da Obra / Contato Local:</span>
          <p>{order.notes}</p>
        </div>
      )}

      {/* Totais & Resumo Financeiro */}
      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:bg-white print:border-black print:p-2 print:mb-3">
        <div className="text-xs text-slate-500 print:text-[9px]">
          <p className="font-semibold text-slate-700 print:text-black">
            Total de Itens: {order.items.reduce((acc, i) => acc + (i.quantity || 1), 0)} unidades
          </p>
          <p className="mt-0.5">Valores expressos em Reais (BRL)</p>
        </div>

        <div className="w-full sm:w-64 space-y-1 text-xs print:text-[10px] print:space-y-0.5">
          <div className="flex justify-between text-slate-600 print:text-black">
            <span>Subtotal dos Materiais:</span>
            <span className="font-medium text-slate-900">{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600 print:text-black">
            <span>Frete para Obra:</span>
            <span className="font-medium text-slate-900">
              {order.shipping === 0 ? 'GRÁTIS' : formatCurrency(order.shipping)}
            </span>
          </div>
          {(order.tax || 0) > 0 && (
            <div className="flex justify-between text-slate-600 print:text-black">
              <span>Taxas / Impostos:</span>
              <span className="font-medium text-slate-900">{formatCurrency(order.tax || 0)}</span>
            </div>
          )}
          <div className="border-t-2 border-slate-300 pt-2 mt-1 flex justify-between items-center text-sm font-black text-slate-900 print:border-black print:text-xs">
            <span>TOTAL GERAL:</span>
            <span className="text-base text-orange-600 font-black print:text-black print:text-sm">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Campo de Assinatura e Conferência de Obra */}
      <div className="border border-dashed border-slate-300 rounded-xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600 print:border-black print:rounded-none print:p-2 print:mb-2 print:text-[9px]">
        <div>
          <p className="font-bold text-slate-800 mb-4 print:mb-3">Conferência de Expedição:</p>
          <div className="border-b border-slate-400 w-full mb-1"></div>
          <p className="text-[10px] text-slate-500">Separado e Conferido no Centro de Distribuição</p>
        </div>
        <div>
          <p className="font-bold text-slate-800 mb-4 print:mb-3">Recebido na Obra:</p>
          <div className="border-b border-slate-400 w-full mb-1"></div>
          <p className="text-[10px] text-slate-500">Assinatura do Responsável / Mestre de Obras (Data: ___/___/______)</p>
        </div>
      </div>

      {/* Footer Legal */}
      <div className="border-t border-slate-200 pt-4 text-center text-[11px] text-slate-400 space-y-1 print:pt-2 print:text-[8px] print:border-black print:text-black">
        <p className="font-medium text-slate-600 print:text-black">
          {company.name} — Documento de Venda & Separação de Materiais gerado eletronicamente.
        </p>
        <p>
          Autenticidade e rastreio disponíveis em {company.website}/pedidos/{order.id}/recibo
        </p>
      </div>
    </div>
  );
}
