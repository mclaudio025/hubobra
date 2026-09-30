const axios = require('axios');

async function testCarouselFrontend() {
  console.log('🎠 Testando carrossel no frontend...\n');

  const frontendURL = 'http://localhost:3001';
  const backendURL = 'http://localhost:8081';

  try {
    // 1. Verificar se o frontend está rodando
    console.log('🌐 Verificando frontend...');
    try {
      await axios.get(frontendURL, { timeout: 5000 });
      console.log('✅ Frontend está rodando');
    } catch (error) {
      console.log('❌ Frontend não está acessível');
      return;
    }

    // 2. Verificar se o backend está rodando
    console.log('\n🔧 Verificando backend...');
    try {
      await axios.get(`${backendURL}/health`, { timeout: 5000 });
      console.log('✅ Backend está funcionando');
    } catch (error) {
      console.log('❌ Backend não está acessível');
      return;
    }

    // 3. Buscar banners HERO ativos
    console.log('\n🎨 Buscando banners HERO...');
    const bannersResponse = await axios.get(`${backendURL}/banners?type=HERO&active=true`);
    const banners = bannersResponse.data;
    
    console.log(`📊 Encontrados ${banners.length} banners HERO ativos`);

    // 4. Testar cada imagem de banner
    console.log('\n🖼️ Testando acessibilidade das imagens...');
    let workingImages = 0;
    let totalImages = 0;
    
    for (const banner of banners) {
      console.log(`\n📋 Banner: "${banner.title}"`);
      console.log(`   ID: ${banner.id}`);
      console.log(`   Posição: ${banner.position}`);
      
      if (banner.imageUrl) {
        totalImages++;
        console.log(`   🔗 URL: ${banner.imageUrl}`);
        
        try {
          const imageResponse = await axios.get(banner.imageUrl, {
            timeout: 5000,
            responseType: 'arraybuffer'
          });
          
          const contentType = imageResponse.headers['content-type'];
          const size = imageResponse.data.length;
          
          console.log(`   ✅ Imagem acessível: ${contentType}, ${(size / 1024).toFixed(1)} KB`);
          workingImages++;
          
        } catch (error) {
          console.log(`   ❌ Imagem não acessível: ${error.response?.status || error.code}`);
        }
      } else {
        console.log('   ⚠️ Banner sem imagem configurada');
        if (banner.bgColor) {
          console.log(`   🎨 Cor de fundo: ${banner.bgColor}`);
        }
      }
    }

    // 5. Testar endpoint específico do frontend
    console.log('\n🔄 Testando endpoint do frontend...');
    try {
      const frontendBannersResponse = await axios.get(`${frontendURL}/api/banners?type=HERO&active=true`);
      const frontendBanners = frontendBannersResponse.data;
      console.log(`✅ Frontend retornou ${frontendBanners.length} banners`);
      
      // Comparar com backend
      if (frontendBanners.length === banners.length) {
        console.log('✅ Dados consistentes entre frontend e backend');
      } else {
        console.log('⚠️ Inconsistência entre frontend e backend');
      }
      
    } catch (error) {
      console.log(`❌ Erro no endpoint do frontend: ${error.response?.status || error.code}`);
    }

    // 6. Resultado final
    console.log('\n🎯 RESULTADO FINAL:');
    console.log('=' .repeat(50));
    
    if (totalImages === 0) {
      console.log('⚠️ NENHUMA IMAGEM CONFIGURADA');
      console.log('💡 Adicione imagens aos banners para que apareçam no carrossel');
    } else if (workingImages === totalImages) {
      console.log('✅ TODAS AS IMAGENS ESTÃO FUNCIONANDO!');
      console.log(`📸 ${workingImages}/${totalImages} imagens acessíveis`);
      console.log('🎉 As imagens devem aparecer no carrossel!');
    } else if (workingImages > 0) {
      console.log('⚠️ ALGUMAS IMAGENS FUNCIONANDO');
      console.log(`📸 ${workingImages}/${totalImages} imagens acessíveis`);
      console.log('💡 Algumas imagens podem não aparecer no carrossel');
    } else {
      console.log('❌ NENHUMA IMAGEM FUNCIONANDO');
      console.log('💡 Verifique a configuração do servidor de arquivos estáticos');
    }

    // 7. Instruções para o usuário
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Abra o navegador em http://localhost:3001');
    console.log('2. Verifique se as imagens aparecem no carrossel da página inicial');
    console.log('3. Se não aparecerem, pressione F12 e verifique o console para erros');
    console.log('4. Se necessário, limpe o cache do navegador (Ctrl+Shift+R)');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testCarouselFrontend();