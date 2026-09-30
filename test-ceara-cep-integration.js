const fs = require('fs');

console.log('🌴 Testando integração Ceará + Auto preenchimento CEP...\n');

function testCearaIntegration() {
  console.log('1. Verificando configuração do Ceará...');
  
  const checkoutPath = 'frontend/src/app/checkout/page.tsx';
  
  if (!fs.existsSync(checkoutPath)) {
    console.log('❌ Arquivo de checkout não encontrado');
    return false;
  }
  
  const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
  
  const cearaChecks = [
    {
      name: 'Estado inicial definido como CE',
      test: () => checkoutContent.includes("state: 'CE'")
    },
    {
      name: 'Campo estado fixo como Ceará',
      test: () => checkoutContent.includes('value="Ceará"') && checkoutContent.includes('readOnly')
    },
    {
      name: 'Select de estados removido',
      test: () => !checkoutContent.includes('<option value="SP">São Paulo</option>')
    },
    {
      name: 'Endereço da loja atualizado para Fortaleza',
      test: () => checkoutContent.includes('Fortaleza - CE')
    },
    {
      name: 'CEP da loja atualizado',
      test: () => checkoutContent.includes('60000-000')
    }
  ];
  
  let allPassed = true;
  
  cearaChecks.forEach(check => {
    if (check.test()) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

function testCepAutoFill() {
  console.log('\n2. Verificando auto preenchimento por CEP...');
  
  const checkoutPath = 'frontend/src/app/checkout/page.tsx';
  const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
  
  const cepChecks = [
    {
      name: 'Estado loadingCep adicionado',
      test: () => checkoutContent.includes('loadingCep') && checkoutContent.includes('setLoadingCep')
    },
    {
      name: 'Função searchCep implementada',
      test: () => checkoutContent.includes('const searchCep = async (cep: string)')
    },
    {
      name: 'Integração com ViaCEP',
      test: () => checkoutContent.includes('viacep.com.br/ws/')
    },
    {
      name: 'Validação de CEP do Ceará',
      test: () => checkoutContent.includes("data.uf !== 'CE'") && 
                   checkoutContent.includes('Atendemos apenas o estado do Ceará')
    },
    {
      name: 'Função handleCepChange implementada',
      test: () => checkoutContent.includes('const handleCepChange = (value: string)')
    },
    {
      name: 'Formatação automática de CEP',
      test: () => checkoutContent.includes("replace(/(\\d{5})(\\d)/, '$1-$2')")
    },
    {
      name: 'Campo CEP com nova função',
      test: () => checkoutContent.includes('onChange={(e) => handleCepChange(e.target.value)}')
    },
    {
      name: 'Loading indicator no CEP',
      test: () => checkoutContent.includes('loadingCep &&') && 
                   checkoutContent.includes('animate-spin')
    },
    {
      name: 'Texto explicativo do CEP',
      test: () => checkoutContent.includes('Digite o CEP para preenchimento automático')
    },
    {
      name: 'Preenchimento automático dos campos',
      test: () => checkoutContent.includes('street: data.logradouro') &&
                   checkoutContent.includes('district: data.bairro') &&
                   checkoutContent.includes('city: data.localidade')
    }
  ];
  
  let allPassed = true;
  
  cepChecks.forEach(check => {
    if (check.test()) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

function testErrorHandling() {
  console.log('\n3. Verificando tratamento de erros...');
  
  const checkoutPath = 'frontend/src/app/checkout/page.tsx';
  const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
  
  const errorChecks = [
    {
      name: 'Tratamento de CEP não encontrado',
      test: () => checkoutContent.includes('CEP não encontrado')
    },
    {
      name: 'Tratamento de CEP fora da área',
      test: () => checkoutContent.includes('CEP fora da área de entrega')
    },
    {
      name: 'Tratamento de erro na API',
      test: () => checkoutContent.includes('Erro ao buscar CEP')
    },
    {
      name: 'Toast de sucesso',
      test: () => checkoutContent.includes('CEP encontrado') &&
                   checkoutContent.includes('Endereço preenchido automaticamente')
    },
    {
      name: 'Try/catch implementado',
      test: () => checkoutContent.includes('try {') && 
                   checkoutContent.includes('} catch (error) {')
    }
  ];
  
  let allPassed = true;
  
  errorChecks.forEach(check => {
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
  console.log('\n📋 Resumo das implementações:');
  console.log('   • ✅ Estado fixado como Ceará');
  console.log('   • ✅ Auto preenchimento por CEP');
  console.log('   • ✅ Validação de CEP do Ceará');
  console.log('   • ✅ Formatação automática de CEP');
  console.log('   • ✅ Loading indicator');
  console.log('   • ✅ Tratamento de erros');
  console.log('   • ✅ Endereço da loja atualizado');
  
  console.log('\n🎯 Como funciona:');
  console.log('   1. Cliente digita o CEP');
  console.log('   2. Sistema formata automaticamente (00000-000)');
  console.log('   3. Quando CEP tem 8 dígitos, busca na API ViaCEP');
  console.log('   4. Valida se o CEP é do Ceará');
  console.log('   5. Preenche automaticamente: rua, bairro, cidade');
  console.log('   6. Mostra feedback visual (loading + toast)');
  
  console.log('\n💡 Benefícios:');
  console.log('   • Experiência mais rápida para o cliente');
  console.log('   • Reduz erros de digitação');
  console.log('   • Garante que só atende o Ceará');
  console.log('   • Interface mais limpa (sem select de estados)');
  console.log('   • Feedback visual claro');
  
  console.log('\n🧪 Como testar:');
  console.log('   1. Vá para o checkout');
  console.log('   2. Escolha "Pagar na Entrega"');
  console.log('   3. Digite um CEP do Ceará (ex: 60000-000)');
  console.log('   4. Veja o preenchimento automático');
  console.log('   5. Teste com CEP de outro estado');
  console.log('   6. Teste com CEP inválido');
}

// Executar testes
try {
  const cearaOk = testCearaIntegration();
  const cepOk = testCepAutoFill();
  const errorsOk = testErrorHandling();
  
  if (cearaOk && cepOk && errorsOk) {
    console.log('\n✅ Todas as implementações foram aplicadas com sucesso!');
    generateSummary();
  } else {
    console.log('\n❌ Algumas implementações podem estar incompletas');
    
    if (!cearaOk) console.log('   • Configuração do Ceará');
    if (!cepOk) console.log('   • Auto preenchimento CEP');
    if (!errorsOk) console.log('   • Tratamento de erros');
  }
  
} catch (error) {
  console.error('❌ Erro durante o teste:', error.message);
}