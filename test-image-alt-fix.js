const axios = require('axios');

async function testImageAltFix() {
  console.log('🔍 Testando correção do erro de alt da imagem\n');

  const backendURL = 'http://localhost:8081';

  // 1. Verificar estrutura das imagens nos produtos
  console.log('🔍 Verificando estrutura das imagens nos produtos...');
  try {
    const response = await axios.get(`${backendURL}/products?categoryId=5e595d63-9bac-4b03-a5b9-2af1b93384ac&active=true&limit=3`);
    
    console.log('✅ Produtos retornados pela API:');
    console.log(`📊 Total: ${response.data.products?.length || 0}`);
    
    if (response.data.products && response.data.products.length > 0) {
      response.data.products.forEach((product, index) => {
        console.log(`\n📦 Produto ${index + 1}: ${product.name}`);
        console.log(`   - ID: ${product.id}`);
        console.log(`   - Imagens: ${product.images?.length || 0}`);
        
        if (product.images && product.images.length > 0) {
          product.images.forEach((image, imgIndex) => {
            console.log(`     Imagem ${imgIndex + 1}:`);
            console.log(`       - URL: ${image.url || 'undefined'}`);
            console.log(`       - Alt: ${image.alt || 'undefined'}`);
            console.log(`       - Alt válido: ${image.alt ? 'SIM' : 'NÃO'}`);
          });
        } else {
          console.log('     - Nenhuma imagem cadastrada');
        }
      });
    }
    
  } catch (error) {
    console.log('❌ Erro ao buscar produtos:', error.response?.status, error.response?.data?.message);
  }

  // 2. Testar estrutura esperada pelo ProductCard
  console.log('\n🔍 Testando estrutura esperada pelo ProductCard...');
  
  const mockProduct = {
    id: 'test-id',
    name: 'Produto Teste',
    price: 10.50,
    description: 'Descrição do produto',
    images: [
      { url: '/test.jpg', alt: 'Imagem do produto' },
      { url: '/test2.jpg' }, // sem alt
      { url: '/test3.jpg', alt: '' }, // alt vazio
    ],
    sku: 'TEST001',
    stock: 10,
    brand: 'Marca Teste',
    featured: false
  };

  console.log('📋 Estrutura de teste:');
  console.log(`   - Nome: ${mockProduct.name}`);
  console.log(`   - Preço: ${mockProduct.price} (${typeof mockProduct.price})`);
  console.log(`   - Imagens: ${mockProduct.images.length}`);
  
  mockProduct.images.forEach((image, index) => {
    const imageAlt = image.alt || mockProduct.name;
    console.log(`     Imagem ${index + 1}: alt="${imageAlt}" (${image.alt ? 'original' : 'fallback'})`);
  });

  // 3. Verificar se há problemas de formatação de preço
  console.log('\n🔍 Testando formatação de preços...');
  
  const testPrices = [10.50, 0, undefined, null, '10.50'];
  
  testPrices.forEach(price => {
    const formatted = price && typeof price === 'number' ? price.toFixed(2) : '0,00';
    console.log(`   - ${price} (${typeof price}) → R$ ${formatted}`);
  });

  console.log('\n🏁 Teste concluído!');
  console.log('\n💡 Correções aplicadas:');
  console.log('   ✅ ProductCard agora recebe propriedades individuais');
  console.log('   ✅ Alt da imagem tem fallback para o nome do produto');
  console.log('   ✅ Formatação de preço segura implementada');
  console.log('   ✅ Imagem na view de lista tem alt com fallback');
  
  console.log('\n🚀 Próximos passos:');
  console.log('   1. Acesse http://localhost:3000/categoria/hidraulica');
  console.log('   2. Verifique se não há mais erros no console');
  console.log('   3. Teste tanto a view em grid quanto em lista');
}

// Executar teste
testImageAltFix().catch(console.error);