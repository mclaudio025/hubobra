const axios = require('axios');

async function debugProdutosLoja() {
  console.log('🔍 Debug: Produtos não aparecem na loja\n');

  const baseURL = 'http://localhost:8081';

  // 1. Verificar conectividade
  console.log('🌐 Testando conectividade...');
  try {
    const response = await axios.get(`${baseURL}/health`);
    console.log('✅ Backend respondendo:', response.status);
  } catch (error) {
    console.log('❌ Backend não está respondendo');
    return;
  }

  // 2. Listar todos os produtos
  console.log('\n📦 Listando todos os produtos...');
  try {
    const response = await axios.get(`${baseURL}/products?limit=50`);
    
    const products = response.data.products || [];
    console.log(`✅ Total de produtos: ${products.length}`);
    
    if (products.length === 0) {
      console.log('❌ Nenhum produto encontrado no banco de dados!');
      console.log('💡 Você precisa cadastrar produtos primeiro');
      return;
    }

    console.log('\n📋 Produtos encontrados:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   - ID: ${product.id}`);
      console.log(`   - Ativo: ${product.active ? 'SIM' : 'NÃO'}`);
      console.log(`   - Em destaque: ${product.featured ? 'SIM' : 'NÃO'}`);
      console.log(`   - Categoria: ${product.category?.name || 'Sem categoria'}`);
      console.log(`   - Preço: R$ ${product.price}`);
      console.log(`   - Estoque: ${product.stock}`);
      console.log('');
    });

  } catch (error) {
    console.log('❌ Erro ao listar produtos:', error.response?.status, error.response?.data?.message);
    return;
  }

  // 3. Verificar produtos ativos
  console.log('🔍 Verificando produtos ativos...');
  try {
    const response = await axios.get(`${baseURL}/products?active=true&limit=50`);
    
    const activeProducts = response.data.products || [];
    console.log(`✅ Produtos ativos: ${activeProducts.length}`);
    
    if (activeProducts.length === 0) {
      console.log('❌ Nenhum produto ativo encontrado!');
      console.log('💡 Ative os produtos no admin para aparecerem na loja');
    }

  } catch (error) {
    console.log('❌ Erro ao buscar produtos ativos:', error.response?.data?.message);
  }

  // 4. Verificar produtos em destaque
  console.log('\n⭐ Verificando produtos em destaque...');
  try {
    const response = await axios.get(`${baseURL}/products?featured=true&active=true&limit=10`);
    
    const featuredProducts = response.data.products || [];
    console.log(`✅ Produtos em destaque: ${featuredProducts.length}`);
    
    if (featuredProducts.length === 0) {
      console.log('❌ Nenhum produto em destaque encontrado!');
      console.log('💡 Marque produtos como "destaque" para aparecerem na página inicial');
    } else {
      console.log('\n🌟 Produtos em destaque:');
      featuredProducts.forEach(product => {
        console.log(`   - ${product.name} (R$ ${product.price})`);
      });
    }

  } catch (error) {
    console.log('❌ Erro ao buscar produtos em destaque:', error.response?.data?.message);
  }

  // 5. Verificar produtos por categoria
  console.log('\n📂 Verificando produtos por categoria...');
  try {
    // Buscar categoria Hidráulica
    const categoriesResponse = await axios.get(`${baseURL}/categories`);
    const hidraulicaCategory = categoriesResponse.data.find(cat => 
      cat.name.toLowerCase().includes('hidraulica') || 
      cat.name.toLowerCase().includes('hidráulica')
    );

    if (hidraulicaCategory) {
      const productsResponse = await axios.get(`${baseURL}/products?categoryId=${hidraulicaCategory.id}&active=true`);
      const categoryProducts = productsResponse.data.products || [];
      
      console.log(`✅ Produtos na categoria Hidráulica: ${categoryProducts.length}`);
      
      if (categoryProducts.length > 0) {
        categoryProducts.forEach(product => {
          console.log(`   - ${product.name} (${product.active ? 'Ativo' : 'Inativo'})`);
        });
      }
    }

  } catch (error) {
    console.log('❌ Erro ao verificar produtos por categoria:', error.response?.data?.message);
  }

  // 6. Testar requisição que o frontend faria
  console.log('\n🌐 Testando requisição do frontend...');
  try {
    // Simular requisição do FeaturedProductsCarousel
    const frontendResponse = await axios.get(`${baseURL}/products?featured=true&active=true&limit=10`);
    
    console.log('✅ Requisição do frontend funcionou');
    console.log(`📊 Estrutura da resposta:`);
    console.log(`   - products: ${frontendResponse.data.products?.length || 0}`);
    console.log(`   - total: ${frontendResponse.data.total || 0}`);
    console.log(`   - page: ${frontendResponse.data.page || 1}`);
    console.log(`   - totalPages: ${frontendResponse.data.totalPages || 1}`);

  } catch (error) {
    console.log('❌ Erro na requisição do frontend:', error.response?.data?.message);
  }

  // 7. Verificar se há problemas de CORS
  console.log('\n🔒 Verificando CORS...');
  try {
    const corsResponse = await axios.get(`${baseURL}/products?limit=1`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Referer': 'http://localhost:3000'
      }
    });
    console.log('✅ CORS funcionando corretamente');
  } catch (error) {
    console.log('❌ Possível problema de CORS:', error.message);
  }

  console.log('\n🏁 Debug concluído!');
  console.log('\n💡 Possíveis soluções:');
  console.log('   1. Cadastre produtos se não houver nenhum');
  console.log('   2. Ative os produtos no admin (/admin/produtos)');
  console.log('   3. Marque produtos como "destaque" para aparecerem na home');
  console.log('   4. Verifique se o frontend está fazendo as requisições corretas');
  console.log('   5. Limpe o cache do navegador');
  
  console.log('\n🚀 Próximos passos:');
  console.log('   1. Acesse http://localhost:3000/admin/produtos');
  console.log('   2. Verifique se os produtos estão ativos');
  console.log('   3. Marque alguns como "destaque"');
  console.log('   4. Acesse http://localhost:3000 para ver se aparecem');
}

// Executar debug
debugProdutosLoja().catch(console.error);