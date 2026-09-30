const axios = require('axios');

async function testCarouselImages() {
  console.log('🎠 Testando imagens do carrossel...');
  console.log('=' .repeat(50));

  const baseURL = 'http://localhost:8081';

  try {
    // 1. Buscar banners HERO (que aparecem no carrossel)
    console.log('\n1️⃣ Buscando banners HERO...');
    const bannersResponse = await axios.get(`${baseURL}/banners?type=HERO&active=true`);
    const heroBanners = bannersResponse.data;
    
    console.log(`✅ Encontrados ${heroBanners.length} banners HERO ativos`);
    
    if (heroBanners.length === 0) {
      console.log('⚠️ Nenhum banner HERO encontrado!');
      console.log('💡 O carrossel pode estar vazio por isso.');
      return;
    }

    // 2. Verificar cada banner HERO
    for (let i = 0; i < heroBanners.length; i++) {
      const banner = heroBanners[i];
      console.log(`\n🎨 Banner ${i + 1}: "${banner.title}"`);
      console.log(`   ID: ${banner.id}`);
      console.log(`   Tipo: ${banner.type}`);
      console.log(`   Ativo: ${banner.active ? 'SIM' : 'NÃO'}`);
      console.log(`   Posição: ${banner.position || 'Não definida'}`);
      
      if (banner.imageUrl) {
        console.log(`   URL da imagem: ${banner.imageUrl}`);
        
        // Testar se a imagem está acessível
        try {
          const imageResponse = await axios.get(banner.imageUrl, {
            timeout: 5000,
            responseType: 'arraybuffer'
          });
          
          const contentType = imageResponse.headers['content-type'];
          const size = imageResponse.data.length;
          
          console.log(`   ✅ Imagem acessível: ${contentType}, ${(size / 1024).toFixed(1)} KB`);
          
        } catch (imageError) {
          console.log(`   ❌ Imagem NÃO acessível: ${imageError.response?.status || imageError.code}`);
          console.log(`   🔍 Erro: ${imageError.message}`);
          
          // Se a imagem não está acessível, isso explica por que não aparece no carrossel
          if (imageError.response?.status === 404) {
            console.log('   💡 Arquivo de imagem não encontrado no servidor');
          } else if (imageError.code === 'ECONNREFUSED') {
            console.log('   💡 Servidor de imagens não está respondendo');
          }
        }
      } else {
        console.log(`   ⚠️ Banner sem imagem configurada`);
        console.log(`   🎨 Cor de fundo: ${banner.bgColor || 'Não definida'}`);
      }
    }

    // 3. Testar endpoint específico do frontend
    console.log('\n3️⃣ Testando endpoint usado pelo frontend...');
    try {
      const frontendResponse = await axios.get(`${baseURL}/banners`, {
        params: {
          type: 'HERO',
          active: true
        }
      });
      
      console.log(`✅ Endpoint do frontend retornou ${frontendResponse.data.length} banners`);
      
      // Verificar se os dados estão corretos
      frontendResponse.data.forEach((banner, index) => {
        console.log(`   Banner ${index + 1}: ${banner.title} - ${banner.imageUrl ? 'COM IMAGEM' : 'SEM IMAGEM'}`);
      });
      
    } catch (error) {
      console.log(`❌ Erro no endpoint do frontend: ${error.response?.status || error.code}`);
    }

    // 4. Verificar se o diretório de uploads existe
    console.log('\n4️⃣ Verificando diretório de uploads...');
    try {
      const uploadsResponse = await axios.get(`${baseURL}/uploads/`);
      console.log('✅ Diretório de uploads acessível');
    } catch (error) {
      console.log(`❌ Diretório de uploads não acessível: ${error.response?.status || error.code}`);
      if (error.response?.status === 404) {
        console.log('💡 O servidor pode não estar servindo arquivos estáticos corretamente');
      }
    }

    // 5. Resumo e diagnóstico
    console.log('\n📊 RESUMO:');
    console.log('=' .repeat(30));
    
    const bannersWithImages = heroBanners.filter(b => b.imageUrl).length;
    const bannersWithoutImages = heroBanners.length - bannersWithImages;
    
    console.log(`📈 Total de banners HERO: ${heroBanners.length}`);
    console.log(`🖼️ Com imagens: ${bannersWithImages}`);
    console.log(`🎨 Sem imagens: ${bannersWithoutImages}`);
    
    if (bannersWithImages === 0) {
      console.log('\n🎯 DIAGNÓSTICO:');
      console.log('❌ Nenhum banner tem imagem configurada!');
      console.log('💡 Soluções:');
      console.log('   1. Adicione imagens aos banners existentes');
      console.log('   2. Crie novos banners com imagens');
      console.log('   3. Verifique se o upload de imagens está funcionando');
    } else {
      console.log('\n🎯 DIAGNÓSTICO:');
      console.log('✅ Banners com imagens encontrados');
      console.log('💡 Se as imagens não aparecem no carrossel:');
      console.log('   1. Verifique se as URLs das imagens estão corretas');
      console.log('   2. Confirme se o servidor está servindo arquivos estáticos');
      console.log('   3. Verifique o console do navegador para erros de CORS');
      console.log('   4. Reinicie o frontend para recarregar os dados');
    }

  } catch (error) {
    console.log('❌ Erro geral:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend não está rodando na porta 8081');
    }
  }

  console.log('\n🎯 Teste do carrossel concluído!');
}

testCarouselImages();