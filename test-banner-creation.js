const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testBannerCreation() {
  console.log('🎨 Testando criação de banners com imagens...\n');

  // 1. Fazer login
  console.log('🔐 Fazendo login...');
  let token = null;
  try {
    const loginResponse = await axios.post('http://localhost:8081/auth/login', {
      email: 'admin@loja.com',
      password: 'admin123'
    });
    token = loginResponse.data.access_token;
    console.log('✅ Login realizado com sucesso');
  } catch (error) {
    console.log('❌ Erro no login:', error.message);
    return;
  }

  // 2. Criar imagem de teste
  console.log('\n🎨 Criando imagem de teste...');
  const testImagePath = 'test-banner.png';
  
  // Criar uma imagem simples em base64 (1x1 pixel PNG)
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
  const imageBuffer = Buffer.from(pngBase64, 'base64');
  fs.writeFileSync(testImagePath, imageBuffer);
  console.log('✅ Imagem de teste criada');

  // 3. Fazer upload da imagem
  console.log('\n📤 Fazendo upload da imagem...');
  let imageUrl = null;
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-banner.png',
      contentType: 'image/png'
    });

    const uploadResponse = await axios.post('http://localhost:8081/upload/image', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    imageUrl = uploadResponse.data.url;
    console.log('✅ Upload realizado com sucesso');
    console.log('📋 URL da imagem:', imageUrl);

  } catch (error) {
    console.log('❌ Erro no upload:', error.response?.data || error.message);
    return;
  }

  // 4. Criar banner com dados corretos
  console.log('\n🎨 Criando banner...');
  try {
    const timestamp = new Date().getTime();
    const bannerData = {
      title: `Banner de Teste ${timestamp}`,
      subtitle: 'Teste de funcionalidade',
      description: 'Banner criado automaticamente para teste',
      buttonText: 'Ver Mais',
      buttonLink: '/',
      imageUrl: imageUrl,
      bgColor: 'from-orange-600 to-orange-700',
      textColor: 'text-white',
      type: 'PROMOTIONAL',
      position: 1,
      active: true
    };

    console.log('📋 Dados do banner:', JSON.stringify(bannerData, null, 2));

    const bannerResponse = await axios.post('http://localhost:8081/banners', bannerData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Banner criado com sucesso!');
    console.log('📋 Banner ID:', bannerResponse.data.id);
    console.log('📋 Banner URL:', bannerResponse.data.imageUrl);

    // 5. Verificar se o banner aparece na listagem
    console.log('\n📋 Verificando listagem de banners...');
    const bannersResponse = await axios.get('http://localhost:8081/banners');
    const banners = bannersResponse.data;
    
    console.log(`✅ Total de banners: ${banners.length}`);
    banners.forEach((banner, index) => {
      console.log(`📌 Banner ${index + 1}: ${banner.title} - ${banner.imageUrl ? 'COM IMAGEM' : 'SEM IMAGEM'}`);
    });

  } catch (error) {
    console.log('❌ Erro na criação do banner:', error.response?.status, error.response?.data || error.message);
    
    if (error.response?.data) {
      console.log('📋 Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Tentar novamente com dados mais simples
    console.log('\n🔄 Tentando novamente com dados simplificados...');
    try {
      const simpleBannerData = {
        title: `Banner Simples ${timestamp}`,
        type: 'PROMOTIONAL',
        imageUrl: imageUrl,
        active: true
      };

      const retryResponse = await axios.post('http://localhost:8081/banners', simpleBannerData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Banner simples criado com sucesso!');
      console.log('📋 Banner ID:', retryResponse.data.id);

    } catch (retryError) {
      console.log('❌ Erro na segunda tentativa:', retryError.response?.status, retryError.response?.data || retryError.message);
    }
  }

  // 6. Limpar arquivo de teste
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
    console.log('\n✅ Arquivo de teste removido');
  }

  console.log('\n🎯 Teste de criação de banner concluído!');
  console.log('\n💡 Dicas:');
  console.log('- Acesse http://localhost:3000 para ver os banners');
  console.log('- Acesse http://localhost:3000/admin/banners para gerenciar');
}

testBannerCreation();