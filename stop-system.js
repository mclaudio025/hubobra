#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🛑 Parando Sistema Loja Moderna + Zé da Obra 2.0\n');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runCommand(command, cwd = process.cwd()) {
  return new Promise((resolve) => {
    const child = spawn(command, { 
      shell: true, 
      cwd,
      stdio: 'pipe'
    });
    
    child.on('close', () => resolve());
  });
}

async function main() {
  try {
    log('🔄 Parando processos Node.js...', 'yellow');
    await runCommand('taskkill /f /im node.exe || true');
    
    log('🐳 Parando containers Docker...', 'yellow');
    await runCommand('docker-compose down', path.join(__dirname, 'infra'));
    
    log('🧹 Limpando containers órfãos...', 'yellow');
    await runCommand('docker rm -f postgres-ecommerce redis-ecommerce evolution_v2 || true');
    
    log('✅ Sistema parado com sucesso!', 'green');
    
  } catch (error) {
    log(`❌ Erro: ${error.message}`, 'red');
  }
}

main();