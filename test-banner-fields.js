const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testBannerFields() {
  console.log('🔍 Testando campos específicos do banner...\n');

  // Fazer login
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

  // Criar e fazer upload de imagem
  console.log('\n🎨 Criando e fazendo upload da imagem...');
  const testImagePath = 'test-banner.png';
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
  const imageBuffer = Buffer.from(pngBase64, 'base64');
  fs.writeFileSync(testImagePath, imageBuffer);

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
  } catch (error) {
    console.log('❌ Erro no upload:', error.message);
    return;
  }

  // Função para testar criação de banner
  async function testBannerCreation(testName, bannerData) {
    console.log(`\n🧪 ${testName}:`);
    try {
      const response = await axios.post('http://localhost:8081/banners', bannerData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Sucesso!');
      
      // Limpar banner criado
      await axios.delete(`http://localhost:8081/banners/${response.data.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return true;
    } catch (error) {
      console.log(`❌ Erro: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  // Teste base
  const baseData = {
    title: 'Banner Teste',
    type: 'PROMOTIONAL',
    imageUrl: imageUrl,
    active: true
  };

  await testBannerCreation('Banner base', baseData);

  // Teste adicionando subtitle
  await testBannerCreation('Banner + subtitle', {
    ...baseData,
    subtitle: 'Teste de funcionalidade'
  });

  // Teste adicionando description
  await testBannerCreation('Banner + description', {
    ...baseData,
    subtitle: 'Teste de funcionalidade',
    description: 'Banner criado automaticamente para teste'
  });

  // Teste adicionando buttonText
  await testBannerCreation('Banner + buttonText', {
    ...baseData,
    subtitle: 'Teste de funcionalidade',
    description: 'Banner criado automaticamente para teste',
    buttonText: 'Ver Mais'
  });

  // Teste adicionando buttonLink
  await testBannerCreation('Banner + buttonLink', {
    ...baseData,
    subtitle: 'Teste de funcionalidade',
    description: 'Banner criado automaticamente para teste',
    buttonText: 'Ver Mais',
    buttonLink: '/'
  });

  // Teste adicionando bgColor
  await testBannerCreation('Banner + bgColor', {
    ...baseData,
    subtitle: 'Teste de funcionalidade',
    description: 'Banner criado automaticamente para teste',
    buttonText: 'Ver Mais',
    buttonLink: '/',
    bgColor: 'from-orange-600 to-orange-700'
  });

  // Teste adicionando textColor
  await testBannerCreation('Banner + textColor', {
    ...baseData,
    subtitle: 'Teste de funcionalidade',
    description: 'Banner criado automaticamente para teste',
    buttonText: 'Ver Mais',
    buttonLink: '/',
    bgColor: 'from-orange-600 to-orange-700',
    textColor: 'text-white'
  });

  // Teste adicionando position
  await testBannerCreation('Banner + position', {
    ...baseData,
    subtitle: 'Teste de funcionalidade',
    description: 'Banner criado automaticamente para teste',
    buttonText: 'Ver Mais',
    buttonLink: '/',
    bgColor: 'from-orange-600 to-orange-700',
    textColor: 'text-white',
    position: 1
  });

  // Teste com title duplicado
  await testBannerCreation('Banner com título duplicado', {
    title: 'Materiais', // Título que já existe
    type: 'PROMOTIONAL',
    imageUrl: imageUrl,
    active: true
  });

  // Limpar arquivo de teste
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
    console.log('\n✅ Arquivo de teste removido');
  }

  console.log('\n🎯 Teste de campos concluído!');
}

testBannerFields();