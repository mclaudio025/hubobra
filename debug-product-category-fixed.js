const axios = require('axios');

async function debugProductCategory() {
  console.log('🔍 Debug: Produto não aparece na categoria Hidráulica\n');

  const baseURL = 'http://localhost:8081';
  let token = null;
  let hidraulicaCategory = null;

  // 1. Fazer login para obter token
  console.log('🔐 Fazendo login...');
  try {
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@loja.com',
      password: 'admin123'
    });
    
    token = loginResponse.data.access_token;
    console.log('✅ Login realizado com sucesso\n');
    
  } catch (error) {
    console.log('❌ Erro no login:', error.response?.data?.message);
    return;
  }

  // 2. Listar todas as categorias
  console.log('📋 Listando categorias...');
  try {
    const categoriesResponse = await axios.get(`${baseURL}/categories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Categorias encontradas:');
    categoriesResponse.data.forEach(cat => {
      console.log(`   - ID: ${cat.id} | Nome: ${cat.name} | Slug: ${cat.slug}`);
    });
    
    // Procurar categoria Hidráulica
    hidraulicaCategory = categoriesResponse.data.find(cat => 
      cat.name.toLowerCase().includes('hidraulica') || 
      cat.name.toLowerCase().includes('hidráulica')
    );
    
    if (hidraulicaCategory) {
      console.log(`\n🎯 Categoria Hidráulica encontrada: ID ${hidraulicaCategory.id}`);
    } else {
      console.log('\n❌ Categoria Hidráulica não encontrada!');
      return;
    }
    
  } catch (error) {
    console.log('❌ Erro ao listar categorias:', error.response?.data?.message);
    return;
  }

  // 3. Listar todos os produtos primeiro
  console.log('\n📋 Listando todos os produtos...');
  try {
    const allProductsResponse = await axios.get(`${baseURL}/products?limit=100`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const responseData = allProductsResponse.data;
    const allProducts = responseData.products || responseData.data || responseData || [];
    console.log(`✅ Total de produtos: ${allProducts.length}`);
    
    if (allProducts.length > 0) {
      console.log('\n📦 Últimos produtos cadastrados:');
      allProducts.slice(-10).forEach(product => {
        console.log(`   - Nome: ${product.name}`);
        console.log(`     ID: ${product.id}`);
        console.log(`     Categoria ID: ${product.categoryId}`);
        console.log(`     Categoria: ${product.category?.name || 'Não carregada'}`);
        console.log(`     Ativo: ${product.active}`);
        console.log('');
      });
    }
    
    // Procurar por produtos com "joelho"
    const joelhoProducts = allProducts.filter(p => 
      p.name.toLowerCase().includes('joelho') || 
      p.name.toLowerCase().includes('soldavel') ||
      p.name.toLowerCase().includes('soldável')
    );
    
    if (joelhoProducts.length > 0) {
      console.log('\n🎯 Produtos relacionados a "joelho" encontrados:');
      joelhoProducts.forEach(product => {
        console.log(`   - Nome: ${product.name}`);
        console.log(`     ID: ${product.id}`);
        console.log(`     Categoria ID: ${product.categoryId}`);
        console.log(`     Categoria: ${product.category?.name || 'Não carregada'}`);
        console.log(`     Ativo: ${product.active}`);
        console.log(`     Preço: R$ ${product.price}`);
        console.log(`     Estoque: ${product.stock}`);
        console.log(`     Criado em: ${product.createdAt}`);
        console.log('');
      });
    } else {
      console.log('\n❌ Nenhum produto relacionado a "joelho" encontrado!');
    }
    
  } catch (error) {
    console.log('❌ Erro ao listar produtos:', error.response?.status, error.response?.data?.message);
  }

  // 4. Verificar produtos da categoria Hidráulica especificamente
  console.log('\n🔍 Buscando produtos da categoria Hidráulica...');
  try {
    const hidraulicaProducts = await axios.get(`${baseURL}/products?categoryId=${hidraulicaCategory.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const responseData = hidraulicaProducts.data;
    const products = responseData.products || responseData.data || responseData || [];
    console.log(`✅ Produtos na categoria Hidráulica: ${products.length}`);
    
    if (products.length === 0) {
      console.log('❌ Nenhum produto encontrado na categoria Hidráulica!');
    } else {
      console.log('\n📦 Produtos na categoria Hidráulica:');
      products.forEach(product => {
        console.log(`   - ${product.name} (ID: ${product.id}) - Ativo: ${product.active}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Erro ao buscar produtos da categoria:', error.response?.status, error.response?.data?.message);
  }

  // 5. Verificar se a categoria está ativa
  console.log('\n🔍 Verificando status da categoria Hidráulica...');
  try {
    const categoryResponse = await axios.get(`${baseURL}/categories/${hidraulicaCategory.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`✅ Categoria Hidráulica:`);
    console.log(`   - Nome: ${categoryResponse.data.name}`);
    console.log(`   - Slug: ${categoryResponse.data.slug}`);
    console.log(`   - Ativa: ${categoryResponse.data.active}`);
    console.log(`   - Descrição: ${categoryResponse.data.description || 'Sem descrição'}`);
    
  } catch (error) {
    console.log('❌ Erro ao verificar categoria:', error.response?.status, error.response?.data?.message);
  }

  console.log('\n🏁 Debug concluído!');
  console.log('\n💡 Possíveis problemas identificados:');
  console.log('   1. Produto não foi salvo corretamente no banco');
  console.log('   2. Categoria não foi associada ao produto');
  console.log('   3. Produto está inativo');
  console.log('   4. Categoria está inativa');
  console.log('   5. Cache do frontend não foi atualizado');
  console.log('   6. Problema na busca/filtro por categoria');
}

// Executar debug
debugProductCategory().catch(console.error);