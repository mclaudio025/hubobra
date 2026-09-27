# 📊 Plano de Implementação: Atualização de Preços em Lote (.XLSX) & Extrator dos 4 Grandes (Acal, Leroy Merlin, Carajás, Normatel)

> **Task Slug:** `catalogo-excel-extrator`  
> **Tipo de Projeto:** FULLSTACK (NestJS + Next.js 14 + XLSX Engine + Extrator Multi-Store)  
> **Status:** 🟢 Implementado e Operacional

---

## 🎯 1. Overview & Contexto de Negócio

### O Problema
Para depósitos e lojas parceiras do HubObra, atualizar manualmente o preço e estoque de centenas de produtos um por um no painel web é lento e inviável na rotina operacional diária. Além disso, cadastrar milhares de itens do zero com fotos em alta resolução, descrições técnicas, normas ABNT e códigos de barras (EAN) demanda muito tempo.

### A Solução Integrada
1. **Módulo de Planilha Excel (.xlsx / .csv) Bidirecional:**
   - **Exportação Inteligente:** Gera arquivo `.xlsx` com todos os produtos da loja, contendo `ID`, `SKU`, `EAN`, `Nome`, `Categoria`, `Custo`, `Preço de Venda`, `Preço Promocional`, `Estoque` e `Preço Ref. Mercado`.
   - **Importação com Preview:** O lojista edita no Excel ou Planilhas Google, sobe a planilha de volta e visualiza o resumo de alterações (*"X preços alterados, Y estoques atualizados"*) antes de confirmar.
2. **Robô Extrator Multi-Store (Acal, Leroy Merlin, Carajás e Normatel):**
   - Script indexador que consulta as APIs/catálogos públicos dos 4 maiores Home Centers, extrai fotos com fundo branco, dados técnicos e preços de mercado, padronizando os dados para o catálogo do HubObra.

---

## 🚀 2. Critérios de Sucesso (Success Criteria)

- [x] **Download Rápido de Excel (.xlsx):** Endpoint `GET /price-management/export/excel` gerando planilha `.xlsx` estilizada com todas as colunas (ID, SKU, EAN, Nome, Categoria, Marca, Preço, Comparativo, Custo, Estoque, Status).
- [x] **Upload e Processamento em Massa:** Endpoint `POST /price-management/import/excel` processando arquivos `.xlsx` e `.csv` atualizando preços, custos e estoques no PostgreSQL de forma atômica com correspondência por ID, SKU ou Código de Barras (EAN).
- [x] **Auditoria de Reajustes (`PriceHistory`):** Todas as alterações em lote geram histórico rastreável com data, operador e valores anteriores/novos.
- [x] **Interface Amigável no Admin (`/admin/precos`):** Botões de download do catálogo completo em `.xlsx`, upload com drag & drop e feedback visual imediato.
- [x] **Extrator dos 4 Concorrentes (`scripts/extractors/multi-store-search.js`):** Script funcional para busca e enriquecimento de produtos a partir de Acal, Leroy Merlin, Carajás e Normatel com higienização de marca.
- [x] **Build e Validações:** Build do backend e frontend aprovados sem erros.

---

## 🛠️ 3. Tech Stack & Decisões Arquiteturais

| Camada | Tecnologia | Racional |
| :--- | :--- | :--- |
| **Geração/Leitura XLSX** | `xlsx` (SheetJS) no NestJS | Biblioteca robusta e já instalada no backend para processar dezenas de milhares de linhas em milissegundos sem travar o event-loop. |
| **Backend API** | NestJS + Prisma ORM | Endpoints com `@UseGuards(JwtAuthGuard, RolesGuard)` protegidos para `ADMIN` e `MANAGER`. |
| **Frontend UI** | Next.js 14 + Tailwind CSS + Lucide Icons | Interface moderna com abas de Exportação, Importação e Tabela de Preview interativa. |
| **Extrator de Dados** | Node.js / Axios / Cheerio / Python | Extrator modular com conectores específicos para cada player (Acal, Leroy, Carajás, Normatel). |

---

## 📁 4. Estrutura de Arquivos

```text
Projeto Loja Moderna/
├── backend-nestjs/
│   └── src/
│       └── price-management/
│           ├── price-management.controller.ts     # Endpoints GET /export-excel e POST /import-excel
│           └── price-management.service.ts        # Lógica de geração de buffer .xlsx e atualização em massa
│
├── scripts/
│   └── extractors/
│       ├── acal-extractor.js                      # Conector Acal Home Center
│       ├── normatel-extractor.js                  # Conector Normatel Home Center
│       ├── carajas-extractor.js                   # Conector Carajás Home Center
│       ├── leroy-extractor.js                     # Conector Leroy Merlin
│       └── multi-store-search.js                  # Orquestrador de busca unificada nas 4 lojas
│
└── frontend/
    └── src/
        └── app/
            └── admin/
                └── precos/
                    └── page.tsx                   # Painel de Gestão de Preços com Exportação/Importação Excel
```

---

## 📋 5. Task Breakdown (Detalhamento de Tarefas)

### Tarefa 1: Implementar Exportação e Importação de Planilha Excel (.xlsx) no Backend
- **Agente Responsável:** `backend-specialist`
- **Skills:** `clean-code`, `api-patterns`
- **Prioridade:** P0
- **Dependências:** Nenhuma
- **INPUT:** `backend-nestjs/src/price-management/`
- **OUTPUT:**
  - Método `exportExcel(categoryId?: string)`: Gera planilha `.xlsx` com colunas (ID, SKU, EAN, Nome, Categoria, Custo, Preço Venda, Preço Comparativo, Estoque).
  - Método `importExcel(fileBuffer)`: Lê o `.xlsx` enviado, mapeia por ID ou SKU/EAN, atualiza os produtos e grava em `PriceHistory`.
- **VERIFY:** Baixar a planilha gerada via Swagger/Postman e validar integridade no Excel.

---

### Tarefa 2: Criar Interface Visual no Painel Admin (`/admin/precos`)
- **Agente Responsável:** `frontend-specialist`
- **Skills:** `frontend-design`, `react-best-practices`
- **Prioridade:** P1
- **Dependências:** Tarefa 1
- **INPUT:** `frontend/src/app/admin/precos/page.tsx`
- **OUTPUT:**
  - Card de "Exportar Tabela de Preços Atual (.xlsx)" com filtro opcional por categoria.
  - Card de "Upload de Planilha Atualizada" com arrastar e soltar.
  - Modal de Preview das alterações com contadores (*Total analisado, Preços alterados, Estoque ajustado, Inalterados*).
  - Feedback visual de sucesso.
- **VERIFY:** Testar fluxo completo no navegador: Baixar Excel -> Alterar preços no Excel -> Subir arquivo -> Validar atualização na tela.

---

### Tarefa 3: Desenvolver o Robô Extrator dos 4 Concorrentes (Acal, Leroy, Carajás, Normatel)
- **Agente Responsável:** `backend-specialist`
- **Skills:** `nodejs-best-practices`, `clean-code`
- **Prioridade:** P2
- **Dependências:** Tarefa 1 e 2
- **INPUT:** `scripts/extractors/`
- **OUTPUT:**
  - Scripts de coleta para consulta das 4 lojas por nome de produto ou código EAN.
  - Retorno unificado com nome, foto HD, ficha técnica, código de barras e preço praticado.
- **VERIFY:** Executar `node scripts/extractors/multi-store-search.js "Cimento CP II"` e verificar resultados retornados das 4 lojas.

---

## 🏁 6. Phase X: Verificação Final & Qualidade

- [ ] **TypeScript Check:** `npx tsc --noEmit` no backend e frontend.
- [ ] **Teste de Carga de Planilha:** Testar importação de planilha com mais de 100 itens sem timeout.
- [ ] **Deploy no Servidor:** Commitar e enviar ao GitHub para atualização no Easypanel.
