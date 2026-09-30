const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUploadLimits() {
  console.log('📤 Testando limites de upload...\n');

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

  // Testar diferentes tamanhos de payload
  const tests = [
    {
      name: 'Payload pequeno (1KB)',
      data: { test: 'x'.repeat(1024) }
    },
    {
      name: 'Payload médio (100KB)', 
      data: { test: 'x'.repeat(100 * 1024) }
    },
    {
      name: 'Payload grande (1MB)',
      data: { test: 'x'.repeat(1024 * 1024) }
    },
    {
      name: 'Payload muito grande (10MB)',
      data: { test: 'x'.repeat(10 * 1024 * 1024) }
    }
  ];

  console.log('\n📊 Testando diferentes tamanhos de payload:');
  
  for (const test of tests) {
    try {
      console.log(`\n🧪 ${test.name}:`);
      
      const startTime = Date.now();
      const response = await axios.post(`${baseURL}/settings`, test.data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 segundos
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Sucesso - ${response.status} (${duration}ms)`);
      
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.log('⏰ Timeout - Requisição muito lenta');
      } else if (error.response?.status === 413) {
        console.log('❌ Payload muito grande (413)');
      } else if (error.response?.status === 400) {
        console.log('❌ Bad Request (400) - Possível limite de payload');
      } else {
        console.log(`❌ Erro: ${error.response?.status || 'NETWORK'} - ${error.message}`);
      }
    }
  }

  // Testar upload de arquivo se existir
  console.log('\n📁 Testando upload de arquivo:');
  try {
    // Criar um arquivo de teste pequeno
    const testContent = 'Teste de upload de arquivo\n'.repeat(1000);
    fs.writeFileSync('test-upload.txt', testContent);
    
    const form = new FormData();
    form.append('file', fs.createReadStream('test-upload.txt'));
    
    const response = await axios.post(`${baseURL}/upload/image`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      },
      timeout: 30000
    });
    
    console.log('✅ Upload de arquivo funcionando');
    
    // Limpar arquivo de teste
    fs.unlinkSync('test-upload.txt');
    
  } catch (error) {
    console.log(`❌ Erro no upload: ${error.response?.status || 'NETWORK'} - ${error.message}`);
    
    // Limpar arquivo de teste mesmo em caso de erro
    try {
      fs.unlinkSync('test-upload.txt');
    } catch (e) {}
  }

  console.log('\n🎯 Teste de limites concluído!');
}

testUploadLimits();