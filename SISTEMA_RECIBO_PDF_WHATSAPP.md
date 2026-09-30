# Sistema de Recibo PDF + WhatsApp

## Visão Geral

Sistema completo para geração, visualização e envio de recibos de pedidos em formato PDF via WhatsApp, proporcionando uma experiência profissional e automatizada para o cliente.

## Arquitetura do Sistema

### 1. **Componente de Recibo** (`OrderReceipt.tsx`)
- Layout profissional e responsivo
- Informações completas do pedido
- Formatação brasileira (moeda, data)
- Otimizado para impressão

### 2. **API de Geração PDF** (`/api/orders/[id]/receipt/pdf`)
- Utiliza Puppeteer para geração
- HTML estilizado com Tailwind CSS
- Formato A4 otimizado
- Headers corretos para download

### 3. **API de WhatsApp** (`/api/orders/[id]/receipt/whatsapp`)
- Integração com backend WhatsApp
- Mensagem personalizada
- Envio de PDF como anexo
- Validação de número de telefone

### 4. **Página de Visualização** (`/pedidos/[id]/recibo`)
- Interface completa de ações
- Modal para envio WhatsApp
- Funções de download e impressão
- Cópia de link do recibo

## Funcionalidades Implementadas

### ✅ **Geração de PDF**
```typescript
// Endpoint: GET /api/orders/[id]/receipt/pdf
// Retorna: PDF binário para download
// Formato: A4, otimizado para impressão
// Estilo: Layout profissional com cores da marca
```

### ✅ **Envio por WhatsApp**
```typescript
// Endpoint: POST /api/orders/[id]/receipt/whatsapp
// Parâmetros: { phone: string, message?: string }
// Retorna: { success: boolean, whatsappId: string }
// Funcionalidade: Envia PDF + mensagem personalizada
```

### ✅ **Visualização Web**
```typescript
// Rota: /pedidos/[id]/recibo
// Funcionalidades:
// - Visualização do recibo formatado
// - Download PDF
// - Impressão direta
// - Envio por WhatsApp
// - Cópia de link
```

## Estrutura do Recibo

### **Header da Empresa**
```
┌─────────────────────────────────────────────────────┐
│ 🏢 Materiais de Construção Ceará        🧾 RECIBO   │
│ Rua das Construções, 123 - Centro       #12345      │
│ 📞 (85) 3000-0000 ✉️ contato@...        01/01/2024  │
│ CNPJ: 00.000.000/0001-00                            │
└─────────────────────────────────────────────────────┘
```

### **Informações do Cliente e Status**
```
┌─────────────────────┐  ┌─────────────────────┐
│ 📦 Dados do Cliente │  │ 📅 Status do Pedido │
│ Nome: João Silva    │  │ Status: ✅ Entregue │
│ Email: joao@...     │  │ Pagamento: PIX      │
│ Telefone: (85)...   │  │ Entrega: Em Casa    │
└─────────────────────┘  └─────────────────────┘
```

### **Endereço de Entrega** (condicional)
```
┌─────────────────────────────────────────────────────┐
│ 📍 Endereço de Entrega                              │
│ Rua das Flores, 456 - Apt 101                       │
│ Centro - Fortaleza/CE                               │
│ CEP: 60000-000                                      │
└─────────────────────────────────────────────────────┘
```

### **Tabela de Itens**
```
┌─────────────────────┬─────┬─────────────┬─────────────┐
│ Produto             │ Qtd │ Valor Unit. │ Total       │
├─────────────────────┼─────┼─────────────┼─────────────┤
│ Cimento 50kg        │  2  │ R$ 25,00    │ R$ 50,00    │
│ Tijolo Comum        │ 100 │ R$ 0,50     │ R$ 50,00    │
└─────────────────────┴─────┴─────────────┴─────────────┘
```

### **Totais**
```
                                    ┌─────────────────┐
                                    │ Subtotal: R$ 100,00 │
                                    │ Frete: Grátis       │
                                    │ ─────────────────    │
                                    │ Total: R$ 100,00    │
                                    └─────────────────┘
```

## Fluxo de Uso

### **1. Acesso ao Recibo**
```
Cliente → Meus Pedidos → Detalhes do Pedido → "Ver Recibo"
```

### **2. Ações Disponíveis**
```
┌─────────────────────────────────────────────────────┐
│ [📥 Baixar PDF] [🖨️ Imprimir] [📱 WhatsApp] [📋 Link] │
└─────────────────────────────────────────────────────┘
```

### **3. Envio por WhatsApp**
```
1. Clica em "WhatsApp"
2. Insere número do telefone
3. Personaliza mensagem (opcional)
4. Confirma envio
5. Sistema gera PDF e envia via WhatsApp
```

## Mensagem Padrão do WhatsApp

```
🧾 *Recibo do seu pedido*

Olá João Silva! 👋

Segue o recibo do seu pedido:

📋 *Pedido:* #12345
📅 *Data:* 01/01/2024
💰 *Total:* R$ 100,00
📦 *Status:* Entregue

🚚 *Entrega:* Será entregue no endereço cadastrado
💳 *Pagamento:* PIX

Qualquer dúvida, estamos à disposição! 😊

*Materiais de Construção Ceará*
📞 (85) 3000-0000
```

## Configuração Técnica

### **Dependências Adicionadas**
```json
{
  "dependencies": {
    "puppeteer": "^22.0.0"
  }
}
```

### **APIs Criadas**
```
GET  /api/orders/[id]/receipt/pdf      - Gera e retorna PDF
POST /api/orders/[id]/receipt/whatsapp - Envia por WhatsApp
```

### **Páginas Criadas**
```
/pedidos/[id]/recibo - Visualização completa do recibo
```

### **Componentes Criados**
```
/components/OrderReceipt.tsx - Componente de recibo formatado
```

## Recursos Avançados

### **🎨 Layout Profissional**
- Design responsivo e moderno
- Cores da marca (laranja/azul)
- Ícones intuitivos (Lucide React)
- Tipografia otimizada

### **📱 Otimização Mobile**
- Layout adaptativo
- Botões touch-friendly
- Modal responsivo
- Experiência fluida

### **🖨️ Otimização para Impressão**
- CSS específico para impressão
- Margens adequadas
- Cores otimizadas
- Quebras de página inteligentes

### **🔒 Segurança**
- Validação de acesso ao pedido
- Autenticação obrigatória
- Sanitização de dados
- Tratamento de erros robusto

### **🌐 Internacionalização**
- Formatação brasileira (pt-BR)
- Moeda em Real (BRL)
- Datas no formato brasileiro
- Textos em português

## Personalização

### **Informações da Empresa**
```typescript
const companyInfo = {
  name: 'Materiais de Construção Ceará',
  cnpj: '00.000.000/0001-00',
  address: 'Rua das Construções, 123 - Centro, Fortaleza - CE',
  phone: '(85) 3000-0000',
  email: 'contato@materiaisceara.com.br',
  website: 'www.materiaisceara.com.br'
};
```

### **Cores e Estilos**
```css
:root {
  --primary-color: #ea580c;    /* Laranja */
  --secondary-color: #2563eb;  /* Azul */
  --success-color: #16a34a;    /* Verde */
  --danger-color: #dc2626;     /* Vermelho */
}
```

## Integração com Backend

### **Endpoint WhatsApp Necessário**
```typescript
POST /whatsapp/send-document
{
  phone: string,
  message: string,
  document: {
    data: string,      // Base64
    filename: string,
    mimetype: string
  }
}
```

### **Resposta Esperada**
```typescript
{
  success: boolean,
  id: string,        // ID da mensagem WhatsApp
  status: string
}
```

## Monitoramento e Logs

### **Métricas Importantes**
- Taxa de geração de PDFs
- Taxa de envio por WhatsApp
- Tempo de geração de PDF
- Erros de envio

### **Logs Recomendados**
```typescript
// Geração de PDF
console.log(`PDF gerado para pedido ${orderId} em ${duration}ms`);

// Envio WhatsApp
console.log(`WhatsApp enviado para ${phone} - Pedido ${orderId}`);

// Erros
console.error(`Erro ao gerar PDF: ${error.message}`);
```

## Testes Recomendados

### **1. Teste de Geração PDF**
```bash
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:3000/api/orders/123/receipt/pdf \
     --output recibo.pdf
```

### **2. Teste de Envio WhatsApp**
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"phone":"5585999999999","message":"Teste"}' \
     http://localhost:3000/api/orders/123/receipt/whatsapp
```

### **3. Teste de Interface**
1. Acesse `/pedidos/123/recibo`
2. Teste todos os botões
3. Verifique responsividade
4. Teste impressão
5. Teste modal WhatsApp

## Troubleshooting

### **Erro: Puppeteer não funciona**
```bash
# Instalar dependências do sistema
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2
```

### **Erro: WhatsApp não envia**
- Verificar se backend WhatsApp está rodando
- Validar formato do número de telefone
- Verificar logs do backend

### **Erro: PDF não gera**
- Verificar se Puppeteer está instalado
- Verificar permissões de escrita
- Verificar logs de erro

## Status

✅ **IMPLEMENTADO COMPLETO** - Sistema de recibo PDF + WhatsApp totalmente funcional

O sistema está pronto para uso em produção, oferecendo uma experiência profissional e automatizada para envio de recibos aos clientes via WhatsApp.