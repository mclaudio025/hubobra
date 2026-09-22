@echo off
echo 🐘 Configurando PostgreSQL para desenvolvimento...

REM Parar container existente se houver
docker stop postgres-ecommerce 2>nul
docker rm postgres-ecommerce 2>nul

REM Criar e iniciar container PostgreSQL
docker run --name postgres-ecommerce ^
  -e POSTGRES_USER=postgres ^
  -e POSTGRES_PASSWORD=password ^
  -e POSTGRES_DB=ecommerce_db ^
  -p 5432:5432 ^
  -d postgres:15-alpine

echo ⏳ Aguardando PostgreSQL inicializar...
timeout /t 5 /nobreak >nul

REM Verificar se está rodando
docker ps | findstr postgres-ecommerce >nul
if %errorlevel% == 0 (
  echo ✅ PostgreSQL está rodando!
  echo 📊 Conexão: postgresql://postgres:password@localhost:5432/ecommerce_db
  
  REM Executar migrações
  echo 🔄 Executando migrações...
  npx prisma migrate dev --name init
  
  REM Executar seed
  echo 🌱 Executando seed...
  npx prisma db seed
  
  echo 🎉 Setup concluído com sucesso!
) else (
  echo ❌ Erro ao iniciar PostgreSQL
  exit /b 1
)