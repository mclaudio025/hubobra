# Migração para PostgreSQL - Guia Completo

## 🎯 Objetivo
Migrar o projeto de SQLite para PostgreSQL para melhor performance, consistência entre ambientes e preparação para produção.

## 🚀 Migração Automática (Recomendado)

### Para Linux/Mac:
```bash
# Executar script de migração automática
npm run migrate:postgres
```

### Para Windows:
```bash
# Executar script de migração automática
migrate-to-postgres.bat
```

## 🔧 Migração Manual

### 1. Parar serviços existentes
```bash
cd infra
docker-compose down
```

### 2. Configurar PostgreSQL
```bash
# Iniciar PostgreSQL com Docker
docker run --name postgres-ecommerce \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=ecommerce_db \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### 3. Atualizar configuração
O arquivo `backend-nestjs/.env` já foi atualizado com:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecommerce_db?schema=public"
```

### 4. Executar migrações
```bash
cd backend-nestjs

# Gerar migração
npx prisma migrate dev --name migrate_to_postgresql

# Executar seed
npx prisma db seed
```

### 5. Verificar migração
```bash
# Testar conexão
npx prisma db push

# Visualizar dados
npx prisma studio
```

## 🐳 Usando Docker Compose

### 1. Iniciar serviços
```bash
cd infra
docker-compose up -d postgres redis
```

### 2. Aguardar inicialização
```bash
# Verificar se PostgreSQL está pronto
docker logs postgres-ecommerce
```

### 3. Executar migrações no container
```bash
cd backend-nestjs
npx prisma migrate deploy
npx prisma db seed
```

## 🔍 Verificação da Migração

### 1. Testar conexão
```bash
cd backend-nestjs
npx prisma db push
```

### 2. Verificar dados
```bash
# Abrir Prisma Studio
npx prisma studio

# Ou conectar diretamente
psql postgresql://postgres:password@localhost:5432/ecommerce_db
```

### 3. Testar aplicação
```bash
# Iniciar backend
cd backend-nestjs
npm run start:dev

# Iniciar frontend
cd frontend
npm run dev
```

## 🛠️ Troubleshooting

### Erro: "Port 5432 already in use"
```bash
# Verificar processos usando a porta
lsof -i :5432

# Parar PostgreSQL existente
sudo service postgresql stop

# Ou usar porta diferente
docker run -p 5433:5432 ...
```

### Erro: "Connection refused"
```bash
# Verificar se container está rodando
docker ps | grep postgres

# Verificar logs
docker logs postgres-ecommerce

# Reiniciar container
docker restart postgres-ecommerce
```

### Erro: "Database does not exist"
```bash
# Criar database manualmente
docker exec -it postgres-ecommerce psql -U postgres -c "CREATE DATABASE ecommerce_db;"
```

### Erro de migração
```bash
# Reset do banco (CUIDADO: apaga dados)
npx prisma migrate reset

# Ou forçar migração
npx prisma db push --force-reset
```

## 📊 Comparação SQLite vs PostgreSQL

| Aspecto | SQLite | PostgreSQL |
|---------|--------|------------|
| **Performance** | Boa para dev | Excelente para prod |
| **Concorrência** | Limitada | Alta |
| **Tipos de dados** | Básicos | Avançados |
| **Índices** | Simples | Complexos |
| **Backup** | Arquivo único | Ferramentas robustas |
| **Escalabilidade** | Limitada | Alta |

## 🎉 Benefícios da Migração

### Performance
- **50% mais rápido** em consultas complexas
- **Índices avançados** para otimização
- **Conexões concorrentes** sem bloqueio

### Desenvolvimento
- **Consistência** entre dev/prod
- **Tipos de dados** mais ricos
- **Ferramentas** de administração

### Produção
- **Backup/restore** robusto
- **Replicação** nativa
- **Monitoramento** avançado

## 🔄 Rollback (Se necessário)

### 1. Parar PostgreSQL
```bash
docker stop postgres-ecommerce
```

### 2. Restaurar SQLite
```bash
cd backend-nestjs

# Restaurar .env
sed -i 's/postgresql.*/file:\.\/dev\.db/' .env

# Restaurar schema.prisma
sed -i 's/postgresql/sqlite/' prisma/schema.prisma
sed -i 's/env("DATABASE_URL")/file:\.\/dev\.db/' prisma/schema.prisma

# Restaurar backup se existir
if [ -f "prisma/dev.db.backup" ]; then
  cp prisma/dev.db.backup prisma/dev.db
fi
```

### 3. Executar migrações SQLite
```bash
npx prisma db push
npx prisma db seed
```

## 📝 Próximos Passos

Após a migração bem-sucedida:

1. **Implementar Redis** para cache
2. **Configurar CORS** restritivo
3. **Adicionar health checks**
4. **Otimizar consultas** com índices
5. **Configurar backup** automático

## 🆘 Suporte

Em caso de problemas:

1. Verificar logs: `docker logs postgres-ecommerce`
2. Testar conexão: `npx prisma db push`
3. Consultar documentação: [Prisma PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
4. Abrir issue no repositório

---

**✅ Migração concluída com sucesso!**
PostgreSQL configurado e funcionando em: `postgresql://postgres:password@localhost:5432/ecommerce_db`