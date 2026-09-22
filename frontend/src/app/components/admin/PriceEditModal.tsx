'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { X, DollarSign, TrendingUp, Clock } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  promotionalPrice?: number;
  category: { name: string };
}

interface PriceEditModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSave: (productId: string, newPrice: number, reason: string) => Promise<void>;
}

export default function PriceEditModal({ product, isOpen, onClose, onSave }: PriceEditModalProps) {
  const [newPrice, setNewPrice] = useState(product.price.toString());
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!newPrice || !reason) {
      alert('Preencha o novo preço e o motivo da alteração');
      return;
    }

    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      alert('Preço inválido');
      return;
    }

    try {
      setLoading(true);
      await onSave(product.id, price, reason);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar preço:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const priceDifference = parseFloat(newPrice) - product.price;
  const percentageChange = ((priceDifference / product.price) * 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Editar Preço</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informações do Produto */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm">{product.name}</h3>
            <p className="text-xs text-gray-600">SKU: {product.sku}</p>
            <p className="text-xs text-gray-600">Categoria: {product.category.name}</p>
          </div>

          {/* Preço Atual */}
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Preço Atual</p>
              <p className="font-semibold">{formatCurrency(product.price)}</p>
            </div>
          </div>

          {/* Novo Preço */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Novo Preço</label>
            <Input
              type="number"
              step="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Diferença de Preço */}
          {newPrice && !isNaN(parseFloat(newPrice)) && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Alteração</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="text-gray-600">Diferença: </span>
                  <span className={`font-semibold ${priceDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {priceDifference >= 0 ? '+' : ''}{formatCurrency(priceDifference)}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-600">Percentual: </span>
                  <span className={`font-semibold ${percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(2)}%
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Motivo da Alteração */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Motivo da Alteração</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Ajuste de margem, Promoção, Correção de preço..."
            />
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || !newPrice || !reason}
              className="flex-1"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
