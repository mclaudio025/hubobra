@echo off
echo Iniciando PostgreSQL com Docker...
docker run --name postgres-dev -e POSTGRES_PASSWORD=password -e POSTGRES_DB=ecommerce_db -p 5432:5432 -d postgres:15-alpine

echo Aguardando PostgreSQL inicializar...
timeout /t 10

echo PostgreSQL iniciado! Configurando banco...
cd backend-nestjs
npx prisma db push
npx prisma db seed

echo Setup completo!
pause