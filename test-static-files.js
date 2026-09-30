const axios = require('axios');

async function testStaticFiles() {
  console.log('📁 Testando servir arquivos estáticos...\n');

  const baseURL = 'http://localhost:8081';

  // Testar se o backend está rodando
  try {
    await axios.get(`${baseURL}/health`);
    console.log('✅ Backend está funcionando');
  } catch (error) {
    console.log('❌ Backend não está rodando');
    return;
  }

  // Testar acesso ao diretório uploads
  console.log('\n📂 Testando acesso ao diretório uploads...');
  try {
    const response = await axios.get(`${baseURL}/uploads/`);
    console.log('✅ Diretório uploads acessível');
  } catch (error) {
    console.log('❌ Diretório uploads não acessível:', error.response?.status);
  }

  // Testar acesso a uma imagem específica
  console.log('\n🖼️ Testando acesso a imagens específicas...');
  const testImages = [
    'ea1efb73-04aa-4ee6-a7ac-4643d74eee45.png',
    'f4e721e6-8d8c-43fe-8525-55a548790fb6.png',
    '01b6296c-f0be-44ab-a139-6e1bdeab1b47.png'
  ];

  for (const image of testImages) {
    try {
      const response = await axios.get(`${baseURL}/uploads/original/${image}`, {
        timeout: 5000,
        responseType: 'arraybuffer'
      });
      
      const contentType = response.headers['content-type'];
      const size = response.data.length;
      
      console.log(`✅ ${image}: ${contentType}, ${size} bytes`);
      
    } catch (error) {
      console.log(`❌ ${image}: não acessível (${error.response?.status || error.code})`);
    }
  }

  // Testar banners com imagens
  console.log('\n🎨 Testando banners com imagens...');
  try {
    const bannersResponse = await axios.get(`${baseURL}/banners`);
    const banners = bannersResponse.data;
    
    let bannersWithImages = 0;
    let workingImages = 0;
    
    for (const banner of banners) {
      if (banner.imageUrl) {
        bannersWithImages++;
        try {
          await axios.get(banner.imageUrl, { timeout: 3000, responseType: 'arraybuffer' });
          workingImages++;
          console.log(`✅ Banner "${banner.title}": imagem acessível`);
        } catch (error) {
          console.log(`❌ Banner "${banner.title}": imagem não acessível`);
        }
      }
    }
    
    console.log(`\n📊 Resumo: ${workingImages}/${bannersWithImages} imagens funcionando`);
    
  } catch (error) {
    console.log('❌ Erro ao buscar banners:', error.response?.status);
  }

  console.log('\n🎯 Teste de arquivos estáticos concluído!');
  console.log('\n💡 Se as imagens não estão acessíveis, reinicie o backend para aplicar as configurações.');
}

testStaticFiles();