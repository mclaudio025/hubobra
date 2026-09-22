#!/bin/bash

echo "🐘 Configurando PostgreSQL para desenvolvimento..."

# Parar container existente se houver
docker stop postgres-ecommerce 2>/dev/null || true
docker rm postgres-ecommerce 2>/dev/null || true

# Criar e iniciar container PostgreSQL
docker run --name postgres-ecommerce \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=ecommerce_db \
  -p 5432:5432 \
  -d postgres:15-alpine

echo "⏳ Aguardando PostgreSQL inicializar..."
sleep 5

# Verificar se está rodando
if docker ps | grep -q postgres-ecommerce; then
  echo "✅ PostgreSQL está rodando!"
  echo "📊 Conexão: postgresql://postgres:password@localhost:5432/ecommerce_db"
  
  # Executar migrações
  echo "🔄 Executando migrações..."
  npx prisma migrate dev --name init
  
  # Executar seed
  echo "🌱 Executando seed..."
  npx prisma db seed
  
  echo "🎉 Setup concluído com sucesso!"
else
  echo "❌ Erro ao iniciar PostgreSQL"
  exit 1
fi