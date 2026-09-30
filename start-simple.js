#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Sistema Simples - Loja Moderna\n');

function log(message, color = '\x1b[0m') {
  console.log(`${color}${message}\x1b[0m`);
}

function startProcess(command, cwd, name) {
  return new Promise((resolve) => {
    log(`🔄 Iniciando ${name}...`, '\x1b[36m');
    
    const child = spawn(command, {
      shell: true,
      cwd,
      stdio: 'inherit'
    });
    
    child.on('error', (error) => {
      log(`❌ Erro ao iniciar ${name}: ${error.message}`, '\x1b[31m');
    });
    
    // Não esperar o processo terminar, apenas iniciar
    setTimeout(() => {
      log(`✅ ${name} iniciado`, '\x1b[32m');
      resolve(child);
    }, 2000);
  });
}

async function main() {
  try {
    const backendPath = path.join(__dirname, 'backend-nestjs');
    const frontendPath = path.join(__dirname, 'frontend');
    
    log('📦 Instalando dependências se necessário...', '\x1b[33m');
    
    // Instalar dependências do backend
    await startProcess('npm install', backendPath, 'Dependências Backend');
    
    // Instalar dependências do frontend  
    await startProcess('npm install', frontendPath, 'Dependências Frontend');
    
    log('\n🚀 Iniciando serviços...', '\x1b[34m');
    
    // Iniciar backend
    const backendProcess = await startProcess('npm run start:dev', backendPath, 'Backend NestJS');
    
    // Aguardar um pouco antes de iniciar o frontend
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Iniciar frontend
    const frontendProcess = await startProcess('npm run dev', frontendPath, 'Frontend Next.js');
    
    log('\n🎉 SISTEMA INICIADO!', '\x1b[32m');
    log('═══════════════════════════════════════', '\x1b[32m');
    log('🌐 Frontend: http://localhost:3000', '\x1b[36m');
    log('🔧 Backend: http://localhost:3001', '\x1b[36m');
    log('📊 Admin: http://localhost:3000/admin', '\x1b[36m');
    log('═══════════════════════════════════════', '\x1b[32m');
    
    log('\n📋 INSTRUÇÕES:', '\x1b[33m');
    log('1. Aguarde alguns minutos para tudo carregar', '\x1b[37m');
    log('2. Acesse http://localhost:3000 para ver a loja', '\x1b[37m');
    log('3. Use Ctrl+C para parar', '\x1b[37m');
    
    // Manter processos rodando
    process.on('SIGINT', () => {
      log('\n🛑 Parando serviços...', '\x1b[33m');
      try {
        backendProcess.kill();
        frontendProcess.kill();
      } catch (error) {
        // Ignorar erros
      }
      process.exit(0);
    });
    
    // Manter rodando
    await new Promise(() => {});
    
  } catch (error) {
    log(`❌ Erro: ${error.message}`, '\x1b[31m');
    log('\n💡 SOLUÇÃO MANUAL:', '\x1b[33m');
    log('Abra 2 terminais e execute:', '\x1b[37m');
    log('Terminal 1: cd backend-nestjs && npm run start:dev', '\x1b[37m');
    log('Terminal 2: cd frontend && npm run dev', '\x1b[37m');
  }
}

main();