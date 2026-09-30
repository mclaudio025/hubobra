const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUploadValidation() {
  console.log('🔍 Testando validação de upload...\n');

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

  // Teste 1: Arquivo sem extensão
  console.log('\n🧪 Teste 1: Arquivo sem extensão');
  try {
    const filename = 'test-no-extension';
    fs.writeFileSync(filename, 'conteúdo de teste');
    
    const form = new FormData();
    form.append('file', fs.createReadStream(filename), {
      filename: filename
    });

    const response = await axios.post(`${baseURL}/upload/image`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('⚠️ Inesperado - Upload aceito');
    fs.unlinkSync(filename);
    
  } catch (error) {
    try { fs.unlinkSync('test-no-extension'); } catch (e) {}
    console.log(`✅ Rejeitado: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }

  // Teste 2: Arquivo de texto com extensão .txt
  console.log('\n🧪 Teste 2: Arquivo .txt');
  try {
    const filename = 'test.txt';
    fs.writeFileSync(filename, 'Este é um arquivo de texto');
    
    const form = new FormData();
    form.append('file', fs.createReadStream(filename), {
      filename: filename,
      contentType: 'text/plain'
    });

    const response = await axios.post(`${baseURL}/upload/image`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('⚠️ Inesperado - Upload aceito');
    fs.unlinkSync(filename);
    
  } catch (error) {
    try { fs.unlinkSync('test.txt'); } catch (e) {}
    console.log(`✅ Rejeitado: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }

  // Teste 3: Arquivo com MIME type incorreto mas extensão de imagem
  console.log('\n🧪 Teste 3: MIME type incorreto');
  try {
    const filename = 'fake-image.png';
    fs.writeFileSync(filename, 'Este não é uma imagem PNG');
    
    const form = new FormData();
    form.append('file', fs.createReadStream(filename), {
      filename: filename,
      contentType: 'text/plain' // MIME type incorreto
    });

    const response = await axios.post(`${baseURL}/upload/image`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('⚠️ Inesperado - Upload aceito');
    fs.unlinkSync(filename);
    
  } catch (error) {
    try { fs.unlinkSync('fake-image.png'); } catch (e) {}
    console.log(`✅ Rejeitado: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }

  // Teste 4: Imagem PNG válida (deve funcionar)
  console.log('\n🧪 Teste 4: PNG válido');
  try {
    const filename = 'valid-image.png';
    // PNG 1x1 válido
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(pngBase64, 'base64');
    fs.writeFileSync(filename, imageBuffer);
    
    const form = new FormData();
    form.append('file', fs.createReadStream(filename), {
      filename: filename,
      contentType: 'image/png'
    });

    const response = await axios.post(`${baseURL}/upload/image`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Upload aceito corretamente');
    console.log(`📋 URL: ${response.data.url}`);
    fs.unlinkSync(filename);
    
  } catch (error) {
    try { fs.unlinkSync('valid-image.png'); } catch (e) {}
    console.log(`❌ Erro inesperado: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }

  // Teste 5: Arquivo muito grande
  console.log('\n🧪 Teste 5: Arquivo muito grande (15MB)');
  try {
    const filename = 'large-file.png';
    // Criar um arquivo de 15MB
    const largeBuffer = Buffer.alloc(15 * 1024 * 1024, 0);
    fs.writeFileSync(filename, largeBuffer);
    
    const form = new FormData();
    form.append('file', fs.createReadStream(filename), {
      filename: filename,
      contentType: 'image/png'
    });

    const response = await axios.post(`${baseURL}/upload/image`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      },
      timeout: 60000 // 60 segundos
    });
    
    console.log('⚠️ Inesperado - Upload aceito');
    fs.unlinkSync(filename);
    
  } catch (error) {
    try { fs.unlinkSync('large-file.png'); } catch (e) {}
    
    if (error.response?.status === 413) {
      console.log('✅ Rejeitado corretamente - Payload muito grande (413)');
    } else if (error.code === 'ECONNABORTED') {
      console.log('⏰ Timeout - Arquivo muito grande');
    } else {
      console.log(`❌ Erro: ${error.response?.status || 'NETWORK'} - ${error.response?.data?.message || error.message}`);
    }
  }

  console.log('\n🎯 Teste de validação concluído!');
}

testUploadValidation();