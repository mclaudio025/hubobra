const { spawn } = require('child_process');
const axios = require('axios');

console.log('🔄 Reiniciando backend NestJS...\n');

async function waitForBackend() {
  console.log('⏳ Aguardando backend iniciar...');
  
  for (let i = 0; i < 30; i++) {
    try {
      await axios.get('http://localhost:8081/health', { timeout: 2000 });
      console.log('✅ Backend está funcionando!');
      return true;
    } catch (error) {
      process.stdout.write('.');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n❌ Backend não respondeu após 60s');
  return false;
}

async function main() {
  try {
    // Iniciar backend
    console.log('🚀 Iniciando backend NestJS...');
    const backend = spawn('npm', ['run', 'start:dev'], {
      cwd: 'backend-nestjs',
      stdio: 'pipe',
      shell: true
    });

    backend.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output.includes('Server running') || output.includes('Application is running')) {
        console.log(`\n[Backend] ${output}`);
      }
    });

    backend.stderr.on('data', (data) => {
      console.error(`[Backend ERROR] ${data.toString().trim()}`);
    });

    // Aguardar backend
    const backendReady = await waitForBackend();
    
    if (backendReady) {
      console.log('\n🎉 Backend reiniciado com sucesso!');
      console.log('\n📋 URLs disponíveis:');
      console.log('- Backend API: http://localhost:8081');
      console.log('- API Docs: http://localhost:8081/api/docs');
      console.log('- Uploads: http://localhost:8081/uploads/');
      
      console.log('\n🧪 Testando arquivos estáticos...');
      
      // Testar uma imagem
      try {
        const response = await axios.get('http://localhost:8081/uploads/original/ea1efb73-04aa-4ee6-a7ac-4643d74eee45.png', {
          timeout: 5000,
          responseType: 'arraybuffer'
        });
        
        console.log('✅ Arquivos estáticos funcionando!');
        console.log(`📏 Tamanho da imagem: ${response.data.length} bytes`);
        
      } catch (error) {
        console.log('❌ Arquivos estáticos não funcionando:', error.response?.status);
      }
      
    } else {
      console.log('❌ Falha ao reiniciar backend');
      process.exit(1);
    }

    // Manter o processo vivo
    console.log('\n💡 Backend rodando. Pressione Ctrl+C para parar.');
    process.stdin.resume();
    
  } catch (error) {
    console.error('❌ Erro ao reiniciar backend:', error.message);
    process.exit(1);
  }
}

main();