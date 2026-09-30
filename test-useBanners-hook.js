// Script para testar especificamente o hook useBanners

async function testUseBannersHook() {
  console.log('🔍 Testando hook useBanners...');
  console.log('=' .repeat(50));
  
  const API_URL = 'http://localhost:8081';
  
  // Simular exatamente o que o hook useBanners faz
  const getBanners = (params) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const query = searchParams.toString();
    const endpoint = `/banners${query ? `?${query}` : ''}`;
    
    console.log('📋 Endpoint gerado:', endpoint);
    console.log('📋 URL completa:', `${API_URL}${endpoint}`);
    
    return apiCall(endpoint);
  };
  
  // Simular exatamente o que o apiCall faz
  const apiCall = async (endpoint) => {
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    try {
      console.log('🚀 Fazendo requisição...');
      const response = await fetch(`${API_URL}${endpoint}`, config);
      
      console.log('📊 Status da resposta:', response.status);
      console.log('📊 Headers da resposta:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
        throw new Error(error.message || `Erro ${response.status}`);
      }
      
      // Verificar se há conteúdo para parsear
      const contentType = response.headers.get('content-type');
      console.log('📋 Content-Type:', contentType);
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('✅ Dados recebidos:', data.length, 'banners');
        return data;
      }
      
      console.log('⚠️  Resposta sem JSON');
      return null;
    } catch (error) {
      console.error(`❌ Erro na API (${endpoint}):`, error.message);
      throw error;
    }
  };
  
  try {
    // 1. Testar exatamente como o HeroCarousel chama
    console.log('\n1. Testando getBanners({ type: "HERO", active: true })...');
    
    const banners = await getBanners({
      type: 'HERO',
      active: true,
    });
    
    console.log('✅ Hook funcionou!');
    console.log('📊 Banners retornados:', banners?.length || 0);
    
    if (banners && banners.length > 0) {
      console.log('\n📋 Banners encontrados:');
      banners.forEach((banner, index) => {
        console.log(`   ${index + 1}. "${banner.title}"`);
        console.log(`      - ID: ${banner.id}`);
        console.log(`      - Tipo: ${banner.type}`);
        console.log(`      - Ativo: ${banner.active}`);
        console.log(`      - Imagem: ${banner.imageUrl || 'Não definida'}`);
        console.log(`      - Cor de fundo: ${banner.bgColor || 'Não definida'}`);
      });
      
      console.log('\n✅ RESULTADO: O hook está funcionando corretamente!');
      console.log('   O componente HeroCarousel deveria receber estes banners.');
      
    } else {
      console.log('\n⚠️  PROBLEMA: Hook retornou array vazio ou null');
      console.log('   O componente HeroCarousel usará o banner de fallback.');
    }
    
  } catch (error) {
    console.log('\n❌ ERRO no hook:', error.message);
    console.log('   O componente HeroCarousel entrará no catch e usará o banner de fallback.');
  }
  
  // 2. Testar se o problema pode estar na URL da API
  console.log('\n2. Verificando variável de ambiente API_URL...');
  console.log('📋 API_URL configurada:', API_URL);
  
  // Testar se a URL está acessível
  try {
    const healthResponse = await fetch(`${API_URL}/health`);
    if (healthResponse.ok) {
      console.log('✅ API_URL está acessível');
    } else {
      console.log('❌ API_URL não está respondendo:', healthResponse.status);
    }
  } catch (error) {
    console.log('❌ API_URL não está acessível:', error.message);
  }
  
  // 3. Testar diferentes cenários
  console.log('\n3. Testando cenários de erro...');
  
  // Testar endpoint inexistente
  try {
    await apiCall('/endpoint-inexistente');
  } catch (error) {
    console.log('✅ Erro tratado corretamente para endpoint inexistente:', error.message);
  }
  
  // Testar sem parâmetros
  try {
    const allBanners = await getBanners();
    console.log(`✅ Sem parâmetros: ${allBanners?.length || 0} banners`);
  } catch (error) {
    console.log('❌ Erro sem parâmetros:', error.message);
  }
  
  console.log('\n💡 CONCLUSÃO:');
  console.log('Se o hook está funcionando mas o carrossel não mostra os banners:');
  console.log('1. Problema pode estar no componente HeroCarousel');
  console.log('2. Problema pode estar no estado do React');
  console.log('3. Problema pode estar na renderização');
  console.log('4. Verifique o console do navegador para erros JavaScript');
}

testUseBannersHook();