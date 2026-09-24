# 🚀 Guia de Deploy na VPS Contabo com Easypanel

Este documento descreve a arquitetura de produção e os procedimentos de implantação contínua da aplicação **HubConstruções (Loja Moderna)** hospedada em **VPS Contabo** gerenciada via **Easypanel (Docker)** com banco de dados e mídia no **Supabase**.

---

## 🏗️ 1. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE CLOUD                           │
│   • PostgreSQL Database (aws-0-sa-east-1.pooler.supabase)   │
│   • Storage CDN (Bucket 'products' para imagens WebP)       │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 VPS CONTABO + EASYPANEL                     │
│                                                             │
│  ┌────────────────────────┐     ┌────────────────────────┐  │
│  │     SERVIÇO: api       │     │    SERVIÇO: frontend   │  │
│  │     (NestJS API)       │◄────┤    (Next.js App)       │  │
│  │   Porta Interna 8081   │     │   Porta Interna 3000   │  │
│  └────────────────────────┘     └────────────────────────┘  │
│                                                             │
│  ┌────────────────────────┐     ┌────────────────────────┐  │
│  │     SERVIÇO: n8n       │     │   SERVIÇO: n8nredis    │  │
│  │  (Automação WhatsApp)  │◄────┤     (Redis Cache)      │  │
│  └────────────────────────┘     └────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               ▲
                               │ git push origin main
┌──────────────────────────────┴──────────────────────────────┐
│                  REPOSITÓRIO GITHUB                         │
│               mclaudio025/hubobra (branch: main)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 2. Serviços no Easypanel

O projeto no Easypanel (projeto `n8n`) é composto pelos seguintes serviços:

| Serviço | Tipo | Porta Interna | Descrição |
| :--- | :--- | :--- | :--- |
| **`frontend`** | App (Next.js) | `3000` | Vitrine da loja, painel admin e SSR |
| **`api`** | App (NestJS) | `8081` | Backend REST, autenticação, catálogo e regras |
| **`n8n`** | App | `5678` | Motor de fluxos e atendimento IA WhatsApp |
| **`n8nredis`** | Database / Service | `6379` | Cache e mensageria para o n8n |

---

## 🔄 3. Fluxo de Implantação (Deploy)

O Easypanel está conectado diretamente ao repositório GitHub (`mclaudio025/hubobra`).

### 3.1. Como publicar alterações:

1. **Faça o commit e push das alterações para a branch `main`:**
   ```powershell
   git add .
   git commit -m "feat/fix: descrição da alteração"
   git push origin main
   ```

2. **No painel Easypanel:**
   - Acesse seu painel: `http://SEU_IP_CONTABO:3000`
   - Abra o projeto `n8n`
   - Clique no serviço correspondente (**`frontend`** ou **`api`**)
   - Clique no botão verde **"Implantar"** (Deploy)
   - O Easypanel puxará o código mais recente, executará o build do container Docker e subirá a nova versão com zero downtime.

---

## ⚙️ 4. Variáveis de Ambiente Essenciais

### 4.1. Serviço `api` (Backend NestJS):
```env
PORT=8081
BASE_URL="https://api.seudominio.com.br"
FRONTEND_URL="https://seudominio.com.br"
DATABASE_URL="postgresql://postgres.xxx:senha@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:senha@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="sua-chave-secreta-jwt"
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_BUCKET_NAME="products"
NODE_ENV=production
```

### 4.2. Serviço `frontend` (Next.js):
```env
NEXT_PUBLIC_API_URL="https://api.seudominio.com.br"
NEXT_PUBLIC_SITE_URL="https://seudominio.com.br"
NODE_ENV=production
```

---

## 🛠️ 5. Resolução de Problemas Comuns

- **Deploy dura 1-2 segundos e não atualiza:** Verifique se as alterações locais foram comitadas e enviadas para o GitHub com `git push origin main`.
- **Erro de Conexão com o Banco:** Certifique-se de que a variável `DATABASE_URL` utiliza o Connection Pooler do Supabase (porta 6543) com `pgbouncer=true`.
- **Logs em Tempo Real:** No Easypanel, acesse a aba **"Logs"** de qualquer serviço para acompanhar o output da aplicação e do build em tempo real.
