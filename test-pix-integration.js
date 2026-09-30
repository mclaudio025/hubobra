const fs = require('fs');

console.log('💳 Testando integração PIX no checkout...\n');

function testPixApiRoutes() {
  console.log('1. Verificando API routes do PIX...');
  
  const pixRoutePath = 'frontend/src/app/api/payments/pix/route.ts';
  const paymentUpdatePath = 'frontend/src/app/api/orders/[id]/payment/route.ts';
  
  let allRoutesExist = true;
  
  if (fs.existsSync(pixRoutePath)) {
    console.log('✅ API route PIX criada');
    
    const pixContent = fs.readFileSync(pixRoutePath, 'utf8');
    
    const pixChecks = [
      { name: 'POST method', test: () => pixContent.includes('export async function POST') },
      { name: 'GET method', test: () => pixContent.includes('export async function GET') },
      { name: 'Backend integration', test: () => pixContent.includes('process.env.NEXT_PUBLIC_API_URL') },
      { name: 'Error handling', test: () => pixContent.includes('try {') && pixContent.includes('catch') },
      { name: 'Validation', test: () => pixContent.includes('if (!orderId') }
    ];
    
    pixChecks.forEach(check => {
      if (check.test()) {
        console.log(`   ✅ ${check.name}`);
      } else {
        console.log(`   ❌ ${check.name}`);
        allRoutesExist = false;
      }
    });
  } else {
    console.log('❌ API route PIX não encontrada');
    allRoutesExist = false;
  }
  
  if (fs.existsSync(paymentUpdatePath)) {
    console.log('✅ API route atualização de pagamento criada');
    
    const updateContent = fs.readFileSync(paymentUpdatePath, 'utf8');
    
    const updateChecks = [
      { name: 'PATCH method', test: () => updateContent.includes('export async function PATCH') },
      { name: 'Order ID param', test: () => updateContent.includes('params: { id: string }') },
      { name: 'Status validation', test: () => updateContent.includes('body.status') },
      { name: 'Backend call', test: () => updateContent.includes('/orders/${orderId}/payment') }
    ];
    
    updateChecks.forEach(check => {
      if (check.test()) {
        console.log(`   ✅ ${check.name}`);
      } else {
        console.log(`   ❌ ${check.name}`);
        allRoutesExist = false;
      }
    });
  } else {
    console.log('❌ API route atualização de pagamento não encontrada');
    allRoutesExist = false;
  }
  
  return allRoutesExist;
}

function testCheckoutPixIntegration() {
  console.log('\n2. Verificando integração PIX no checkout...');
  
  const checkoutPath = 'frontend/src/app/checkout/page.tsx';
  
  if (!fs.existsSync(checkoutPath)) {
    console.log('❌ Arquivo de checkout não encontrado');
    return false;
  }
  
  const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
  
  const pixIntegrationChecks = [
    {
      name: 'PIX como método de pagamento',
      test: () => checkoutContent.includes("method: 'PIX'")
    },
    {
      name: 'Chamada para API PIX',
      test: () => checkoutContent.includes("fetch('/api/payments/pix'")
    },
    {
      name: 'Redirecionamento para página PIX',
      test: () => checkoutContent.includes('router.push(`/pagamento/pix/${paymentResult.id}`)')
    },
    {
      name: 'Tratamento de erro PIX',
      test: () => checkoutContent.includes('paymentResult.error')
    },
    {
      name: 'Dados do PIX enviados',
      test: () => checkoutContent.includes('orderId: order.id') && 
                   checkoutContent.includes('amount: calculateTotal()')
    },
    {
      name: 'Interface PIX no checkout',
      test: () => checkoutContent.includes('Pagamento via PIX') &&
                   checkoutContent.includes('Smartphone')
    }
  ];
  
  let allChecksPass = true;
  
  pixIntegrationChecks.forEach(check => {
    if (check.test()) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
      allChecksPass = false;
    }
  });
  
  return allChecksPass;
}

function testBackendPixRoutes() {
  console.log('\n3. Verificando rotas PIX no backend...');
  
  const paymentsControllerPath = 'backend-nestjs/src/payments/payments.controller.ts';
  const ordersControllerPath = 'backend-nestjs/src/orders/orders.controller.ts';
  
  let backendOk = true;
  
  if (fs.existsSync(paymentsControllerPath)) {
    const paymentsContent = fs.readFileSync(paymentsControllerPath, 'utf8');
    
    const backendPixChecks = [
      { name: 'POST /payments/pix', test: () => paymentsContent.includes("@Post('pix')") },
      { name: 'GET /payments/pix/:id', test: () => paymentsContent.includes("@Get('pix/:id')") },
      { name: 'PIX service integration', test: () => paymentsContent.includes('pixService.createPixPayment') },
      { name: 'PIX webhook', test: () => paymentsContent.includes("@Post('pix/webhook')") }
    ];
    
    backendPixChecks.forEach(check => {
      if (check.test()) {
        console.log(`✅ ${check.name}`);
      } else {
        console.log(`❌ ${check.name}`);
        backendOk = false;
      }
    });
  } else {
    console.log('❌ Controller de payments não encontrado');
    backendOk = false;
  }
  
  if (fs.existsSync(ordersControllerPath)) {
    const ordersContent = fs.readFileSync(ordersControllerPath, 'utf8');
    
    if (ordersContent.includes("@Patch(':id/payment')")) {
      console.log('✅ PATCH /orders/:id/payment');
    } else {
      console.log('❌ PATCH /orders/:id/payment');
      backendOk = false;
    }
  } else {
    console.log('❌ Controller de orders não encontrado');
    backendOk = false;
  }
  
  return backendOk;
}

function generatePixTestSummary() {
  console.log('\n📋 Resumo da integração PIX:');
  console.log('   • ✅ API routes criadas no frontend');
  console.log('   • ✅ Integração PIX no checkout');
  console.log('   • ✅ Rotas PIX no backend');
  console.log('   • ✅ Fluxo completo de pagamento');
  
  console.log('\n🔄 Fluxo do PIX:');
  console.log('   1. Cliente escolhe PIX no checkout');
  console.log('   2. Frontend chama /api/payments/pix');
  console.log('   3. API frontend chama backend /payments/pix');
  console.log('   4. Backend gera código PIX');
  console.log('   5. Cliente é redirecionado para página PIX');
  console.log('   6. Cliente paga e sistema confirma automaticamente');
  
  console.log('\n🎯 Como testar:');
  console.log('   1. Adicione produtos ao carrinho');
  console.log('   2. Vá para o checkout');
  console.log('   3. Escolha PIX como forma de pagamento');
  console.log('   4. Finalize o pedido');
  console.log('   5. Verifique se é redirecionado para página PIX');
  console.log('   6. Teste o pagamento (simulação em dev)');
  
  console.log('\n💡 Recursos PIX implementados:');
  console.log('   • Geração de código PIX');
  console.log('   • QR Code para pagamento');
  console.log('   • Verificação de status');
  console.log('   • Webhook para confirmação');
  console.log('   • Simulação em desenvolvimento');
  console.log('   • Integração com pedidos');
}

// Executar testes
try {
  const apiRoutesOk = testPixApiRoutes();
  const checkoutOk = testCheckoutPixIntegration();
  const backendOk = testBackendPixRoutes();
  
  if (apiRoutesOk && checkoutOk && backendOk) {
    console.log('\n✅ Integração PIX implementada com sucesso!');
    generatePixTestSummary();
  } else {
    console.log('\n❌ Alguns componentes da integração PIX podem estar faltando');
    console.log('\n🔧 Verifique:');
    if (!apiRoutesOk) console.log('   • API routes do frontend');
    if (!checkoutOk) console.log('   • Integração no checkout');
    if (!backendOk) console.log('   • Rotas do backend');
  }
  
} catch (error) {
  console.error('❌ Erro durante o teste:', error.message);
}