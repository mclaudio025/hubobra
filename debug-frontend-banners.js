// Script para debugar especificamente a requisição de banners como o frontend faz

async function debugFrontendBanners() {
  console.log('🔍 Debugando requisição de banners do frontend...');
  console.log('=' .repeat(60));
  
  const backendUrl = 'http://localhost:8081';
  const frontendUrl = 'http://localhost:3001';
  
  try {
    // 1. Verificar se o backend está rodando
    console.log('1. Verificando backend...');
    try {
      const healthResponse = await fetch(`${backendUrl}/health`);
      if (healthResponse.ok) {
        console.log('✅ Backend está rodando');
      } else {
        console.log('❌ Backend não está respondendo');
        return;
      }
    } catch (error) {
      console.log('❌ Backend não está acessível:', error.message);
      return;
    }
    
    // 2. Simular exatamente a requisição que o frontend faz
    console.log('\n2. Simulando requisição do HeroCarousel...');
    const params = new URLSearchParams();
    params.append('type', 'HERO');
    params.append('active', 'true');
    
    const requestUrl = `${backendUrl}/banners?${params.toString()}`;
    console.log('📋 URL da requisição:', requestUrl);
    
    try {
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Origin': frontendUrl
        }
      });
      
      console.log('📊 Status da resposta:', response.status);
      console.log('📊 Headers da resposta:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const banners = await response.json();
        console.log(`✅ Banners recebidos: ${banners.length}`);
        
        if (banners.length === 0) {
          console.log('⚠️  PROBLEMA: Nenhum banner HERO ativo encontrado!');
          console.log('   O carrossel usará o fallback estático.');
        } else {
          console.log('\n📋 Banners encontrados:');
          banners.forEach((banner, index) => {
            console.log(`   ${index + 1}. "${banner.title}"`);
            console.log(`      - ID: ${banner.id}`);
            console.log(`      - Tipo: ${banner.type}`);
            console.log(`      - Ativo: ${banner.active}`);
            console.log(`      - Posição: ${banner.position}`);
            console.log(`      - Imagem: ${banner.imageUrl || 'Não definida'}`);
            console.log(`      - Cor de fundo: ${banner.bgColor || 'Não definida'}`);
            console.log(`      - Cor do texto: ${banner.textColor || 'Não definida'}`);
          });
        }
        
        // 3. Testar acessibilidade das imagens
        console.log('\n3. Testando acessibilidade das imagens...');
        for (const banner of banners) {
          if (banner.imageUrl) {
            try {
              const imageResponse = await fetch(banner.imageUrl, {
                method: 'HEAD' // Apenas verificar se existe
              });
              
              if (imageResponse.ok) {
                console.log(`   ✅ "${banner.title}": Imagem acessível`);
              } else {
                console.log(`   ❌ "${banner.title}": Imagem não acessível (${imageResponse.status})`);
              }
            } catch (error) {
              console.log(`   ❌ "${banner.title}": Erro ao acessar imagem - ${error.message}`);
            }
          } else {
            console.log(`   ⚠️  "${banner.title}": Sem imagem configurada`);
          }
        }
        
      } else {
        console.log('❌ Erro na requisição:', response.status, response.statusText);
        const errorText = await response.text();
        console.log('📋 Resposta de erro:', errorText);
      }
      
    } catch (error) {
      console.log('❌ Erro na requisição:', error.message);
    }
    
    // 4. Verificar se o frontend está rodando
    console.log('\n4. Verificando frontend...');
    try {
      const frontendResponse = await fetch(frontendUrl, {
        method: 'HEAD'
      });
      
      if (frontendResponse.ok) {
        console.log('✅ Frontend está rodando');
      } else {
        console.log('❌ Frontend não está respondendo');
      }
    } catch (error) {
      console.log('❌ Frontend não está acessível:', error.message);
    }
    
    // 5. Verificar se há banners no banco de dados
    console.log('\n5. Verificando todos os banners no banco...');
    try {
      const allBannersResponse = await fetch(`${backendUrl}/banners`);
      if (allBannersResponse.ok) {
        const allBanners = await allBannersResponse.json();
        console.log(`📊 Total de banners no banco: ${allBanners.length}`);
        
        const heroBanners = allBanners.filter(b => b.type === 'HERO');
        const activeHeroBanners = heroBanners.filter(b => b.active);
        
        console.log(`📊 Banners HERO: ${heroBanners.length}`);
        console.log(`📊 Banners HERO ativos: ${activeHeroBanners.length}`);
        
        if (heroBanners.length === 0) {
          console.log('\n🚨 PROBLEMA IDENTIFICADO:');
          console.log('   - Não há banners do tipo HERO no banco de dados');
          console.log('   - O carrossel usará apenas o banner de fallback');
          console.log('\n🔧 SOLUÇÕES:');
          console.log('   1. Execute: node "backend-nestjs/create-banners.js"');
          console.log('   2. Ou crie banners HERO manualmente no admin');
        } else if (activeHeroBanners.length === 0) {
          console.log('\n🚨 PROBLEMA IDENTIFICADO:');
          console.log('   - Há banners HERO, mas nenhum está ativo');
          console.log('   - O carrossel usará apenas o banner de fallback');
          console.log('\n🔧 SOLUÇÃO:');
          console.log('   - Ative os banners HERO no painel admin');
        }
      }
    } catch (error) {
      console.log('❌ Erro ao verificar banners:', error.message);
    }
    
    console.log('\n💡 RESUMO DO DEBUG:');
    console.log('1. Se o carrossel mostra apenas 1 slide = está usando fallback');
    console.log('2. Se não há banners HERO ativos = precisa criar/ativar banners');
    console.log('3. Se há banners mas imagens não carregam = problema nas URLs das imagens');
    console.log('4. Verifique o console do navegador (F12) para erros JavaScript');
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

debugFrontendBanners();