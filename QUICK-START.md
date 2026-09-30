# 🚀 Inicialização Rápida - Loja Moderna + Zé da Obra 2.0

## ⚡ Comandos Super Rápidos

### Iniciar tudo automaticamente:
```bash
npm start
```

### Verificar status:
```bash
npm run status
```

### Parar tudo:
```bash
npm stop
```

### Testar Zé da Obra:
```bash
npm run test:ze
```

## 🎯 O que o `npm start` faz automaticamente:

1. ✅ Verifica se Docker está instalado
2. ✅ Inicia PostgreSQL + Redis
3. ✅ Executa migrações do banco
4. ✅ Popula dados iniciais
5. ✅ Inicia backend NestJS (porta 8081)
6. ✅ Testa Zé da Obra 2.0
7. ✅ Inicia frontend Next.js (porta 3000)
8. ✅ Mostra resumo completo

## 🌐 URLs após inicialização:

- **Loja**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
- **Backend API**: http://localhost:8081
- **Health Check**: http://localhost:8081/health
- **Evolution API**: http://localhost:8080
- **PgAdmin**: http://localhost:5433

## 🤖 Testando o Zé da Obra 2.0:

```bash
# Ver status do sistema
npm run test:ze status

# Simular conversas
npm run test:ze conversa
```

## 🔧 Comandos Manuais (se necessário):

```bash
# Apenas infraestrutura
npm run docker:up

# Apenas backend
cd backend-nestjs && npm run start:dev

# Apenas frontend
cd frontend && npm run dev

# Banco de dados
npm run db:studio  # Interface visual do banco
```

## 🆘 Resolução de Problemas:

### Se algo não funcionar:
```bash
npm stop
npm start
```

### Se o banco estiver com problemas:
```bash
npm run docker:down
npm run docker:up
npm run db:migrate
npm run db:seed
```

### Verificar logs:
```bash
npm run status
```

## 🎉 Pronto!

Agora você pode iniciar todo o sistema com apenas **um comando**:

```bash
npm start
```

E acessar a loja em: **http://localhost:3000**