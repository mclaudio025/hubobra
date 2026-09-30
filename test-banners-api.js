// Usando fetch nativo do Node.js 18+

async function testBannersAPI() {
  console.log('🔍 Testando API de Banners...');
  console.log('=' .repeat(50));
  
  const backendUrl = 'http://localhost:8081';
  const frontendUrl = 'http://localhost:3001';
  
  try {
    // 1. Testar se o backend está rodando
    console.log('1. Verificando status do backend...');
    try {
      const backendResponse = await fetch(`${backendUrl}/health`);
      if (backendResponse.ok) {
        console.log('✅ Backend está rodando');
      } else {
        console.log('❌ Backend não está respondendo corretamente');
        return;
      }
    } catch (error) {
      console.log('❌ Backend não está acessível:', error.message);
      return;
    }
    
    // 2. Testar endpoint de banners
    console.log('\n2. Testando endpoint /banners...');
    try {
      const bannersResponse = await fetch(`${backendUrl}/banners`);
      if (bannersResponse.ok) {
        const banners = await bannersResponse.json();
        console.log(`✅ Endpoint /banners funcionando - ${banners.length} banners encontrados`);
        
        banners.forEach((banner, index) => {
          console.log(`   Banner ${index + 1}:`);
          console.log(`     - ID: ${banner.id}`);
          console.log(`     - Título: ${banner.title}`);
          console.log(`     - Tipo: ${banner.type}`);
          console.log(`     - Ativo: ${banner.active}`);
          console.log(`     - Imagem: ${banner.imageUrl || 'Não definida'}`);
        });
      } else {
        console.log('❌ Endpoint /banners falhou:', bannersResponse.status);
      }
    } catch (error) {
      console.log('❌ Erro ao acessar /banners:', error.message);
    }
    
    // 3. Testar endpoint específico para banners HERO ativos
    console.log('\n3. Testando banners HERO ativos...');
    try {
      const heroResponse = await fetch(`${backendUrl}/banners?type=HERO&active=true`);
      if (heroResponse.ok) {
        const heroBanners = await heroResponse.json();
        console.log(`✅ Banners HERO ativos: ${heroBanners.length}`);
        
        if (heroBanners.length === 0) {
          console.log('⚠️  PROBLEMA: Nenhum banner HERO ativo encontrado!');
          console.log('   Isso explica por que o carrossel não mostra imagens.');
        } else {
          heroBanners.forEach((banner, index) => {
            console.log(`   Banner HERO ${index + 1}:`);
            console.log(`     - Título: ${banner.title}`);
            console.log(`     - Imagem: ${banner.imageUrl}`);
            console.log(`     - Posição: ${banner.position}`);
          });
        }
      } else {
        console.log('❌ Falha ao buscar banners HERO:', heroResponse.status);
      }
    } catch (error) {
      console.log('❌ Erro ao buscar banners HERO:', error.message);
    }
    
    // 4. Testar se as imagens dos banners estão acessíveis
    console.log('\n4. Testando acessibilidade das imagens...');
    try {
      const allBannersResponse = await fetch(`${backendUrl}/banners?type=HERO&active=true`);
      if (allBannersResponse.ok) {
        const banners = await allBannersResponse.json();
        
        for (const banner of banners) {
          if (banner.imageUrl) {
            try {
              const imageResponse = await fetch(banner.imageUrl);
              if (imageResponse.ok) {
                console.log(`✅ Imagem acessível: ${banner.imageUrl}`);
              } else {
                console.log(`❌ Imagem inacessível: ${banner.imageUrl} (${imageResponse.status})`);
              }
            } catch (error) {
              console.log(`❌ Erro ao acessar imagem: ${banner.imageUrl} - ${error.message}`);
            }
          }
        }
      }
    } catch (error) {
      console.log('❌ Erro ao testar imagens:', error.message);
    }
    
    // 5. Testar se o frontend está rodando
    console.log('\n5. Verificando status do frontend...');
    try {
      const frontendResponse = await fetch(frontendUrl);
      if (frontendResponse.ok) {
        console.log('✅ Frontend está rodando');
      } else {
        console.log('❌ Frontend não está respondendo corretamente');
      }
    } catch (error) {
      console.log('❌ Frontend não está acessível:', error.message);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('📋 DIAGNÓSTICO COMPLETO:');
    console.log('=' .repeat(50));
    
    // Verificar novamente os banners HERO para diagnóstico final
    const finalCheck = await fetch(`${backendUrl}/banners?type=HERO&active=true`);
    if (finalCheck.ok) {
      const finalBanners = await finalCheck.json();
      
      if (finalBanners.length === 0) {
        console.log('🚨 PROBLEMA IDENTIFICADO:');
        console.log('   - Não há banners HERO ativos no banco de dados');
        console.log('   - O carrossel não tem conteúdo para exibir');
        console.log('\n🔧 SOLUÇÃO:');
        console.log('   - Execute: node "backend-nestjs/create-banners.js"');
        console.log('   - Ou crie banners HERO manualmente no admin');
      } else {
        console.log('✅ Banners HERO encontrados e ativos');
        console.log('\n🔍 Se as imagens não aparecem no navegador:');
        console.log('   1. Limpe o cache do navegador (Ctrl+F5)');
        console.log('   2. Tente modo incógnito');
        console.log('   3. Verifique o console do navegador (F12)');
        console.log('   4. Verifique a aba Network para requisições falhando');
      }
    }
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

testBannersAPI();