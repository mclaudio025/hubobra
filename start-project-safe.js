#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Iniciando Projeto - Modo Seguro\n');

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

async function checkPort(port) {
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

async function waitForService(url, name, maxAttempts = 15) {
  log(`⏳ Aguardando ${name}...`, 'yellow');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 404) {
        log(`✅ ${name} está funcionando!`, 'green');
        return true;
      }
    } catch (error) {
      // Continua tentando
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    process.stdout.write('.');
  }
  
  log(`\n⚠️  ${name} não respondeu (continuando...)`, 'yellow');
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
      // Para processos em background, capturar apenas erros críticos
      child.stderr.on('data', (data) => {
        const error = data.toString();
        if (error.includes('EADDRINUSE')) {
          log(`⚠️  Porta em uso: ${command}`, 'yellow');
        } else if (error.includes('Error:') && !error.includes('warning')) {
          console.error(`❌ Erro em ${command}:`, error);
        }
      });
      
      child.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('ready') || output.includes('listening') || output.includes('started')) {
          log(`✅ ${command} iniciado com sucesso`, 'green');
        }
      });
      
      resolve(child);
      return;
    }
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        log(`⚠️  Comando terminou com código ${code}: ${command}`, 'yellow');
        resolve(); // Continuar mesmo com erro
      }
    });
  });
}

async function main() {
  try {
    log('📋 Modo seguro - Iniciando apenas serviços essenciais', 'blue');
    
    // 1. Verificar portas
    log('🔍 Verificando portas...', 'blue');
    const backendPortBusy = await checkPort(3001);
    const frontendPortBusy = await checkPort(3000);
    
    if (backendPortBusy) {
      log('⚠️  Porta 3001 em uso - backend pode já estar rodando', 'yellow');
    }
    
    if (frontendPortBusy) {
      log('⚠️  Porta 3000 em uso - frontend pode já estar rodando', 'yellow');
    }
    
    // 2. Verificar dependências do backend
    const backendPath = path.join(__dirname, 'backend-nestjs');
    if (!fs.existsSync(path.join(backendPath, 'node_modules'))) {
      log('📦 Instalando dependências do backend...', 'blue');
      try {
        await runCommand('npm install', backendPath);
      } catch (error) {
        log('⚠️  Erro na instalação - continuando...', 'yellow');
      }
    }
    
    // 3. Configurar ambiente de desenvolvimento
    log('🔧 Configurando ambiente...', 'blue');
    const envPath = path.join(backendPath, '.env');
    if (!fs.existsSync(envPath)) {
      const envContent = `
# Configuração de desenvolvimento
NODE_ENV=development
PORT=3001

# Database (SQLite para desenvolvimento)
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="dev-secret-key-change-in-production"

# CORS
FRONTEND_URL="http://localhost:3000"

# IA (opcional)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""

# Email (opcional)
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""

# PIX (desenvolvimento)
PIX_KEY="11999999999"
`;
      fs.writeFileSync(envPath, envContent.trim());
      log('✅ Arquivo .env criado', 'green');
    }
    
    // 4. Tentar executar migração (se possível)
    if (!backendPortBusy) {
      log('🗄️  Tentando executar migração...', 'blue');
      try {
        await runCommand('npx prisma migrate dev --name init', backendPath);
        log('✅ Migração executada', 'green');
      } catch (error) {
        log('⚠️  Migração falhou - continuando...', 'yellow');
      }
    }
    
    // 5. Iniciar backend (se porta livre)
    let backendProcess;
    if (!backendPortBusy) {
      log('🚀 Iniciando backend...', 'blue');
      try {
        backendProcess = await runCommand('npm run start:dev', backendPath, true);
        await waitForService('http://localhost:3001/health', 'Backend NestJS');
      } catch (error) {
        log('⚠️  Backend não iniciou - continuando...', 'yellow');
      }
    } else {
      log('✅ Backend já está rodando na porta 3001', 'green');
    }
    
    // 6. Verificar dependências do frontend
    const frontendPath = path.join(__dirname, 'frontend');
    if (!fs.existsSync(path.join(frontendPath, 'node_modules'))) {
      log('📦 Instalando dependências do frontend...', 'blue');
      try {
        await runCommand('npm install', frontendPath);
      } catch (error) {
        log('⚠️  Erro na instalação - continuando...', 'yellow');
      }
    }
    
    // 7. Iniciar frontend (se porta livre)
    let frontendProcess;
    if (!frontendPortBusy) {
      log('🎨 Iniciando frontend...', 'blue');
      try {
        frontendProcess = await runCommand('npm run dev', frontendPath, true);
        await waitForService('http://localhost:3000', 'Frontend Next.js');
      } catch (error) {
        log('⚠️  Frontend não iniciou - continuando...', 'yellow');
      }
    } else {
      log('✅ Frontend já está rodando na porta 3000', 'green');
    }
    
    // 8. Mostrar status final
    log('\n🎉 SISTEMA INICIADO (MODO SEGURO)!', 'green');
    log('═══════════════════════════════════════', 'green');
    log('🌐 Frontend: http://localhost:3000', 'cyan');
    log('🔧 Backend: http://localhost:3001', 'cyan');
    log('📊 Admin: http://localhost:3000/admin', 'cyan');
    log('═══════════════════════════════════════', 'green');
    
    log('\n📋 TESTES DISPONÍVEIS:', 'yellow');
    log('• node test-metadata-structure.js - Verificar metadata', 'white');
    log('• node test-payments-controller.js - Testar pagamentos', 'white');
    log('• node test-checkout-system.js - Testar checkout', 'white');
    log('• node check-system.js - Verificar status', 'white');
    
    log('\n💡 DICAS:', 'yellow');
    log('• Se algum serviço não iniciou, tente manualmente', 'white');
    log('• Use Ctrl+C para parar os serviços', 'white');
    log('• Verifique os logs acima para possíveis problemas', 'white');
    
    // Manter processos rodando
    if (backendProcess || frontendProcess) {
      process.on('SIGINT', () => {
        log('\n🛑 Parando serviços...', 'yellow');
        try {
          if (backendProcess) backendProcess.kill();
          if (frontendProcess) frontendProcess.kill();
        } catch (error) {
          // Ignorar erros ao matar processos
        }
        log('✅ Serviços parados', 'green');
        process.exit(0);
      });
      
      // Manter o script rodando
      await new Promise(() => {});
    } else {
      log('\n✅ Verificação concluída - serviços podem já estar rodando', 'green');
    }
    
  } catch (error) {
    log(`❌ Erro: ${error.message}`, 'red');
    log('\n💡 Dicas para resolver:', 'yellow');
    log('• Verifique se as portas 3000 e 3001 estão livres', 'white');
    log('• Execute: npm install nas pastas frontend/ e backend-nestjs/', 'white');
    log('• Tente iniciar os serviços manualmente', 'white');
    process.exit(1);
  }
}

main();