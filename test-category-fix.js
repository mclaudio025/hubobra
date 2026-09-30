const axios = require('axios');

async function testCategoryFix() {
  console.log('🔍 Testando correção da página da categoria\n');

  const backendURL = 'http://localhost:8081';

  // 1. Testar a requisição correta que o frontend deveria fazer
  console.log('🔍 Testando requisição corrigida...');
  try {
    const response = await axios.get(`${backendURL}/products?categoryId=5e595d63-9bac-4b03-a5b9-2af1b93384ac&active=true&page=1&limit=20`);
    
    console.log('✅ Requisição funcionou!');
    console.log(`📊 Estrutura da resposta:`);
    console.log(`   - products: ${response.data.products?.length || 0}`);
    console.log(`   - total: ${response.data.total}`);
    console.log(`   - page: ${response.data.page}`);
    console.log(`   - totalPages: ${response.data.totalPages}`);
    
    if (response.data.products && response.data.products.length > 0) {
      console.log('\n📦 Produtos encontrados:');
      response.data.products.forEach(product => {
        console.log(`   - ${product.name} (${product.active ? 'Ativo' : 'Inativo'})`);
      });
    }
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.response?.status, error.response?.data?.message);
  }

  // 2. Testar busca por categoria via slug
  console.log('\n🔍 Testando busca de categoria por slug...');
  try {
    const response = await axios.get(`${backendURL}/categories/slug/hidraulica`);
    
    console.log('✅ Categoria encontrada via slug:');
    console.log(`   - ID: ${response.data.id}`);
    console.log(`   - Nome: ${response.data.name}`);
    console.log(`   - Ativa: ${response.data.active}`);
    
  } catch (error) {
    console.log('❌ Erro ao buscar categoria por slug:', error.response?.status, error.response?.data?.message);
  }

  console.log('\n🏁 Teste concluído!');
  console.log('\n💡 Próximos passos:');
  console.log('   1. Acesse http://localhost:3000/categoria/hidraulica');
  console.log('   2. Verifique se os produtos aparecem agora');
  console.log('   3. Se ainda não aparecer, limpe o cache do navegador');
}

// Executar teste
testCategoryFix().catch(console.error);