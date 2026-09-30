async function testFeaturedProducts() {
  try {
    console.log('🔍 Testando produtos em destaque...\n');
    
    // Testar produtos em destaque
    const featuredResponse = await fetch('http://localhost:8081/products?featured=true&active=true');
    const featuredData = await featuredResponse.json();
    
    console.log(`Produtos em destaque: ${featuredData.products ? featuredData.products.length : 0}`);
    
    if (featuredData.products && featuredData.products.length > 0) {
      console.log('✅ Há produtos em destaque');
      featuredData.products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (Featured: ${product.featured})`);
      });
    } else {
      console.log('❌ Nenhum produto em destaque encontrado');
      
      // Testar produtos ativos normais
      const activeResponse = await fetch('http://localhost:8081/products?active=true&limit=5');
      const activeData = await activeResponse.json();
      
      console.log(`\nProdutos ativos disponíveis: ${activeData.products ? activeData.products.length : 0}`);
      
      if (activeData.products && activeData.products.length > 0) {
        console.log('✅ Há produtos ativos que podem ser exibidos');
        activeData.products.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} (Active: ${product.active}, Featured: ${product.featured})`);
        });
      }
    }
    
    // Testar configuração de componentes
    console.log('\n🔧 Testando configuração de componentes...');
    const configResponse = await fetch('http://localhost:8081/components/config-public');
    const configData = await configResponse.json();
    
    const featuredComponent = configData.find(c => c.id === 'featured-products');
    if (featuredComponent) {
      console.log(`Componente featured-products: ${featuredComponent.enabled ? 'HABILITADO' : 'DESABILITADO'}`);
      console.log(`Ordem: ${featuredComponent.order}`);
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

testFeaturedProducts();