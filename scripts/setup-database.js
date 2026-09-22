#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bold');
  console.log('='.repeat(60));
}

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      stdio: 'inherit', 
      cwd: options.cwd || process.cwd(),
      ...options 
    });
    return result;
  } catch (error) {
    log(`❌ Erro ao executar: ${command}`, 'red');
    log(`   ${error.message}`, 'red');
    throw error;
  }
}

// Verificar se PostgreSQL está rodando
function checkPostgreSQL() {
  logSection('🔍 VERIFICANDO POSTGRESQL');
  
  try {
    // Tentar conectar usando psql
    execCommand('psql --version', { stdio: 'pipe' });
    log('✅ PostgreSQL CLI encontrado', 'green');
    
    // Verificar se o servidor está rodando
    const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ecommerce_db';
    execCommand(`psql "${dbUrl}" -c "SELECT version();"`, { stdio: 'pipe' });
    log('✅ PostgreSQL servidor está rodando', 'green');
    
    return true;
  } catch (error) {
    log('❌ PostgreSQL não está disponível', 'red');
    log('   Execute: docker-compose up -d postgres', 'yellow');
    return false;
  }
}

// Verificar se Redis está rodando
function checkRedis() {
  logSection('🔍 VERIFICANDO REDIS');
  
  try {
    execCommand('redis-cli ping', { stdio: 'pipe' });
    log('✅ Redis está rodando', 'green');
    return true;
  } catch (error) {
    log('❌ Redis não está disponível', 'red');
    log('   Execute: docker-compose up -d redis', 'yellow');
    return false;
  }
}

// Configurar variáveis de ambiente
function setupEnvironment() {
  logSection('⚙️  CONFIGURANDO AMBIENTE');
  
  const backendEnvPath = path.join(__dirname, '../backend-nestjs/.env');
  const frontendEnvPath = path.join(__dirname, '../frontend/.env.local');
  
  // Backend .env
  const backendEnvContent = `
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecommerce_db?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# CORS
CORS_ORIGIN="http://localhost:3000"

# Server
PORT=8081
NODE_ENV=development

# Logs
LOG_LEVEL=info

# Upload
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=10485760

# AI
OPENAI_API_KEY="your-openai-api-key"
GEMINI_API_KEY="your-gemini-api-key"

# WhatsApp (opcional)
WHATSAPP_TOKEN="your-whatsapp-token"
WHATSAPP_PHONE_ID="your-phone-id"

# Email (opcional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
`.trim();

  // Frontend .env.local
  const frontendEnvContent = `
# API URLs
NEXT_PUBLIC_API_URL=http://localhost:8081
NEXT_PUBLIC_IA_URL=http://localhost:8000

# Environment
NODE_ENV=development

# Features
NEXT_PUBLIC_ENABLE_AI=true
NEXT_PUBLIC_ENABLE_WHATSAPP=true
`.trim();

  // Escrever arquivos .env
  fs.writeFileSync(backendEnvPath, backendEnvContent);
  log(`✅ Arquivo .env criado: ${backendEnvPath}`, 'green');
  
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  log(`✅ Arquivo .env.local criado: ${frontendEnvPath}`, 'green');
  
  log('⚠️  Lembre-se de configurar suas chaves de API!', 'yellow');
}

// Executar migrações do Prisma
function runMigrations() {
  logSection('🔄 EXECUTANDO MIGRAÇÕES');
  
  const backendPath = path.join(__dirname, '../backend-nestjs');
  
  try {
    // Gerar cliente Prisma
    log('📦 Gerando cliente Prisma...', 'blue');
    execCommand('npx prisma generate', { cwd: backendPath });
    
    // Executar migrações
    log('🔄 Executando migrações...', 'blue');
    execCommand('npx prisma migrate dev --name init', { cwd: backendPath });
    
    log('✅ Migrações executadas com sucesso', 'green');
  } catch (error) {
    log('❌ Erro nas migrações', 'red');
    throw error;
  }
}

// Executar seed do banco
function runSeed() {
  logSection('🌱 EXECUTANDO SEED');
  
  const backendPath = path.join(__dirname, '../backend-nestjs');
  
  try {
    log('🌱 Populando banco com dados iniciais...', 'blue');
    execCommand('npx prisma db seed', { cwd: backendPath });
    
    log('✅ Seed executado com sucesso', 'green');
  } catch (error) {
    log('❌ Erro no seed', 'red');
    log('   Verifique se o arquivo prisma/seed.ts existe', 'yellow');
  }
}

// Verificar status do banco
function checkDatabaseStatus() {
  logSection('📊 STATUS DO BANCO');
  
  const backendPath = path.join(__dirname, '../backend-nestjs');
  
  try {
    // Verificar status das migrações
    log('🔍 Verificando status das migrações...', 'blue');
    execCommand('npx prisma migrate status', { cwd: backendPath });
    
    // Mostrar estatísticas do banco
    log('📊 Estatísticas do banco:', 'blue');
    const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ecommerce_db';
    
    const queries = [
      "SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;",
      "SELECT COUNT(*) as total_users FROM users;",
      "SELECT COUNT(*) as total_products FROM products;",
      "SELECT COUNT(*) as total_categories FROM categories;",
      "SELECT COUNT(*) as total_orders FROM orders;"
    ];
    
    for (const query of queries) {
      try {
        execCommand(`psql "${dbUrl}" -c "${query}"`, { stdio: 'inherit' });
      } catch (error) {
        // Ignorar erros de queries específicas
      }
    }
    
  } catch (error) {
    log('❌ Erro ao verificar status', 'red');
  }
}

// Backup do banco
function backupDatabase() {
  logSection('💾 BACKUP DO BANCO');
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup_${timestamp}.sql`;
    const backupPath = path.join(__dirname, '../backups', backupFile);
    
    // Criar diretório de backups
    const backupsDir = path.dirname(backupPath);
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ecommerce_db';
    
    log(`💾 Criando backup: ${backupFile}`, 'blue');
    execCommand(`pg_dump "${dbUrl}" > "${backupPath}"`);
    
    log(`✅ Backup criado: ${backupPath}`, 'green');
    
    // Mostrar tamanho do arquivo
    const stats = fs.statSync(backupPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    log(`   Tamanho: ${fileSizeInMB} MB`, 'blue');
    
  } catch (error) {
    log('❌ Erro ao criar backup', 'red');
  }
}

// Restaurar backup
function restoreDatabase(backupFile) {
  logSection('🔄 RESTAURANDO BACKUP');
  
  if (!backupFile) {
    log('❌ Especifique o arquivo de backup', 'red');
    log('   Uso: node setup-database.js restore backup_file.sql', 'yellow');
    return;
  }
  
  const backupPath = path.join(__dirname, '../backups', backupFile);
  
  if (!fs.existsSync(backupPath)) {
    log(`❌ Arquivo não encontrado: ${backupPath}`, 'red');
    return;
  }
  
  try {
    const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ecommerce_db';
    
    log(`🔄 Restaurando backup: ${backupFile}`, 'blue');
    log('⚠️  Isso irá sobrescrever todos os dados atuais!', 'yellow');
    
    // Confirmar ação
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('Continuar? (y/N): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        execCommand(`psql "${dbUrl}" < "${backupPath}"`);
        log('✅ Backup restaurado com sucesso', 'green');
      } else {
        log('❌ Operação cancelada', 'yellow');
      }
      readline.close();
    });
    
  } catch (error) {
    log('❌ Erro ao restaurar backup', 'red');
  }
}

// Resetar banco (desenvolvimento)
function resetDatabase() {
  logSection('🔄 RESETANDO BANCO');
  
  const backendPath = path.join(__dirname, '../backend-nestjs');
  
  try {
    log('⚠️  Resetando banco de dados...', 'yellow');
    
    // Reset das migrações
    execCommand('npx prisma migrate reset --force', { cwd: backendPath });
    
    // Executar seed novamente
    runSeed();
    
    log('✅ Banco resetado com sucesso', 'green');
    
  } catch (error) {
    log('❌ Erro ao resetar banco', 'red');
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'setup';
  
  log('🐘 CONFIGURAÇÃO POSTGRESQL - E-COMMERCE', 'bold');
  log(`Comando: ${command}`, 'blue');
  
  // Carregar variáveis de ambiente
  require('dotenv').config({ path: path.join(__dirname, '../backend-nestjs/.env') });
  
  switch (command) {
    case 'setup':
      log('🚀 Configuração completa do banco de dados', 'blue');
      setupEnvironment();
      
      if (!checkPostgreSQL()) {
        log('💡 Para iniciar PostgreSQL:', 'yellow');
        log('   cd infra && docker-compose up -d postgres', 'yellow');
        return;
      }
      
      checkRedis();
      runMigrations();
      runSeed();
      checkDatabaseStatus();
      break;
      
    case 'check':
      checkPostgreSQL();
      checkRedis();
      checkDatabaseStatus();
      break;
      
    case 'migrate':
      if (checkPostgreSQL()) {
        runMigrations();
      }
      break;
      
    case 'seed':
      if (checkPostgreSQL()) {
        runSeed();
      }
      break;
      
    case 'backup':
      if (checkPostgreSQL()) {
        backupDatabase();
      }
      break;
      
    case 'restore':
      if (checkPostgreSQL()) {
        restoreDatabase(args[1]);
      }
      break;
      
    case 'reset':
      if (checkPostgreSQL()) {
        resetDatabase();
      }
      break;
      
    case 'env':
      setupEnvironment();
      break;
      
    default:
      log('❌ Comando não reconhecido', 'red');
      log('', 'reset');
      log('Comandos disponíveis:', 'yellow');
      log('  setup   - Configuração completa (padrão)', 'yellow');
      log('  check   - Verificar status dos serviços', 'yellow');
      log('  migrate - Executar migrações', 'yellow');
      log('  seed    - Executar seed do banco', 'yellow');
      log('  backup  - Criar backup do banco', 'yellow');
      log('  restore - Restaurar backup', 'yellow');
      log('  reset   - Resetar banco (desenvolvimento)', 'yellow');
      log('  env     - Configurar arquivos .env', 'yellow');
      break;
  }
  
  log('', 'reset');
  log('✅ Operação concluída!', 'green');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    log('❌ Erro fatal: ' + error.message, 'red');
    process.exit(1);
  });
}

module.exports = { main };