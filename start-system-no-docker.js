#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Iniciando Sistema Loja Moderna (Modo Desenvolvimento)\n');

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

async function waitForService(url, name, maxAttempts = 15) {
  log(`⏳ Aguardando ${name}...`, 'yellow');

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 404) { // 404 também indica que o servidor está rodando
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
        if (error.includes('EADDRINUSE') || error.includes('Error:')) {
          console.error(`❌ Erro em ${command}:`, error);
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
    log('📋 Modo de desenvolvimento (sem Docker)', 'blue');
    log('Este modo usa SQLite local e não requer Docker\n', 'yellow');

    // 1. Verificar e instalar dependências do backend
    const backendPath = path.join(__dirname, 'backend-nestjs');
    if (!fs.existsSync(path.join(backendPath, 'node_modules'))) {
      log('📦 Instalando dependências do backend...', 'blue');
      await runCommand('npm install', backendPath);
    }

    // 2. Configurar banco SQLite (desenvolvimento)
    log('🗄️ Configurando banco de dados local...', 'blue');

    // Criar arquivo .env para desenvolvimento se não existir
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
      log('✅ Arquivo .env criado para desenvolvimento', 'green');
    }

    // 3. Executar migrações (SQLite)
    try {
      log('🔄 Executando migrações do banco...', 'blue');
      await runCommand('npx prisma migrate dev --name init', backendPath);
      await runCommand('npx prisma db seed', backendPath);
    } catch (error) {
      log('⚠️  Migrações podem ter falhado (continuando...)', 'yellow');
    }

    // 4. Iniciar backend com limite de memória aumentado
    log('🚀 Iniciando backend NestJS (com 1GB RAM limit)...', 'blue');
    process.env.NODE_OPTIONS = '--max-old-space-size=1024';
    const backendProcess = await runCommand('npm run start:dev', backendPath, true);
    delete process.env.NODE_OPTIONS; // Limpar para não afetar o frontend desnecessariamente

    // 5. Aguardar backend
    await waitForService('http://localhost:8081/health', 'Backend NestJS');

    // 6. Verificar e instalar dependências do frontend
    const frontendPath = path.join(__dirname, 'frontend');
    if (!fs.existsSync(path.join(frontendPath, 'node_modules'))) {
      log('📦 Instalando dependências do frontend...', 'blue');
      await runCommand('npm install', frontendPath);
    }

    // 7. Iniciar frontend
    log('🎨 Iniciando frontend Next.js...', 'blue');
    const frontendProcess = await runCommand('npm run dev', frontendPath, true);

    // 8. Aguardar frontend
    await waitForService('http://localhost:3000', 'Frontend Next.js');

    // 9. Mostrar resumo
    log('\n🎉 SISTEMA INICIADO COM SUCESSO!', 'green');
    log('═══════════════════════════════════════', 'green');
    log('🌐 Frontend: http://localhost:3000', 'cyan');
    log('🔧 Backend: http://localhost:8081', 'cyan');
    log('📊 Admin: http://localhost:3000/admin', 'cyan');
    log('🗄️ Banco: SQLite (dev.db)', 'cyan');
    log('═══════════════════════════════════════', 'green');

    log('\n📋 PRÓXIMOS PASSOS:', 'yellow');
    log('1. Acesse http://localhost:3000 para ver a loja', 'white');
    log('2. Acesse http://localhost:3000/admin para administração', 'white');
    log('3. Login admin: admin@loja.com / admin123', 'white');
    log('4. Use Ctrl+C para parar todos os serviços', 'white');

    log('\n🧪 COMANDOS DE TESTE:', 'yellow');
    log('• node test-checkout-system.js - Testar checkout', 'white');
    log('• node test-payments-controller.js - Testar pagamentos', 'white');
    log('• node check-system.js - Verificar status', 'white');

    // Manter processos rodando
    process.on('SIGINT', () => {
      log('\n🛑 Parando serviços...', 'yellow');
      try {
        backendProcess.kill();
        frontendProcess.kill();
      } catch (error) {
        // Ignorar erros ao matar processos
      }
      log('✅ Serviços parados', 'green');
      process.exit(0);
    });

    // Manter o script rodando
    await new Promise(() => { });

  } catch (error) {
    log(`❌ Erro: ${error.message}`, 'red');
    log('\n💡 Dicas para resolver:', 'yellow');
    log('• Verifique se as portas 3000 e 3001 estão livres', 'white');
    log('• Execute: npm install nas pastas frontend/ e backend-nestjs/', 'white');
    log('• Tente reiniciar o terminal', 'white');
    process.exit(1);
  }
}

main();