#!/bin/bash

echo "🚀 Migrando projeto para PostgreSQL..."

# 1. Parar serviços existentes
echo "⏹️ Parando serviços existentes..."
cd infra && docker-compose down

# 2. Configurar PostgreSQL
echo "🐘 Configurando PostgreSQL..."
cd ../backend-nestjs

# Fazer backup do SQLite se existir
if [ -f "prisma/dev.db" ]; then
  echo "💾 Fazendo backup do SQLite..."
  cp prisma/dev.db prisma/dev.db.backup
fi

# 3. Gerar nova migração
echo "🔄 Gerando migração para PostgreSQL..."
npx prisma migrate dev --name migrate_to_postgresql

# 4. Executar seed
echo "🌱 Executando seed..."
npx prisma db seed

# 5. Iniciar serviços com Docker
echo "🐳 Iniciando serviços com Docker..."
cd ../infra
docker-compose up -d postgres redis

# Aguardar PostgreSQL estar pronto
echo "⏳ Aguardando PostgreSQL..."
sleep 10

# 6. Testar conexão
echo "🔍 Testando conexão..."
cd ../backend-nestjs
npx prisma db push

if [ $? -eq 0 ]; then
  echo "✅ Migração concluída com sucesso!"
  echo "📊 PostgreSQL: postgresql://postgres:password@localhost:5432/ecommerce_db"
  echo "🔴 Redis: redis://localhost:6379"
  echo ""
  echo "🚀 Para iniciar o desenvolvimento:"
  echo "   npm run dev"
  echo ""
  echo "🐳 Para usar Docker:"
  echo "   cd infra && docker-compose up"
else
  echo "❌ Erro na migração. Verifique os logs."
  exit 1
fi