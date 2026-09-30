const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function fixImageUpload() {
  console.log('🖼️ Corrigindo sistema de upload de imagens...\n');

  // 1. Verificar se o backend está rodando
  try {
    await axios.get('http://localhost:8081/health');
    console.log('✅ Backend está funcionando');
  } catch (error) {
    console.log('❌ Backend não está rodando. Execute: node start-system-manual.js');
    return;
  }

  // 2. Fazer login
  console.log('\n🔐 Fazendo login...');
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

  // 3. Verificar pasta de uploads
  const uploadsDir = path.join(__dirname, 'backend-nestjs', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Pasta uploads criada');
  } else {
    console.log('✅ Pasta uploads existe');
  }

  // 4. Criar imagem de teste
  console.log('\n🎨 Criando imagem de teste...');
  const testImagePath = 'test-banner.png';
  
  // Criar uma imagem simples em base64 (1x1 pixel PNG)
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
  const imageBuffer = Buffer.from(pngBase64, 'base64');
  fs.writeFileSync(testImagePath, imageBuffer);
  console.log('✅ Imagem de teste criada');

  // 5. Testar upload
  console.log('\n📤 Testando upload...');
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
      },
      maxContentLength: 50 * 1024 * 1024, // 50MB
      maxBodyLength: 50 * 1024 * 1024
    });

    console.log('✅ Upload funcionando!');
    console.log('📋 Resposta:', uploadResponse.data);

    // 6. Testar criação de banner
    console.log('\n🎨 Testando criação de banner...');
    const bannerData = {
      title: 'Banner de Teste',
      subtitle: 'Teste de upload',
      description: 'Banner criado automaticamente para teste',
      buttonText: 'Ver Mais',
      buttonLink: '/produtos',
      imageUrl: uploadResponse.data.url,
      type: 'PROMOTIONAL',
      position: 1,
      active: true
    };

    const bannerResponse = await axios.post('http://localhost:8081/banners', bannerData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Banner criado com sucesso!');
    console.log('📋 Banner ID:', bannerResponse.data.id);

  } catch (error) {
    console.log('❌ Erro no upload:', error.response?.status, error.response?.data || error.message);
    
    if (error.response?.status === 413) {
      console.log('\n💡 Erro 413 - Payload muito grande');
      console.log('🔧 Aplicando correção...');
      
      // Aplicar correção no main.ts
      await applyPayloadFix();
    }
  }

  // 7. Limpar arquivo de teste
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
    console.log('✅ Arquivo de teste removido');
  }

  console.log('\n🎯 Teste de upload concluído!');
}

async function applyPayloadFix() {
  console.log('🔧 Aplicando correção de payload...');
  
  const mainTsPath = path.join(__dirname, 'backend-nestjs', 'src', 'main.ts');
  let content = fs.readFileSync(mainTsPath, 'utf8');
  
  // Verificar se já tem a correção
  if (content.includes('express.json({ limit:')) {
    console.log('✅ Correção já aplicada');
    return;
  }
  
  // Aplicar correção
  const correctedContent = content.replace(
    'async function bootstrap() {\n  const app = await NestFactory.create(AppModule);',
    `async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração de limites de payload
  app.use(require('express').json({ limit: '50mb' }));
  app.use(require('express').urlencoded({ limit: '50mb', extended: true }));`
  );
  
  fs.writeFileSync(mainTsPath, correctedContent);
  console.log('✅ Correção aplicada ao main.ts');
  console.log('⚠️ Reinicie o backend para aplicar as mudanças');
}

fixImageUpload();