'use client';

import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { 
  Store, 
  Smartphone, 
  Link, 
  Truck,
  Clock,
  CheckCircle,
  CreditCard,
  Banknote
} from 'lucide-react';

export enum PaymentMethod {
  STORE_PICKUP = 'STORE_PICKUP',
  PIX = 'PIX',
  PAYMENT_LINK = 'PAYMENT_LINK',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY'
}

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ReactNode;
  processingTime: string;
  fee: string;
  available: boolean;
  popular?: boolean;
}

interface PaymentMethodSelectorProps {
  amount: number;
  onMethodSelect: (method: PaymentMethod) => void;
  selectedMethod?: PaymentMethod;
  disabled?: boolean;
}

export default function PaymentMethodSelector({
  amount,
  onMethodSelect,
  selectedMethod,
  disabled = false
}: PaymentMethodSelectorProps) {
  const [hoveredMethod, setHoveredMethod] = useState<PaymentMethod | null>(null);

  const paymentMethods: PaymentMethodOption[] = [
    {
      id: PaymentMethod.PIX,
      name: 'PIX',
      description: 'Pagamento instantâneo via PIX',
      icon: <Smartphone className="w-6 h-6" />,
      processingTime: 'Instantâneo',
      fee: 'Grátis',
      available: true,
      popular: true,
    },
    {
      id: PaymentMethod.STORE_PICKUP,
      name: 'Retirar na Loja',
      description: 'Pague na retirada do produto',
      icon: <Store className="w-6 h-6" />,
      processingTime: 'Na retirada',
      fee: 'Grátis',
      available: true,
    },
    {
      id: PaymentMethod.PAYMENT_LINK,
      name: 'Link de Pagamento',
      description: 'Cartão, PIX, boleto em link seguro',
      icon: <Link className="w-6 h-6" />,
      processingTime: '1-2 dias úteis',
      fee: 'Grátis',
      available: true,
    },
    {
      id: PaymentMethod.CASH_ON_DELIVERY,
      name: 'Pagamento na Entrega',
      description: 'Pague quando receber o produto',
      icon: <Truck className="w-6 h-6" />,
      processingTime: 'Na entrega',
      fee: 'Grátis',
      available: true,
    },
  ];

  const handleMethodSelect = (method: PaymentMethod) => {
    if (!disabled) {
      onMethodSelect(method);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Forma de Pagamento</h3>
        <div className="text-sm text-gray-600">
          Total: <span className="font-bold text-green-600">R$ {amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid gap-3">
        {paymentMethods.map((method) => (
          <Card
            key={method.id}
            className={`relative cursor-pointer transition-all duration-200 ${
              selectedMethod === method.id
                ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50'
                : hoveredMethod === method.id
                ? 'border-gray-300 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            } ${
              !method.available || disabled
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
            onMouseEnter={() => setHoveredMethod(method.id)}
            onMouseLeave={() => setHoveredMethod(null)}
            onClick={() => method.available && handleMethodSelect(method.id)}
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    selectedMethod === method.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {method.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{method.name}</h4>
                      {method.popular && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Mais usado
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                    
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{method.processingTime}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Banknote className="w-3 h-3" />
                        <span>{method.fee}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedMethod === method.id && (
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                )}
              </div>

              {/* Informações adicionais quando selecionado */}
              {selectedMethod === method.id && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  {method.id === PaymentMethod.PIX && (
                    <div className="text-sm text-blue-700">
                      ✅ Pagamento instantâneo via QR Code ou código PIX
                    </div>
                  )}
                  {method.id === PaymentMethod.STORE_PICKUP && (
                    <div className="text-sm text-blue-700">
                      🏪 Pague na retirada: dinheiro, PIX ou cartão
                    </div>
                  )}
                  {method.id === PaymentMethod.PAYMENT_LINK && (
                    <div className="text-sm text-blue-700">
                      🔗 Link seguro com múltiplas opções de pagamento
                    </div>
                  )}
                  {method.id === PaymentMethod.CASH_ON_DELIVERY && (
                    <div className="text-sm text-blue-700">
                      🚚 Pague quando receber: dinheiro ou PIX
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {selectedMethod && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Forma de pagamento selecionada
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
