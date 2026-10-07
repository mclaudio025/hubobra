# 📚 HubObra - Documentação Técnica de Melhorias e Novas Arquiteturas
> **Registro de Novas Funcionalidades, Regras de Negócio e Soluções de Infraestrutura**  
> *Data:* Outubro de 2026 | *Versão:* 2.6.0

---

## 1. 📦 HubObra ERP: Saldo de Materiais (Venda para Retirada Futura)

### 🎯 Objetivo de Negócio
No comércio de materiais de construção, é comum que engenheiros, construtoras e mestres de obras comprem grandes volumes de materiais brutos (ex: 200 sacos de cimento, 10 milheiros de tijolos, 50 barras de aço) para **travar o preço de atacado** antes de reajustes dos fabricantes, deixando o material armazenado no galpão da loja para ser retirado ou entregue em etapas conforme o avanço da obra.

### ⚙️ Regra de Programação e Proteção de Estoque
- **Lançamento Financeiro:** No momento do pagamento no Caixa Central, o valor integral (PIX, Cartão, Boleto ou Dinheiro) entra no fluxo de caixa da empresa.
- **Isolamento de Estoque Físico:** A rotina `handleConfirmPayment` em `hubobra-erp/src/components/CashierQueueView.tsx` verifica `deliveryMode === 'FUTURE_PICKUP'` ou `isFutureDelivery === true`.
- **Comportamento:** O estoque físico do galpão (`product.stock`) **NÃO é debitado** na finalização da venda.
- **Baixa Fracionada:** O estoque físico só é deduzido quando o cliente realiza a retirada física no galpão (`DigitalExpeditionView.tsx` ou pelo aplicativo mobile de scanner com assinatura digital).

```typescript
// Lógica de proteção implementada em CashierQueueView.tsx:
const isFuturePickup = selectedOrder.deliveryMode === 'FUTURE_PICKUP' || selectedOrder.isFutureDelivery;

if (!isFuturePickup) {
  // Venda normal: Baixa imediata de estoque
  for (const item of selectedOrder.items) {
    const prod = await db.products.get(item.productId);
    if (prod) {
      await db.products.update(item.productId, {
        stock: Math.max(0, prod.stock - item.quantity),
        reservedStock: Math.max(0, (prod.reservedStock || 0) - item.quantity),
      });
    }
  }
} else {
  // Saldo de Materiais: Estoque físico preservado na loja
  console.log(`📦 Venda #${selectedOrder.orderNumber} confirmada como SALDO DE MATERIAIS. Estoque físico mantido na loja.`);
}
```

### 🎨 Diferenciação Visual no Caixa Central
- **Card Amarelo / Âmbar Glow:** Borda `border-amber-400`, iluminação ambiente e gradiente especial.
- **Badge Superior:** `📦 SALDO NA LOJA (RETIRADA FUTURA)`.
- **Alerta de Segurança:** Box amarelo destacado: `⚠️ Material FICA na loja. NÃO carregar caminhão agora.`.
- **Botão de Ação:** `Receber & Gerar Saldo [F10] ➔`.
- **Injetores de Teste no Topo:** Botões rápidos para testes e treinamento (`+ Exemplo Saldo Loja (Amarelo)`, `+ Exemplo Balcão`, `+ Exemplo Lia IA`).

---

## 2. 🌐 Loja Virtual (Next.js 15): Sincronização Dinâmica de Categorias

### 🔍 Diagnóstico do Problema Anterior
1. As imagens das categorias salvas via upload direto no navegador eram armazenadas no banco no formato **Data URL Base64** (`data:image/png;base64,...`).
2. O componente da vitrine (`DepartmentShortcuts.tsx`) possuía uma validação restritiva (`clean.startsWith('data:') => return false`) que descartava imagens Base64, forçando o fallback para fotos estáticas do Unsplash.
3. O componente mapeava os departamentos apenas com base em IDs fixos, ignorando alterações feitas no Painel Administrativo.

### 🛠️ Solução Implementada
- **Validação Ampla de Mídias:** O helper `isValidImageUrl` agora aceita:
  - URLs HTTP/HTTPS (`https://...`)
  - Caminhos locais ou CDN (`/uploads/...`)
  - Data URLs em Base64 (`data:image/...`)
- **Sincronização 100% Dinâmica:** O componente consulta a rota `/api/categories?active=true` do backend e mapeia todos os departamentos principais ativos cadastrados no banco de dados.
- **Detecção Inteligente de Ícones:** O helper `getCategoryIconType` associa automaticamente o ícone vetorial estilizado (alvenaria, hidráulica, elétrica, tintas, ferramentas, pisos, portas, iluminação e utilidades) com base no nome ou slug da categoria.
- **Banner Imersivo na Página de Categoria:** A rota `/categoria/[slug]` (`CategoryClient.tsx`) agora renderiza um banner visual de alta resolução com a foto e a descrição cadastradas no banco de dados.

---

## 3. 🚀 DevOps & Infraestrutura VPS (Easypanel + Docker Swarm + Traefik)

### ⚠️ Resolução de Erro 502 Bad Gateway no Docker Swarm
- **Causa Raiz:** Em VPS com kernel específico (ex: Contabo), a rede overlay do Docker Swarm pode apresentar falha de roteamento no IP Virtual (`VIP 10.11.0.x`). Quando o Traefik tenta se conectar ao serviço através do VIP do Swarm, o pacote retorna `Host is unreachable` e gera um erro **502 Bad Gateway**.
- **Solução Definitiva:** Alterar o modo de resolução do serviço no Docker Swarm para **DNS Round-Robin (`dnsrr`)**:
  ```bash
  docker service update --endpoint-mode dnsrr n8n_frontend
  docker service update --endpoint-mode dnsrr n8n_api
  ```
- **Resultado:** O Traefik conecta-se diretamente aos IPs reais dos contêineres (`10.11.4.x`), eliminando a latência e os erros 502 de gateway.

### 🌐 Configuração de Produção do Next.js 15 Standalone
- **Binding de Rede:** O arquivo `frontend/server.js` foi configurado para escutar explicitamente em `0.0.0.0:3000` (`const hostname = '0.0.0.0'`).
- **Script de Inicialização:** No `package.json`, o comando `"start"` foi definido como `"node server.js"`, garantindo compatibilidade total com o builder Nixpacks no Easypanel.

---

## 📊 4. Resumo de Commits & Versões

| Commit | Módulo | Descrição |
| :--- | :--- | :--- |
| `c3f20f8` | ERP / Caixa | Adição do fluxo de Saldo de Materiais e retenção de estoque no Caixa Central |
| `9aeb3f4` | ERP / Caixa | Inclusão de botões de injeção dinâmica de pedidos de teste no Caixa |
| `abd419d` | Frontend / Vitrine | Suporte a imagens dinâmicas e Base64 nas categorias da loja e banner em `/categoria/[slug]` |
| `b789342` | Frontend / UI | Correção de tags `<Link>` no Next.js e deduplicação de propriedades no `GlassCard` |
| `1e1dba4` | Frontend / Hero | Inclusão do import `Phone` no componente `ImmersiveHero.tsx` |

---
*HubObra - Plataforma Integrada de Comércio, ERP e IA para a Construção Civil.*
