# 🏛️ Guia de Arquitetura & Implementação: IA, WhatsApp, Chatwoot (CRM), n8n, Supabase Pro e VPS Contabo

> **HubConstruções - Marketplace da Construção Civil**  
> Documento técnico com o passo a passo completo para configurar o ecossistema de atendimento inteligente, CRM multiatendente com aplicativo mobile, transbordo humano, busca semântica de produtos com envio de fotos e automações de vendas.

---

## 🗺️ 1. Visão Geral da Topologia Completa

```
                                  [ CLIENTE NO WHATSAPP / SITE ]
                                                │
                                                ▼
                                    [ WAZAPI / EVOLUTION API ]
                                                │
                                    ┌───────────┴───────────┐
                                    ▼                       ▼
                         [ CHATWOOT CRM (Inbox) ]    [ n8n (Orquestrador IA) ]
                         • Painel de Atendentes      • Agente OpenAI / Gemini
                         • App Android / iOS         • Busca Semântica (RAG)
                         • Fila de Transbordo        • Envio de Fotos & PIX
                                    │                       │
                                    └───────────┬───────────┘
                                                ▼
                                   ┌─────────────────────────┐
                                   │   VPS CONTABO (Linux)   │
                                   │  • Nginx (SSL / Cache)  │
                                   │  • Frontend (Next.js)   │
                                   │  • Backend (NestJS API) │
                                   │  • Redis & Postgres     │
                                   └────────────┬────────────┘
                                                │
                                    ┌───────────┴───────────┐
                                    ▼                       ▼
                         [ SUPABASE PRO ]           [ IA (OpenAI / Gemini) ]
                    • Banco de Dados PostgreSQL     • Embeddings do Catálogo
                    • pgvector (Busca Produtos)     • Raciocínio & Balcão Virtual
                    • CDN Storage (Fotos)           • Transcrição de Áudio
```

### Divisão de Responsabilidades:
1. **Chatwoot (CRM Open Source):** A caixa de entrada central onde a equipe humana atende. Permite múltiplos atendentes no mesmo número, aplicativo para celular (Android/iOS), histórico completo do cliente, etiquetas (tags) e visualização em tempo real das conversas da IA.
2. **Wazapi / Evolution API:** Gateway que conecta o número do WhatsApp da loja à internet e ao Chatwoot/n8n.
3. **n8n (Orquestrador IA):** O "cérebro" das automações. Ouve as mensagens, transcreve áudios com Whisper, consulta o catálogo com busca vetorial no Supabase e responde ao cliente com foto, especificações técnicas e chave PIX.
4. **Transbordo Humano Inteligente:** Quando a IA detecta que o cliente quer negociar ou falar com uma pessoa, ela passa o status da conversa no Chatwoot para `Aberto` e dispara notificação sonora e push no celular do vendedor.
5. **Supabase Pro:** Banco de Dados PostgreSQL, busca vetorial (`pgvector`) para o catálogo de materiais e Storage CDN para as fotos dos produtos.
6. **VPS Contabo:** Servidor central que hospeda todos os serviços (Chatwoot, n8n, NestJS, Next.js, Redis e Nginx) com custo fixo e zero mensalidade por usuário.

---

## 🗄️ 2. Configuração do Supabase Pro (Banco & Fotos)

### A. Habilitar a Extensão de Busca Vetorial (`pgvector`)
No painel do Supabase, acesse **SQL Editor** e execute:

```sql
-- 1. Habilita pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Adiciona coluna de embedding na tabela de produtos
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

-- 3. Cria índice para busca rápida por cosseno
CREATE INDEX IF NOT EXISTS "product_embedding_idx" 
ON "Product" 
USING ivfflat ("embedding" vector_cosine_ops)
WITH (lists = 100);

-- 4. Função para busca semântica de produtos
CREATE OR REPLACE FUNCTION search_products_rag (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.65,
  match_count int DEFAULT 4
)
RETURNS TABLE (
  id text,
  name text,
  description text,
  price float,
  compare_price float,
  brand text,
  stock int,
  image_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.description,
    p.price,
    p."comparePrice" as compare_price,
    p.brand,
    p.stock,
    p.images->0->>'url' as image_url,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM "Product" p
  WHERE p.active = true 
    AND p.stock > 0
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

### B. Configurar o Storage CDN para Imagens
1. Crie o bucket público `products` no **Storage** do Supabase.
2. Defina a política de acesso para leitura pública (`Public Bucket = ON`).
3. Todas as URLs de imagem ficam no formato CDN:
   `https://[SEU_PROJETO].supabase.co/storage/v1/object/public/products/[ID_DO_PRODUTO].webp`

---

## 🤖 3. Configuração do n8n na Contabo (Fluxo de IA & WhatsApp)

### A. Estrutura do Workflow Principal no n8n

```
[ Webhook Wazapi ] 
        │
        ▼
[ Switch: Tipo de Mensagem ]
   ├─► Áudio ──► [ Whisper OpenAI ] ──► (Converte em Texto)
   └─► Texto ─────────────────────────►
                                           │
                                           ▼
                                 [ Agente de IA (OpenAI / Claude) ]
                                           │
                                           ├─► Tool: [ Supabase Vector Search ]
                                           ├─► Tool: [ Consultar Estoque / Preço ]
                                           └─► Tool: [ Criar Link de Pedido PIX ]
                                           │
                                           ▼
                                 [ Formatador de Mensagem ]
                                           │
                                           ├─► 1. Wazapi: Enviar Foto do Produto
                                           └─► 2. Wazapi: Enviar Texto com Modo de Uso + Preço PIX
```

### B. Regra de Ouro: Catálogo Restrito & Anti-Alucinação (Zero Invenção de Produtos)

> ⚠️ **DIRETRIZ CRÍTICA:** A IA **NUNCA** pode citar ou recomendar produtos/marcas que **NÃO constam no catálogo/estoque ativo** da HubConstruções no Supabase.
> 1. Se o cliente pedir uma categoria geral (ex: *"preciso de impermeabilizante"*), a IA pesquisa via `search_products_rag` e apresenta estritamente os produtos cadastrados e com estoque positivo.
> 2. Se o cliente pedir uma marca não cadastrada (ex: *"vocês têm produto da Mactra?"*), a IA responde com transparência: *"Não temos essa marca específica em estoque no momento, mas trabalhamos com a linha completa da Vedacit/Sika que atende com a mesma qualidade e pronta entrega"*.

---

### C. Arquitetura Dual-Persona: Lia (Comercial) & Zé da Obra (Técnico)

Para humanizar o atendimento e maximizar as vendas, dividimos a IA em duas personas complementares na mesma conversa:

```
                  ┌───────────────────────────────────────────────┐
                  │          MENSAGEM DO CLIENTE                  │
                  └───────────────────────┬───────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     [ Dúvida Comercial / Estoque ]                 [ Dúvida de Uso / Engenharia ]
                  │                                               │
                  ▼                                               ▼
       🙋‍♀️ LIA (Consultora Comercial)                 👷‍♂️ ZÉ DA OBRA (Mestre de Obras)
• Consulta produtos reais do estoque           • Explica passo a passo de aplicação
• Apresenta preços, marcas e fotos             • Ensina demãos, traço e rendimento
• Informa frete grátis e desconto PIX          • Executa cálculo de cubagem / materiais
• Monta o carrinho e fecha o pedido            • Passa a bola de volta para a Lia fechar!
```

---

### D. System Prompt Especializado no n8n (Lia + Zé da Obra)

Configure o nó **AI Agent** com o seguinte prompt:

```text
Você é a inteligência de vendas e engenharia da HubConstruções no WhatsApp, atuando através de duas personas:
1. LIA (Consultora Comercial): Cordial, ágil e focada em vendas. Apresenta APENAS produtos que constam no nosso catálogo/estoque (usando a ferramenta de busca no Supabase), informa preços, desconto de 10% no PIX, prazo de entrega e gera links de checkout.
2. ZÉ DA OBRA (Mestre de Obras & Especialista Técnico): Experiente, prático e didático. Entra em cena quando o cliente tem dúvidas sobre COMO USAR/APLICAR o produto (tempo de secagem, preparo de superfície, demãos cruzadas, traço de massa) ou quando solicita CÁLCULO DE MATERIAIS (ex: parede, piso, laje).

REGRAS RÍGIDAS DE ATENDIMENTO:
1. RESTRIÇÃO DE CATÁLOGO (Anti-alucinação): Nunca invente produtos. Sempre use a ferramenta "Supabase Vector Search" para checar o estoque real antes de recomendar.
2. HANDOFF DE PERSONAS:
   - Se o cliente perguntar: "preciso de produto para impermeabilização", a LIA responde apresentando as opções reais em estoque com preço e fotos.
   - Se o cliente perguntar: "como usa esse produto?", "quantas demãos?", "qual o traço?", a LIA chama o ZÉ DA OBRA, que explica o passo a passo prático de obra. Em seguida, a LIA retoma para fechar a compra.
3. PREÇOS E CONDIÇÕES: Destaque sempre o preço à vista no PIX com 10% de desconto e frete grátis para Fortaleza e Região Metropolitana.
4. TRANSBORDO HUMANO: Se o cliente solicitar negociar pessoalmente ou falar com um vendedor humano, acione o transbordo no Chatwoot (Status = Open).
```

---

---

## 💬 4. Configuração do Chatwoot (CRM de Atendimento & App Mobile)

O **Chatwoot** é a interface visual onde seus vendedores/atendentes trabalham sem precisar usar o WhatsApp Web pessoal e com total histórico centralizado.

### A. Estrutura de Atendimento no Chatwoot:
1. **Caixa de Entrada Unificada (*Inbox*):** Conectada ao número de WhatsApp da HubConstruções via Evolution API / Wazapi.
2. **Equipes e Agentes:** Cadastre quantos vendedores quiser (Vendas, Cotações Especiais, Suporte).
3. **Aplicativo Mobile (Android / iOS):**
   - Os vendedores instalam o app oficial do Chatwoot no celular.
   - Quando um cliente é transferido pela IA, o celular do vendedor toca e exibe notificação push instantânea.
4. **Notas Internas Privadas:** Vendedores podem trocar mensagens internas dentro do chamado do cliente sem que o cliente veja (ex: *"Cliente quer 50 sacos de cimento, podemos dar 5% extra no PIX"*).

### B. O Ciclo do Transbordo Humano (*Handoff*):
```
[ Mensagem do Cliente ] ──► [ Chatwoot: Status = BOT / PENDING ]
                                     │
                                     ├─► IA do n8n responde automaticamente
                                     │
   Cliente pede humano / Dúvida complexa
                                     │
                                     ▼
                      [ n8n altera Status = OPEN ]
                      [ Atribui para Equipe "Vendas" ]
                                     │
                                     ▼
                   🔔 Alerta no Painel + Push no Celular
                                     │
                                     ▼
                      [ Vendedor assume o chat ]
                                     │
                             Venda Concluída
                                     │
                                     ▼
                   [ Vendedor clica em "Resolver" ]
```

---

## 📱 5. Configuração do Gateway WhatsApp (Wazapi / Evolution API)

1. **Configurar Instância no Gateway:**
   - Crie a instância `hubconstrucoes-atendimento`.
   - Conecte o WhatsApp lendo o QR Code no seu aplicativo WhatsApp Business.
2. **Conectar ao Chatwoot:**
   - Configure a integração nativa com o Chatwoot informando a URL do Chatwoot e o Token da Caixa de Entrada.
3. **Apontar Webhook para o n8n:**
   - Configure o Webhook para `https://n8n.seudominio.com.br/webhook/whatsapp-mensagem` para acionar a IA em mensagens recebidas.

---

---

## ⚡ 6. Casos de Uso e Automações de Alto Impacto

### 1. 📝 Leitura de Lista Manuscrita no Papel (Visão Computacional / OCR)
- **Cenário:** O pedreiro ou mestre de obras escreve a lista de materiais em uma folha de caderno com caneta e manda a **foto no WhatsApp**.
- **Processamento da IA (Gemini / GPT-4o Vision):**
  1. Decifra a caligrafia da foto: *"2 sacos de argamassa, 5 kg de gesso, 1 makita serra circular, 2 m areia grossa"*.
  2. Consulta o estoque da HubConstruções no Supabase.
  3. Devolve a cotação pronta em segundos com fotos, preços unitários e valor total no PIX.

### 2. 🧱 Calculadora Inteligente de Materiais (Exemplo: Parede de 2m x 5m)
- **Mensagem / Áudio do Cliente:** *"Zé, preciso levantar uma parede de 2 metros de altura por 5 de comprimento, quanto de material eu compro?"*
- **Cálculo de Engenharia Executado pela IA:**
  - **Área Total:** `2m x 5m = 10 m²`
  - **Tijolos 8 furos (9x19x19 cm):** `27 un/m² * 10 m² = 270 un + 10% margem = 300 tijolos`.
  - **Cimento (Assentamento + Reboco 2 lados):** `5 sacos de Cimento Poty / Apodi 50kg`.
  - **Areia Média Lavada:** `1 metro cúbico (1 m³)`.
  - **Aditivo Plastificante (Vedalit):** `1 frasco de 1 Litro (para liga e impermeabilização do reboco)`.
- **Resposta Automática no WhatsApp:**
  ```text
  🏗️ Olá! Para levantar e rebocar sua parede de 2x5m (10 m²), você vai precisar de:

  🧱 300x Tijolo Cerâmico 8 Furos 9x19x19cm ➔ R$ 360,00
  📦 5x Cimento Poty Todas as Obras 50kg ➔ R$ 175,00
  ⏳ 1x Metro de Areia Média Lavada (1 m³) ➔ R$ 110,00
  🧴 1x Aditivo Plastificante Vedalit 1L ➔ R$ 24,90

  ──────────────
  💰 TOTAL NO PIX: R$ 669,90 (com desconto à vista)
  🚚 FRETE: GRÁTIS para seu bairro em Fortaleza!

  Deseja que eu gere o link para entrega na sua obra agora? 🚛
  ```

### 3. 🧪 Dúvida de Produto & Aplicação: Impermeabilização (Lia + Zé da Obra)
- **1º Turno (Cliente):** *"Preciso de um produto para impermeabilização!"*
- **Resposta da LIA (Catálogo Real & Estoque):**
  ```text
  🙋‍♀️ Lia da HubConstruções:

  Olá! Temos opções de alta performance para impermeabilização em estoque no nosso depósito com entrega rápida:

  📦 1. Vedatop 18kg (Argamassa Polimérica - Vedacit)
  • Para caixas d'água, piscinas, banheiros e umidade de rodapé.
  • Preço: R$ 98,90 no PIX (ou R$ 109,90 no cartão)

  📦 2. Aditivo Impermeabilizante Vedacit 3,6L
  • Para misturar no reboco e concreto.
  • Preço: R$ 42,90 no PIX

  📦 3. Bianco Resina Adesiva 3,6kg (Vedacit)
  • Para ponte de aderência e reforço plástico.
  • Preço: R$ 89,90 no PIX

  🚚 Frete Grátis para Fortaleza!
  Se tiver qualquer dúvida de como aplicar ou rendimento, me avisa que chamo o Zé da Obra 👷‍♂️!
  ```

- **2º Turno (Cliente):** *"Como que eu aplico esse Vedatop? Quantas demãos tem que passar?"*
- **Resposta do ZÉ DA OBRA (Mestre de Obras / Passo a Passo Prático):**
  ```text
  👷‍♂️ Zé da Obra na área! A Lia me chamou pra te explicar o modo de aplicação correto do Vedatop:

  1️⃣ Preparo da Superfície: Limpe bem a área, tire pó, graxa ou restos soltos. Umedeça levemente a parede antes de começar.
  2️⃣ Mistura: Adicione o componente líquido aos poucos no pó, misturando bem até formar uma tinta grossa e homogênea.
  3️⃣ Aplicação Cruzada: Aplique de 2 a 3 demãos fartas com brocha ou trincha. A 1ª demão no sentido horizontal; espere secar de 4 a 6 horas e passe a 2ª demão no sentido vertical!
  4️⃣ Cantos e Encontros: Faça uma meia-cana arredondada nos cantos com argamassa antes de aplicar, pra nunca trincar.

  💡 Rendimento: Uma caixa de 18kg rende de 6 a 9 m² prontos com 3 demãos.

  🙋‍♀️ Lia: Já reservei o Vedatop 18kg no nosso sistema por R$ 98,90 no PIX. Deseja que eu gere o link para entrega na sua obra hoje? 🛒
  ```

### 4. 🎙️ Atendimento por Áudio de Obra (Whisper)
- **Áudio do Cliente:** Cliente manda áudio com barulho de betoneira ao fundo: *"Ô Zé, manda 10 saco de cimento e 2 metro de brita aqui pra obra na Aldeota"*.
- **Ação:** O n8n transcreve o áudio com Whisper, identifica o produto e localidade, calcula frete R$ 0,00 e envia o orçamento imediato.

### 5. 👤 Transbordo Humano no Chatwoot
- Se o cliente disser: *"Quero negociar com um atendente"* ou *"Tenho uma lista grande de obra"*:
- O n8n altera a conversa no Chatwoot para `Open`, toca o alarme no computador e dispara notificação push no aplicativo do celular do vendedor para assumir.

---

## 🔐 6. Variáveis de Ambiente Recomendadas

### Backend NestJS (`backend-nestjs/.env`)
```env
PORT=8081
NODE_ENV=production
DATABASE_URL="postgresql://postgres:[SENHA]@db.[PROJETO].supabase.co:5432/postgres"
JWT_SECRET="chave-secreta-super-segura"
FRONTEND_URL="https://loja.seudominio.com.br"

# Supabase Pro
SUPABASE_URL="https://[PROJETO].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"
SUPABASE_ANON_KEY="sua-anon-key"
SUPABASE_BUCKET_NAME="products"

# OpenAI (Para Embeddings e IA)
OPENAI_API_KEY="sk-proj-..."

# Wazapi & n8n
WAZAPI_URL="https://wazapi.seudominio.com.br"
WAZAPI_API_KEY="sua-chave-wazapi"
N8N_WEBHOOK_URL="https://n8n.seudominio.com.br/webhook"
```

### Frontend Next.js (`frontend/.env.production`)
```env
NEXT_PUBLIC_API_URL=https://api.seudominio.com.br
API_URL=https://api.seudominio.com.br
BACKEND_URL=https://api.seudominio.com.br
NEXT_PUBLIC_ENVIRONMENT=production
```

---

## 📈 7. Próximos Passos de Execução

1. **Deploy da Stack na VPS Contabo:**
   - Instalar Docker e configurar o Nginx com SSL (`certbot`) para:
     - `loja.seudominio.com.br` (Frontend Next.js)
     - `api.seudominio.com.br` (Backend NestJS)
     - `chatwoot.seudominio.com.br` (CRM de Atendimento Humano)
     - `n8n.seudominio.com.br` (Orquestrador de IA)
     - `wazapi.seudominio.com.br` (Gateway WhatsApp)
2. **Executar o SQL do `pgvector` no Supabase Pro**.
3. **Conectar a instância do WhatsApp (Wazapi / Evolution API) à caixa de entrada do Chatwoot**.
4. **Apontar o Webhook de mensagens recebidas para o n8n**.
5. **Cadastrar os atendentes no Chatwoot e baixar o aplicativo nos celulares da equipe**.
