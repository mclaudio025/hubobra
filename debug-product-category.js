const axios = require('axios');

async function debugProductCategory() {
  console.log('🔍 Debug: Produto não aparece na categoria Hidráulica\n');

  const baseURL = 'http://localhost:8081';

  // 1. Fazer login para obter token
  console.log('🔐 Fazendo login...');
  let token = null;
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
    const hidraulicaCategory = categoriesResponse.data.find(cat => 
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

  // 3. Buscar produtos com "joelho" no nome
  console.log('\n🔍 Buscando produtos com "joelho"...');
  try {
    const productsResponse = await axios.get(`${baseURL}/products?search=joelho`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`✅ Produtos encontrados: ${productsResponse.data.data?.length || productsResponse.data.length || 0}`);
    
    const products = productsResponse.data.data || productsResponse.data || [];
    
    if (products.length === 0) {
      console.log('❌ Nenhum produto com "joelho" encontrado!');
      
      // Listar todos os produtos para verificar
      console.log('\n📋 Listando todos os produtos...');
      const allProductsResponse = await axios.get(`${baseURL}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const allProducts = allProductsResponse.data.data || allProductsResponse.data || [];
      console.log(`Total de produtos: ${allProducts.length}`);
      
      if (allProducts.length > 0) {
        console.log('\n📦 Produtos encontrados:');
        allProducts.slice(0, 10).forEach(product => {
          console.log(`   - ID: ${product.id} | Nome: ${product.name} | Categoria: ${product.category?.name || 'Sem categoria'}`);
        });
        if (allProducts.length > 10) {
          console.log(`   ... e mais ${allProducts.length - 10} produtos`);
        }
      }
      
    } else {
      products.forEach(product => {
        console.log(`\n📦 Produto encontrado:`);
        console.log(`   - ID: ${product.id}`);
        console.log(`   - Nome: ${product.name}`);
        console.log(`   - Descrição: ${product.description}`);
        console.log(`   - Categoria ID: ${product.categoryId}`);
        console.log(`   - Categoria Nome: ${product.category?.name || 'Não carregada'}`);
        console.log(`   - Ativo: ${product.active}`);
        console.log(`   - Preço: R$ ${product.price}`);
        console.log(`   - Estoque: ${product.stock}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Erro ao buscar produtos:', error.response?.status, error.response?.data?.message);
  }

  // 4. Verificar produtos da categoria Hidráulica especificamente
  console.log('\n🔍 Buscando produtos da categoria Hidráulica...');
  
  // Primeiro, vamos pegar o ID da categoria Hidráulica
  const hidraulicaCategory = categoriesResponse.data.find(cat => 
    cat.name.toLowerCase().includes('hidraulica') || 
    cat.name.toLowerCase().includes('hidráulica')
  );
  
  if (hidraulicaCategory) {
    try {
      const hidraulicaProducts = await axios.get(`${baseURL}/products?categoryId=${hidraulicaCategory.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const products = hidraulicaProducts.data.data || hidraulicaProducts.data || [];
      console.log(`✅ Produtos na categoria Hidráulica: ${products.length}`);
      
      if (products.length === 0) {
        console.log('❌ Nenhum produto encontrado na categoria Hidráulica!');
      } else {
        products.forEach(product => {
          console.log(`   - ${product.name} (ID: ${product.id}) - Ativo: ${product.active}`);
        });
      }
      
    } catch (error) {
      console.log('❌ Erro ao buscar produtos da categoria:', error.response?.status, error.response?.data?.message);
    }
  }

  // 5. Verificar se existe algum problema com o slug da categoria
  console.log('\n🔍 Testando acesso à categoria via slug...');
  try {
    const categoryResponse = await axios.get(`${baseURL}/categories/slug/hidraulica`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`✅ Categoria encontrada via slug: ${categoryResponse.data.name}`);
    console.log(`   ID: ${categoryResponse.data.id}`);
    console.log(`   Ativa: ${categoryResponse.data.active}`);
    
  } catch (error) {
    console.log('❌ Erro ao acessar categoria via slug:', error.response?.status, error.response?.data?.message);
  }

  // 6. Verificar se o produto foi realmente criado recentemente
  console.log('\n🔍 Verificando produtos criados recentemente...');
  try {
    const recentProducts = await axios.get(`${baseURL}/products?limit=50`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const products = recentProducts.data.data || recentProducts.data || [];
    console.log(`✅ Últimos ${products.length} produtos:`);
    
    // Procurar por produtos com "joelho" ou "soldavel"
    const joelhoProducts = products.filter(p => 
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
        console.log(`     Criado em: ${product.createdAt}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhum produto relacionado a "joelho" encontrado nos últimos produtos');
    }
    
  } catch (error) {
    console.log('❌ Erro ao buscar produtos recentes:', error.response?.status, error.response?.data?.message);
  }

  console.log('\n🏁 Debug concluído!');
  console.log('\n💡 Possíveis problemas:');
  console.log('   1. Produto não foi salvo corretamente');
  console.log('   2. Categoria não foi associada ao produto');
  console.log('   3. Produto está inativo');
  console.log('   4. Cache do frontend não foi atualizado');
  console.log('   5. Problema no slug da categoria');
}

// Executar debug
debugProductCategory().catch(console.error);