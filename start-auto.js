#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function checkDependencies() {
  log('🔍 Verificando dependências...', 'cyan');
  
  const backendPackageJson = path.join(__dirname, 'backend-nestjs', 'package.json');
  const frontendPackageJson = path.join(__dirname, 'frontend', 'package.json');
  const backendNodeModules = path.join(__dirname, 'backend-nestjs', 'node_modules');
  const frontendNodeModules = path.join(__dirname, 'frontend', 'node_modules');
  
  if (!checkFileExists(backendPackageJson)) {
    log('❌ Backend package.json não encontrado!', 'red');
    return false;
  }
  
  if (!checkFileExists(frontendPackageJson)) {
    log('❌ Frontend package.json não encontrado!', 'red');
    return false;
  }
  
  if (!checkFileExists(backendNodeModules)) {
    log('⚠️  Backend node_modules não encontrado. Execute: cd backend-nestjs && npm install', 'yellow');
    return false;
  }
  
  if (!checkFileExists(frontendNodeModules)) {
    log('⚠️  Frontend node_modules não encontrado. Execute: cd frontend && npm install', 'yellow');
    return false;
  }
  
  log('✅ Todas as dependências estão instaladas!', 'green');
  return true;
}

function checkEnvironment() {
  log('🔍 Verificando arquivos de ambiente...', 'cyan');
  
  const backendEnv = path.join(__dirname, 'backend-nestjs', '.env');
  const frontendEnv = path.join(__dirname, 'frontend', '.env.local');
  
  if (!checkFileExists(backendEnv)) {
    log('⚠️  Backend .env não encontrado. Usando configurações padrão.', 'yellow');
  } else {
    log('✅ Backend .env encontrado!', 'green');
  }
  
  if (!checkFileExists(frontendEnv)) {
    log('⚠️  Frontend .env.local não encontrado. Usando configurações padrão.', 'yellow');
  } else {
    log('✅ Frontend .env.local encontrado!', 'green');
  }
  
  return true;
}

function startBackend() {
  return new Promise((resolve, reject) => {
    log('🚀 Iniciando Backend (NestJS)...', 'blue');
    
    // Primeiro compilar o projeto
    const compile = spawn('npx', ['tsc'], {
      cwd: path.join(__dirname, 'backend-nestjs'),
      stdio: 'pipe',
      shell: true
    });
    
    compile.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('Falha na compilação do TypeScript'));
        return;
      }
      
      // Agora iniciar o backend compilado
      const backend = spawn('node', ['dist/src/main.js'], {
        cwd: path.join(__dirname, 'backend-nestjs'),
        stdio: 'pipe',
        shell: true
      });
      
      let backendReady = false;
      
      backend.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Server running on') || output.includes('Nest application successfully started')) {
          log('✅ Backend iniciado com sucesso!', 'green');
          log('📚 API Documentation: http://localhost:8081/api/docs', 'cyan');
          backendReady = true;
          resolve(backend);
        }
        // Log do backend com prefixo
         output.split('\n').forEach(line => {
           if (line.trim()) {
             console.log(`${colors.blue}[Backend]${colors.reset} ${line}`);
           }
         });
       });
       
       backend.stderr.on('data', (data) => {
         const error = data.toString();
         console.error(`${colors.red}[Backend Error]${colors.reset} ${error}`);
         if (!backendReady) {
           reject(new Error(`Backend failed to start: ${error}`));
         }
       });
       
       backend.on('close', (code) => {
         if (code !== 0 && !backendReady) {
           reject(new Error(`Backend process exited with code ${code}`));
         }
       });
       
       // Timeout de 45 segundos (mais tempo para compilação)
       setTimeout(() => {
         if (!backendReady) {
           reject(new Error('Backend timeout - não iniciou em 45 segundos'));
         }
       }, 45000);
     });
     
     compile.stderr.on('data', (data) => {
       const error = data.toString();
       console.error(`${colors.red}[Compile Error]${colors.reset} ${error}`);
     });
  });
}

function startFrontend() {
  return new Promise((resolve, reject) => {
    log('🚀 Iniciando Frontend (Next.js)...', 'magenta');
    
    const frontend = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: 'pipe',
      shell: true
    });
    
    let frontendReady = false;
    
    frontend.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Ready in') || output.includes('Local:') || output.includes('✓ Ready')) {
        // Detectar a porta correta do output
        const portMatch = output.match(/localhost:(\d+)/);
        const port = portMatch ? portMatch[1] : '3000';
        
        log('✅ Frontend iniciado com sucesso!', 'green');
        log(`🌐 Aplicação: http://localhost:${port}`, 'cyan');
        frontendReady = true;
        resolve(frontend);
      }
      // Log do frontend com prefixo
      output.split('\n').forEach(line => {
        if (line.trim()) {
          console.log(`${colors.magenta}[Frontend]${colors.reset} ${line}`);
        }
      });
    });
    
    frontend.stderr.on('data', (data) => {
      const error = data.toString();
      console.error(`${colors.red}[Frontend Error]${colors.reset} ${error}`);
      // Não tratar warnings como erros fatais
      if (!frontendReady && !error.includes('Warning:') && !error.includes('⚠')) {
        reject(new Error(`Frontend failed to start: ${error}`));
      }
    });
    
    frontend.on('close', (code) => {
      if (code !== 0 && !frontendReady) {
        reject(new Error(`Frontend process exited with code ${code}`));
      }
    });
    
    // Timeout de 30 segundos
    setTimeout(() => {
      if (!frontendReady) {
        reject(new Error('Frontend timeout - não iniciou em 30 segundos'));
      }
    }, 30000);
  });
}

async function main() {
  log('🏪 Iniciando Loja Moderna...', 'bright');
  log('=' .repeat(50), 'cyan');
  
  try {
    // Verificar dependências
    if (!checkDependencies()) {
      log('❌ Falha na verificação de dependências!', 'red');
      process.exit(1);
    }
    
    // Verificar ambiente
    checkEnvironment();
    
    log('\n🚀 Iniciando serviços...', 'bright');
    
    // Iniciar backend primeiro
    const backendProcess = await startBackend();
    
    // Aguardar um pouco antes de iniciar o frontend
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Iniciar frontend
    const frontendProcess = await startFrontend();
    
    log('\n' + '=' .repeat(50), 'green');
    log('🎉 Sistema iniciado com sucesso!', 'green');
    log('🌐 Frontend: Verifique o log acima para a URL correta', 'cyan');
    log('🔧 Backend: http://localhost:8081', 'cyan');
    log('📚 API Docs: http://localhost:8081/api/docs', 'cyan');
    log('=' .repeat(50), 'green');
    log('\n💡 Pressione Ctrl+C para parar todos os serviços', 'yellow');
    
    // Gerenciar encerramento
    process.on('SIGINT', () => {
      log('\n🛑 Parando serviços...', 'yellow');
      
      if (backendProcess && !backendProcess.killed) {
        backendProcess.kill('SIGTERM');
        log('✅ Backend parado', 'green');
      }
      
      if (frontendProcess && !frontendProcess.killed) {
        frontendProcess.kill('SIGTERM');
        log('✅ Frontend parado', 'green');
      }
      
      log('👋 Até logo!', 'cyan');
      process.exit(0);
    });
    
    // Manter o processo principal vivo
    process.stdin.resume();
    
  } catch (error) {
    log(`❌ Erro durante a inicialização: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Executar apenas se for chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main, checkDependencies, checkEnvironment };