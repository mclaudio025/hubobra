const fs = require('fs');

console.log('🚚 Testando alteração do texto de entrega no checkout...\n');

function testDeliveryTextChange() {
  console.log('1. Verificando alteração no checkout...');
  
  const checkoutPath = 'frontend/src/app/checkout/page.tsx';
  
  if (!fs.existsSync(checkoutPath)) {
    console.log('❌ Arquivo de checkout não encontrado');
    return false;
  }
  
  const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
  
  const checks = [
    {
      name: 'Texto "Pagar na Entrega" presente',
      test: () => checkoutContent.includes('Pagar na Entrega')
    },
    {
      name: 'Descrição "Pague quando receber o produto" presente',
      test: () => checkoutContent.includes('Pague quando receber o produto')
    },
    {
      name: 'Texto antigo "Entrega em Casa" removido',
      test: () => !checkoutContent.includes('Entrega em Casa')
    },
    {
      name: 'Descrição antiga "Receba no conforto da sua casa" removida',
      test: () => !checkoutContent.includes('Receba no conforto da sua casa')
    },
    {
      name: 'Ícone de caminhão mantido',
      test: () => checkoutContent.includes('<Truck className="h-5 w-5 text-orange-600" />')
    },
    {
      name: 'Value "DELIVERY" mantido',
      test: () => checkoutContent.includes('value="DELIVERY"')
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

function checkConsistency() {
  console.log('\n2. Verificando consistência no checkout...');
  
  const checkoutPath = 'frontend/src/app/checkout/page.tsx';
  const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
  
  // Verificar se há outras referências que precisam ser atualizadas
  const consistencyChecks = [
    {
      name: 'Título da seção mantido como "Forma de Entrega"',
      test: () => checkoutContent.includes('Forma de Entrega')
    },
    {
      name: 'Progress step mantido como "Entrega"',
      test: () => checkoutContent.includes('<span className="ml-2 text-sm font-medium">Entrega</span>')
    },
    {
      name: 'Formulário de endereço condicional mantido',
      test: () => checkoutContent.includes("deliveryMethod === 'DELIVERY'")
    },
    {
      name: 'Opção de retirada na loja mantida',
      test: () => checkoutContent.includes('Retirar na Loja')
    }
  ];
  
  let allConsistent = true;
  
  consistencyChecks.forEach(check => {
    if (check.test()) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
      allConsistent = false;
    }
  });
  
  return allConsistent;
}

function generateSummary() {
  console.log('\n📋 Resumo da alteração:');
  console.log('   • ✅ "Entrega em Casa" → "Pagar na Entrega"');
  console.log('   • ✅ "Receba no conforto da sua casa" → "Pague quando receber o produto"');
  console.log('   • ✅ Ícone e funcionalidade mantidos');
  console.log('   • ✅ Lógica de entrega preservada');
  
  console.log('\n🎯 Benefícios da mudança:');
  console.log('   • Deixa claro que o pagamento é na entrega');
  console.log('   • Alinha com o modelo de negócio local');
  console.log('   • Diferencia melhor das outras opções');
  console.log('   • Mais direto e objetivo');
  
  console.log('\n💡 Como aparece agora:');
  console.log('   📦 Pagar na Entrega');
  console.log('      Pague quando receber o produto');
  console.log('');
  console.log('   🏪 Retirar na Loja');
  console.log('      Retire quando for conveniente');
}

// Executar testes
try {
  const textChanged = testDeliveryTextChange();
  const consistent = checkConsistency();
  
  if (textChanged && consistent) {
    console.log('\n✅ Alteração aplicada com sucesso!');
    generateSummary();
  } else {
    console.log('\n❌ Alguns problemas foram encontrados na alteração');
    
    if (!textChanged) {
      console.log('   • Texto não foi alterado corretamente');
    }
    if (!consistent) {
      console.log('   • Inconsistências encontradas no código');
    }
  }
  
} catch (error) {
  console.error('❌ Erro durante o teste:', error.message);
}