const axios = require('axios');

async function debugBannerUserError() {
  console.log('🔍 Debugando erro "Usuário não encontrado" ao atualizar banner...');
  console.log('=' .repeat(60));

  const baseURL = 'http://localhost:8082';

  // 1. Verificar se backend está funcionando
  console.log('\n1️⃣ Verificando backend...');
  try {
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Backend está funcionando:', healthResponse.status);
  } catch (error) {
    console.log('❌ Backend não está respondendo:', error.message);
    return;
  }

  // 2. Fazer login para obter token
  console.log('\n2️⃣ Fazendo login...');
  let authToken = null;
  let userData = null;
  
  try {
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@loja.com',
      password: 'admin123'
    });
    
    authToken = loginResponse.data.access_token;
    userData = loginResponse.data.user;
    
    console.log('✅ Login realizado com sucesso!');
    console.log('👤 Usuário:', userData.name, '(' + userData.email + ')');
    console.log('🆔 ID do usuário:', userData.id);
    console.log('🔑 Token obtido:', authToken ? 'Sim' : 'Não');
    console.log('🎭 Role:', userData.role);
    console.log('✅ Ativo:', userData.active);
  } catch (error) {
    console.log('❌ Erro no login:', error.response?.data?.message || error.message);
    return;
  }

  // 3. Verificar se o usuário existe no banco
  console.log('\n3️⃣ Verificando se usuário existe no banco...');
  try {
    const userResponse = await axios.get(`${baseURL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Usuário encontrado no banco:', {
      id: userResponse.data.id,
      email: userResponse.data.email,
      name: userResponse.data.name,
      role: userResponse.data.role,
      active: userResponse.data.active
    });
  } catch (error) {
    console.log('❌ Erro ao buscar perfil do usuário:', error.response?.data?.message || error.message);
    if (error.response?.data?.message?.includes('Usuário não encontrado')) {
      console.log('🎯 PROBLEMA IDENTIFICADO: O usuário do token não existe no banco!');
      return;
    }
  }

  // 4. Listar banners existentes
  console.log('\n4️⃣ Listando banners existentes...');
  let bannerId = null;
  try {
    const bannersResponse = await axios.get(`${baseURL}/banners`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const banners = bannersResponse.data;
    console.log(`✅ ${banners.length} banners encontrados`);
    
    if (banners.length > 0) {
      bannerId = banners[0].id;
      console.log('📋 Primeiro banner:', {
        id: banners[0].id,
        title: banners[0].title,
        active: banners[0].active
      });
    } else {
      console.log('⚠️ Nenhum banner encontrado. Criando um banner de teste...');
      
      // Criar banner de teste
      const createResponse = await axios.post(`${baseURL}/banners`, {
        title: 'Banner de Teste',
        description: 'Banner criado para teste de atualização',
        imageUrl: 'https://via.placeholder.com/800x400',
        linkUrl: 'https://example.com',
        type: 'HERO',
        active: true,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      bannerId = createResponse.data.id;
      console.log('✅ Banner de teste criado:', bannerId);
    }
  } catch (error) {
    console.log('❌ Erro ao listar/criar banners:', error.response?.data?.message || error.message);
    if (error.response?.data?.message?.includes('Usuário não encontrado')) {
      console.log('🎯 PROBLEMA IDENTIFICADO: Erro "Usuário não encontrado" ao acessar banners!');
      return;
    }
  }

  // 5. Tentar atualizar o banner (reproduzir o erro)
  console.log('\n5️⃣ Tentando atualizar banner...');
  if (bannerId) {
    try {
      const updateResponse = await axios.patch(`${baseURL}/banners/${bannerId}`, {
        title: 'Banner Atualizado - ' + new Date().toLocaleTimeString()
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('✅ Banner atualizado com sucesso!');
      console.log('📋 Dados atualizados:', {
        id: updateResponse.data.id,
        title: updateResponse.data.title
      });
    } catch (error) {
      console.log('❌ ERRO AO ATUALIZAR BANNER:', error.response?.data?.message || error.message);
      
      if (error.response?.data?.message?.includes('Usuário não encontrado')) {
        console.log('\n🎯 ERRO REPRODUZIDO: "Usuário não encontrado" ao atualizar banner!');
        console.log('\n🔍 Análise do problema:');
        console.log('   - O token JWT é válido para login');
        console.log('   - O usuário existe no banco de dados');
        console.log('   - O erro ocorre especificamente na atualização de banners');
        console.log('   - Isso indica um problema na validação JWT do BannersController');
        
        // Decodificar o token para análise
        console.log('\n📋 Analisando token JWT...');
        try {
          const tokenParts = authToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            console.log('🔍 Payload do token:', {
              sub: payload.sub,
              email: payload.email,
              iat: new Date(payload.iat * 1000),
              exp: new Date(payload.exp * 1000),
              isExpired: payload.exp < (Date.now() / 1000)
            });
          }
        } catch (decodeError) {
          console.log('❌ Erro ao decodificar token:', decodeError.message);
        }
      }
    }
  }

  console.log('\n✅ Debug concluído!');
}

debugBannerUserError();