# 📦 Plano de Implementação: PWA de Expedição & Despacho (HubExpedição)

> **Task Slug:** `pwa-expedicao`  
> **Tipo de Projeto:** WEB / PWA Mobile-First (Next.js 14 + NestJS + Supabase/PostgreSQL)  
> **Status:** 🟢 Implementado e Operacional

---

## 🎯 1. Overview & Contexto de Negócio

### O Problema
No fluxo atual de depósitos de materiais de construção, a separação, embalagem e carregamento dos pedidos ocorrem fisicamente no galpão/pátio, distante do balcão de vendas e do escritório. Para atualizar o status do pedido para **"Saiu para Entrega" (SHIPPED)**, o operador do galpão precisa ligar ou mandar WhatsApp para a atendente no computador do escritório alterar no painel admin, gerando gargalos, atrasos de notificação ao cliente e retrabalho de comunicação.

### A Solução
Criar um **Módulo Web PWA Mobile-First independente (`/expedicao`)**, com acesso restrito a operadores de expedição (`EXPEDITION` / `OPERATOR`), permitindo que a equipe do galpão:
1. Visualize em tempo real a **fila de pedidos prontos para despacho** (pedidos pagos / em separação).
2. Acesse rapidamente a **conferência de itens** (resumo com quantidades e materiais).
3. Acione o botão de ação rápida **🚀 "Liberar / Saiu para Entrega"** em 1 toque (com confirmação contra toques acidentais).
4. Opcionalmente informe o **nome do entregador / motoboy / veículo**.
5. Dispare imediatamente a atualização de status no banco de dados, no painel administrativo e no WhatsApp do cliente via automação.

---

## 🚀 2. Critérios de Sucesso (Success Criteria)

- [x] **Isolamento Completo:** A rota `/expedicao` não renderiza menus, rodapés ou widgets da loja pública (tratado no `ConditionalLayout.tsx`).
- [x] **PWA Standalone:** Suporte a "Adicionar à Tela Inicial" com manifest próprio (`/manifest-expedicao.json`), ícone e viewport standalone.
- [x] **Controle de Acesso RBAC:** Papel `EXPEDITION` implementado no enum do backend e no `AuthContext` do frontend.
- [x] **Operação Ágil Mobile-First:** Carregamento instantâneo, botões de toque com tamanho mínimo de 48px, alto contraste visual, checklist tátil e feedback háptico/visual ao liberar.
- [x] **Sincronização em Tempo Real:** Polling automático e endpoint `PATCH /orders/:id/dispatch` atualizando para `SHIPPED` instantaneamente com registro de entregador e veículo.
- [x] **Compilação Backend:** TypeScript do NestJS validado e aprovado com 0 erros (`npx tsc --noEmit`).

---

## 🛠️ 3. Tech Stack & Decisões Arquiteturais

| Camada | Tecnologia | Racional |
| :--- | :--- | :--- |
| **Frontend PWA** | Next.js 14 (App Router) + Tailwind CSS | Integração nativa no projeto, sem necessidade de publicação em lojas de apps, renderização ultra rápida e caching. |
| **Componentes & UI** | Lucide React + Radix UI Primitives | Interface consistente, acessível, com ícones industriais/logísticos (Box, Truck, Check, RefreshCw). |
| **Backend API** | NestJS + Prisma ORM | Endpoints otimizados com `@Roles(UserRole.EXPEDITION, UserRole.ADMIN)` para busca leve e transição segura de status. |
| **Banco de Dados** | Supabase / PostgreSQL | Atualização atômica do status do pedido e histórico de despacho. |
| **PWA Manifest** | Web App Manifest + Service Worker | Configuração de manifest dedicado para instalação do app de expedição na tela inicial do celular. |

---

## 📁 4. Estrutura de Arquivos (Modificações e Criações)

```text
Projeto Loja Moderna/
├── backend-nestjs/
│   └── src/
│       ├── common/
│       │   └── enums.ts                            # Adicionar UserRole.EXPEDITION
│       ├── orders/
│       │   ├── orders.controller.ts                # Endpoint GET /orders/expedition e PATCH /orders/:id/dispatch
│       │   └── orders.service.ts                   # Lógica de listagem da fila de despacho e atualização segura
│       └── auth/
│           └── auth.service.ts                     # Suporte ao papel de expedição no login/token
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   └── ConditionalLayout.tsx           # Isolar rota /expedicao do layout da loja pública
│   │   │   └── expedicao/
│   │   │       ├── layout.tsx                      # Layout dedicado PWA (escuro/industrial, standalone)
│   │   │       ├── page.tsx                        # Dashboard da Fila de Despacho com Cards e Ações
│   │   │       ├── login/
│   │   │       │   └── page.tsx                    # Tela de Login/PIN rápido para o Operador
│   │   │       └── manifest.json / icon.png        # Configurações PWA específicas
│   │   └── contexts/
│   │       └── AuthContext.tsx                     # Suporte à checagem de role isExpedition
│   └── public/
│       └── manifest-expedicao.json                 # Manifest específico para o app de expedição
```

---

## 📋 5. Task Breakdown (Detalhamento de Tarefas)

### Tarefa 1: Atualização de Modelos e Permissões no Backend (NestJS)
- **Agente Responsável:** `backend-specialist`
- **Skills:** `clean-code`, `api-patterns`
- **Prioridade:** P0 (Bloqueador)
- **Dependências:** Nenhuma
- **INPUT:** `backend-nestjs/src/common/enums.ts` e `backend-nestjs/src/orders/`
- **OUTPUT:**
  - Inclusão do papel `EXPEDITION = "EXPEDITION"` no `UserRole`.
  - Endpoint `GET /orders/expedition`: Retorna pedidos nos status `PROCESSING` e `CONFIRMED` com dados leves (id, orderNumber, cliente, endereço, itens com qtd/unidade, observações, criado em).
  - Endpoint `PATCH /orders/:id/dispatch`: Atualiza o status para `SHIPPED` registrando quem despachou e dados de entrega (ex: motoboy/veículo).
- **VERIFY:** Requisição autenticada no Swagger ou Postman retornando a lista de pedidos em separação com status HTTP 200.

---

### Tarefa 2: Isolamento da Rota e Contexto de Autenticação no Frontend
- **Agente Responsável:** `frontend-specialist`
- **Skills:** `frontend-design`, `clean-code`
- **Prioridade:** P1
- **Dependências:** Tarefa 1
- **INPUT:** `frontend/src/app/components/ConditionalLayout.tsx` e `frontend/src/app/contexts/AuthContext.tsx`
- **OUTPUT:**
  - Ajuste no `ConditionalLayout.tsx` para garantir que `/expedicao` não renderize cabeçalho, rodapé ou chat da loja.
  - Atualização do `AuthContext.tsx` para reconhecer `isExpedition` e redirecionar adequadamente.
- **VERIFY:** Acessar `/expedicao` no navegador e validar tela 100% limpa e sem elementos do e-commerce.

---

### Tarefa 3: Desenvolvimento da Interface PWA Mobile-First (`/expedicao`)
- **Agente Responsável:** `frontend-specialist`
- **Skills:** `frontend-design`, `react-best-practices`, `clean-code`
- **Prioridade:** P2
- **Dependências:** Tarefa 2
- **INPUT:** `frontend/src/app/expedicao/page.tsx` e componentes auxiliares
- **OUTPUT:**
  - Tela de Login/PIN do operador de expedição.
  - Cabeçalho logístico com indicador de status de conexão, contagem de pedidos na fila e botão de atualizar/logout.
  - Cards de pedidos com design industrial, tipografia legível, badges de prioridade/urgência.
  - Modal/Gaveta (Drawer) com checklist de itens do pedido (para conferência dos sacos/materiais embalados).
  - Campo opcional para informar o Entregador/Motoboy.
  - Botão de ação principal: **🚀 "LIBERAR / SAIU PARA ENTREGA"** com confirmação de segurança (deslizar ou diálogo de 1 clique).
  - Feedback visual imediato (toast de sucesso, vibração móvel e remoção suave do card da fila).
- **VERIFY:** Teste de navegação e despacho em resolução mobile (375px a 430px) com transições fluidas.

---

### Tarefa 4: Configuração de Instalação PWA Dedicada (Manifest & Standalone)
- **Agente Responsável:** `frontend-specialist`
- **Skills:** `frontend-design`, `webapp-testing`
- **Prioridade:** P3
- **Dependências:** Tarefa 3
- **INPUT:** `frontend/src/app/expedicao/layout.tsx` e `frontend/public/manifest-expedicao.json`
- **OUTPUT:**
  - Manifest customizado com nome "HubObra Expedição", tema escuro/laranja industrial, ícone de despacho.
  - Meta tags para iOS (Apple Web App Capable) e Android.
- **VERIFY:** Validar no Chrome DevTools (Aba Application -> Manifest) instalação como PWA autônomo.

---

## 🏁 6. Phase X: Verificação Final & Qualidade

- [ ] **Lint & TypeScript:** `npm run lint` e `npx tsc --noEmit` no frontend e backend.
- [ ] **Build do Frontend:** `npm run build` executado com sucesso.
- [ ] **Design & Acessibilidade:** Conformidade com o Design System (sem cores roxas/clichês, botões táteis >= 48px).
- [ ] **Fluxo Ponta a Ponta:**
  1. Criar ou identificar um pedido no status "Em Separação".
  2. Abrir `/expedicao` no celular/simulador mobile.
  3. Realizar login do operador.
  4. Visualizar o pedido na fila.
  5. Clicar em "Liberar / Saiu para Entrega".
  6. Verificar status atualizado para `SHIPPED` no banco e no painel admin da loja.
