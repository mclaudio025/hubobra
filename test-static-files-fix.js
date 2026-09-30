const axios = require('axios');

async function testStaticFilesFix() {
  console.log('🔧 Testando correção de arquivos estáticos...\n');

  const baseURL = 'http://localhost:8081';

  // Aguardar backend estar pronto
  console.log('⏳ Aguardando backend estar pronto...');
  let backendReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      await axios.get(`${baseURL}/health`, { timeout: 2000 });
      backendReady = true;
      console.log('✅ Backend está funcionando!');
      break;
    } catch (error) {
      console.log(`⏳ Tentativa ${i + 1}/30 - aguardando...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  if (!backendReady) {
    console.log('❌ Backend não iniciou a tempo');
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

  // Testar imagens específicas dos banners
  console.log('\n🖼️ Testando imagens específicas dos banners...');
  const testImages = [
    'ea1efb73-04aa-4ee6-a7ac-4643d74eee45.png',
    'f4e721e6-8d8c-43fe-8525-55a548790fb6.png',
    '01b6296c-f0be-44ab-a139-6e1bdeab1b47.png',
    '5e71ac8a-350b-4816-815b-5d433b62ff5a.png'
  ];

  let workingImages = 0;
  for (const image of testImages) {
    try {
      const response = await axios.get(`${baseURL}/uploads/original/${image}`, {
        timeout: 5000,
        responseType: 'arraybuffer'
      });
      
      const contentType = response.headers['content-type'];
      const size = response.data.length;
      
      console.log(`✅ ${image}: ${contentType}, ${size} bytes`);
      workingImages++;
      
    } catch (error) {
      console.log(`❌ ${image}: não acessível (${error.response?.status || error.code})`);
    }
  }

  // Testar banners da API
  console.log('\n🎨 Testando banners HERO da API...');
  try {
    const bannersResponse = await axios.get(`${baseURL}/banners?type=HERO&active=true`);
    const banners = bannersResponse.data;
    
    console.log(`📊 Encontrados ${banners.length} banners HERO ativos`);
    
    let bannersWithWorkingImages = 0;
    for (const banner of banners) {
      if (banner.imageUrl) {
        try {
          await axios.get(banner.imageUrl, { timeout: 3000, responseType: 'arraybuffer' });
          console.log(`✅ Banner "${banner.title}": imagem acessível`);
          bannersWithWorkingImages++;
        } catch (error) {
          console.log(`❌ Banner "${banner.title}": imagem não acessível`);
        }
      } else {
        console.log(`⚠️ Banner "${banner.title}": sem imagem configurada`);
      }
    }
    
    console.log(`\n📈 Resumo: ${bannersWithWorkingImages}/${banners.length} banners com imagens funcionando`);
    
  } catch (error) {
    console.log('❌ Erro ao buscar banners:', error.response?.status);
  }

  // Resultado final
  console.log('\n🎯 RESULTADO:');
  console.log('=' .repeat(40));
  if (workingImages > 0) {
    console.log('✅ CORREÇÃO APLICADA COM SUCESSO!');
    console.log(`📸 ${workingImages}/${testImages.length} imagens de teste acessíveis`);
    console.log('💡 As imagens agora devem aparecer no carrossel!');
  } else {
    console.log('❌ CORREÇÃO NÃO FUNCIONOU');
    console.log('💡 Pode ser necessário reiniciar o backend novamente');
  }
}

testStaticFilesFix();