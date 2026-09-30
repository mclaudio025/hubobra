#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

console.log('🚀 Iniciando Sistema Loja Moderna + Zé da Obra 2.0 (Versão Corrigida)\n');

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

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => resolve(false));
      server.close();
    });
    
    server.on('error', () => resolve(true));
  });
}

async function waitForPort(port, name, maxAttempts = 30) {
  log(`⏳ Aguardando ${name} na porta ${port}...`, 'yellow');
  
  for (let i = 0; i < maxAttempts; i++) {
    const isPortInUse = await checkPort(port);
    if (isPortInUse) {
      log(`✅ ${name} está rodando na porta ${port}!`, 'green');
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    process.stdout.write('.');
  }
  
  log(`❌ ${name} não respondeu na porta ${port}`, 'red');
  return false;
}

async function runCommand(command, cwd = process.cwd(), background = false) {
  return new Promise((resolve, reject) => {
    log(`🔄 Executando: ${command}`, 'cyan');
    
    const child = spawn(command, { 
      shell: true, 
      cwd,
      stdio: background ? ['pipe', 'pipe', 'pipe'] : 'inherit'
    });
    
    if (background) {
      log(`🔄 Processo em background iniciado (PID: ${child.pid})`, 'cyan');
      
      // Capturar logs em background para debug
      child.stdout.on('data', (data) => {
        if (data.toString().includes('error') || data.toString().includes('Error')) {
          log(`⚠️ ${name}: ${data.toString().trim()}`, 'yellow');
        }
      });
      
      child.stderr.on('data', (data) => {
        log(`❌ ${name} Error: ${data.toString().trim()}`, 'red');
      });
      
      resolve(child);
      return;
    }
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Comando falhou com código ${code}: ${command}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function stopExistingProcesses() {
  log('🛑 Parando processos existentes...', 'yellow');
  
  try {
    // Parar containers Docker
    await runCommand('docker-compose down', path.join(__dirname, 'infra'));
    await runCommand('docker rm -f postgres-ecommerce redis-ecommerce || true');
    
    // Matar processos Node.js nas portas específicas
    const ports = [3000, 3001, 8080];
    for (const port of ports) {
      try {
        if (process.platform === 'win32') {
          await runCommand(`netstat -ano | findstr :${port} | for /f "tokens=5" %a in ('more') do taskkill /PID %a /F || true`);
        } else {
          await runCommand(`lsof -ti:${port} | xargs kill -9 || true`);
        }
      } catch (error) {
        // Ignorar erros de processos não encontrados
      }
    }
    
    log('✅ Processos existentes parados', 'green');
  } catch (error) {
    log('⚠️ Alguns processos podem ainda estar rodando', 'yellow');
  }
}

async function main() {
  try {
    // 0. Parar processos existentes
    await stopExistingProcesses();
    
    // 1. Verificar se Docker está rodando
    log('🐳 Verificando Docker...', 'blue');
    try {
      await runCommand('docker --version');
      log('✅ Docker encontrado', 'green');
    } catch (error) {
      log('❌ Docker não encontrado. Tentando continuar sem Docker...', 'yellow');
    }

    // 2. Verificar se as pastas existem
    const backendPath = path.join(__dirname, 'backend-nestjs');
    const frontendPath = path.join(__dirname, 'frontend');
    const infraPath = path.join(__dirname, 'infra');
    
    if (!fs.existsSync(backendPath)) {
      log('❌ Pasta backend-nestjs não encontrada', 'red');
      process.exit(1);
    }
    
    if (!fs.existsSync(frontendPath)) {
      log('❌ Pasta frontend não encontrada', 'red');
      process.exit(1);
    }

    // 3. Iniciar infraestrutura (se Docker disponível)
    if (fs.existsSync(infraPath)) {
      log('🏗️ Iniciando infraestrutura (PostgreSQL + Redis)...', 'blue');
      try {
        await runCommand('docker-compose up -d postgres redis', infraPath);
        
        // Aguardar PostgreSQL
        await waitForPort(5434, 'PostgreSQL', 20);
        await waitForPort(6380, 'Redis', 10);
      } catch (error) {
        log('⚠️ Erro ao iniciar infraestrutura Docker. Continuando...', 'yellow');
      }
    }
    
    // 4. Instalar dependências do backend se necessário
    if (!fs.existsSync(path.join(backendPath, 'node_modules'))) {
      log('📦 Instalando dependências do backend...', 'blue');
      await runCommand('npm install', backendPath);
    }
    
    // 5. Executar migrações (se possível)
    try {
      log('🗄️ Executando migrações do banco...', 'blue');
      await runCommand('npx prisma migrate deploy', backendPath);
      await runCommand('npx prisma db seed', backendPath);
    } catch (error) {
      log('⚠️ Erro nas migrações. Continuando...', 'yellow');
    }
    
    // 6. Iniciar backend
    log('🚀 Iniciando backend NestJS...', 'blue');
    const backendProcess = await runCommand('npm run start:dev', backendPath, true);
    
    // 7. Aguardar backend
    const backendReady = await waitForPort(3001, 'Backend NestJS', 30);
    if (!backendReady) {
      log('⚠️ Backend pode não ter iniciado corretamente, mas continuando...', 'yellow');
    }
    
    // 8. Instalar dependências do frontend se necessário
    if (!fs.existsSync(path.join(frontendPath, 'node_modules'))) {
      log('📦 Instalando dependências do frontend...', 'blue');
      await runCommand('npm install', frontendPath);
    }
    
    // 9. Iniciar frontend
    log('🎨 Iniciando frontend Next.js...', 'blue');
    const frontendProcess = await runCommand('npm run dev', frontendPath, true);
    
    // 10. Aguardar frontend
    const frontendReady = await waitForPort(3000, 'Frontend Next.js', 30);
    
    // 11. Mostrar resumo
    log('\n🎉 SISTEMA INICIADO!', 'green');
    log('═══════════════════════════════════════', 'green');
    log('🌐 Frontend: http://localhost:3000', 'cyan');
    log('🔧 Backend: http://localhost:3001', 'cyan');
    log('📊 Admin: http://localhost:3000/admin', 'cyan');
    
    if (backendReady) {
      log('✅ Backend: Funcionando', 'green');
    } else {
      log('⚠️ Backend: Pode estar com problemas', 'yellow');
    }
    
    if (frontendReady) {
      log('✅ Frontend: Funcionando', 'green');
    } else {
      log('⚠️ Frontend: Pode estar com problemas', 'yellow');
    }
    
    log('═══════════════════════════════════════', 'green');
    
    log('\n📋 PRÓXIMOS PASSOS:', 'yellow');
    log('1. Acesse http://localhost:3000 para ver a loja', 'white');
    log('2. Acesse http://localhost:3000/admin para administração', 'white');
    log('3. Use Ctrl+C para parar todos os serviços', 'white');
    
    // Manter processos rodando
    process.on('SIGINT', () => {
      log('\n🛑 Parando serviços...', 'yellow');
      try {
        backendProcess.kill();
        frontendProcess.kill();
      } catch (error) {
        // Ignorar erros ao matar processos
      }
      process.exit(0);
    });
    
    // Manter o script rodando
    setInterval(() => {
      // Verificar se os processos ainda estão rodando
    }, 5000);
    
  } catch (error) {
    log(`❌ Erro: ${error.message}`, 'red');
    log('💡 Tente executar os comandos manualmente:', 'yellow');
    log('1. cd backend-nestjs && npm run start:dev', 'white');
    log('2. cd frontend && npm run dev', 'white');
    process.exit(1);
  }
}

main();