const axios = require('axios');

async function testBannerImages() {
  console.log('🖼️ Testando imagens dos banners...\n');

  try {
    // 1. Buscar todos os banners
    console.log('📋 Buscando banners...');
    const bannersResponse = await axios.get('http://localhost:8081/banners');
    const banners = bannersResponse.data;
    
    console.log(`✅ Encontrados ${banners.length} banners`);
    
    // 2. Verificar cada banner
    for (let i = 0; i < banners.length; i++) {
      const banner = banners[i];
      console.log(`\n🎨 Banner ${i + 1}: "${banner.title}"`);
      console.log(`   Tipo: ${banner.type}`);
      console.log(`   Ativo: ${banner.active ? 'SIM' : 'NÃO'}`);
      
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
          
          console.log(`   ✅ Imagem acessível: ${contentType}, ${size} bytes`);
          
        } catch (imageError) {
          console.log(`   ❌ Imagem não acessível: ${imageError.response?.status || imageError.code}`);
        }
      } else {
        console.log(`   ⚠️ Sem imagem configurada`);
      }
    }

    // 3. Verificar se o diretório de uploads existe
    console.log('\n📁 Verificando diretório de uploads...');
    try {
      const uploadsResponse = await axios.get('http://localhost:8081/uploads/');
      console.log('✅ Diretório de uploads acessível');
    } catch (error) {
      console.log('❌ Diretório de uploads não acessível:', error.response?.status);
    }

    // 4. Testar uma URL de imagem específica
    console.log('\n🔍 Testando URLs de imagem...');
    const testUrls = [
      'http://localhost:8081/uploads/original/',
      'http://localhost:8081/uploads/thumbnail/',
      'http://localhost:8081/uploads/medium/'
    ];

    for (const url of testUrls) {
      try {
        const response = await axios.get(url);
        console.log(`✅ ${url} - acessível`);
      } catch (error) {
        console.log(`❌ ${url} - não acessível (${error.response?.status})`);
      }
    }

    // 5. Verificar configuração do frontend
    console.log('\n🌐 Verificando se o frontend consegue acessar as imagens...');
    try {
      const frontendResponse = await axios.get('http://localhost:3000/api/banners');
      console.log('✅ Frontend consegue acessar API de banners');
    } catch (error) {
      console.log('❌ Frontend não consegue acessar API de banners:', error.response?.status);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }

  console.log('\n🎯 Teste de imagens dos banners concluído!');
}

testBannerImages();