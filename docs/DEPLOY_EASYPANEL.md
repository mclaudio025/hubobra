# 🚀 Deploy na VPS Contabo com Easypanel - HubConstruções

Guia de referência para implantação dos serviços da loja e do assistente IA na VPS Contabo.

---

## 🏗️ 1. Visão Geral

- **VPS:** Contabo
- **Painel:** Easypanel (Docker)
- **Banco de Dados:** Supabase PostgreSQL (Porta 6543 / 5432)
- **Storage:** Supabase Storage CDN (Bucket `products`)
- **Repositório:** GitHub (`mclaudio025/hubobra`, branch `main`)

---

## 📦 2. Serviços

1. **`frontend`**: Next.js App (SSR, Standalone)
2. **`api`**: NestJS REST API
3. **`n8n`**: Automações, webhook e integração com WhatsApp
4. **`n8nredis`**: Cache e fila para o n8n

---

## 🚀 3. Como Executar o Deploy

1. Envie as alterações locais para o GitHub:
   ```powershell
   git add .
   git commit -m "feat/fix: mensagem de commit"
   git push origin main
   ```
2. No painel do Easypanel, abra o serviço desejado e clique em **"Implantar"**.
