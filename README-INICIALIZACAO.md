# 🚀 Scripts de Inicialização Automática - Loja Moderna

Este projeto inclui scripts automatizados para inicializar tanto o backend (NestJS) quanto o frontend (Next.js) simultaneamente.

## 📋 Pré-requisitos

- **Node.js** (versão 16 ou superior)
- **NPM** (incluído com Node.js)
- Dependências instaladas em ambos os projetos:
  ```bash
  cd backend-nestjs && npm install
  cd frontend && npm install
  ```

## 🎯 Scripts Disponíveis

### 1. **start.bat** (Recomendado para Windows)
```bash
# Duplo clique no arquivo ou execute no terminal:
start.bat
```

### 2. **start.ps1** (PowerShell)
```powershell
# Execute no PowerShell:
.\start.ps1
```

### 3. **start-auto.js** (Node.js direto)
```bash
# Execute diretamente:
node start-auto.js
```

## 🔧 Funcionalidades dos Scripts

### ✅ Verificações Automáticas
- **Dependências**: Verifica se `node_modules` existem
- **Arquivos**: Confirma presença dos `package.json`
- **Ambiente**: Detecta arquivos `.env` (opcional)
- **Node.js/NPM**: Valida instalação das ferramentas

### 🚀 Inicialização Inteligente
- **Backend primeiro**: Inicia NestJS na porta 8081
- **Frontend depois**: Inicia Next.js na porta 3000
- **Logs coloridos**: Diferencia saídas do backend e frontend
- **Detecção automática**: Confirma quando serviços estão prontos

### 🛑 Gerenciamento de Processos
- **Ctrl+C**: Para ambos os serviços simultaneamente
- **Timeout**: 30 segundos para cada serviço inicializar
- **Tratamento de erros**: Exibe mensagens claras em caso de falha

## 📊 Saída Esperada

```
🏪 Iniciando Loja Moderna...
==================================================
🔍 Verificando dependências...
✅ Todas as dependências estão instaladas!
🔍 Verificando arquivos de ambiente...
✅ Backend .env encontrado!
⚠️  Frontend .env.local não encontrado. Usando configurações padrão.

🚀 Iniciando serviços...
🚀 Iniciando Backend (NestJS)...
[Backend] > loja-moderna-backend@0.0.1 start
[Backend] > nest start
✅ Backend iniciado com sucesso!
📚 API Documentation: http://localhost:8081/api/docs

🚀 Iniciando Frontend (Next.js)...
[Frontend] > frontend@0.1.0 dev
[Frontend] > next dev --turbo
✅ Frontend iniciado com sucesso!
🌐 Aplicação: http://localhost:3000

==================================================
🎉 Sistema iniciado com sucesso!
🌐 Frontend: http://localhost:3000
🔧 Backend: http://localhost:8081
📚 API Docs: http://localhost:8081/api/docs
==================================================

💡 Pressione Ctrl+C para parar todos os serviços
```

## 🌐 URLs do Sistema

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:3000 | Interface da loja |
| **Backend** | http://localhost:8081 | API REST |
| **API Docs** | http://localhost:8081/api/docs | Documentação Swagger |

## 🐛 Solução de Problemas

### ❌ "Backend node_modules não encontrado"
```bash
cd backend-nestjs
npm install
```

### ❌ "Frontend node_modules não encontrado"
```bash
cd frontend
npm install
```

### ❌ "Node.js não encontrado"
- Instale o Node.js: https://nodejs.org/
- Reinicie o terminal após a instalação

### ❌ "Timeout - não iniciou em 30 segundos"
- Verifique se as portas 3000 e 8081 estão livres
- Execute `netstat -ano | findstr :3000` e `netstat -ano | findstr :8081`
- Termine processos que estejam usando essas portas

### ❌ Erro de permissão no PowerShell
```powershell
# Execute como administrador:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📝 Notas Importantes

- **Ordem de inicialização**: O backend sempre inicia primeiro
- **Dependências**: Scripts verificam automaticamente se tudo está instalado
- **Logs**: Cada serviço tem logs prefixados para fácil identificação
- **Encerramento**: Use Ctrl+C para parar ambos os serviços de forma segura

## 🔄 Desenvolvimento

Para modificar os scripts:
- **start-auto.js**: Lógica principal de inicialização
- **start.bat**: Interface batch para Windows
- **start.ps1**: Interface PowerShell com cores

---

**Desenvolvido para o projeto Loja Moderna** 🏪