import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  User,
  Calculator,
  Percent,
  CheckCircle,
  Truck,
  Layers,
  ArrowRight,
  Package,
} from 'lucide-react';
import { db, LocalProduct, LocalCustomer, SaleItem, LocalSale } from '../db/db';
import { MaterialsCalculatorModal } from './MaterialsCalculatorModal';
import { PaymentModal } from './PaymentModal';

interface POSViewProps {
  onSaleCompleted: (sale: LocalSale) => void;
  isOnline: boolean;
}

export const POSView: React.FC<POSViewProps> = ({ onSaleCompleted, isOnline }) => {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [customers, setCustomers] = useState<LocalCustomer[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [selectedCustomer, setSelectedCustomer] = useState<LocalCustomer | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);

  // Modais
  const [isCalcOpen, setIsCalcOpen] = useState<boolean>(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Carregar produtos e clientes do IndexedDB
  useEffect(() => {
    const loadData = async () => {
      const allProducts = await db.products.toArray();
      const allCustomers = await db.customers.toArray();
      setProducts(allProducts);
      setCustomers(allCustomers);
    };
    loadData();
  }, []);

  // Atalhos de Teclado Globais (F1, F2, F3, F4, F10, ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      } else if (e.key === 'F3') {
        e.preventDefault();
        setIsCustomerSelectOpen(true);
      } else if (e.key === 'F10') {
        e.preventDefault();
        if (cart.length > 0) setIsPaymentOpen(true);
      } else if (e.key === 'Escape') {
        setIsCalcOpen(false);
        setIsPaymentOpen(false);
        setIsCustomerSelectOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Categorias únicas
  const categories = ['TODOS', ...Array.from(new Set(products.map((p) => p.category)))];

  // Produtos filtrados
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'TODOS' || p.category === selectedCategory;
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));
    return matchesCat && matchesSearch;
  });

  // Adicionar ao Carrinho
  const handleAddToCart = (product: LocalProduct, customQty?: number) => {
    const existingIndex = cart.findIndex((i) => i.productId === product.id);
    const qtyToAdd = customQty || 1;

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += qtyToAdd;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setCart(updated);
    } else {
      const newItem: SaleItem = {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        unit: product.unit,
        unitPrice: product.price,
        cost: product.cost,
        quantity: qtyToAdd,
        discount: 0,
        total: product.price * qtyToAdd,
      };
      setCart([...cart, newItem]);
    }
  };

  // Leitor de Código de Barras (EAN)
  const handleBarcodeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const barcodeVal = barcodeInputRef.current?.value.trim();
    if (!barcodeVal) return;

    const found = products.find((p) => p.barcode === barcodeVal || p.sku === barcodeVal);
    if (found) {
      handleAddToCart(found, 1);
      if (barcodeInputRef.current) barcodeInputRef.current.value = '';
    } else {
      alert(`Código de barras ou SKU "${barcodeVal}" não encontrado no catálogo local!`);
    }
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const updated = [...cart];
    updated[index].quantity = newQty;
    updated[index].total = updated[index].quantity * updated[index].unitPrice - updated[index].discount;
    setCart(updated);
  };

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Cálculos de Totais
  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
  const discountVal = (subtotal * discountPercent) / 100;
  const total = Math.max(0, subtotal - discountVal + shippingCost);

  // Aplicar Itens da Calculadora de Obras
  const handleApplyCalculatedItems = (items: Array<{ name: string; quantity: number; unit: string; price: number }>) => {
    const newItems: SaleItem[] = items.map((i) => ({
      productId: 'calc-' + Date.now() + Math.random(),
      sku: 'CALC-' + i.unit,
      name: i.name,
      unit: i.unit,
      unitPrice: i.price,
      cost: i.price * 0.7,
      quantity: i.quantity,
      discount: 0,
      total: i.price * i.quantity,
    }));
    setCart([...cart, ...newItems]);
  };

  // Finalizar Venda no IndexedDB Local (0ms)
  const handleConfirmSale = async (paymentData: any) => {
    const saleNumber = 'VND-' + Math.floor(100000 + Math.random() * 900000);
    const newSale: LocalSale = {
      id: 'sale-' + Date.now(),
      saleNumber,
      createdAt: new Date().toISOString(),
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name || 'Consumidor Final',
      customerCpfCnpj: selectedCustomer?.cpfCnpj,
      items: cart,
      subtotal,
      discount: discountVal,
      shipping: shippingCost,
      total,
      paymentMethod: paymentData.method,
      payments: [{ method: paymentData.method, amount: total }],
      cashReceived: paymentData.cashReceived,
      changeAmount: paymentData.change,
      cashierName: 'Operador Balcão 01',
      status: 'COMPLETED',
      fiscalStatus: paymentData.emitNfce ? (isOnline ? 'AUTHORIZED_SEFAZ' : 'CONTINGENCY_EMITTED') : 'NOT_EMITTED',
      fiscalKey: paymentData.emitNfce
        ? '2326' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 10)).join('')
        : undefined,
      syncedToCloud: false,
      syncedToGestaoClick: false,
    };

    // 1. Gravar Venda no Dexie Local
    await db.sales.add(newSale);

    // 2. Decrementar estoque local
    for (const item of cart) {
      const prod = await db.products.get(item.productId);
      if (prod) {
        await db.products.update(item.productId, {
          stock: Math.max(0, prod.stock - item.quantity),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 3. Limpar carrinho e fechar modal
    setCart([]);
    setDiscountPercent(0);
    setShippingCost(0);
    setIsPaymentOpen(false);

    // 4. Notificar e imprimir
    onSaleCompleted(newSale);
  };

  return (
    <div className="h-[calc(100vh-85px)] flex flex-col md:flex-row bg-slate-950 overflow-hidden">
      {/* PAINEL ESQUERDO: Catálogo & Busca Rápida */}
      <div className="flex-1 flex flex-col border-r border-slate-800 p-3 overflow-hidden">
        {/* Barra de Busca e Leitor EAN */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-3">
          <div className="md:col-span-8 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="F1: Buscar produto por nome, SKU ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>

          <form onSubmit={handleBarcodeSubmit} className="md:col-span-4 relative">
            <Barcode className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="F2: Bipar Código de Barras"
              className="w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-emerald-500/40 rounded-xl text-white text-sm focus:border-emerald-400 focus:outline-none"
            />
          </form>
        </div>

        {/* Categorias Filtro */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grade de Produtos */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 content-start">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => handleAddToCart(p)}
              className="bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/50 p-3 rounded-xl cursor-pointer transition-all flex flex-col justify-between group active:scale-[0.98]"
            >
              <div>
                <div className="flex justify-between items-start gap-1 mb-1.5">
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {p.sku}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                    {p.unit}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 group-hover:text-amber-400 transition-colors">
                  {p.name}
                </h4>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block text-[10px]">Estoque: {p.stock}</span>
                  <span className="text-sm font-black text-emerald-400">R$ {p.price.toFixed(2)}</span>
                </div>
                <button className="p-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 rounded-lg transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum produto localizado.</p>
            </div>
          )}
        </div>
      </div>

      {/* PAINEL DIREITO: Cupom do Balcão / Carrinho / Checkout */}
      <div className="w-full md:w-[450px] lg:w-[480px] bg-slate-900 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800">
        {/* Top Header do Cupom */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCustomerSelectOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>{selectedCustomer ? selectedCustomer.name.substring(0, 20) + '...' : 'F3: Cliente Balcão'}</span>
            </button>

            {selectedCustomer && (
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-slate-400 hover:text-red-400"
                title="Remover cliente"
              >
                &times;
              </button>
            )}
          </div>

          <button
            onClick={() => setIsCalcOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 border border-amber-500/30 text-amber-400 hover:text-slate-950 font-bold rounded-lg text-xs transition-all"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Cálculo Obras</span>
          </button>
        </div>

        {/* Lista de Itens do Cupom */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-950/70 border border-slate-800/80 p-2.5 rounded-xl flex items-center justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{item.name}</p>
                <p className="text-[10px] text-slate-400">
                  {item.sku} • R$ {item.unitPrice.toFixed(2)} / {item.unit}
                </p>
              </div>

              {/* Controles de Quantidade */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
                <button
                  onClick={() => handleUpdateQuantity(idx, item.quantity - 1)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  step="any"
                  value={item.quantity}
                  onChange={(e) => handleUpdateQuantity(idx, Number(e.target.value))}
                  className="w-12 text-center text-xs font-bold bg-transparent text-white focus:outline-none"
                />
                <button
                  onClick={() => handleUpdateQuantity(idx, item.quantity + 1)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Preço Total & Excluir */}
              <div className="text-right">
                <p className="text-xs font-black text-emerald-400">R$ {item.total.toFixed(2)}</p>
                <button
                  onClick={() => handleRemoveItem(idx)}
                  className="text-slate-500 hover:text-red-400 p-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
              <Package className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-xs font-semibold">Caixa Livre • Bipar ou clicar nos itens</p>
            </div>
          )}
        </div>

        {/* Resumo Financeiro & Botão de Fechamento */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal ({cart.length} itens):</span>
              <span className="font-semibold text-slate-200">R$ {subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-400 items-center">
              <span className="flex items-center gap-1">
                <Percent className="w-3 h-3 text-amber-400" /> Desconto (%):
              </span>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent || ''}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                placeholder="0"
                className="w-14 text-right bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-bold"
              />
            </div>

            <div className="flex justify-between text-slate-400 items-center">
              <span className="flex items-center gap-1">
                <Truck className="w-3 h-3 text-cyan-400" /> Frete / Entrega (R$):
              </span>
              <input
                type="number"
                min="0"
                value={shippingCost || ''}
                onChange={(e) => setShippingCost(Number(e.target.value))}
                placeholder="0.00"
                className="w-20 text-right bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-bold"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-300">TOTAL:</span>
              <span className="text-2xl font-black text-emerald-400">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Botão de Fechamento F10 */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => setIsPaymentOpen(true)}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 transition-all active:scale-[0.99]"
          >
            <span>F10: RECEBER & EMITIR (R$ {total.toFixed(2)})</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MODAIS */}
      <MaterialsCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        onApplyMaterials={handleApplyCalculatedItems}
        availableProducts={products}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        total={total}
        customer={selectedCustomer}
        onConfirmPayment={handleConfirmSale}
        isOnline={isOnline}
      />

      {/* Modal Selecionar Cliente */}
      {isCustomerSelectOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Identificar Cliente no Balcão</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {customers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCustomer(c);
                    setIsCustomerSelectOpen(false);
                  }}
                  className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer flex justify-between items-center transition-colors"
                >
                  <div>
                    <p className="text-xs font-bold text-white">{c.name}</p>
                    <p className="text-[10px] text-slate-400">{c.cpfCnpj || c.phone || 'Sem documento'}</p>
                  </div>
                  <div className="text-right text-[10px]">
                    <span className="text-slate-400">Limite Disp:</span>
                    <p className="font-bold text-emerald-400">R$ {(c.creditLimit - c.creditUsed).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setIsCustomerSelectOpen(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
            >
              Fechar (ESC)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
