# CONTEXTO PARA IA — HubObra (handoff)

> **Leia este arquivo inteiro antes de agir.** Ele foi escrito para uma IA (ou pessoa) que **nunca viu o projeto**.
> Última atualização: 2026-10-07 · Frente de trabalho ativa: **Roteamento e resiliência em deploys (zero-downtime)**

---

## 0. Regras de uso deste documento

1. **Cada afirmação tem um selo de evidência.** Respeite-o:
   - `✅ VERIFICADO` — conferido no código, no git ou em print/saída real, com data.
   - `🟡 SUPOSTO` — provável, mas ninguém confirmou. **Confirme antes de usar.**
   - `❌ REFUTADO` — já foi dito em algum documento, mas está errado.
   - `⏳ PENDENTE` — precisa ser medido/verificado (ver seção 8).
2. **Documentos antigos do repositório são fontes secundárias** — vários contêm exageros ("99%", "zero-downtime", "latência zero"). Na dúvida, o código e as medições vencem.
3. Ao terminar uma tarefa, **atualize este arquivo** (seções 7, 8 e 11) e mude os selos.
4. **Nunca escreva segredos aqui** (senhas, tokens, `DATABASE_URL` completa).

---

## 1. O projeto em 5 linhas

- **HubObra** é um ecossistema completo para loja de materiais de construção (Ceará, Brasil): e-commerce (`hubobra.com.br`) + balcão ERP + CRM + WhatsApp. `✅`
- Monorepo no GitHub **público**: `https://github.com/mclaudio025/hubobra` (branch `main`). `✅`
- Frontend **Next.js 15.4.3** (`frontend/`) + API **NestJS** (`backend-nestjs/`) + banco **Supabase PostgreSQL** via Prisma. `✅`
- Roda numa **VPS Contabo** com **Easypanel** (Docker Swarm por baixo) e **Cloudflare** na frente. `✅`
- Módulos do ecossistema:
  - **Atendimento/CRM:** `deskcomm-crm` (Next.js, WAHA/WhatsApp, agentes IA). `Chatwoot` foi `❌ DESCONTINUADO/REMOVIDO` da VPS. `✅`
  - **ERP Balcão:** `hubobra-erp` (sistema próprio local-first para loja física, PDV e "Saldo de Obra / Retirada Futura" `FUTURE_PICKUP`. Marca white-label por loja, ex: "São José - ERP"). `GestãoClick` foi `❌ DESCARTADO` em favor da solução própria. `✅`
  - **Automação:** workflows no `n8n` orquestrando WhatsApp, IA e integrações. `🟡`

O usuário (dono) fala **português**; responda em pt-BR. Código e variáveis em inglês.

---

## 2. Mapa da infraestrutura

### 2.1 Servidor
| Item | Valor | Selo |
|---|---|---|
| Provedor / host | Contabo, hostname `vmi2878792`, Ubuntu | ✅ (print 2026-10-07) |
| IP público | `161.97.122.119` | ✅ |
| Painel Easypanel | `http://161.97.122.119:3000` (HTTP sem TLS) | ✅ |
| Acesso SSH | Usuário usa **Termius** como `root` com senha. **A IA não tem acesso SSH.** | ✅ |

### 2.2 Serviços no Easypanel por projeto
O Easypanel nomeia os serviços Swarm como `<projeto>_<serviço>`. A VPS hospeda múltiplos projetos dividindo RAM e CPU:

#### Projeto `n8n` (Loja HubObra & Automações)
| Serviço Easypanel | Nome Swarm | Função | Porta | Selo |
|---|---|---|---|---|
| `frontend` | `n8n_frontend` | Loja Next.js 15 | 3000 | ✅ |
| `api` | `n8n_api` | API NestJS | 8081 | ✅ porta no código |
| `n8n` | `n8n_n8n` | Orquestrador de workflows | 5678 | 🟡 |
| `n8nredis` | `n8n_n8nredis` | Redis do n8n | 6379 | 🟡 |

#### Projeto `atendimento` (CRM & Atendimento ao Cliente)
| Serviço Easypanel | Nome Swarm | Função | Status / Selo |
|---|---|---|---|
| `deskcomm` | `atendimento_deskcomm` | Deskcomm CRM (vendas, IA, WhatsApp) | Ativo `✅ print` |
| `chatwoot` | `atendimento_chatwoot` | Chatwoot Web (Ruby on Rails) | ❌ Descontinuado / Em remoção |
| `chatwoot-sidekiq` | `atendimento_chatwoot-sidekiq` | Worker em background do Chatwoot | ❌ Descontinuado / Em remoção |
| `chatwoot-db` | `atendimento_chatwoot-db` | PostgreSQL exclusivo do Chatwoot | ❌ Descontinuado / Em remoção |
| `chatwoot-redis` | `atendimento_chatwoot-redis` | Redis exclusivo do Chatwoot | ❌ Descontinuado / Em remoção |

> **Nota de recursos:** A remoção do stack do Chatwoot (Rails + Sidekiq + DB + Redis) libera cerca de **1,5 GB a 2,5 GB de RAM** na VPS, aliviando a carga durante os builds e deploys do Next.js. `✅`

### 2.3 Domínios configurados (serviço `frontend`)
| Domínio público | Destino no Easypanel | Selo |
|---|---|---|
| `https://hubobra.com.br/` (principal) | `http://n8n_frontend:3000/` | ✅ print |
| `https://www.hubobra.com.br/` | `http://n8n_frontend:3000/` | ✅ print |
| `https://n8n-frontend.q6zw3x.easypanel.host/` | `http://n8n_frontend:3000/` | ✅ print |
| `https://api.hubobra.com.br` → `n8n_api` | | 🟡 domínio usado no código, config não vista |

### 2.4 Fluxo de uma requisição
```
Navegador → Cloudflare → Traefik (do Easypanel) → n8n_frontend:3000 (Next.js)
                                                     └─ rotas /api/* do Next → fetchBackend() → n8n_api:8081 (NestJS) → Supabase
Navegador → (direto, 31 usos de NEXT_PUBLIC_API_URL) → api.hubobra.com.br → Traefik → n8n_api
```
O Traefik lê `/etc/easypanel/traefik/config/main.yaml`, **regenerado pelo Easypanel a cada deploy**. `🟡`

### 2.5 Como o deploy acontece
- Fonte do `frontend`: aba **Git** (não a integração "Github"), repo acima, branch `main`, **caminho de build `/frontend`**, usa o `frontend/Dockerfile`. `✅ print`
- `api`: presumivelmente igual com `/backend-nestjs`. `🟡`
- **Auto-deploy no push:** o usuário afirma que faz deploy a partir do GitHub. Se é automático (webhook) ou manual (botão "Implantar") **não foi confirmado**. `⏳`
- O workflow [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) **não faz deploy** (só `echo`). `✅`

---

## 3. Estrutura do repositório (o que importa)

| Caminho | O que é |
|---|---|
| `frontend/` | Next.js 15, `output: 'standalone'`, imagem `node:20-alpine` |
| `frontend/src/lib/backend-client.ts` | `fetchBackend()`: cliente com lista de hosts candidatos + circuit breaker |
| `frontend/src/app/api/*` | Rotas proxy do Next para o backend |
| `backend-nestjs/` | API NestJS, Prisma (`url` + `directUrl`), porta 8081, **sem prefixo global** |
| `backend-nestjs/src/health/` | `GET /health`, `/health/ping`, `/health/ready`, `/health/live` |
| `hubobra-erp/` | ERP Balcão Local-First (React 19, Dexie/IndexedDB, Vite) para PDV de loja física e Saldo de Obra / Retirada Futura (`FUTURE_PICKUP`). White-label com o nome da loja do cliente (ex: "São José - ERP"). |
| `deskcomm-crm/` | CRM de atendimento e vendas open-source (Next.js, WAHA/WhatsApp, agentes IA). Roda no projeto `atendimento` no Easypanel. |
| `ia/` | Serviço Python/FastAPI (IA "Zé da Obra") — status em produção `🟡` |
| `app_flutter_scanner/` | App Flutter de scanner/estoque e leitor EAN de balcão |
| `infra/diagnostico/` | Scripts de diagnóstico prontos localmente (`verificar_infra.sh` e `monitorar_deploy.sh`) para medição na VPS |
| `.agent/` | Regras/agents de IA do usuário (`.agent/rules/GEMINI.md`) |

---

## 4. Estado do git (2026-10-07)

- HEAD: `cac9565` na `main`. Commits relevantes desta frente: `c2304ac` (usa `tasks.n8n_api`), `d3a060f` (sanitiza headers), `de4ae22`, `db29a2d`, `d2cb42a`, `0021a14` (cache + timeout 10s). `✅`
- **Alterações locais NÃO commitadas do usuário** — não descarte, não commite sem pedir:
  `frontend/src/lib/backend-client.ts`, `frontend/src/app/api/{products,categories,banners}/route.ts`, `frontend/public/sw.js`, além de vários arquivos novos `??`. `✅`

---

## 5. A frente de trabalho atual

### 5.1 Problema
A loja dá **502 Bad Gateway durante deploys** e às vezes fica instável depois. Objetivo: **deploy sem queda perceptível** e loja confiável para venda.

### 5.2 Histórico
1. Uma sessão anterior de IA concluiu que a causa era um "bug do VIP do Docker Swarm" e escreveu o estudo `ESTUDO_ARQUITETURA_ROTEAMENTO_E_RESILIENCIA_HUBOBRA.md` (fora do repo, na pasta de artefatos da IA).
2. Em 2026-10-07 esse estudo foi **revisado e considerado não confiável** (seção 6).
3. Foram criados scripts **somente-leitura** para medir a realidade na VPS (seção 8).

---

## 6. Afirmações: verificado × suposto × refutado

| # | Afirmação | Selo | Observação |
|---|---|---|---|
| 1 | Causa das quedas é "bug de kernel no VIP do Swarm" | 🟡 | Hipótese sem evidência. Teste no script, seção 7 do relatório |
| 2 | Swarm atualiza com `stop-first` (derruba o antigo antes de subir o novo) | ⏳ | **Provável causa principal** se não houver healthcheck + `start-first` |
| 3 | `--endpoint-mode dnsrr` foi aplicado em `n8n_frontend` e `n8n_api` | 🟡 | Consta no `CHANGELOG.md:30`. Se o Easypanel reseta no deploy: ⏳ |
| 4 | Header `Authorization: ""` causava 502 | ❌ | Isso causa 401/403, não 502. Já corrigido em `d3a060f` |
| 5 | Cliente resiliente tem timeout de 2,5s | ❌ | 10s no host principal, 2,5s nos outros; 16 candidatos → pior caso ~45s |
| 6 | Watchdog systemd corrige `main.yaml` "em milissegundos" | ❌ | Faz polling de 3s, usa `sed` frágil. Não se sabe se está instalado: ⏳ |
| 7 | Fase 3 do estudo (bind em `127.0.0.1` + blue/green) | ❌ | Inviável no Swarm como descrito (Traefik está em container; `mode: host` conflita com `start-first`) |
| 8 | Frontend tem `/api/health` | ❌ | Não existe |
| 9 | Dockerfiles têm `HEALTHCHECK` | ❌ | Nenhum dos dois |
| 10 | Backend faz shutdown gracioso | ❌ | Falta `app.enableShutdownHooks()` em `main.ts` |
| 11 | Uploads persistem entre deploys | ⏳ | Backend grava em `/app/uploads` dentro do container; só persiste se houver volume |
| 12 | Next.js versão 14 (doc do ecossistema) | ❌ | É 15.4.3 |
| 13 | "Docker Compose" (doc do ecossistema) | ❌ | É Docker Swarm via Easypanel |
| 14 | Chatwoot é o CRM/Inbox de atendimento | ❌ | Refutado / Descontinuado. Não é usado e foi removido da VPS |
| 15 | GestãoClick é o ERP contratado | ❌ | Refutado / Cancelado. Substituído pelo ERP próprio local-first (`hubobra-erp`, com a marca da loja do cliente, ex: "São José - ERP") |
| 16 | `deskcomm-crm` é não relacionado ao projeto | ❌ | Refutado. É o CRM oficial de vendas e WhatsApp do ecossistema, rodando no projeto `atendimento` no Easypanel |

---

## 7. Riscos conhecidos (priorizados)

1. **Queda em todo deploy** — sem healthcheck/`start-first` (itens 2, 9, 10).
2. **Perda de imagens enviadas** em deploy, se não houver volume em `/app/uploads` (item 11).
3. **Painel Easypanel exposto em HTTP** na porta 3000 do IP público — credenciais trafegam sem criptografia.
4. **Cliente do backend falha devagar** (até ~45s) e tenta hosts sem sentido (`localhost`, `host.docker.internal`).
5. **Configuração manual** (dnsrr, watchdog, edições no `main.yaml`) pode ser desfeita pelo Easypanel sem aviso.
6. **Pressão de memória RAM na VPS:** Aliviada com a exclusão do stack Chatwoot (~1,5 GB a 2,5 GB liberados). Deixa margem segura para os builds pesados do Next.js sem acionar o OOM Killer.

---

## 8. Próximos passos (em ordem)

| # | Tarefa | Quem | Critério de pronto |
|---|---|---|---|
| 1 | Colocar os scripts na VPS (commit+push de `infra/diagnostico/` **só com OK do usuário**, pois pode disparar deploy; ou upload via SFTP do Termius) | IA + usuário | Arquivos em `/root/` na VPS |
| 2 | Rodar `bash /root/monitorar_deploy.sh` **durante** um deploy real | usuário | Log com nº de falhas e linha do tempo |
| 3 | Rodar `bash /root/verificar_infra.sh` e enviar `/root/hubobra_diag_*.txt` | usuário | Relatório recebido |
| 4 | Atualizar seções 6 e 7 com os dados medidos | IA | Nenhum item ⏳ restante nos itens 2, 3, 6, 11 |
| 5 | Reescrever o estudo de arquitetura com base nas medições | IA | Documento aprovado pelo usuário |
| 6 | Implementar correções (healthcheck, `start-first`, shutdown gracioso, volume de uploads, enxugar `backend-client.ts`) | IA | `monitorar_deploy.sh` mostra **0 falhas** num deploy |

Download na VPS (após o push):
```bash
cd /root && curl -fsSLO https://raw.githubusercontent.com/mclaudio025/hubobra/main/infra/diagnostico/verificar_infra.sh \
         && curl -fsSLO https://raw.githubusercontent.com/mclaudio025/hubobra/main/infra/diagnostico/monitorar_deploy.sh
```

---

## 9. Restrições e combinados

- **Nunca faça push na `main` sem autorização explícita** — pode disparar deploy em produção.
- **Na VPS, só comandos de leitura** até o usuário aprovar mudanças. Toda mudança precisa de plano de rollback.
- A IA **não tem SSH**: entregue comandos prontos para o usuário colar no Termius e peça a saída.
- Scripts `.sh` precisam de quebra de linha **LF** (não CRLF).
- O usuário tem regras de IA em `.agent/rules/GEMINI.md` (perguntar antes de implementar coisas complexas, responder em pt-BR).

---

## 10. Glossário rápido

- **VIP (Virtual IP):** IP único do serviço Swarm que balanceia entre containers. `n8n_frontend` resolve para ele.
- **`tasks.<serviço>`:** nome DNS que resolve direto para os IPs dos containers, sem passar pelo VIP.
- **`dnsrr`:** modo do serviço em que o próprio nome já resolve para os containers (sem VIP).
- **`stop-first` / `start-first`:** ordem de troca de container no deploy. Só `start-first` + healthcheck evita queda.
- **Traefik:** proxy reverso usado pelo Easypanel; recebe o tráfego do Cloudflare.

---

## 11. Documentos relacionados e confiabilidade

| Documento | Confiabilidade |
|---|---|
| Este arquivo | Fonte principal desta frente |
| `infra/diagnostico/*.sh` | Ferramentas de medição (somente leitura) |
| `CHANGELOG.md` | Bom para histórico; confira se as mudanças ainda valem |
| `ECOSSISTEMA_COMPLETO_DO_PROJETO.md` | Visão de produto útil; **dados técnicos com erros** (itens 12, 13) |
| `ESTUDO_ARQUITETURA_ROTEAMENTO_E_RESILIENCIA_HUBOBRA.md` | **Não confiável** — ver seção 6 |
| `GUIA_DEPLOY_EASYPANEL_CONTABO.md`, `docs/DEPLOY_EASYPANEL.md` | Não revisados `🟡` |

---

## 12. Registro de atualizações deste arquivo

| Data | O que mudou |
|---|---|
| 2026-10-07 | Criação: mapa da infra, revisão do estudo antigo, scripts de diagnóstico, próximos passos |
| 2026-10-07 | Refinamento: Chatwoot removido da VPS / descontinuado, inclusão do Deskcomm CRM no projeto 'atendimento', substituição do GestãoClick pelo ERP próprio (hubobra-erp com marca da loja do cliente, ex: São José - ERP) e mapa multi-projeto do Easypanel. |
