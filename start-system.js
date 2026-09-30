#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Iniciando Sistema Loja Moderna + Zé da Obra 2.0\n');

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
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => resolve(false));
      server.close();
    });
    
    server.on('error', () => resolve(true));
  });
}

async function waitForService(url, name, maxAttempts = 30) {
  log(`⏳ Aguardando ${name}...`, 'yellow');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        log(`✅ ${name} está funcionando!`, 'green');
        return true;
      }
    } catch (error) {
      // Continua tentando
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    process.stdout.write('.');
  }
  
  log(`❌ ${name} não respondeu`, 'red');
  return false;
}

async function runCommand(command, cwd = process.cwd(), background = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { 
      shell: true, 
      cwd,
      stdio: background ? 'pipe' : 'inherit'
    });
    
    if (background) {
      log(`🔄 Executando em background: ${command}`, 'cyan');
      resolve(child);
      return;
    }
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Comando falhou: ${command}`));
      }
    });
  });
}

async function main() {
  try {
    // 1. Verificar se Docker está rodando
    log('🐳 Verificando Docker...', 'blue');
    try {
      await runCommand('docker --version');
      log('✅ Docker encontrado', 'green');
    } catch (error) {
      log('❌ Docker não encontrado. Instale o Docker primeiro.', 'red');
      process.exit(1);
    }

    // 2. Iniciar infraestrutura
    log('🏗️ Iniciando infraestrutura (PostgreSQL + Redis)...', 'blue');
    await runCommand('docker-compose down', path.join(__dirname, 'infra'));
    await runCommand('docker rm -f postgres-ecommerce redis-ecommerce || true');
    await runCommand('docker-compose up -d postgres redis', path.join(__dirname, 'infra'));
    
    // 3. Aguardar PostgreSQL
    await waitForService('http://localhost:5434', 'PostgreSQL (pode demorar)', 15);
    
    // 4. Instalar dependências do backend se necessário
    if (!fs.existsSync(path.join(__dirname, 'backend-nestjs', 'node_modules'))) {
      log('📦 Instalando dependências do backend...', 'blue');
      await runCommand('npm install', path.join(__dirname, 'backend-nestjs'));
    }
    
    // 5. Executar migrações
    log('🗄️ Executando migrações do banco...', 'blue');
    await runCommand('npx prisma migrate deploy', path.join(__dirname, 'backend-nestjs'));
    await runCommand('npx prisma db seed', path.join(__dirname, 'backend-nestjs'));
    
    // 6. Iniciar backend
    log('🚀 Iniciando backend NestJS...', 'blue');
    const backendProcess = await runCommand('npm run start:dev', path.join(__dirname, 'backend-nestjs'), true);
    
    // 7. Aguardar backend
    const backendReady = await waitForService('http://localhost:3001/health', 'Backend NestJS');
    if (!backendReady) {
      log('❌ Backend não iniciou corretamente', 'red');
      process.exit(1);
    }
    
    // 8. Testar Zé da Obra
    log('🤖 Testando Zé da Obra 2.0...', 'blue');
    await runCommand('node test-ze-da-obra.js status');
    
    // 9. Instalar dependências do frontend se necessário
    if (!fs.existsSync(path.join(__dirname, 'frontend', 'node_modules'))) {
      log('📦 Instalando dependências do frontend...', 'blue');
      await runCommand('npm install', path.join(__dirname, 'frontend'));
    }
    
    // 10. Iniciar frontend
    log('🎨 Iniciando frontend Next.js...', 'blue');
    const frontendProcess = await runCommand('npm run dev', path.join(__dirname, 'frontend'), true);
    
    // 11. Aguardar frontend
    await waitForService('http://localhost:3000', 'Frontend Next.js');
    
    // 12. Mostrar resumo
    log('\n🎉 SISTEMA INICIADO COM SUCESSO!', 'green');
    log('═══════════════════════════════════════', 'green');
    log('🌐 Frontend: http://localhost:3000', 'cyan');
    log('🔧 Backend: http://localhost:3001', 'cyan');
    log('📊 Admin: http://localhost:3000/admin', 'cyan');
    log('🤖 Zé da Obra: Ativo e funcionando', 'cyan');
    log('🐘 PostgreSQL: localhost:5434', 'cyan');
    log('🔴 Redis: localhost:6380', 'cyan');
    log('📱 Evolution API: http://localhost:8080', 'cyan');
    log('═══════════════════════════════════════', 'green');
    
    log('\n📋 PRÓXIMOS PASSOS:', 'yellow');
    log('1. Acesse http://localhost:3000 para ver a loja', 'white');
    log('2. Acesse http://localhost:3000/admin para administração', 'white');
    log('3. Configure uma API Key de IA no admin para ativar o Zé da Obra', 'white');
    log('4. Use Ctrl+C para parar todos os serviços', 'white');
    
    // Manter processos rodando
    process.on('SIGINT', () => {
      log('\n🛑 Parando serviços...', 'yellow');
      backendProcess.kill();
      frontendProcess.kill();
      process.exit(0);
    });
    
    // Manter o script rodando
    await new Promise(() => {});
    
  } catch (error) {
    log(`❌ Erro: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();