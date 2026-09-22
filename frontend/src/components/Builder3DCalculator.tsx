'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calculator,
  Plus,
  Minus,
  Trash2,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  Package,
  Ruler,
  DollarSign
} from 'lucide-react';

interface Material {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  color: string;
  texture: string;
  price: number;
  unit: string;
  coverage: number;
  thickness?: number;
  weight?: number;
  durability: number;
  waterproof: boolean;
  fireResistant: boolean;
  ecoFriendly: boolean;
  image: string;
  description: string;
  specifications: Record<string, any>;
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviews: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  weight: number;
  material: string;
  color: string;
  style: string;
  image: string;
  description: string;
  specifications: Record<string, any>;
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviews: number;
  installation: {
    difficulty: 'easy' | 'medium' | 'hard';
    timeRequired: number;
    toolsRequired: string[];
    instructions: string;
  };
}

interface CalculationItem {
  id: string;
  type: 'material' | 'product';
  item: Material | Product;
  quantity: number;
  area?: number;
  waste: number;
  totalCost: number;
  notes?: string;
}

interface ProjectCalculation {
  items: CalculationItem[];
  subtotal: number;
  wasteTotal: number;
  taxRate: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  estimatedWeight: number;
  estimatedInstallationTime: number;
}

interface Builder3DCalculatorProps {
  items: CalculationItem[];
  onItemsChange: (items: CalculationItem[]) => void;
  onExportCalculation?: (calculation: ProjectCalculation) => void;
  className?: string;
}

const Builder3DCalculator: React.FC<Builder3DCalculatorProps> = ({
  items,
  onItemsChange,
  onExportCalculation,
  className = ''
}) => {
  const [calculation, setCalculation] = useState<ProjectCalculation>({
    items: [],
    subtotal: 0,
    wasteTotal: 0,
    taxRate: 0.18, // 18% ICMS
    tax: 0,
    shippingCost: 0,
    discount: 0,
    total: 0,
    estimatedWeight: 0,
    estimatedInstallationTime: 0
  });
  const [customWasteRate, setCustomWasteRate] = useState<number>(10); // 10% padrão
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'items' | 'summary' | 'export'>('items');

  // Calcular totais automaticamente
  const calculateTotals = useCallback(() => {
    const subtotal = items.reduce((sum, item) => {
      const itemCost = item.type === 'material' 
        ? (item.item as Material).price * item.quantity
        : (item.item as Product).price * item.quantity;
      return sum + itemCost;
    }, 0);

    const wasteTotal = subtotal * (customWasteRate / 100);
    const tax = (subtotal + wasteTotal) * calculation.taxRate;
    const total = subtotal + wasteTotal + tax + shippingCost - discount;

    const estimatedWeight = items.reduce((sum, item) => {
      if (item.type === 'material') {
        const material = item.item as Material;
        return sum + (material.weight || 0) * item.quantity;
      } else {
        const product = item.item as Product;
        return sum + product.weight * item.quantity;
      }
    }, 0);

    const estimatedInstallationTime = items.reduce((sum, item) => {
      if (item.type === 'product') {
        const product = item.item as Product;
        return sum + product.installation.timeRequired * item.quantity;
      }
      return sum;
    }, 0);

    setCalculation({
      items,
      subtotal,
      wasteTotal,
      taxRate: calculation.taxRate,
      tax,
      shippingCost,
      discount,
      total,
      estimatedWeight,
      estimatedInstallationTime
    });
  }, [items, customWasteRate, shippingCost, discount, calculation.taxRate]);

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  // Atualizar quantidade de um item
  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    const updatedItems = items.map(item => 
      item.id === itemId 
        ? { ...item, quantity: Math.max(0, newQuantity) }
        : item
    );
    onItemsChange(updatedItems);
  };

  // Remover item
  const removeItem = (itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    onItemsChange(updatedItems);
  };

  // Adicionar notas a um item
  const updateItemNotes = (itemId: string, notes: string) => {
    const updatedItems = items.map(item => 
      item.id === itemId 
        ? { ...item, notes }
        : item
    );
    onItemsChange(updatedItems);
  };

  // Exportar cálculo
  const exportCalculation = () => {
    onExportCalculation?.(calculation);
    
    // Gerar relatório em texto
    const report = generateTextReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `calculo-projeto-${Date.now()}.txt`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  // Gerar relatório em texto
  const generateTextReport = () => {
    const date = new Date().toLocaleDateString('pt-BR');
    
    let report = `RELATÓRIO DE CÁLCULO DE PROJETO\n`;
    report += `Data: ${date}\n`;
    report += `=====================================\n\n`;
    
    report += `ITENS DO PROJETO:\n`;
    report += `-----------------\n`;
    
    items.forEach((item, index) => {
      const itemData = item.item;
      const unitPrice = item.type === 'material' 
        ? (itemData as Material).price
        : (itemData as Product).price;
      const totalPrice = unitPrice * item.quantity;
      
      report += `${index + 1}. ${itemData.name}\n`;
      report += `   Categoria: ${itemData.category}\n`;
      report += `   Marca: ${itemData.brand}\n`;
      report += `   Quantidade: ${item.quantity}\n`;
      report += `   Preço unitário: R$ ${unitPrice.toFixed(2)}\n`;
      report += `   Total: R$ ${totalPrice.toFixed(2)}\n`;
      if (item.notes) {
        report += `   Observações: ${item.notes}\n`;
      }
      report += `\n`;
    });
    
    report += `RESUMO FINANCEIRO:\n`;
    report += `------------------\n`;
    report += `Subtotal: R$ ${calculation.subtotal.toFixed(2)}\n`;
    report += `Desperdício (${customWasteRate}%): R$ ${calculation.wasteTotal.toFixed(2)}\n`;
    report += `Impostos (${(calculation.taxRate * 100).toFixed(0)}%): R$ ${calculation.tax.toFixed(2)}\n`;
    report += `Frete: R$ ${calculation.shippingCost.toFixed(2)}\n`;
    report += `Desconto: R$ ${calculation.discount.toFixed(2)}\n`;
    report += `TOTAL: R$ ${calculation.total.toFixed(2)}\n\n`;
    
    report += `INFORMAÇÕES TÉCNICAS:\n`;
    report += `---------------------\n`;
    report += `Peso estimado: ${calculation.estimatedWeight.toFixed(2)} kg\n`;
    report += `Tempo de instalação estimado: ${calculation.estimatedInstallationTime} horas\n`;
    
    return report;
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items" className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            Itens ({items.length})
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-1">
            <Calculator className="h-4 w-4" />
            Resumo
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Exportar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="flex-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Lista de Materiais e Produtos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {items.map((item) => {
                    const itemData = item.item;
                    const unitPrice = item.type === 'material' 
                      ? (itemData as Material).price
                      : (itemData as Product).price;
                    const totalPrice = unitPrice * item.quantity;
                    
                    return (
                      <Card key={item.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium">{itemData.name}</h4>
                            <p className="text-sm text-gray-500">
                              {itemData.category} • {itemData.brand}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={item.type === 'material' ? 'secondary' : 'outline'}>
                                {item.type === 'material' ? 'Material' : 'Produto'}
                              </Badge>
                              {itemData.inStock ? (
                                <Badge variant="outline" className="text-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Em estoque
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Indisponível
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <Label htmlFor={`quantity-${item.id}`}>Quantidade</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input
                                id={`quantity-${item.id}`}
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                                className="text-center h-8"
                                min="0"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <Label>Preço Total</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="font-bold text-green-600">
                                R$ {totalPrice.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              R$ {unitPrice.toFixed(2)} por {item.type === 'material' ? (itemData as Material).unit : 'unidade'}
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor={`notes-${item.id}`}>Observações</Label>
                          <Input
                            id={`notes-${item.id}`}
                            placeholder="Adicione observações sobre este item..."
                            value={item.notes || ''}
                            onChange={(e) => updateItemNotes(item.id, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </Card>
                    );
                  })}
                  
                  {items.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum item adicionado ao cálculo</p>
                      <p className="text-sm text-gray-400">Adicione materiais e produtos na aba Materiais</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {/* Configurações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Configurações de Cálculo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="waste-rate">Taxa de Desperdício (%)</Label>
                  <Input
                    id="waste-rate"
                    type="number"
                    value={customWasteRate}
                    onChange={(e) => setCustomWasteRate(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                    min="0"
                    max="50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recomendado: 10-15% para materiais de construção
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="shipping-cost">Custo de Frete (R$)</Label>
                  <Input
                    id="shipping-cost"
                    type="number"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                    min="0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="discount">Desconto (R$)</Label>
                  <Input
                    id="discount"
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                    min="0"
                  />
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Informações Técnicas</span>
                  </div>
                  <div className="space-y-1 text-sm text-blue-700">
                    <div className="flex justify-between">
                      <span>Peso total estimado:</span>
                      <span>{calculation.estimatedWeight.toFixed(2)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tempo de instalação:</span>
                      <span>{calculation.estimatedInstallationTime}h</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Resumo Financeiro */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R$ {calculation.subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-orange-600">
                    <span>Desperdício ({customWasteRate}%):</span>
                    <span>R$ {calculation.wasteTotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-red-600">
                    <span>Impostos ({(calculation.taxRate * 100).toFixed(0)}%):</span>
                    <span>R$ {calculation.tax.toFixed(2)}</span>
                  </div>
                  
                  {calculation.shippingCost > 0 && (
                    <div className="flex justify-between">
                      <span>Frete:</span>
                      <span>R$ {calculation.shippingCost.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {calculation.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto:</span>
                      <span>- R$ {calculation.discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>TOTAL:</span>
                    <span className="text-green-600">R$ {calculation.total.toFixed(2)}</span>
                  </div>
                  
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      Cálculo atualizado automaticamente
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="export" className="flex-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Exportar Cálculo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={exportCalculation}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <Download className="h-4 w-4" />
                  Exportar Relatório (TXT)
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  size="lg"
                  onClick={() => {
                    // Copiar para clipboard
                    navigator.clipboard.writeText(generateTextReport());
                  }}
                >
                  <FileText className="h-4 w-4" />
                  Copiar para Área de Transferência
                </Button>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Preview do Relatório:</h4>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {generateTextReport()}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Builder3DCalculator;