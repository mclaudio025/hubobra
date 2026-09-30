const axios = require('axios');

async function testBannerDatabase() {
  console.log('🗄️ Testando banco de dados de banners...\n');

  const baseURL = 'http://localhost:8081';

  // Fazer login primeiro
  console.log('🔐 Fazendo login...');
  let token = null;
  try {
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@loja.com',
      password: 'admin123'
    });
    token = loginResponse.data.access_token;
    console.log('✅ Login realizado com sucesso!');
  } catch (error) {
    console.log('❌ Erro no login:', error.message);
    return;
  }

  // Testar listagem de banners
  console.log('\n📋 Testando listagem de banners...');
  try {
    const response = await axios.get(`${baseURL}/banners`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Listagem funcionando');
    console.log(`📊 Total de banners: ${response.data.length}`);
    
    if (response.data.length > 0) {
      console.log('📌 Primeiros banners:');
      response.data.slice(0, 3).forEach((banner, index) => {
        console.log(`  ${index + 1}. ${banner.title} (${banner.type}) - ${banner.active ? 'ATIVO' : 'INATIVO'}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Erro na listagem: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    return;
  }

  // Testar criação de banner simples
  console.log('\n🎨 Testando criação de banner simples...');
  try {
    const bannerData = {
      title: 'Banner de Teste DB',
      subtitle: 'Teste de banco de dados',
      description: 'Banner criado para testar o banco',
      type: 'PROMOTIONAL',
      active: true,
      position: 999
    };

    const response = await axios.post(`${baseURL}/banners`, bannerData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Banner criado com sucesso!');
    console.log(`📋 ID: ${response.data.id}`);
    console.log(`📋 Título: ${response.data.title}`);
    
    // Testar busca do banner criado
    console.log('\n🔍 Testando busca do banner criado...');
    const getResponse = await axios.get(`${baseURL}/banners/${response.data.id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Banner encontrado!');
    console.log(`📋 Dados: ${JSON.stringify(getResponse.data, null, 2)}`);
    
    // Testar atualização
    console.log('\n✏️ Testando atualização do banner...');
    const updateData = {
      title: 'Banner Atualizado',
      subtitle: 'Teste de atualização'
    };
    
    const updateResponse = await axios.patch(`${baseURL}/banners/${response.data.id}`, updateData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Banner atualizado!');
    console.log(`📋 Novo título: ${updateResponse.data.title}`);
    
    // Testar exclusão
    console.log('\n🗑️ Testando exclusão do banner...');
    await axios.delete(`${baseURL}/banners/${response.data.id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Banner excluído com sucesso!');
    
  } catch (error) {
    console.log(`❌ Erro: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    
    if (error.response?.data) {
      console.log('📋 Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
  }

  // Testar estatísticas
  console.log('\n📊 Testando estatísticas de banners...');
  try {
    const response = await axios.get(`${baseURL}/banners/stats`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Estatísticas obtidas!');
    console.log(`📋 Dados: ${JSON.stringify(response.data, null, 2)}`);
    
  } catch (error) {
    console.log(`❌ Erro nas estatísticas: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }

  console.log('\n🎯 Teste de banco de dados concluído!');
}

testBannerDatabase();