const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testBannerUpload() {
  console.log('🎨 Testando upload de banner...\n');

  const baseURL = 'http://localhost:8081';

  // Fazer login primeiro
  console.log('🔐 Fazendo login...');
  let token = null;
  try {
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@loja.com',
      password: 'admin123'
    });
    token = loginResponse.data.access_token;
    console.log('✅ Login realizado com sucesso!');
  } catch (error) {
    console.log('❌ Erro no login:', error.message);
    return;
  }

  // Criar uma imagem de teste simples (1x1 pixel PNG)
  const testImageBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
    0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);

  // Salvar imagem temporária
  fs.writeFileSync('test-banner.png', testImageBuffer);

  console.log('\n📤 Testando upload de imagem...');
  let imageUrl = null;
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream('test-banner.png'), {
      filename: 'test-banner.png',
      contentType: 'image/png'
    });

    const uploadResponse = await axios.post(`${baseURL}/upload/image`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      },
      timeout: 30000
    });

    console.log('✅ Upload realizado com sucesso!');
    console.log('📋 Dados do upload:', uploadResponse.data);
    imageUrl = uploadResponse.data.url;

  } catch (error) {
    console.log(`❌ Erro no upload: ${error.response?.status || 'NETWORK'} - ${error.response?.data?.message || error.message}`);
    
    // Limpar arquivo temporário
    try { fs.unlinkSync('test-banner.png'); } catch (e) {}
    return;
  }

  console.log('\n🎨 Criando banner com imagem...');
  try {
    const bannerData = {
      title: 'Banner de Teste',
      subtitle: 'Testando upload de imagem',
      description: 'Este é um banner criado para testar o sistema de upload',
      buttonText: 'Ver Produtos',
      buttonLink: '/produtos',
      imageUrl: imageUrl,
      type: 'HERO',
      active: true,
      position: 1
    };

    const bannerResponse = await axios.post(`${baseURL}/banners`, bannerData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Banner criado com sucesso!');
    console.log('📋 Dados do banner:', {
      id: bannerResponse.data.id,
      title: bannerResponse.data.title,
      imageUrl: bannerResponse.data.imageUrl
    });

    // Testar se a imagem está acessível
    console.log('\n🔍 Testando acesso à imagem...');
    try {
      const imageResponse = await axios.get(imageUrl, { timeout: 5000 });
      console.log(`✅ Imagem acessível! Status: ${imageResponse.status}`);
    } catch (error) {
      console.log(`❌ Erro ao acessar imagem: ${error.response?.status || 'NETWORK'}`);
    }

  } catch (error) {
    console.log(`❌ Erro ao criar banner: ${error.response?.status || 'NETWORK'} - ${error.response?.data?.message || error.message}`);
  }

  // Limpar arquivo temporário
  try {
    fs.unlinkSync('test-banner.png');
  } catch (e) {}

  console.log('\n🎯 Teste de banner concluído!');
}

testBannerUpload();