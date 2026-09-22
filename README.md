# Plataforma de E-commerce para Materiais de Construção

## Visão Geral
Esta é uma plataforma de e-commerce headless de alta performance para um depósito de materiais de construção. Usa arquitetura de microsserviços com frontend em React/Next.js, backend em Node.js/NestJS, serviços de IA em Python/FastAPI, PostgreSQL/Elasticsearch para dados, e DevOps com Docker, Kubernetes e AWS. Foco em MVP com funcionalidades core, escalabilidade e UX imersiva.

## Estrutura do Projeto
- **/frontend**: Aplicação Next.js para interface (PWA, SSR).
- **/backend**: NestJS para microsserviços de negócio e chat.
- **/ia**: FastAPI para módulos de IA.
- **/infra**: Configurações Docker, Kubernetes e AWS.

## Requisitos
- Node.js v18+
- Python 3.10+
- Docker
- Git
- Conta AWS

## Setup Rápido

```bash
# 1. Clone o repositório
git clone [repo-url]
cd ecommerce-materiais-construcao

# 2. Setup automático (instala dependências e configura .env)
npm run setup

# 3. Migrar para PostgreSQL (recomendado)
npm run migrate:postgres

# OU configure PostgreSQL manualmente
npm run postgres:setup

# 4. Inicie com Docker (recomendado)
npm run docker:up

# OU inicie em modo desenvolvimento
npm run dev
```

**Acesse:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8080  
- IA Service: http://localhost:8000

Para setup detalhado, consulte [SETUP.md](SETUP.md)

## Ambientes
- **Dev**: Local com dados simulados para testes (use `NODE_ENV=development`).
- **Test**: Staging no AWS com dados de teste.
- **Prod**: Produção no AWS com auto-scaling, sem dados simulados.

Use variáveis de ambiente para diferenciar (ex.: DATABASE_URL).

## CI/CD
Configurado com GitHub Actions para testes, lint e deploy automático para AWS.

## Funcionalidades Implementadas

### 🛒 **E-commerce Core**

#### ✅ Sistema de Produtos e Categorias
- **CRUD Completo:** Gestão de produtos, categorias e subcategorias
- **Interface Administrativa:** Painel de controle intuitivo
- **API RESTful:** Endpoints padronizados e documentados
- **Upload de Imagens:** Sistema avançado com preview e múltiplas imagens
- **Gestão de Estoque:** Controle de disponibilidade e quantidades

#### ✅ Sistema de Carrinho de Compras
- **Carrinho Persistente:** Mantém itens entre sessões
- **Gestão de Quantidades:** Adicionar, remover e atualizar produtos
- **Cálculo Automático:** Totais e subtotais em tempo real
- **Integração com Estoque:** Validação de disponibilidade

#### ✅ Sistema de Pedidos
- **Fluxo Completo:** Do carrinho ao checkout
- **Gestão de Status:** Acompanhamento de pedidos
- **Histórico:** Visualização de pedidos anteriores
- **Interface Admin:** Gerenciamento de pedidos pelo admin

### 🔍 **Sistema de Busca e Navegação**

#### ✅ Busca Avançada
- **Página Dedicada:** Interface completa de busca (`/busca`)
- **Filtros Múltiplos:** Por categoria, preço, marca e texto
- **Ordenação:** Por relevância, preço, nome e data
- **Visualização:** Modos grid e lista
- **Paginação:** Navegação eficiente pelos resultados

#### ✅ Navegação por Categorias
- **Páginas Dedicadas:** Visualização por categoria (`/categoria/[slug]`)
- **Breadcrumb:** Navegação hierárquica
- **Filtros Específicos:** Filtros contextuais por categoria
- **Contagem:** Número de produtos por categoria

### ❤️ **Sistema de Favoritos**

#### ✅ Funcionalidades Completas
- **Lista Personalizada:** Favoritos por usuário com persistência
- **Estatísticas:** Total, valor, preço médio dos favoritos
- **Filtros Avançados:** Por faixa de preço com filtros rápidos
- **Ordenação:** Por nome, preço e data de adição
- **Ações em Massa:** Adicionar todos ao carrinho, compartilhar, exportar CSV
- **Integração:** Botões em produtos, contador no header

### 🎨 **Interface e UX**

#### ✅ Sistema de Banners Dinâmicos
- **Interface Administrativa:** Gerenciamento completo de banners
- **Tipos Múltiplos:** Hero, Promocional e Departamento
- **Funcionalidades:** CRUD completo, upload, preview em tempo real
- **Documentação:** [Sistema de Banners](docs/SISTEMA_BANNERS_DINAMICOS.md)

#### ✅ Design Responsivo
- **Mobile First:** Interface otimizada para dispositivos móveis
- **Componentes Reutilizáveis:** Sistema de design consistente
- **Feedback Visual:** Toasts, loading states e transições suaves

### 🔐 **Autenticação e Segurança**

#### ✅ Sistema de Autenticação
- **JWT Authentication:** Sistema seguro de login
- **Controle de Acesso:** Roles de Admin, Manager e User
- **Proteção de Rotas:** Endpoints e páginas protegidos
- **Gestão de Sessão:** Login/logout com persistência

### 🤖 **Inteligência Artificial**

#### ✅ Zé da Obra - Assistente IA
- **Chat Inteligente:** Assistente especializado em construção
- **Recomendações:** Sugestões de produtos baseadas em necessidades
- **Calculadora:** Cálculo de materiais para projetos
- **Documentação:** [Sistema IA](docs/SISTEMA_IA_ZE_DA_OBRA.md)

### 📊 **Painel Administrativo**

#### ✅ Gestão Completa
- **Dashboard:** Visão geral do sistema
- **Produtos:** CRUD completo com upload de imagens
- **Pedidos:** Gerenciamento de status e acompanhamento
- **Banners:** Sistema de marketing dinâmico
- **Usuários:** Gestão de contas e permissões
- **Importação:** Sistema de importação em massa de produtos

### 🛠️ **Recursos Técnicos**

#### ✅ Arquitetura Moderna
- **Frontend:** Next.js 14 com TypeScript
- **Backend:** NestJS com Prisma ORM
- **Banco de Dados:** PostgreSQL com migrações
- **Estado:** Context API + React Hooks
- **Validação:** Zod + class-validator
- **Testes:** Jest + Testing Library

## Documentação

### 📚 Guias Técnicos
- [Arquitetura do Projeto](docs/ARQUITETURA_PROJETO.md)
- [Sistema de Busca Avançada](docs/SISTEMA_BUSCA_AVANCADA.md)
- [Sistema de Favoritos](docs/SISTEMA_FAVORITOS.md)
- [Sistema de Banners Dinâmicos](docs/SISTEMA_BANNERS_DINAMICOS.md)
- [Sistema IA - Zé da Obra](docs/SISTEMA_IA_ZE_DA_OBRA.md)
- [Análise Técnica - Banners](docs/ANALISE_TECNICA_BANNERS.md)
- [Guia de Uso - Banners](docs/GUIA_USO_BANNERS.md)
- [Setup Detalhado](SETUP.md)
- [Changelog](CHANGELOG.md)

### 🎯 Para Desenvolvedores
- **Arquitetura:** Microsserviços com NestJS + Next.js
- **Banco de Dados:** Prisma ORM + PostgreSQL
- **Autenticação:** JWT + Guards personalizados
- **Validação:** DTOs com class-validator + Zod
- **Estado:** Context API + React Hooks
- **Estilização:** Tailwind CSS + Componentes reutilizáveis

### 👥 Para Usuários Finais
- **Loja Online:** Navegação intuitiva e busca avançada
- **Sistema de Favoritos:** Lista personalizada com funcionalidades extras
- **Carrinho Inteligente:** Persistência e validação automática
- **Painel Admin:** Interface completa para gerenciamento
- **Assistente IA:** Zé da Obra para ajuda especializada

### 🚀 Funcionalidades em Destaque

#### Sistema de Busca Inteligente
- Busca por texto, categoria, preço e marca
- Filtros dinâmicos e ordenação múltipla
- Interface responsiva com visualização grid/lista

#### Favoritos Avançados
- Estatísticas detalhadas e filtros por preço
- Exportação para CSV e compartilhamento
- Integração completa com carrinho

#### IA Especializada
- Assistente Zé da Obra para construção civil
- Calculadora de materiais inteligente
- Recomendações personalizadas

## Roadmap e Próximos Passos

### 🎯 Versão 1.6 (Próxima)
- [ ] Sistema de Reviews e Avaliações
- [ ] Comparação de Produtos
- [ ] Wishlist Compartilhável
- [ ] Notificações Push

### 🚀 Versão 2.0 (Futuro)
- [ ] Realidade Aumentada (AR) para visualização
- [ ] IA Preditiva para estoque
- [ ] Sistema de Fidelidade
- [ ] Marketplace Multi-vendor

### 🤝 Como Contribuir
1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Status do Projeto
🟢 **Ativo** - Em desenvolvimento contínuo com releases regulares