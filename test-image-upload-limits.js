const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testImageUploadLimits() {
  console.log('🖼️ Testando limites de upload de imagens...\n');

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

  // Função para criar imagem de teste
  function createTestImage(sizeKB) {
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
      0x90, 0x77, 0x53, 0xDE, // CRC
      0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
      0xE2, 0x21, 0xBC, 0x33, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);

    // Adicionar dados extras para atingir o tamanho desejado
    const targetSize = sizeKB * 1024;
    const extraData = Buffer.alloc(Math.max(0, targetSize - pngHeader.length), 0);
    
    return Buffer.concat([pngHeader, extraData]);
  }

  // Testes de diferentes tamanhos
  const tests = [
    { name: 'Imagem pequena (1KB)', size: 1 },
    { name: 'Imagem média (100KB)', size: 100 },
    { name: 'Imagem grande (1MB)', size: 1024 },
    { name: 'Imagem muito grande (5MB)', size: 5120 },
    { name: 'Imagem extrema (10MB)', size: 10240 }
  ];

  console.log('\n📊 Testando diferentes tamanhos de imagem:');
  
  for (const test of tests) {
    try {
      console.log(`\n🧪 ${test.name}:`);
      
      // Criar arquivo de teste
      const filename = `test-${test.size}kb.png`;
      const imageBuffer = createTestImage(test.size);
      fs.writeFileSync(filename, imageBuffer);
      
      const form = new FormData();
      form.append('file', fs.createReadStream(filename), {
        filename: filename,
        contentType: 'image/png'
      });

      const startTime = Date.now();
      const response = await axios.post(`${baseURL}/upload/image`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${token}`
        },
        timeout: 60000, // 60 segundos
        maxContentLength: 50 * 1024 * 1024, // 50MB
        maxBodyLength: 50 * 1024 * 1024
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Sucesso - ${response.status} (${duration}ms)`);
      console.log(`📋 URL: ${response.data.url}`);
      console.log(`📏 Tamanho real: ${response.data.size} bytes`);
      
      // Limpar arquivo
      fs.unlinkSync(filename);
      
    } catch (error) {
      // Limpar arquivo mesmo em caso de erro
      try {
        fs.unlinkSync(`test-${test.size}kb.png`);
      } catch (e) {}
      
      if (error.code === 'ECONNABORTED') {
        console.log('⏰ Timeout - Upload muito lento');
      } else if (error.response?.status === 413) {
        console.log('❌ Payload muito grande (413)');
      } else if (error.response?.status === 400) {
        console.log('❌ Bad Request (400):', error.response?.data?.message || 'Erro desconhecido');
      } else if (error.response?.status === 500) {
        console.log('❌ Erro interno do servidor (500)');
      } else {
        console.log(`❌ Erro: ${error.response?.status || 'NETWORK'} - ${error.message}`);
      }
    }
  }

  // Testar tipos de arquivo não suportados
  console.log('\n🚫 Testando tipos de arquivo não suportados:');
  
  const invalidTests = [
    { name: 'Arquivo de texto', ext: 'txt', content: 'Este é um arquivo de texto' },
    { name: 'Arquivo executável', ext: 'exe', content: 'MZ\x90\x00' }
  ];
  
  for (const test of invalidTests) {
    try {
      console.log(`\n🧪 ${test.name}:`);
      
      const filename = `test.${test.ext}`;
      fs.writeFileSync(filename, test.content);
      
      const form = new FormData();
      form.append('file', fs.createReadStream(filename), {
        filename: filename
      });

      const response = await axios.post(`${baseURL}/upload/image`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${token}`
        },
        timeout: 30000
      });
      
      console.log(`⚠️ Inesperado - Upload aceito: ${response.status}`);
      
      // Limpar arquivo
      fs.unlinkSync(filename);
      
    } catch (error) {
      // Limpar arquivo mesmo em caso de erro
      try {
        fs.unlinkSync(`test.${test.ext}`);
      } catch (e) {}
      
      if (error.response?.status === 400) {
        console.log('✅ Rejeitado corretamente (400):', error.response?.data?.message || 'Tipo não suportado');
      } else {
        console.log(`❌ Erro inesperado: ${error.response?.status || 'NETWORK'} - ${error.message}`);
      }
    }
  }

  console.log('\n🎯 Teste de limites de upload concluído!');
}

testImageUploadLimits();