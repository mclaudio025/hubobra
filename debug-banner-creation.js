const axios = require('axios');

async function debugBannerCreation() {
  console.log('🔍 Debug da criação de banners...\n');

  const baseURL = 'http://localhost:8081';

  // Fazer login
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

  // Teste 1: Banner mínimo
  console.log('\n🧪 Teste 1: Banner com campos mínimos');
  try {
    const bannerData = {
      title: 'Banner Mínimo',
      type: 'PROMOTIONAL'
    };

    const response = await axios.post(`${baseURL}/banners`, bannerData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Banner mínimo criado!');
    console.log(`📋 ID: ${response.data.id}`);
    
    // Limpar
    await axios.delete(`${baseURL}/banners/${response.data.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
  } catch (error) {
    console.log(`❌ Erro: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log('📋 Detalhes:', JSON.stringify(error.response.data, null, 2));
    }
  }

  // Teste 2: Banner com subtitle
  console.log('\n🧪 Teste 2: Banner com subtitle');
  try {
    const bannerData = {
      title: 'Banner com Subtitle',
      subtitle: 'Este é o subtitle',
      type: 'PROMOTIONAL'
    };

    const response = await axios.post(`${baseURL}/banners`, bannerData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Banner com subtitle criado!');
    
    // Limpar
    await axios.delete(`${baseURL}/banners/${response.data.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
  } catch (error) {
    console.log(`❌ Erro: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }

  // Teste 3: Banner com imageUrl
  console.log('\n🧪 Teste 3: Banner com imageUrl');
  try {
    const bannerData = {
      title: 'Banner com Imagem',
      type: 'PROMOTIONAL',
      imageUrl: 'http://localhost:8081/uploads/original/test.png'
    };

    const response = await axios.post(`${baseURL}/banners`, bannerData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Banner com imagem criado!');
    
    // Limpar
    await axios.delete(`${baseURL}/banners/${response.data.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
  } catch (error) {
    console.log(`❌ Erro: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }

  // Teste 4: Banner com bgColor
  console.log('\n🧪 Teste 4: Banner com bgColor');
  try {
    const bannerData = {
      title: 'Banner com BgColor',
      type: 'PROMOTIONAL',
      bgColor: 'from-orange-600 to-orange-700'
    };

    const response = await axios.post(`${baseURL}/banners`, bannerData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Banner com bgColor criado!');
    
    // Limpar
    await axios.delete(`${baseURL}/banners/${response.data.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
  } catch (error) {
    console.log(`❌ Erro: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }

  // Teste 5: Banner completo (como no script original)
  console.log('\n🧪 Teste 5: Banner completo');
  try {
    const bannerData = {
      title: 'Banner Completo Debug',
      subtitle: 'Teste de funcionalidade',
      description: 'Banner criado automaticamente para teste',
      buttonText: 'Ver Mais',
      buttonLink: '/',
      imageUrl: 'http://localhost:8081/uploads/original/test.png',
      bgColor: 'from-orange-600 to-orange-700',
      textColor: 'text-white',
      type: 'HERO',
      position: 1,
      active: true
    };

    console.log('📋 Dados enviados:', JSON.stringify(bannerData, null, 2));

    const response = await axios.post(`${baseURL}/banners`, bannerData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Banner completo criado!');
    console.log(`📋 ID: ${response.data.id}`);
    
    // Limpar
    await axios.delete(`${baseURL}/banners/${response.data.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
  } catch (error) {
    console.log(`❌ Erro: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log('📋 Detalhes completos:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('\n🎯 Debug concluído!');
}

debugBannerCreation();