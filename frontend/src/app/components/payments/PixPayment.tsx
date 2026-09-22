'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { 
  Copy, 
  QrCode, 
  Clock, 
  CheckCircle, 
  RefreshCw,
  Smartphone,
  AlertCircle
} from 'lucide-react';

interface PixPaymentProps {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  onPaymentConfirmed: (transactionId: string) => void;
  onCancel: () => void;
}

interface PixData {
  id: string;
  pixCode: string;
  qrCode: string;
  expiresAt: string;
  status: string;
}

export default function PixPayment({
  orderId,
  amount,
  customerName,
  customerEmail,
  onPaymentConfirmed,
  onCancel
}: PixPaymentProps) {
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    createPixPayment();
  }, []);

  useEffect(() => {
    if (pixData && pixData.expiresAt) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(pixData.expiresAt).getTime();
        const difference = expiry - now;

        if (difference > 0) {
          setTimeLeft(Math.floor(difference / 1000));
        } else {
          setTimeLeft(0);
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [pixData]);

  useEffect(() => {
    if (pixData && pixData.status === 'PENDING') {
      const interval = setInterval(() => {
        checkPaymentStatus();
      }, 5000); // Verificar a cada 5 segundos

      return () => clearInterval(interval);
    }
  }, [pixData]);

  const createPixPayment = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments/pix/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount,
          customerName,
          customerEmail,
          description: `Pedido ${orderId}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPixData(data);
      } else {
        throw new Error('Erro ao criar pagamento PIX');
      }
    } catch (error) {
      console.error('Erro ao criar PIX:', error);
      alert('Erro ao gerar PIX. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!pixData) return;

    try {
      setChecking(true);
      const response = await fetch(`/api/payments/pix/${pixData.id}/status`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'PAID') {
          onPaymentConfirmed(data.transactionId || 'PIX_CONFIRMED');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setChecking(false);
    }
  };

  const copyPixCode = async () => {
    if (pixData?.pixCode) {
      try {
        await navigator.clipboard.writeText(pixData.pixCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Erro ao copiar:', error);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Gerando PIX...</span>
        </div>
      </Card>
    );
  }

  if (!pixData) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro ao gerar PIX</h3>
          <p className="text-gray-600 mb-4">Não foi possível gerar o código PIX</p>
          <Button onClick={createPixPayment}>Tentar novamente</Button>
        </div>
      </Card>
    );
  }

  const isExpired = timeLeft <= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center space-x-2">
              <Smartphone className="w-6 h-6 text-blue-600" />
              <span>Pagamento via PIX</span>
            </h2>
            <p className="text-gray-600">Valor: R$ {amount.toFixed(2)}</p>
          </div>
          
          <div className="text-right">
            {isExpired ? (
              <Badge className="bg-red-100 text-red-800">
                <Clock className="w-3 h-3 mr-1" />
                Expirado
              </Badge>
            ) : (
              <Badge className="bg-green-100 text-green-800">
                <Clock className="w-3 h-3 mr-1" />
                {formatTime(timeLeft)}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {!isExpired ? (
        <>
          {/* QR Code */}
          <Card className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Escaneie o QR Code</h3>
              
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <img 
                    src={pixData.qrCode} 
                    alt="QR Code PIX" 
                    className="w-48 h-48"
                  />
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>📱 Abra o app do seu banco</p>
                <p>📷 Escaneie o QR Code</p>
                <p>✅ Confirme o pagamento</p>
              </div>
            </div>
          </Card>

          {/* Código PIX */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Ou copie o código PIX</h3>
            
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 border rounded-lg">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono break-all flex-1 mr-2">
                    {pixData.pixCode}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyPixCode}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p>💡 <strong>Como usar:</strong></p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Copie o código PIX acima</li>
                  <li>Abra o app do seu banco</li>
                  <li>Escolha "PIX" → "Colar código"</li>
                  <li>Cole o código e confirme</li>
                </ol>
              </div>
            </div>
          </Card>

          {/* Status */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Status do Pagamento</h4>
                <p className="text-sm text-gray-600">
                  Aguardando confirmação do pagamento...
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {checking && <RefreshCw className="w-4 h-4 animate-spin" />}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkPaymentStatus}
                  disabled={checking}
                >
                  Verificar Status
                </Button>
              </div>
            </div>
          </Card>
        </>
      ) : (
        /* PIX Expirado */
        <Card className="p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">PIX Expirado</h3>
            <p className="text-gray-600 mb-4">
              O tempo para pagamento via PIX expirou. Gere um novo código ou escolha outra forma de pagamento.
            </p>
            <div className="flex justify-center space-x-3">
              <Button onClick={createPixPayment}>
                Gerar Novo PIX
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Escolher Outra Forma
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Ações */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        
        {process.env.NODE_ENV === 'development' && (
          <Button
            variant="outline"
            onClick={() => onPaymentConfirmed('PIX_SIMULATED')}
            className="bg-yellow-50 border-yellow-300 text-yellow-800"
          >
            🧪 Simular Pagamento
          </Button>
        )}
      </div>
    </div>
  );
}
