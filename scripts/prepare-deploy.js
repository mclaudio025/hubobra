#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparando deploy para PlusHost...\n');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createDeployStructure() {
  log('📁 Criando estrutura de deploy...', 'blue');
  
  const deployDir = path.join(__dirname, '..', 'deploy');
  
  // Criar diretórios
  const dirs = [
    'deploy',
    'deploy/public_html',
    'deploy/nodejs',
    'deploy/database',
    'deploy/config'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      log(`  ✅ Criado: ${dir}`, 'green');
    }
  });
}

function buildFrontend() {
  log('🎨 Fazendo build do frontend...', 'blue');
  
  try {
    // Build do Next.js para produção
    execSync('cd frontend && npm run build', { stdio: 'inherit' });
    
    // Copiar arquivos para deploy
    const frontendBuild = path.join(__dirname, '..', 'frontend', '.next');
    const deployPublic = path.join(__dirname, '..', 'deploy', 'public_html');
    
    if (fs.existsSync(frontendBuild)) {
      execSync(`cp -r frontend/.next/* deploy/public_html/`, { stdio: 'inherit' });
      execSync(`cp -r frontend/public/* deploy/public_html/`, { stdio: 'inherit' });
      log('  ✅ Frontend copiado para deploy/', 'green');
    }
    
  } catch (error) {
    log('  ❌ Erro no build do frontend', 'red');
    console.error(error.message);
  }
}

function buildBackend() {
  log('⚙️ Fazendo build do backend...', 'blue');
  
  try {
    // Build do NestJS
    execSync('cd backend-nestjs && npm run build', { stdio: 'inherit' });
    
    // Copiar arquivos para deploy
    execSync(`cp -r backend-nestjs/dist/* deploy/nodejs/`, { stdio: 'inherit' });
    execSync(`cp backend-nestjs/package.json deploy/nodejs/`, { stdio: 'inherit' });
    execSync(`cp backend-nestjs/prisma deploy/nodejs/ -r`, { stdio: 'inherit' });
    
    log('  ✅ Backend copiado para deploy/', 'green');
    
  } catch (error) {
    log('  ❌ Erro no build do backend', 'red');
    console.error(error.message);
  }
}

function createProductionEnv() {
  log('🔧 Criando arquivo .env de produção...', 'blue');
  
  const envTemplate = `# Configurações de Produção - PlusHost
# IMPORTANTE: Substitua os valores pelos dados reais da sua hospedagem

# Database (PostgreSQL da PlusHost)
DATABASE_URL="postgresql://usuario_loja:SENHA_AQUI@localhost:5432/usuario_loja_moderna"

# URLs do seu domínio
NEXT_PUBLIC_API_URL="https://seudominio.com.br/api"
FRONTEND_URL="https://seudominio.com.br"

# JWT Secret (gere uma chave forte)
JWT_SECRET="sua-chave-jwt-super-secreta-aqui-128-caracteres-minimo"

# Upload de arquivos
UPLOAD_DIR="/home/usuario/public_html/uploads"
MAX_FILE_SIZE="10485760"

# Cache Redis (se disponível)
REDIS_URL="redis://localhost:6379"

# Email (configurar com dados da PlusHost)
SMTP_HOST="mail.seudominio.com.br"
SMTP_PORT="587"
SMTP_USER="noreply@seudominio.com.br"
SMTP_PASS="senha-do-email"

# IA (opcional - adicionar se quiser usar)
OPENAI_API_KEY=""
GEMINI_API_KEY=""

# WhatsApp (opcional)
WHATSAPP_API_URL=""
WHATSAPP_API_TOKEN=""

# Configurações de produção
NODE_ENV="production"
PORT="3000"
`;

  fs.writeFileSync(path.join(__dirname, '..', 'deploy', 'nodejs', '.env'), envTemplate);
  log('  ✅ Arquivo .env criado em deploy/nodejs/', 'green');
}

function createHtaccess() {
  log('🌐 Criando arquivo .htaccess...', 'blue');
  
  const htaccessContent = `# Configuração para Loja Moderna na PlusHost
RewriteEngine On

# Redirecionar HTTP para HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# API routes para Node.js
RewriteRule ^api/(.*)$ /nodejs/$1 [P,L]

# Frontend routes (Next.js)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# Compressão Gzip
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Cache de arquivos estáticos
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/webp "access plus 1 month"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/pdf "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType application/json "access plus 1 week"
</IfModule>

# Headers de segurança
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Bloquear acesso a arquivos sensíveis
<Files ".env">
    Order allow,deny
    Deny from all
</Files>

<Files "*.log">
    Order allow,deny
    Deny from all
</Files>
`;

  fs.writeFileSync(path.join(__dirname, '..', 'deploy', 'public_html', '.htaccess'), htaccessContent);
  log('  ✅ Arquivo .htaccess criado', 'green');
}

function createDatabaseScripts() {
  log('🗄️ Criando scripts de banco de dados...', 'blue');
  
  const migrationScript = `#!/bin/bash
# Script para executar migrações na PlusHost

echo "🗄️ Executando migrações do banco de dados..."

cd /home/usuario/nodejs

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install --production
fi

# Executar migrações
echo "🔄 Executando migrações..."
npx prisma migrate deploy

# Popular dados iniciais (apenas na primeira vez)
echo "🌱 Populando dados iniciais..."
npx prisma db seed

echo "✅ Banco de dados configurado com sucesso!"
`;

  fs.writeFileSync(path.join(__dirname, '..', 'deploy', 'database', 'setup.sh'), migrationScript);
  
  // Tornar executável
  try {
    execSync('chmod +x deploy/database/setup.sh');
  } catch (error) {
    // Ignorar erro no Windows
  }
  
  log('  ✅ Scripts de banco criados', 'green');
}

function createDeployInstructions() {
  log('📋 Criando instruções de deploy...', 'blue');
  
  const instructions = `# 🚀 Instruções de Deploy - PlusHost

## Arquivos Preparados:

### 📁 deploy/public_html/
- Frontend Next.js buildado
- Arquivo .htaccess configurado
- Copiar todo conteúdo para public_html/ na PlusHost

### 📁 deploy/nodejs/
- Backend NestJS buildado
- Arquivo .env (CONFIGURE AS VARIÁVEIS!)
- Copiar todo conteúdo para nodejs/ na PlusHost

### 📁 deploy/database/
- Scripts de configuração do banco
- Executar setup.sh via SSH ou cPanel Terminal

## 🔧 Passos no cPanel da PlusHost:

### 1. Configurar Node.js App:
- Versão: Node.js 18.x
- Diretório: nodejs/
- Arquivo de inicialização: dist/main.js
- URL: /api

### 2. Configurar Banco de Dados:
- Criar banco PostgreSQL
- Anotar credenciais
- Atualizar .env com dados reais

### 3. Upload dos Arquivos:
- public_html/ → Raiz do site
- nodejs/ → Aplicação Node.js
- Instalar dependências via cPanel

### 4. Testar:
- https://seudominio.com.br (Frontend)
- https://seudominio.com.br/api/health (Backend)

## ⚠️ IMPORTANTE:
1. Edite deploy/nodejs/.env com dados reais
2. Configure domínio e SSL
3. Teste todas as funcionalidades
4. Configure backups automáticos

## 📞 Suporte:
- PlusHost: https://plushost.com.br/suporte
- Documentação: docs/DEPLOY_PLUSHOST.md
`;

  fs.writeFileSync(path.join(__dirname, '..', 'deploy', 'INSTRUCOES.md'), instructions);
  log('  ✅ Instruções criadas', 'green');
}

function createPackageJsonForProduction() {
  log('📦 Criando package.json otimizado...', 'blue');
  
  // Ler package.json do backend
  const backendPackage = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'backend-nestjs', 'package.json'), 'utf8')
  );
  
  // Criar versão otimizada para produção
  const productionPackage = {
    name: 'loja-moderna-api',
    version: backendPackage.version,
    description: 'API da Loja Moderna - Produção',
    main: 'dist/main.js',
    scripts: {
      start: 'node dist/main.js',
      'db:migrate': 'npx prisma migrate deploy',
      'db:seed': 'npx prisma db seed'
    },
    dependencies: {
      // Apenas dependências de produção
      ...Object.fromEntries(
        Object.entries(backendPackage.dependencies || {})
          .filter(([key]) => !key.includes('@types/'))
      )
    },
    engines: {
      node: '>=18.0.0'
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, '..', 'deploy', 'nodejs', 'package.json'),
    JSON.stringify(productionPackage, null, 2)
  );
  
  log('  ✅ package.json otimizado criado', 'green');
}

// Executar todas as funções
async function main() {
  try {
    createDeployStructure();
    buildFrontend();
    buildBackend();
    createProductionEnv();
    createHtaccess();
    createDatabaseScripts();
    createPackageJsonForProduction();
    createDeployInstructions();
    
    log('\n🎉 Deploy preparado com sucesso!', 'green');
    log('\n📋 Próximos passos:', 'yellow');
    log('1. Edite deploy/nodejs/.env com dados reais da PlusHost', 'white');
    log('2. Faça upload dos arquivos conforme INSTRUCOES.md', 'white');
    log('3. Configure Node.js App no cPanel', 'white');
    log('4. Execute setup do banco de dados', 'white');
    log('5. Teste o site em produção', 'white');
    
    log('\n📁 Arquivos prontos em: ./deploy/', 'blue');
    
  } catch (error) {
    log('\n❌ Erro durante a preparação:', 'red');
    console.error(error);
    process.exit(1);
  }
}

main();