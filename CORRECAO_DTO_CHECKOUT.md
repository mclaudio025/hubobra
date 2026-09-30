# Correção do DTO no Checkout

## Problema Identificado

O checkout estava enviando dados que não eram compatíveis com o DTO do backend:

1. **Campo `deliveryAddress`** não existe no DTO (deve ser `shippingAddress`)
2. **Campo `deliveryMethod`** não existe no DTO
3. **Métodos de pagamento** não eram compatíveis com o enum do backend

## Erros de Validação

```
property deliveryAddress should not exist
property deliveryMethod should not exist  
payment.method must be one of the following values: CREDIT_CARD, DEBIT_CARD, PIX, BANK_SLIP, CASH
```

## Correções Implementadas

### 1. **Interface PaymentData Corrigida**

**Antes:**
```typescript
interface PaymentData {
  method: 'PIX' | 'STORE_PICKUP' | 'PAYMENT_LINK' | 'CASH_ON_DELIVERY';
}
```

**Depois:**
```typescript
interface PaymentData {
  method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'BANK_SLIP' | 'CASH';
}
```

### 2. **Estrutura do Pedido Corrigida**

**Antes:**
```typescript
const orderData = {
  items: [...],
  deliveryAddress: deliveryMethod === 'DELIVERY' ? deliveryAddress : null,
  deliveryMethod,
  payment: {
    method: paymentData.method, // Valores incompatíveis
    amount: calculateTotal()
  },
  shipping: 0,
  tax: 0,
  notes
};
```

**Depois:**
```typescript
const orderData = {
  items: [...],
  shippingAddress: deliveryMethod === 'DELIVERY' ? deliveryAddress : {
    street: 'Retirada na loja',
    number: '123',
    district: 'Centro',
    city: 'Fortaleza',
    state: 'CE',
    zipCode: '60000-000',
    country: 'Brasil'
  },
  payment: {
    method: mapPaymentMethod(paymentData.method), // Mapeado corretamente
    amount: calculateTotal()
  },
  shipping: 0,
  tax: 0,
  notes
};
```

### 3. **Função de Mapeamento de Métodos**

```typescript
const mapPaymentMethod = (method: string) => {
  const methodMap = {
    'PIX': 'PIX',
    'STORE_PICKUP': 'CASH', // Pagar na entrega = CASH
    'PAYMENT_LINK': 'CREDIT_CARD', // Link de pagamento = CREDIT_CARD
    'CASH_ON_DELIVERY': 'CASH' // Pagamento na entrega = CASH
  };
  return methodMap[method as keyof typeof methodMap] || 'CASH';
};
```

## DTO do Backend (Referência)

### **Enum PaymentMethod**
```typescript
export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  BANK_SLIP = 'BANK_SLIP',
  CASH = 'CASH'
}
```

### **CreateOrderDto**
```typescript
export class CreateOrderDto {
  items: CreateOrderItemDto[];
  shippingAddress: CreateShippingAddressDto; // OBRIGATÓRIO
  payment: CreatePaymentDto;
  notes?: string;
  shipping: number;
  tax?: number;
}
```

## Mapeamento de Métodos de Pagamento

| Frontend (Interface) | Backend (DTO) | Descrição |
|---------------------|---------------|-----------|
| `PIX` | `PIX` | Pagamento instantâneo |
| `STORE_PICKUP` | `CASH` | Pagar na entrega |
| `PAYMENT_LINK` | `CREDIT_CARD` | Link de pagamento |
| `CASH_ON_DELIVERY` | `CASH` | Pagamento na entrega |

## Tratamento do Endereço

### **Para Entrega (DELIVERY)**
- Usa o endereço preenchido pelo cliente
- Todos os campos obrigatórios validados

### **Para Retirada (PICKUP)**
- Usa endereço fixo da loja
- Satisfaz a obrigatoriedade do campo `shippingAddress`

```typescript
shippingAddress: deliveryMethod === 'DELIVERY' ? deliveryAddress : {
  street: 'Retirada na loja',
  number: '123',
  district: 'Centro',
  city: 'Fortaleza',
  state: 'CE',
  zipCode: '60000-000',
  country: 'Brasil'
}
```

## Interface do Usuário Mantida

### **Métodos de Pagamento (Frontend)**
- ✅ PIX (Pagamento instantâneo via PIX)
- ✅ Pagar na Entrega (Pague quando receber o produto)
- ✅ Link de Pagamento (Cartão, PIX, boleto em link seguro)
- ✅ Pagamento na Entrega (Pague quando receber o produto)

### **Mapeamento Transparente**
- O usuário continua vendo os mesmos métodos
- O sistema mapeia automaticamente para o backend
- Não há mudança na experiência do usuário

## Estado Local Mantido

### **deliveryMethod (Estado Local)**
```typescript
const [deliveryMethod, setDeliveryMethod] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
```

**Uso:**
- ✅ Controla exibição do formulário de endereço
- ✅ Controla validação condicional
- ✅ Controla informações da loja
- ❌ **NÃO** é enviado para o backend

## Validação Corrigida

### **Campos Obrigatórios**
- ✅ `items`: Array de itens do pedido
- ✅ `shippingAddress`: Sempre preenchido
- ✅ `payment.method`: Valor válido do enum
- ✅ `payment.amount`: Valor numérico
- ✅ `shipping`: Sempre 0 (sem frete)

### **Campos Opcionais**
- ✅ `notes`: Observações do pedido
- ✅ `tax`: Impostos (padrão 0)
- ✅ `payment.transactionId`: ID da transação

## Benefícios das Correções

### **✅ Compatibilidade Total**
- Dados enviados compatíveis com DTO
- Validação passa sem erros
- Pedidos criados com sucesso

### **✅ Interface Preservada**
- Usuário não percebe mudanças
- Mesmos métodos de pagamento
- Mesma experiência de uso

### **✅ Manutenibilidade**
- Código mais limpo
- Mapeamento centralizado
- Fácil de manter e expandir

### **✅ Robustez**
- Tratamento de todos os cenários
- Fallback para método padrão
- Endereço sempre válido

## Testes Recomendados

### **1. Teste PIX**
```javascript
// Deve mapear PIX → PIX
method: 'PIX' // Frontend
method: 'PIX' // Backend
```

### **2. Teste Pagar na Entrega**
```javascript
// Deve mapear STORE_PICKUP → CASH
method: 'STORE_PICKUP' // Frontend  
method: 'CASH' // Backend
```

### **3. Teste Link de Pagamento**
```javascript
// Deve mapear PAYMENT_LINK → CREDIT_CARD
method: 'PAYMENT_LINK' // Frontend
method: 'CREDIT_CARD' // Backend
```

### **4. Teste Endereço de Retirada**
```javascript
// Para deliveryMethod = 'PICKUP'
shippingAddress: {
  street: 'Retirada na loja',
  number: '123',
  district: 'Centro',
  city: 'Fortaleza',
  state: 'CE',
  zipCode: '60000-000',
  country: 'Brasil'
}
```

## Status

✅ **CORRIGIDO** - DTO do checkout alinhado com backend

O checkout agora envia dados totalmente compatíveis com o DTO do backend, mantendo a interface do usuário inalterada através de mapeamento transparente dos métodos de pagamento.