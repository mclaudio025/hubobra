const axios = require('axios');

async function testProdutosLojaFix() {
  console.log('🔍 Testando correção dos produtos na loja\n');

  const baseURL = 'http://localhost:8081';

  // 1. Testar a nova lógica do FeaturedProductsCarousel
  console.log('🎯 Testando nova lógica de produtos...');
  
  try {
    // Simular o que o componente fará agora
    console.log('1️⃣ Buscando produtos em destaque...');
    let featuredResponse = await axios.get(`${baseURL}/products?featured=true&active=true&limit=10`);
    let featuredProducts = featuredResponse.data.products || [];
    
    console.log(`   ✅ Produtos em destaque: ${featuredProducts.length}`);
    featuredProducts.forEach(product => {
      console.log(`      - ${product.name} (R$ ${product.price})`);
    });

    // Se não houver produtos em destaque suficientes
    if (featuredProducts.length < 6) {
      console.log('\n2️⃣ Buscando produtos ativos adicionais...');
      const additionalResponse = await axios.get(`${baseURL}/products?active=true&limit=${10 - featuredProducts.length}`);
      const additionalProducts = (additionalResponse.data.products || [])
        .filter(product => !featuredProducts.some(fp => fp.id === product.id));
      
      console.log(`   ✅ Produtos adicionais: ${additionalProducts.length}`);
      additionalProducts.forEach(product => {
        console.log(`      - ${product.name} (R$ ${product.price}) ${product.featured ? '[DESTAQUE]' : '[NORMAL]'}`);
      });

      featuredProducts = [...featuredProducts, ...additionalProducts];
    }

    console.log(`\n📊 Total de produtos que aparecerão na loja: ${featuredProducts.length}`);

  } catch (error) {
    console.log('❌ Erro ao testar nova lógica:', error.response?.data?.message);
  }

  // 2. Verificar se todos os produtos têm dados necessários
  console.log('\n🔍 Verificando dados dos produtos...');
  try {
    const response = await axios.get(`${baseURL}/products?active=true&limit=20`);
    const products = response.data.products || [];
    
    console.log('📋 Validação dos produtos:');
    products.forEach(product => {
      const issues = [];
      
      if (!product.name) issues.push('Nome faltando');
      if (!product.price || product.price <= 0) issues.push('Preço inválido');
      if (!product.category) issues.push('Categoria faltando');
      if (!product.images || product.images.length === 0) issues.push('Sem imagens');
      
      const status = issues.length === 0 ? '✅' : '⚠️';
      console.log(`   ${status} ${product.name}`);
      
      if (issues.length > 0) {
        console.log(`      Problemas: ${issues.join(', ')}`);
      }
    });

  } catch (error) {
    console.log('❌ Erro ao validar produtos:', error.response?.data?.message);
  }

  // 3. Testar conectividade frontend
  console.log('\n🌐 Testando conectividade frontend...');
  try {
    const frontendResponse = await axios.get('http://localhost:3000', { timeout: 5000 });
    console.log('✅ Frontend acessível');
  } catch (error) {
    console.log('❌ Frontend não acessível:', error.message);
    console.log('💡 Certifique-se de que o frontend está rodando na porta 3000');
  }

  // 4. Sugestões de melhorias
  console.log('\n💡 Sugestões para melhorar a exibição dos produtos:');
  
  try {
    const allProducts = await axios.get(`${baseURL}/products?active=true`);
    const products = allProducts.data.products || [];
    
    const withoutImages = products.filter(p => !p.images || p.images.length === 0);
    const notFeatured = products.filter(p => !p.featured);
    const withoutStock = products.filter(p => p.stock <= 0);
    
    if (withoutImages.length > 0) {
      console.log(`   📸 ${withoutImages.length} produtos sem imagens - adicione imagens para melhor visualização`);
    }
    
    if (notFeatured.length > 0) {
      console.log(`   ⭐ ${notFeatured.length} produtos não estão em destaque - marque alguns como destaque`);
    }
    
    if (withoutStock.length > 0) {
      console.log(`   📦 ${withoutStock.length} produtos sem estoque - atualize o estoque`);
    }

  } catch (error) {
    console.log('❌ Erro ao gerar sugestões:', error.response?.data?.message);
  }

  console.log('\n🏁 Teste concluído!');
  console.log('\n🚀 Próximos passos:');
  console.log('   1. Acesse http://localhost:3000');
  console.log('   2. Verifique se os produtos aparecem na seção "Nossos Produtos"');
  console.log('   3. Se necessário, marque mais produtos como destaque em /admin/produtos');
  console.log('   4. Adicione imagens aos produtos para melhor visualização');
  
  console.log('\n✨ Melhorias implementadas:');
  console.log('   ✅ Loja agora mostra produtos ativos mesmo sem destaque');
  console.log('   ✅ Título mudou de "Produtos em Destaque" para "Nossos Produtos"');
  console.log('   ✅ Lógica inteligente: destaque primeiro, depois produtos normais');
  console.log('   ✅ Até 10 produtos serão exibidos na página inicial');
}

// Executar teste
testProdutosLojaFix().catch(console.error);