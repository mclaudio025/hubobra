@echo off
echo 🚀 Migrando projeto para PostgreSQL...

REM 1. Parar serviços existentes
echo ⏹️ Parando serviços existentes...
cd infra
docker-compose down

REM 2. Configurar PostgreSQL
echo 🐘 Configurando PostgreSQL...
cd ..\backend-nestjs

REM Fazer backup do SQLite se existir
if exist "prisma\dev.db" (
  echo 💾 Fazendo backup do SQLite...
  copy "prisma\dev.db" "prisma\dev.db.backup"
)

REM 3. Gerar nova migração
echo 🔄 Gerando migração para PostgreSQL...
npx prisma migrate dev --name migrate_to_postgresql

REM 4. Executar seed
echo 🌱 Executando seed...
npx prisma db seed

REM 5. Iniciar serviços com Docker
echo 🐳 Iniciando serviços com Docker...
cd ..\infra
docker-compose up -d postgres redis

REM Aguardar PostgreSQL estar pronto
echo ⏳ Aguardando PostgreSQL...
timeout /t 10 /nobreak >nul

REM 6. Testar conexão
echo 🔍 Testando conexão...
cd ..\backend-nestjs
npx prisma db push

if %errorlevel% == 0 (
  echo ✅ Migração concluída com sucesso!
  echo 📊 PostgreSQL: postgresql://postgres:password@localhost:5432/ecommerce_db
  echo 🔴 Redis: redis://localhost:6379
  echo.
  echo 🚀 Para iniciar o desenvolvimento:
  echo    npm run dev
  echo.
  echo 🐳 Para usar Docker:
  echo    cd infra ^&^& docker-compose up
) else (
  echo ❌ Erro na migração. Verifique os logs.
  exit /b 1
)