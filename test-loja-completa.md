# 🧪 Teste Completo da Loja Moderna - Guia de Validação

## 🎯 Objetivo
Testar todas as funcionalidades implementadas da loja, incluindo as melhorias de infraestrutura, performance, segurança e monitoramento.

## 📋 Checklist de Pré-requisitos

### ✅ Infraestrutura
- [ ] PostgreSQL rodando (porta 5432)
- [ ] Redis rodando (porta 6379)
- [ ] Backend NestJS (porta 8081)
- [ ] Frontend Next.js (porta 3000)
- [ ] IA Service Python (porta 8000)

### ✅ Banco de Dados
- [ ] Migrações aplicadas
- [ ] Seed executado
- [ ] Dados de teste carregados

## 🚀 Roteiro de Testes

### Fase 1: Infraestrutura e Health Checks

#### 1.1 Testar PostgreSQL
```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Testar conexão
cd backend-nestjs
npx prisma studio
```

#### 1.2 Testar Redis
```bash
# Verificar se Redis está rodando
docker ps | grep redis

# Testar conexão
cd backend-nestjs
npm run redis:test
```

#### 1.3 Testar Health Checks
```bash
# Teste completo de health
cd backend-nestjs
npm run health:test

# Monitoramento em tempo real
npm run health:monitor
```

### Fase 2: Backend e APIs

#### 2.1 Testar Autenticação
```bash
# Testar login
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"admin123"}'

# Verificar logs de segurança
curl http://localhost:8081/security/logs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 2.2 Testar Cache
```bash
# Verificar estatísticas do cache
curl http://localhost:8081/cache/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Testar produtos (deve usar cache)
curl http://localhost:8081/products
curl http://localhost:8081/products # Segunda chamada deve ser mais rápida
```

#### 2.3 Testar Rate Limiting
```bash
# Testar limite de login (5 tentativas/min)
for i in {1..10}; do
  curl -X POST http://localhost:8081/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "Tentativa $i"
done
```

### Fase 3: Frontend e UX

#### 3.1 Página Inicial
- [ ] Carregamento rápido (< 3s)
- [ ] Banners dinâmicos funcionando
- [ ] Produtos em destaque carregando
- [ ] Menu de categorias responsivo
- [ ] Busca funcionando

#### 3.2 Sistema de Produtos
- [ ] Listagem de produtos
- [ ] Filtros por categoria
- [ ] Busca avançada
- [ ] Detalhes do produto
- [ ] Imagens carregando

#### 3.3 Sistema de Favoritos
- [ ] Adicionar aos favoritos
- [ ] Página de favoritos
- [ ] Filtros e ordenação
- [ ] Estatísticas
- [ ] Exportar CSV

#### 3.4 Carrinho de Compras
- [ ] Adicionar produtos
- [ ] Alterar quantidades
- [ ] Remover itens
- [ ] Cálculo de totais
- [ ] Persistência entre sessões

#### 3.5 Sistema de Pedidos
- [ ] Checkout completo
- [ ] Dados de entrega
- [ ] Métodos de pagamento
- [ ] Confirmação do pedido
- [ ] Histórico de pedidos

### Fase 4: Painel Administrativo

#### 4.1 Dashboard
- [ ] Login admin
- [ ] Estatísticas gerais
- [ ] Gráficos funcionando
- [ ] Navegação fluida

#### 4.2 Gestão de Produtos
- [ ] Listar produtos
- [ ] Criar produto
- [ ] Editar produto
- [ ] Upload de imagens
- [ ] Importação em massa

#### 4.3 Gestão de Categorias
- [ ] Visualização hierárquica
- [ ] Criar categoria
- [ ] Editar categoria
- [ ] Subcategorias

#### 4.4 Gestão de Pedidos
- [ ] Lista de pedidos
- [ ] Detalhes do pedido
- [ ] Alterar status
- [ ] Filtros e busca

#### 4.5 Sistema de Banners
- [ ] Lista de banners
- [ ] Criar banner
- [ ] Upload de imagem
- [ ] Preview em tempo real
- [ ] Ativar/desativar

#### 4.6 Configurações de IA
- [ ] Página de configurações
- [ ] Testar conexão
- [ ] Salvar configurações
- [ ] Logs de uso

### Fase 5: IA e Automação

#### 5.1 Chat do Zé da Obra
- [ ] Abrir chat
- [ ] Enviar mensagem
- [ ] Receber resposta
- [ ] Recomendações de produtos
- [ ] Calculadora de materiais

#### 5.2 Calculadora de Materiais
- [ ] Abrir calculadora
- [ ] Inserir medidas
- [ ] Calcular materiais
- [ ] Recomendações
- [ ] Adicionar ao carrinho

### Fase 6: Performance e Monitoramento

#### 6.1 Performance
- [ ] Lighthouse Score > 90
- [ ] Core Web Vitals em verde
- [ ] Tempo de carregamento < 3s
- [ ] Cache funcionando

#### 6.2 Segurança
- [ ] CORS restritivo funcionando
- [ ] Rate limiting ativo
- [ ] Logs de auditoria
- [ ] Tentativas de acesso bloqueadas

#### 6.3 Monitoramento
- [ ] Health checks funcionando
- [ ] Alertas sendo gerados
- [ ] Métricas coletadas
- [ ] Logs estruturados

## 🛠️ Scripts de Teste Automatizado

### Script de Inicialização
```bash
#!/bin/bash
echo "🚀 Iniciando teste completo da Loja Moderna..."

# 1. Verificar serviços
echo "📋 Verificando serviços..."
docker ps | grep -E "(postgres|redis)"

# 2. Iniciar aplicações
echo "🏃 Iniciando aplicações..."
cd backend-nestjs && npm run start:dev &
cd frontend && npm run dev &
cd ia && python main.py &

# 3. Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 30

# 4. Testar health checks
echo "🏥 Testando health checks..."
npm run health:test

# 5. Testar APIs principais
echo "🔌 Testando APIs..."
curl -f http://localhost:8081/products || echo "❌ API de produtos falhou"
curl -f http://localhost:8081/categories || echo "❌ API de categorias falhou"

# 6. Testar frontend
echo "🌐 Testando frontend..."
curl -f http://localhost:3000 || echo "❌ Frontend não está respondendo"

echo "✅ Teste de inicialização concluído!"
```

### Script de Teste de Performance
```bash
#!/bin/bash
echo "⚡ Testando performance..."

# Teste de carga no backend
echo "🔥 Teste de carga - Backend..."
cd backend-nestjs
npm run health:load 100 10

# Lighthouse no frontend
echo "💡 Lighthouse - Frontend..."
npx lighthouse http://localhost:3000 --output=json --output-path=lighthouse-report.json

# Análise de bundle
echo "📦 Análise de bundle..."
cd frontend
npm run analyze

echo "📊 Relatórios gerados!"
```

### Script de Teste de Segurança
```bash
#!/bin/bash
echo "🔒 Testando segurança..."

# Testar CORS
echo "🌐 Testando CORS..."
curl -H "Origin: https://malicious-site.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost:8081/auth/login

# Testar Rate Limiting
echo "⚡ Testando Rate Limiting..."
for i in {1..10}; do
  curl -X POST http://localhost:8081/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"test@test.com","password":"wrong"}' &
done
wait

# Verificar logs de segurança
echo "📋 Verificando logs de segurança..."
curl http://localhost:8081/security/stats

echo "🛡️ Testes de segurança concluídos!"
```

## 📊 Métricas de Sucesso

### Performance
- [ ] Tempo de carregamento inicial < 3s
- [ ] Lighthouse Performance > 90
- [ ] Core Web Vitals em verde
- [ ] Cache hit rate > 80%

### Funcionalidade
- [ ] Todas as páginas carregam sem erro
- [ ] CRUD completo funcionando
- [ ] Autenticação e autorização OK
- [ ] Carrinho e checkout funcionais

### Segurança
- [ ] CORS bloqueando origens não autorizadas
- [ ] Rate limiting funcionando
- [ ] Logs de auditoria sendo gerados
- [ ] Tentativas maliciosas bloqueadas

### Monitoramento
- [ ] Health checks retornando status correto
- [ ] Alertas sendo gerados quando necessário
- [ ] Métricas sendo coletadas
- [ ] Sistema de monitoramento ativo

## 🐛 Troubleshooting

### Problemas Comuns

#### Backend não inicia
```bash
# Verificar portas
lsof -i :8081

# Verificar logs
cd backend-nestjs && npm run start:dev

# Verificar banco
npx prisma db push
```

#### Frontend não carrega
```bash
# Verificar dependências
cd frontend && npm install

# Verificar variáveis de ambiente
cat .env.local

# Limpar cache
rm -rf .next && npm run dev
```

#### Cache não funciona
```bash
# Verificar Redis
docker ps | grep redis

# Testar conexão
cd backend-nestjs && npm run redis:test

# Verificar configuração
curl http://localhost:8081/cache/stats
```

#### Health checks falhando
```bash
# Verificar serviços
docker ps

# Testar individualmente
curl http://localhost:8081/health/live
curl http://localhost:8081/health/ready

# Verificar logs
cd backend-nestjs && npm run health:monitor
```

## 📝 Relatório de Teste

### Template de Relatório
```markdown
# Relatório de Teste - Loja Moderna

## Data: [DATA]
## Versão: 1.7.4
## Testador: [NOME]

### ✅ Funcionalidades Testadas
- [ ] Infraestrutura (PostgreSQL, Redis)
- [ ] Backend APIs
- [ ] Frontend UX
- [ ] Painel Admin
- [ ] IA e Automação
- [ ] Performance
- [ ] Segurança
- [ ] Monitoramento

### 📊 Métricas Obtidas
- Tempo de carregamento: [X]s
- Lighthouse Score: [X]/100
- Cache hit rate: [X]%
- Health check response: [X]ms

### 🐛 Problemas Encontrados
1. [Descrição do problema]
   - Severidade: [Alta/Média/Baixa]
   - Status: [Aberto/Resolvido]

### 💡 Recomendações
1. [Recomendação 1]
2. [Recomendação 2]

### ✅ Conclusão
Sistema [APROVADO/REPROVADO] para [desenvolvimento/produção]
```

## 🚀 Próximos Passos

Após os testes:
1. **Corrigir** problemas encontrados
2. **Otimizar** performance se necessário
3. **Documentar** configurações finais
4. **Preparar** para deploy em produção
5. **Configurar** monitoramento contínuo

---

**🎯 Objetivo**: Validar que todas as melhorias implementadas estão funcionando corretamente e o sistema está pronto para uso em produção.