const fs = require('fs');

console.log('💳 Testando alteração do texto de pagamento no checkout...\n');

function testPaymentMethodTextChange() {
  console.log('1. Verificando alteração nos métodos de pagamento...');
  
  const checkoutPath = 'frontend/src/app/checkout/page.tsx';
  
  if (!fs.existsSync(checkoutPath)) {
    console.log('❌ Arquivo de checkout não encontrado');
    return false;
  }
  
  const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
  
  const checks = [
    {
      name: 'Label alterado para "Pagar na Entrega"',
      test: () => checkoutContent.includes("label: 'Pagar na Entrega'")
    },
    {
      name: 'Descrição alterada para "Pague quando receber o produto"',
      test: () => checkoutContent.includes('Pague quando receber o produto')
    },
    {
      name: 'Título do card alterado',
      test: () => checkoutContent.includes('<h4 className="font-medium text-green-900">Pagar na Entrega</h4>')
    },
    {
      name: 'Descrição do card atualizada',
      test: () => checkoutContent.includes('Você pode pagar com dinheiro, PIX ou cartão no momento da entrega')
    },
    {
      name: 'Texto "Disponível para entregas locais" adicionado',
      test: () => checkoutContent.includes('Disponível para entregas locais')
    },
    {
      name: 'Value "STORE_PICKUP" mantido (lógica interna)',
      test: () => checkoutContent.includes("value: 'STORE_PICKUP'")
    },
    {
      name: 'Ícone Store mantido',
      test: () => checkoutContent.includes('<Store className="h-5 w-5" />')
    },
    {
      name: 'Texto antigo "Pagar na Retirada" removido',
      test: () => !checkoutContent.includes("label: 'Pagar na Retirada'")
    },
    {
      name: 'Texto antigo "Pagamento na Retirada" removido',
      test: () => !checkoutContent.includes('Pagamento na Retirada')
    },
    {
      name: 'Referência antiga "momento da retirada" removida',
      test: () => !checkoutContent.includes('momento da retirada')
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
  console.log('\n2. Verificando consistência geral...');
  
  const checkoutPath = 'frontend/src/app/checkout/page.tsx';
  const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
  
  const consistencyChecks = [
    {
      name: 'Outros métodos de pagamento mantidos',
      test: () => checkoutContent.includes("label: 'PIX'") && 
                   checkoutContent.includes("label: 'Link de Pagamento'") &&
                   checkoutContent.includes("label: 'Pagamento na Entrega'")
    },
    {
      name: 'Lógica de validação mantida',
      test: () => checkoutContent.includes("paymentData.method === 'STORE_PICKUP'")
    },
    {
      name: 'Estrutura do formulário preservada',
      test: () => checkoutContent.includes('Método de Pagamento') &&
                   checkoutContent.includes('space-y-3')
    },
    {
      name: 'Cards informativos mantidos',
      test: () => checkoutContent.includes('bg-green-50 border border-green-200')
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
  console.log('   • ✅ "Pagar na Retirada" → "Pagar na Entrega"');
  console.log('   • ✅ "Pague quando retirar" → "Pague quando receber"');
  console.log('   • ✅ "Pagamento na Retirada" → "Pagar na Entrega"');
  console.log('   • ✅ "Momento da retirada" → "Momento da entrega"');
  console.log('   • ✅ Adicionado "Disponível para entregas locais"');
  
  console.log('\n🎯 Benefícios da mudança:');
  console.log('   • Alinha com o modelo de "Pagar na Entrega"');
  console.log('   • Consistência com a opção de entrega');
  console.log('   • Deixa claro que é para entregas, não retiradas');
  console.log('   • Melhor compreensão do cliente');
  
  console.log('\n💡 Como aparece agora:');
  console.log('   💳 PIX');
  console.log('      Pagamento instantâneo via PIX');
  console.log('');
  console.log('   🏪 Pagar na Entrega');
  console.log('      Pague quando receber o produto');
  console.log('');
  console.log('   🔗 Link de Pagamento');
  console.log('      Cartão, PIX, boleto em link seguro');
  console.log('');
  console.log('   🚚 Pagamento na Entrega');
  console.log('      Pague quando receber o produto');
  
  console.log('\n🔄 Lógica mantida:');
  console.log('   • Value interno: STORE_PICKUP (sem mudança)');
  console.log('   • Ícone: Store (mantido)');
  console.log('   • Validações: Preservadas');
  console.log('   • Funcionalidade: Inalterada');
}

// Executar testes
try {
  const textChanged = testPaymentMethodTextChange();
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