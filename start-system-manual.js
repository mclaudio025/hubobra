const { spawn } = require('child_process');
const axios = require('axios');

console.log('🚀 Iniciando Sistema Manualmente...\n');

// Função para aguardar um serviço
async function waitForService(url, name, maxAttempts = 30) {
  console.log(`⏳ Aguardando ${name}...`);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(url, { timeout: 2000 });
      console.log(`✅ ${name} está funcionando!`);
      return true;
    } catch (error) {
      process.stdout.write('.');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log(`\n❌ ${name} não respondeu após ${maxAttempts * 2}s`);
  return false;
}

// Função para iniciar um processo
function startProcess(command, args, cwd, name) {
  console.log(`🔄 Iniciando ${name}...`);
  
  const process = spawn(command, args, {
    cwd,
    stdio: 'pipe',
    shell: true
  });

  process.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });

  process.stderr.on('data', (data) => {
    console.error(`[${name} ERROR] ${data.toString().trim()}`);
  });

  return process;
}

async function main() {
  try {
    // 1. Verificar Docker
    console.log('🐳 Verificando Docker...');
    await new Promise((resolve, reject) => {
      const docker = spawn('docker', ['--version'], { shell: true });
      docker.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Docker encontrado');
          resolve();
        } else {
          reject(new Error('Docker não encontrado'));
        }
      });
    });

    // 2. Iniciar infraestrutura
    console.log('\n🏗️ Iniciando infraestrutura...');
    spawn('docker-compose', ['up', '-d'], { 
      cwd: 'infra', 
      stdio: 'inherit',
      shell: true 
    });

    // Aguardar PostgreSQL
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 3. Executar migrações
    console.log('\n🗄️ Executando migrações...');
    await new Promise((resolve) => {
      const migrate = spawn('npx', ['prisma', 'db', 'push'], {
        cwd: 'backend-nestjs',
        stdio: 'inherit',
        shell: true
      });
      migrate.on('close', () => resolve());
    });

    // 4. Executar seed
    console.log('\n🌱 Executando seed...');
    await new Promise((resolve) => {
      const seed = spawn('npx', ['prisma', 'db', 'seed'], {
        cwd: 'backend-nestjs',
        stdio: 'inherit',
        shell: true
      });
      seed.on('close', () => resolve());
    });

    // 5. Iniciar backend
    console.log('\n🚀 Iniciando backend...');
    const backend = startProcess('npm', ['run', 'start:dev'], 'backend-nestjs', 'Backend');
    
    // Aguardar backend
    const backendReady = await waitForService('http://localhost:8081/health', 'Backend NestJS');
    
    if (!backendReady) {
      console.log('❌ Backend não iniciou. Tentando novamente...');
      backend.kill();
      
      // Tentar novamente
      await new Promise(resolve => setTimeout(resolve, 5000));
      const backend2 = startProcess('npm', ['run', 'start:dev'], 'backend-nestjs', 'Backend-2');
      await waitForService('http://localhost:8081/health', 'Backend NestJS (2ª tentativa)');
    }

    // 6. Iniciar frontend
    console.log('\n🎨 Iniciando frontend...');
    const frontend = startProcess('npm', ['run', 'dev'], 'frontend', 'Frontend');
    
    // Aguardar frontend
    await waitForService('http://localhost:3000', 'Frontend Next.js');

    console.log('\n🎉 Sistema iniciado com sucesso!');
    console.log('\n📋 URLs disponíveis:');
    console.log('- Frontend: http://localhost:3000');
    console.log('- Backend: http://localhost:8081');
    console.log('- Admin: http://localhost:3000/admin');
    console.log('- API Docs: http://localhost:8081/api/docs');
    
    console.log('\n👤 Usuário de teste:');
    console.log('- Email: admin@loja.com');
    console.log('- Senha: admin123');

    // Manter o processo vivo
    process.stdin.resume();
    
  } catch (error) {
    console.error('❌ Erro ao iniciar sistema:', error.message);
    process.exit(1);
  }
}

main();