# Setup do Projeto - Guia Completo

## Pré-requisitos

- Node.js 18+ 
- Python 3.11+
- Docker e Docker Compose
- Git

## Setup Rápido

1. **Clone o repositório**
```bash
git clone <repo-url>
cd ecommerce-materiais-construcao
```

2. **Setup automático**
```bash
npm run setup
```

3. **Inicie os serviços**
```bash
# Opção 1: Com Docker (recomendado)
npm run docker:up

# Opção 2: Desenvolvimento local
npm run dev
```

4. **Acesse as aplicações**
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- IA Service: http://localhost:8000
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Elasticsearch: http://localhost:9200

## Setup Manual

### 1. Instalar dependências

```bash
# Root
npm install

# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

# IA Service
cd ../ia
pip install -r requirements.txt
```

### 2. Configurar variáveis de ambiente

```bash
# Root
cp .env.example .env

# Frontend
cp frontend/.env.example frontend/.env.local

# Backend
cp backend/.env.example backend/.env

# IA Service
cp ia/.env.example ia/.env
```

### 3. Configurar banco de dados

```bash
# Opção 1: Script automático (recomendado)
npm run migrate:postgres

# Opção 2: PostgreSQL manual
npm run postgres:setup

# Opção 3: Com Docker Compose
cd infra
docker-compose up postgres redis -d

# Opção 4: PostgreSQL standalone
docker run --name postgres-ecommerce \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=ecommerce_db \
  -p 5432:5432 \
  -d postgres:15-alpine
```

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev                 # Inicia todos os serviços
npm run dev:frontend       # Apenas frontend
npm run dev:backend        # Apenas backend
npm run dev:ia            # Apenas IA service

# Build
npm run build             # Build de todos os serviços
npm run build:frontend    # Build apenas frontend
npm run build:backend     # Build apenas backend

# Docker
npm run docker:up         # Sobe todos os containers
npm run docker:down       # Para todos os containers
npm run docker:build      # Rebuild dos containers

# Instalação
npm run install:all       # Instala todas as dependências
```

## Estrutura do Projeto

```
├── frontend/          # Next.js + React
├── backend/           # Express + TypeScript
├── ia/               # FastAPI + Python
├── infra/            # Docker, Kubernetes, CI/CD
├── .github/          # GitHub Actions
└── docs/             # Documentação
```

## Troubleshooting

### Problemas comuns

1. **Porta já em uso**
   - Frontend (3000): `lsof -ti:3000 | xargs kill -9`
   - Backend (8080): `lsof -ti:8080 | xargs kill -9`
   - IA (8000): `lsof -ti:8000 | xargs kill -9`

2. **Erro de conexão com banco**
   - Verifique se o PostgreSQL está rodando
   - Confirme as credenciais no .env

3. **Dependências Python**
   - Use um ambiente virtual: `python -m venv venv && source venv/bin/activate`

4. **Docker issues**
   - Limpe containers: `docker system prune -a`
   - Rebuild: `npm run docker:build`

## Próximos Passos

Após o setup, consulte o arquivo `detalhes_projeto.md` para entender as próximas fases de desenvolvimento.