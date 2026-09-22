'use client';

import { CheckCircle, Clock, Package, Truck, Home, X } from 'lucide-react';

interface OrderStatusTrackerProps {
  status: string;
  createdAt: string;
  updatedAt: string;
  paymentStatus?: string;
}

const statusSteps = [
  {
    key: 'PENDING',
    label: 'Pedido Recebido',
    description: 'Aguardando confirmação do pagamento',
    icon: Clock,
    color: 'yellow'
  },
  {
    key: 'CONFIRMED',
    label: 'Pagamento Confirmado',
    description: 'Pedido confirmado e sendo preparado',
    icon: CheckCircle,
    color: 'green'
  },
  {
    key: 'PROCESSING',
    label: 'Preparando Pedido',
    description: 'Separando produtos para envio',
    icon: Package,
    color: 'blue'
  },
  {
    key: 'SHIPPED',
    label: 'Enviado',
    description: 'Pedido despachado para entrega',
    icon: Truck,
    color: 'purple'
  },
  {
    key: 'DELIVERED',
    label: 'Entregue',
    description: 'Pedido entregue com sucesso',
    icon: Home,
    color: 'green'
  }
];

const cancelledStep = {
  key: 'CANCELLED',
  label: 'Cancelado',
  description: 'Pedido foi cancelado',
  icon: X,
  color: 'red'
};

export default function OrderStatusTracker({ 
  status, 
  createdAt, 
  updatedAt, 
  paymentStatus 
}: OrderStatusTrackerProps) {
  const getCurrentStepIndex = () => {
    if (status === 'CANCELLED') return -1;
    return statusSteps.findIndex(step => step.key === status);
  };

  const currentStepIndex = getCurrentStepIndex();
  const isCancelled = status === 'CANCELLED';

  const getStepColor = (stepIndex: number) => {
    if (isCancelled) return 'gray';
    if (stepIndex <= currentStepIndex) return 'green';
    return 'gray';
  };

  const getStepIcon = (step: any, stepIndex: number) => {
    const IconComponent = step.icon;
    const isActive = stepIndex <= currentStepIndex && !isCancelled;
    const isCurrentStep = stepIndex === currentStepIndex;
    
    return (
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
        ${isActive ? 
          'bg-green-100 border-green-500 text-green-600' : 
          'bg-gray-100 border-gray-300 text-gray-400'
        }
        ${isCurrentStep && !isCancelled ? 'ring-4 ring-green-100' : ''}
      `}>
        <IconComponent className="h-5 w-5" />
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isCancelled) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            Pedido Cancelado
          </h2>
          <p className="text-gray-600 mb-4">
            Este pedido foi cancelado
          </p>
          <div className="text-sm text-gray-500">
            <p>Cancelado em: {formatDate(updatedAt)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Status do Pedido
      </h2>

      {/* Status atual destacado */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-3">
          {getStepIcon(statusSteps[currentStepIndex], currentStepIndex)}
          <div>
            <h3 className="font-semibold text-blue-900">
              {statusSteps[currentStepIndex]?.label}
            </h3>
            <p className="text-sm text-blue-700">
              {statusSteps[currentStepIndex]?.description}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Atualizado em: {formatDate(updatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline de status */}
      <div className="space-y-4">
        {statusSteps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isActive = index === currentStepIndex;
          
          return (
            <div key={step.key} className="flex items-start gap-4">
              {/* Linha conectora */}
              {index > 0 && (
                <div className="absolute ml-5 -mt-4 w-0.5 h-4 bg-gray-200"></div>
              )}
              
              {/* Ícone do status */}
              {getStepIcon(step, index)}
              
              {/* Conteúdo do status */}
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium ${
                    isCompleted ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </h4>
                  {isActive && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Atual
                    </span>
                  )}
                </div>
                <p className={`text-sm ${
                  isCompleted ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {step.description}
                </p>
                {isCompleted && (
                  <p className="text-xs text-gray-500 mt-1">
                    {index === 0 ? formatDate(createdAt) : 
                     index === currentStepIndex ? formatDate(updatedAt) : ''}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Informações de pagamento */}
      {paymentStatus && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Status do Pagamento:</span>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
              paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
              paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {paymentStatus === 'PAID' ? 'Pago' :
               paymentStatus === 'PENDING' ? 'Pendente' :
               paymentStatus === 'FAILED' ? 'Falhou' : paymentStatus}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
