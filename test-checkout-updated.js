const fs = require('fs');

console.log('🛒 Testando atualização do checkout...\n');

function testCheckoutUpdates() {
  console.log('1. Verificando atualizações no checkout...');
  
  const checkoutPath = 'frontend/src/app/checkout/page.tsx';
  
  if (!fs.existsSync(checkoutPath)) {
    console.log('❌ Arquivo de checkout não encontrado');
    return false;
  }
  
  const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
  
  // Verificar se as mudanças foram aplicadas
  const checks = [
    {
      name: 'Tipos de pagamento atualizados',
      test: () => checkoutContent.includes('PIX') && 
                   checkoutContent.includes('STORE_PICKUP') && 
                   checkoutContent.includes('PAYMENT_LINK') && 
                   checkoutContent.includes('CASH_ON_DELIVERY')
    },
    {
      name: 'Frete removido do cálculo',
      test: () => checkoutContent.includes('return total; // Sem frete - trabalho local')
    },
    {
      name: 'Opção de retirada na loja',
      test: () => checkoutContent.includes('Retirar na Loja') && 
                   checkoutContent.includes('deliveryMethod')
    },
    {
      name: 'Endereço condicional',
      test: () => checkoutContent.includes('deliveryMethod === \'DELIVERY\'') &&
                   checkoutContent.includes('required={deliveryMethod === \'DELIVERY\'}')
    },
    {
      name: 'Informações da loja para retirada',
      test: () => checkoutContent.includes('Endereço da Loja') &&
                   checkoutContent.includes('Horário:')
    },
    {
      name: 'Métodos de pagamento com descrições',
      test: () => checkoutContent.includes('Pagamento instantâneo via PIX') &&
                   checkoutContent.includes('Pague quando retirar o produto')
    },
    {
      name: 'Resumo sem frete',
      test: () => checkoutContent.includes('Entrega local gratuita') ||
                   checkoutContent.includes('Retirada na loja')
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(check => {
    if (check.test()) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

function checkPaymentMethodSelector() {
  console.log('\n2. Verificando PaymentMethodSelector...');
  
  const selectorPath = 'frontend/src/app/components/payments/PaymentMethodSelector.tsx';
  
  if (!fs.existsSync(selectorPath)) {
    console.log('❌ PaymentMethodSelector não encontrado');
    return false;
  }
  
  const selectorContent = fs.readFileSync(selectorPath, 'utf8');
  
  const paymentMethods = [
    'STORE_PICKUP',
    'PIX', 
    'PAYMENT_LINK',
    'CASH_ON_DELIVERY'
  ];
  
  let allMethodsFound = true;
  
  paymentMethods.forEach(method => {
    if (selectorContent.includes(method)) {
      console.log(`✅ Método ${method} encontrado`);
    } else {
      console.log(`❌ Método ${method} não encontrado`);
      allMethodsFound = false;
    }
  });
  
  return allMethodsFound;
}

function generateTestSummary() {
  console.log('\n📋 Resumo das atualizações do checkout:');
  console.log('   • ✅ Frete removido (trabalho local)');
  console.log('   • ✅ Opção de retirada na loja adicionada');
  console.log('   • ✅ Tipos de pagamento atualizados:');
  console.log('     - PIX (instantâneo)');
  console.log('     - Retirar na Loja (pagar na retirada)');
  console.log('     - Link de Pagamento (múltiplas opções)');
  console.log('     - Pagamento na Entrega (para entregas)');
  console.log('   • ✅ Endereço condicional (só para entrega)');
  console.log('   • ✅ Informações da loja para retirada');
  console.log('   • ✅ Resumo atualizado sem frete');
  
  console.log('\n🎯 Como testar:');
  console.log('   1. Adicione produtos ao carrinho');
  console.log('   2. Vá para o checkout');
  console.log('   3. Teste as opções de entrega:');
  console.log('      - Entrega em casa (pede endereço)');
  console.log('      - Retirar na loja (mostra endereço da loja)');
  console.log('   4. Teste os métodos de pagamento');
  console.log('   5. Verifique se o total não inclui frete');
  
  console.log('\n💡 Benefícios:');
  console.log('   • Processo mais simples para negócio local');
  console.log('   • Opções de pagamento adequadas ao modelo');
  console.log('   • Flexibilidade entre entrega e retirada');
  console.log('   • Interface mais clara e objetiva');
}

// Executar testes
try {
  const checkoutOk = testCheckoutUpdates();
  const selectorOk = checkPaymentMethodSelector();
  
  if (checkoutOk && selectorOk) {
    console.log('\n✅ Todas as atualizações foram aplicadas com sucesso!');
    generateTestSummary();
  } else {
    console.log('\n❌ Algumas atualizações podem não ter sido aplicadas corretamente');
  }
  
} catch (error) {
  console.error('❌ Erro durante o teste:', error.message);
}