const axios = require('axios');

async function testProductCardFix() {
  console.log('🔍 Testando correção do ProductCard\n');

  const backendURL = 'http://localhost:8081';

  // 1. Verificar estrutura dos produtos retornados pela API
  console.log('🔍 Verificando estrutura dos produtos da API...');
  try {
    const response = await axios.get(`${backendURL}/products?categoryId=5e595d63-9bac-4b03-a5b9-2af1b93384ac&active=true&limit=5`);
    
    console.log('✅ Produtos retornados pela API:');
    console.log(`📊 Total: ${response.data.products?.length || 0}`);
    
    if (response.data.products && response.data.products.length > 0) {
      console.log('\n📦 Estrutura do primeiro produto:');
      const product = response.data.products[0];
      
      console.log(`   - id: ${product.id || 'undefined'}`);
      console.log(`   - name: ${product.name || 'undefined'}`);
      console.log(`   - price: ${product.price} (tipo: ${typeof product.price})`);
      console.log(`   - stock: ${product.stock} (tipo: ${typeof product.stock})`);
      console.log(`   - sku: ${product.sku || 'undefined'}`);
      console.log(`   - brand: ${product.brand || 'undefined'}`);
      console.log(`   - active: ${product.active}`);
      console.log(`   - images: ${product.images?.length || 0} imagens`);
      console.log(`   - category: ${product.category?.name || 'undefined'}`);
      
      // Verificar se há produtos com price undefined/null
      const productsWithoutPrice = response.data.products.filter(p => 
        p.price === undefined || p.price === null || isNaN(p.price)
      );
      
      if (productsWithoutPrice.length > 0) {
        console.log(`\n⚠️ Produtos com preço inválido: ${productsWithoutPrice.length}`);
        productsWithoutPrice.forEach(p => {
          console.log(`   - ${p.name}: price = ${p.price} (${typeof p.price})`);
        });
      } else {
        console.log('\n✅ Todos os produtos têm preços válidos');
      }
      
      // Verificar se há produtos com campos obrigatórios faltando
      const productsWithMissingFields = response.data.products.filter(p => 
        !p.id || !p.name
      );
      
      if (productsWithMissingFields.length > 0) {
        console.log(`\n⚠️ Produtos com campos obrigatórios faltando: ${productsWithMissingFields.length}`);
        productsWithMissingFields.forEach(p => {
          console.log(`   - ID: ${p.id || 'FALTANDO'}, Nome: ${p.name || 'FALTANDO'}`);
        });
      } else {
        console.log('✅ Todos os produtos têm campos obrigatórios');
      }
    }
    
  } catch (error) {
    console.log('❌ Erro ao buscar produtos:', error.response?.status, error.response?.data?.message);
  }

  // 2. Testar formatação de preços
  console.log('\n🔍 Testando formatação de preços...');
  
  const testPrices = [
    1.46,
    12.5,
    0,
    undefined,
    null,
    NaN,
    "1.46",
    "invalid"
  ];
  
  testPrices.forEach(price => {
    try {
      const formatted = price ? price.toFixed(2) : '0,00';
      console.log(`   - ${price} (${typeof price}) → R$ ${formatted}`);
    } catch (error) {
      console.log(`   - ${price} (${typeof price}) → ERRO: ${error.message}`);
    }
  });

  console.log('\n🏁 Teste concluído!');
  console.log('\n💡 Próximos passos:');
  console.log('   1. Acesse http://localhost:3000/categoria/hidraulica');
  console.log('   2. Verifique se o erro do ProductCard foi corrigido');
  console.log('   3. Abra o DevTools para verificar se não há mais erros');
}

// Executar teste
testProductCardFix().catch(console.error);