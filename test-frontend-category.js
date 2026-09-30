const axios = require('axios');

async function testFrontendCategory() {
  console.log('🔍 Testando página da categoria Hidráulica no frontend\n');

  const frontendURL = 'http://localhost:3000';
  const backendURL = 'http://localhost:8081';

  // 1. Testar se o frontend está rodando
  console.log('🌐 Testando conectividade do frontend...');
  try {
    const response = await axios.get(frontendURL, { timeout: 5000 });
    console.log('✅ Frontend respondendo:', response.status);
  } catch (error) {
    console.log('❌ Frontend não está respondendo:', error.message);
    console.log('💡 Certifique-se de que o frontend está rodando na porta 3000');
    return;
  }

  // 2. Testar API route do frontend para produtos
  console.log('\n🔍 Testando API route do frontend para produtos...');
  try {
    const response = await axios.get(`${frontendURL}/api/products`, { timeout: 10000 });
    console.log('✅ API route de produtos funcionando');
    
    const products = response.data.products || response.data || [];
    console.log(`📊 Total de produtos via frontend: ${products.length}`);
    
    // Procurar produtos com "joelho"
    const joelhoProducts = products.filter(p => 
      p.name && p.name.toLowerCase().includes('joelho')
    );
    
    if (joelhoProducts.length > 0) {
      console.log(`🎯 Produtos "joelho" via frontend: ${joelhoProducts.length}`);
      joelhoProducts.forEach(product => {
        console.log(`   - ${product.name} (Categoria: ${product.category?.name || 'N/A'})`);
      });
    } else {
      console.log('❌ Nenhum produto "joelho" encontrado via frontend');
    }
    
  } catch (error) {
    console.log('❌ Erro na API route do frontend:', error.response?.status, error.message);
  }

  // 3. Testar API route específica para categoria
  console.log('\n🔍 Testando API route para categoria Hidráulica...');
  try {
    const response = await axios.get(`${frontendURL}/api/categories/hidraulica/products`, { timeout: 10000 });
    console.log('✅ API route da categoria funcionando');
    
    const products = response.data.products || response.data || [];
    console.log(`📊 Produtos na categoria via frontend: ${products.length}`);
    
    if (products.length > 0) {
      products.forEach(product => {
        console.log(`   - ${product.name}`);
      });
    } else {
      console.log('❌ Nenhum produto encontrado na categoria via frontend');
    }
    
  } catch (error) {
    console.log('❌ Erro na API route da categoria:', error.response?.status, error.message);
    
    // Tentar rota alternativa
    try {
      console.log('   Tentando rota alternativa...');
      const altResponse = await axios.get(`${frontendURL}/api/products?category=hidraulica`, { timeout: 10000 });
      const altProducts = altResponse.data.products || altResponse.data || [];
      console.log(`   ✅ Rota alternativa funcionou: ${altProducts.length} produtos`);
    } catch (altError) {
      console.log('   ❌ Rota alternativa também falhou');
    }
  }

  // 4. Testar conexão direta com backend via frontend
  console.log('\n🔍 Testando se frontend consegue acessar backend...');
  try {
    // Simular uma requisição que o frontend faria
    const response = await axios.get(`${backendURL}/products?categoryId=5e595d63-9bac-4b03-a5b9-2af1b93384ac`, {
      timeout: 10000,
      headers: {
        'Origin': frontendURL,
        'Referer': frontendURL
      }
    });
    
    const products = response.data.products || [];
    console.log(`✅ Frontend pode acessar backend: ${products.length} produtos na categoria`);
    
  } catch (error) {
    console.log('❌ Erro de conectividade frontend->backend:', error.response?.status, error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend não está respondendo - verifique se está rodando na porta 8081');
    } else if (error.response?.status === 404) {
      console.log('💡 Rota não encontrada - verifique as rotas do backend');
    } else if (error.response?.status >= 500) {
      console.log('💡 Erro interno do servidor - verifique logs do backend');
    }
  }

  // 5. Verificar se há problemas de CORS
  console.log('\n🔍 Verificando configuração CORS...');
  try {
    const response = await axios.options(`${backendURL}/products`, {
      headers: {
        'Origin': frontendURL,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('✅ CORS configurado corretamente');
    
  } catch (error) {
    console.log('❌ Possível problema de CORS:', error.message);
    console.log('💡 Verifique a configuração CORS no backend');
  }

  console.log('\n🏁 Teste concluído!');
  console.log('\n💡 Próximos passos:');
  console.log('   1. Acesse http://localhost:3000/categoria/hidraulica no navegador');
  console.log('   2. Abra o DevTools (F12) e verifique a aba Network');
  console.log('   3. Verifique se há erros no Console');
  console.log('   4. Verifique se as requisições para a API estão sendo feitas');
  console.log('   5. Limpe o cache do navegador (Ctrl+Shift+R)');
}

// Executar teste
testFrontendCategory().catch(console.error);