const fs = require('fs');

console.log('🔧 Testando correção do DTO no checkout...\n');

function testDTOCorrections() {
  console.log('1. Verificando correções no checkout...');
  
  const checkoutPath = 'frontend/src/app/checkout/page.tsx';
  
  if (!fs.existsSync(checkoutPath)) {
    console.log('❌ Arquivo de checkout não encontrado');
    return false;
  }
  
  const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
  
  const corrections = [
    {
      name: 'Interface PaymentData corrigida',
      test: () => checkoutContent.includes("'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'BANK_SLIP' | 'CASH'")
    },
    {
      name: 'Campo deliveryAddress removido',
      test: () => !checkoutContent.includes('deliveryAddress:') && checkoutContent.includes('shippingAddress:')
    },
    {
      name: 'Campo deliveryMethod removido',
      test: () => !checkoutContent.includes('deliveryMethod,')
    },
    {
      name: 'Função mapPaymentMethod implementada',
      test: () => checkoutContent.includes('const mapPaymentMethod = (method: string)')
    },
    {
      name: 'Mapeamento de métodos correto',
      test: () => checkoutContent.includes("'STORE_PICKUP': 'CASH'") && 
                   checkoutContent.includes("'PAYMENT_LINK': 'CREDIT_CARD'") &&
                   checkoutContent.includes("'CASH_ON_DELIVERY': 'CASH'")
    },
    {
      name: 'shippingAddress sempre preenchido',
      test: () => checkoutContent.includes('shippingAddress: deliveryMethod') && 
                   checkoutContent.includes('Retirada na loja')
    },
    {
      name: 'Método de pagamento mapeado na criação',
      test: () => checkoutContent.includes('method: mapPaymentMethod(paymentData.method)')
    },
    {
      name: 'Valores de método mantidos na interface',
      test: () => checkoutContent.includes("value: 'PIX'") && 
                   checkoutContent.includes("value: 'STORE_PICKUP'") &&
                   checkoutContent.includes("value: 'PAYMENT_LINK'") &&
                   checkoutContent.includes("value: 'CASH_ON_DELIVERY'")
    }
  ];
  
  let allPassed = true;
  
  corrections.forEach(correction => {
    if (correction.test()) {
      console.log(`✅ ${correction.name}`);
    } else {
      console.log(`❌ ${correction.name}`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

function testBackendDTO() {
  console.log('\n2. Verificando DTO do backend...');
  
  const dtoPath = 'backend-nestjs/src/orders/dto/create-order.dto.ts';
  
  if (!fs.existsSync(dtoPath)) {
    console.log('❌ DTO do backend não encontrado');
    return false;
  }
  
  const dtoContent = fs.readFileSync(dtoPath, 'utf8');
  
  const dtoChecks = [
    {
      name: 'Enum PaymentMethod definido',
      test: () => dtoContent.includes('export enum PaymentMethod')
    },
    {
      name: 'Métodos de pagamento corretos',
      test: () => dtoContent.includes('CREDIT_CARD') && 
                   dtoContent.includes('DEBIT_CARD') &&
                   dtoContent.includes('PIX') &&
                   dtoContent.includes('BANK_SLIP') &&
                   dtoContent.includes('CASH')
    },
    {
      name: 'Campo shippingAddress obrigatório',
      test: () => dtoContent.includes('shippingAddress: CreateShippingAddressDto')
    },
    {
      name: 'Campo payment obrigatório',
      test: () => dtoContent.includes('payment: CreatePaymentDto')
    },
    {
      name: 'Campo shipping obrigatório',
      test: () => dtoContent.includes('shipping: number')
    }
  ];
  
  let allPassed = true;
  
  dtoChecks.forEach(check => {
    if (check.test()) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

function generateSummary() {
  console.log('\n📋 Resumo das correções:');
  console.log('   • ✅ Interface PaymentData alinhada com backend');
  console.log('   • ✅ Campo deliveryAddress → shippingAddress');
  console.log('   • ✅ Campo deliveryMethod removido');
  console.log('   • ✅ Função de mapeamento de métodos implementada');
  console.log('   • ✅ Endereço sempre preenchido (mesmo para retirada)');
  
  console.log('\n🔄 Mapeamento de métodos:');
  console.log('   Frontend → Backend');
  console.log('   PIX → PIX');
  console.log('   STORE_PICKUP → CASH');
  console.log('   PAYMENT_LINK → CREDIT_CARD');
  console.log('   CASH_ON_DELIVERY → CASH');
  
  console.log('\n💡 Estrutura do pedido corrigida:');
  console.log('   {');
  console.log('     items: [...],');
  console.log('     shippingAddress: { ... }, // Sempre preenchido');
  console.log('     payment: {');
  console.log('       method: "PIX|CREDIT_CARD|DEBIT_CARD|BANK_SLIP|CASH",');
  console.log('       amount: number,');
  console.log('       transactionId?: string');
  console.log('     },');
  console.log('     shipping: 0,');
  console.log('     tax: 0,');
  console.log('     notes?: string');
  console.log('   }');
  
  console.log('\n🎯 Benefícios:');
  console.log('   • Compatibilidade total com backend');
  console.log('   • Validação correta dos dados');
  console.log('   • Interface mantida para o usuário');
  console.log('   • Mapeamento transparente de métodos');
}

// Executar testes
try {
  const checkoutOk = testDTOCorrections();
  const dtoOk = testBackendDTO();
  
  if (checkoutOk && dtoOk) {
    console.log('\n✅ Correções do DTO aplicadas com sucesso!');
    generateSummary();
  } else {
    console.log('\n❌ Algumas correções podem estar incompletas');
    
    if (!checkoutOk) console.log('   • Correções no checkout');
    if (!dtoOk) console.log('   • Estrutura do DTO backend');
  }
  
} catch (error) {
  console.error('❌ Erro durante o teste:', error.message);
}