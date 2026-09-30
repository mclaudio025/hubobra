#!/usr/bin/env node

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkService(url, name) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      log(`✅ ${name}: Funcionando`, 'green');
      return true;
    } else {
      log(`⚠️ ${name}: Respondendo mas com erro (${response.status})`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ ${name}: Não está respondendo`, 'red');
    return false;
  }
}

async function main() {
  log('📊 Verificando Status do Sistema\n', 'cyan');

  const services = [
    { url: 'http://localhost:3000', name: 'Frontend (Next.js)' },
    { url: 'http://localhost:8081/health', name: 'Backend (NestJS)' },
    { url: 'http://localhost:8080', name: 'Evolution API' },
    { url: 'http://localhost:5433', name: 'PgAdmin' }
  ];

  let allGood = true;

  for (const service of services) {
    const isWorking = await checkService(service.url, service.name);
    if (!isWorking) allGood = false;
  }

  log('\n🐳 Containers Docker:', 'cyan');
  const { spawn } = require('child_process');

  try {
    const dockerPs = spawn('docker', ['ps', '--format', 'table {{.Names}}\t{{.Status}}']);

    dockerPs.stdout.on('data', (data) => {
      console.log(data.toString());
    });

    dockerPs.stderr.on('data', (data) => {
      // Ignorar erros silenciosamente ou reportar se necessário
    });

    dockerPs.on('error', (err) => {
      log('⚠️ Docker não disponível ou não instalado no sistema.', 'yellow');
      finishCheck();
    });

    dockerPs.on('close', (code) => {
      if (code === 0) {
        finishCheck();
      } else if (code !== null) {
        // Já tratado pelo error se for comando não encontrado, ou aqui se for erro do docker
        finishCheck();
      }
    });

  } catch (error) {
    log('⚠️ Falha ao tentar executar comando Docker.', 'yellow');
    finishCheck();
  }

  function finishCheck() {
    if (allGood) {
      log('\n🎉 Todos os serviços locais estão funcionando!', 'green');
    } else {
      log('\n⚠️ Alguns serviços não estão respondendo. Verifique se os processos estão rodando:', 'yellow');
      log('node start-system-no-docker.js', 'cyan');
    }
  }
}

main();