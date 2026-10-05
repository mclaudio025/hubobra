import Dexie, { Table } from 'dexie';

export interface LocalProduct {
  id: string;
  sku: string;
  barcode?: string;
  reference?: string;
  brand?: string;
  ncm?: string;
  name: string;
  price: number;
  comparePrice?: number;
  cost: number;
  stock: number;
  reservedStock: number;
  minStock: number;
  unit: string; // UN, M2, KG, SACO, CX, MILHEIRO, LITRO, BARRA, M3
  location?: string; // Ex: Corredor A - Prateleira 03
  packaging?: string; // Ex: Fardo c/ 10, Caixa c/ 2.12m²
  category: string;
  image?: string;
  description?: string;
  isMaster?: boolean;
  masterProductId?: string;
  updatedAt: string;
  synced: boolean;
}

export interface LocalCustomer {
  id: string;
  code?: string;
  name: string;
  cpfCnpj?: string;
  phone?: string;
  email?: string;
  address?: {
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
    zipCode: string;
    complement?: string;
  };
  creditLimit: number;
  creditUsed: number;
  storeCredit?: number; // Saldo de Crédito/Haver de devolução ou adiantamento na loja
  pendingInvoices?: Array<{
    number: string;
    dueDate: string;
    amount: number;
    status: 'OPEN' | 'OVERDUE';
  }>;
  notes?: string;
  createdAt: string;
  synced: boolean;
}

export interface SaleItem {
  productId: string;
  name: string;
  sku: string;
  reference?: string;
  unit: string;
  unitPrice: number;
  cost: number;
  quantity: number;
  discount: number;
  total: number;
  location?: string;
  packaging?: string;
  observations?: string;
}

export interface PaymentEntry {
  id: string;
  method: 'PIX' | 'DINHEIRO' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO' | 'CREDIARIO_LOJA' | 'CREDITO_LOJA';
  amount: number;
  installments?: number;
  cashReceived?: number;
  change?: number;
  notes?: string;
}

export interface LocalOrder {
  id: string;
  orderNumber: string;
  type: 'PEDIDO_VENDA' | 'ORCAMENTO';
  createdAt: string;
  sellerId: string;
  sellerName: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerCpfCnpj?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentCondition?: string; // A Vista, 30/60/90, PIX, Cartao, Pagar na Entrega
  payments?: PaymentEntry[]; // Pagamentos múltiplos / detalhados
  change?: number;
  storeCreditUsed?: number;
  origin?: 'BALCAO' | 'MOBILE' | 'LIA_AI' | 'ECOMMERCE';
  isAiGenerated?: boolean;
  deliveryDriver?: string; // Nome do motorista ou vendedor que levou a maquininha
  status: 'AGUARDANDO_PAGAMENTO' | 'EM_ROTA_ENTREGA' | 'PAGO' | 'EM_SEPARACAO' | 'ENTREGUE' | 'CANCELADO';
  paidAt?: string;
  cashierName?: string;
  fiscalStatus: 'NOT_EMITTED' | 'CONTINGENCY_EMITTED' | 'AUTHORIZED_SEFAZ';
  fiscalKey?: string;
  notes?: string;
  syncedToCloud: boolean;
  syncedToGestaoClick: boolean;
}

export interface CashRegister {
  id: string;
  openedAt: string;
  closedAt?: string;
  operator: string;
  initialCash: number;
  currentCash: number;
  movements: Array<{
    type: 'SUPPLY' | 'BLEED';
    amount: number;
    reason: string;
    time: string;
  }>;
  status: 'OPEN' | 'CLOSED';
}

export interface SellerUser {
  id: string;
  name: string;
  code: string;
  commissionPercent: number;
  avatar?: string;
  salesTodayCount: number;
  salesTodayTotal: number;
}

export interface Supplier {
  id: string;
  code: string;
  tradeName: string; // Nome Fantasia
  corporateName: string; // Razão Social
  cnpj: string;
  representativeName: string;
  phone: string;
  whatsapp: string;
  email: string;
  category: string;
  leadTimeDays: number;
  minOrderValue?: number;
  standardPaymentTerms: string;
  rating: number;
  suppliedProductsCount: number;
  notes?: string;
  createdAt: string;
}

export interface PurchaseQuotationItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  currentCost: number;
  lastPurchasePrice: number;
  targetPrice: number;
}

export interface QuotedSupplierData {
  supplierId: string;
  supplierName: string;
  representative: string;
  whatsapp: string;
  quotedPrices: Record<string, number>; // productId -> unitPrice
  freight: number;
  paymentTerms: string;
  deliveryDays: number;
  totalQuotation: number;
  isWinner?: boolean;
}

export interface PurchaseQuotation {
  id: string;
  quotationNumber: string;
  title: string;
  createdAt: string;
  buyerName: string;
  status: 'ABERTA' | 'EM_ANALISE' | 'APROVADA' | 'PEDIDO_GERADO' | 'CANCELADA';
  items: PurchaseQuotationItem[];
  suppliersQuoted: QuotedSupplierData[];
  winningSupplierId?: string;
  savingsAmount?: number;
  savingsPercent?: number;
  notes?: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitCost: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  quotationId?: string;
  supplierId: string;
  supplierName: string;
  representativeName: string;
  whatsapp: string;
  createdAt: string;
  expectedDeliveryDate: string;
  status: 'EMITIDA' | 'CONFIRMADA_FORNECEDOR' | 'EM_TRANSITO' | 'ENTREGUE_PARCIAL' | 'ENTREGUE_TOTAL' | 'CANCELADA';
  items: PurchaseOrderItem[];
  subtotal: number;
  freight: number;
  discount: number;
  total: number;
  paymentTerms: string;
  deliveryAddress: string;
  notes?: string;
  sentViaWhatsApp: boolean;
}

class HubObraDatabase extends Dexie {
  products!: Table<LocalProduct>;
  customers!: Table<LocalCustomer>;
  orders!: Table<LocalOrder>;
  cashRegisters!: Table<CashRegister>;
  suppliers!: Table<Supplier>;
  quotations!: Table<PurchaseQuotation>;
  purchaseOrders!: Table<PurchaseOrder>;

  constructor() {
    super('HubObraLocalERP_v2');
    this.version(1).stores({
      products: 'id, sku, barcode, reference, name, category, unit, synced',
      customers: 'id, code, name, cpfCnpj, phone, synced',
      orders: 'id, orderNumber, type, createdAt, sellerId, customerId, status, fiscalStatus, syncedToCloud',
      cashRegisters: 'id, status, openedAt',
      suppliers: 'id, code, tradeName, cnpj, category',
      quotations: 'id, quotationNumber, status, createdAt',
      purchaseOrders: 'id, orderNumber, supplierId, status, createdAt',
    });
  }
}

export const db = new HubObraDatabase();

export const DEFAULT_SELLERS: SellerUser[] = [
  { id: 'v-1', name: 'Carlos Eduardo (Balcão 1)', code: '01', commissionPercent: 1.5, salesTodayCount: 6, salesTodayTotal: 4850.00 },
  { id: 'v-2', name: 'Marcos Vinícius (Balcão 2)', code: '02', commissionPercent: 1.5, salesTodayCount: 8, salesTodayTotal: 6320.00 },
  { id: 'v-3', name: 'Roberto Lima (Balcão 3)', code: '03', commissionPercent: 1.5, salesTodayCount: 4, salesTodayTotal: 2980.00 },
  { id: 'v-4', name: 'Amanda Sousa (Televendas)', code: '04', commissionPercent: 2.0, salesTodayCount: 11, salesTodayTotal: 12450.00 },
  { id: 'v-5', name: 'Fernando Costa (Obras)', code: '05', commissionPercent: 2.0, salesTodayCount: 5, salesTodayTotal: 8900.00 },
];

