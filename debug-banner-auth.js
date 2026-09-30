const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function debugBannerAuth() {
  console.log('🔍 Debug: Erro "Usuário não encontrado" ao salvar banners\n');

  const baseURL = 'http://localhost:8081';

  // 1. Testar se o backend está rodando
  console.log('🌐 Testando conectividade do backend...');
  try {
    const response = await axios.get(`${baseURL}/health`);
    console.log('✅ Backend respondendo:', response.status);
  } catch (error) {
    console.log('❌ Backend não está respondendo. Execute: node restart-backend.js');
    return;
  }

  // 2. Testar login
  console.log('\n🔐 Testando login...');
  let token = null;
  try {
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@loja.com',
      password: 'admin123'
    });
    
    token = loginResponse.data.access_token;
    console.log('✅ Login realizado com sucesso');
    console.log('📋 Token recebido:', token ? 'SIM' : 'NÃO');
    console.log('📋 Usuário:', loginResponse.data.user?.name || 'N/A');
    console.log('📋 Role:', loginResponse.data.user?.role || 'N/A');
    console.log('📋 ID do usuário:', loginResponse.data.user?.id || 'N/A');
    
  } catch (error) {
    console.log('❌ Erro no login:', error.response?.status, error.response?.data?.message);
    return;
  }

  // 3. Testar acesso ao perfil do usuário
  console.log('\n👤 Testando acesso ao perfil...');
  try {
    const profileResponse = await axios.get(`${baseURL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Perfil acessado com sucesso');
    console.log('📋 ID do usuário:', profileResponse.data.id);
    console.log('📋 Nome:', profileResponse.data.name);
    console.log('📋 Email:', profileResponse.data.email);
    
  } catch (error) {
    console.log('❌ Erro ao acessar perfil:', error.response?.status, error.response?.data?.message);
  }

  // 4. Testar listagem de banners (GET)
  console.log('\n📋 Testando listagem de banners...');
  try {
    const bannersResponse = await axios.get(`${baseURL}/banners`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Listagem funcionando');
    console.log(`📊 Total de banners: ${bannersResponse.data.length}`);
    
  } catch (error) {
    console.log('❌ Erro na listagem:', error.response?.status, error.response?.data?.message);
  }

  // 5. Testar criação de banner simples (POST)
  console.log('\n🎨 Testando criação de banner simples...');
  try {
    const timestamp = Date.now();
    const bannerData = {
      title: `Banner Debug ${timestamp}`,
      subtitle: 'Teste de debug',
      description: 'Banner para testar autenticação',
      type: 'PROMOTIONAL',
      active: true,
      position: 999
    };

    console.log('📋 Dados enviados:', JSON.stringify(bannerData, null, 2));

    const createResponse = await axios.post(`${baseURL}/banners`, bannerData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Banner criado com sucesso!');
    console.log('📋 ID do banner:', createResponse.data.id);
    
    // Limpar banner criado
    try {
      await axios.delete(`${baseURL}/banners/${createResponse.data.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('🗑️ Banner de teste removido');
    } catch (deleteError) {
      console.log('⚠️ Erro ao remover banner de teste:', deleteError.response?.data?.message);
    }
    
  } catch (error) {
    console.log('❌ ERRO AO CRIAR BANNER:', error.response?.status);
    console.log('📋 Mensagem:', error.response?.data?.message);
    console.log('📋 Detalhes:', JSON.stringify(error.response?.data, null, 2));
  }

  // 6. Testar criação com imagem
  console.log('\n🖼️ Testando criação de banner com imagem...');
  
  // Criar uma imagem de teste simples
  const testImagePath = 'test-banner-image.jpg';
  if (!fs.existsSync(testImagePath)) {
    console.log('⚠️ Criando imagem de teste...');
    // Criar um arquivo de imagem fake para teste
    fs.writeFileSync(testImagePath, Buffer.from('fake-image-data'));
  }

  try {
    const formData = new FormData();
    formData.append('title', `Banner com Imagem ${Date.now()}`);
    formData.append('subtitle', 'Teste com upload');
    formData.append('description', 'Banner para testar upload de imagem');
    formData.append('type', 'PROMOTIONAL');
    formData.append('active', 'true');
    formData.append('position', '998');
    formData.append('image', fs.createReadStream(testImagePath));

    const uploadResponse = await axios.post(`${baseURL}/banners`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Banner com imagem criado com sucesso!');
    console.log('📋 ID do banner:', uploadResponse.data.id);
    console.log('📋 URL da imagem:', uploadResponse.data.imageUrl);
    
    // Limpar banner criado
    try {
      await axios.delete(`${baseURL}/banners/${uploadResponse.data.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('🗑️ Banner com imagem removido');
    } catch (deleteError) {
      console.log('⚠️ Erro ao remover banner com imagem:', deleteError.response?.data?.message);
    }
    
  } catch (error) {
    console.log('❌ ERRO AO CRIAR BANNER COM IMAGEM:', error.response?.status);
    console.log('📋 Mensagem:', error.response?.data?.message);
    console.log('📋 Detalhes:', JSON.stringify(error.response?.data, null, 2));
    
    // Verificar se é problema de autenticação
    if (error.response?.status === 401) {
      console.log('\n🔍 DIAGNÓSTICO: Problema de autenticação detectado!');
      console.log('💡 Possíveis causas:');
      console.log('   - Token JWT expirado');
      console.log('   - Middleware de autenticação não configurado corretamente');
      console.log('   - Guard de autenticação falhando na validação');
    }
    
    if (error.response?.data?.message?.includes('Usuário não encontrado')) {
      console.log('\n🔍 DIAGNÓSTICO: Erro "Usuário não encontrado" confirmado!');
      console.log('💡 Possíveis causas:');
      console.log('   - JWT payload não contém ID do usuário');
      console.log('   - Usuário foi removido do banco após login');
      console.log('   - Problema na validação do token no AuthGuard');
    }
  }

  // Limpar arquivo de teste
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
  }

  console.log('\n🏁 Debug concluído!');
}

// Executar debug
debugBannerAuth().catch(console.error);