# ✅ Checklist de Deploy - VPS Contabo + Easypanel

## 📋 **Pré-Deploy (Local & Git)**

### **Preparação:**
- [x] Backend NestJS e Frontend Next.js compilando com sucesso (`npm run build`)
- [x] Alterações testadas e validadas localmente
- [x] Código comitado e enviado para o GitHub (`git push origin main`)

---

## 🌐 **Configuração na VPS Contabo + Easypanel**

### **Serviços no Easypanel (Projeto `n8n`):**
- [x] Serviço **`frontend`** (Next.js) configurado na porta 3000
- [x] Serviço **`api`** (NestJS) configurado na porta 8081
- [x] Serviço **`n8n`** (Automação de WhatsApp e IA) ativo na porta 5678
- [x] Serviço **`n8nredis`** ativo na porta 6379

### **Banco de Dados & Storage (Supabase Cloud):**
- [x] PostgreSQL ativo no Supabase com PgBouncer
- [x] Storage Bucket `products` configurado para imagens e mídias
- [x] Migrações e schema Prisma sincronizados

---

## 🔄 **Procedimento de Deploy Contínuo**

1. **Local:**
   ```powershell
   git add .
   git commit -m "feat/fix: sua alteração"
   git push origin main
   ```

2. **No Easypanel:**
   - Acesse o painel da VPS
   - No serviço desejado (`frontend` ou `api`), clique em **"Implantar"** (Deploy)
   - Acompanhe os logs na aba **"Logs"**

---

## 🧪 **Verificação Pós-Deploy**

- [ ] Vitrine inicial carrega (`/`)
- [ ] Listagem de departamentos e categorias (`/categoria/[slug]`)
- [ ] Busca de produtos com filtros (`/busca`)
- [ ] Detalhes do produto (`/produtos/[id]`)
- [ ] Checkout e cálculo de frete (`/checkout`)
- [ ] Geração e envio de recibos no WhatsApp (`/pedidos/[id]/recibo`)
- [ ] Painel Administrativo (`/admin`)