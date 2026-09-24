# Implementação de Prompts para Personas - Lia e Zé da Obra

## 🎯 **Problema Identificado**

O sistema tinha prompts configuráveis apenas para o "Zé da Obra", mas não para a "Lia" (atendente virtual). Como o sistema usa duas personas distintas, cada uma deveria ter seus próprios prompts específicos.

## ✅ **Solução Implementada**

### 1. **Expansão do Sistema de Prompts**

#### **Prompts da Lia (Atendente Virtual)**
```typescript
// Categorias: LIA
- lia_system: Prompt principal da personalidade
- lia_greeting: Saudação inicial
- lia_orders: Informações sobre pedidos
- lia_delivery: Informações de entrega
- lia_store_hours: Horários de funcionamento
- lia_promotions: Promoções e ofertas
- lia_transfer: Transferência para especialista
```

#### **Prompts do Zé da Obra (Especialista Técnico)**
```typescript
// Categorias: ZE_DA_OBRA
- ze_system: Prompt principal da personalidade
- ze_greeting: Saudação inicial
- ze_cement: Informações sobre cimento
- ze_bricks: Informações sobre tijolos
- ze_calculation: Cálculos de materiais
- ze_safety: Dicas de segurança
```

#### **Prompts para WhatsApp**
```typescript
// Categorias: WHATSAPP
- whatsapp_welcome_lia: Boas-vindas da Lia
- whatsapp_welcome_ze: Boas-vindas do Zé da Obra
```

### 2. **Personalidades Distintas**

#### **Lia - Atendente Virtual**
```
PERSONALIDADE:
- Simpática, acolhedora e prestativa
- Eficiente em atendimento ao cliente
- Sempre positiva e solucionadora
- Comunicação clara e amigável

RESPONSABILIDADES:
- Atendimento geral aos clientes
- Informações sobre pedidos e entregas
- Horários e localização da loja
- Promoções e ofertas
- Navegação no site
- Suporte básico
```

#### **Zé da Obra - Especialista Técnico**
```
PERSONALIDADE:
- Técnico, experiente e confiável
- Didático e paciente para explicar
- Sempre prioriza a segurança
- Fala de forma clara e profissional

CONHECIMENTOS:
- Materiais de construção
- Cálculos de quantidade de materiais
- Técnicas de construção e reforma
- Normas de segurança (ABNT, NR-18)
- Especificações técnicas
- Preços e orçamentos
```

### 3. **Interface de Gerenciamento Atualizada**

#### **Página de Prompts (`/admin/prompts`)**
- **Tabs separadas** para cada persona
- **Visualização específica** por categoria
- **Editor individual** para cada prompt
- **Sistema de variáveis** com teste
- **Preview em tempo real**

#### **Funcionalidades:**
- ✅ Edição de prompts por persona
- ✅ Sistema de variáveis ({{userName}}, etc.)
- ✅ Preview com substituição de variáveis
- ✅ Cópia para área de transferência
- ✅ Status ativo/inativo
- ✅ Categorização por persona

### 4. **Backend Atualizado**

#### **PromptsService Expandido**
```typescript
// Métodos específicos para personas
async getLiaPrompt(context: string, variables: Record<string, string>): Promise<string>
async getZePrompt(context: string, variables: Record<string, string>): Promise<string>
async getPromptsByPersona(persona: 'lia' | 'ze'): Promise<PromptTemplate[]>
async getWhatsAppWelcome(persona: 'lia' | 'ze', userName: string): Promise<string>
```

#### **PromptsController Criado**
```typescript
@Controller('prompts')
- GET /prompts - Listar todos os prompts
- GET /prompts/lia - Prompts da Lia
- GET /prompts/ze - Prompts do Zé da Obra
- PUT /prompts/:id - Atualizar prompt
```

#### **PromptsModule Adicionado**
- Integração completa com o sistema
- Injeção de dependências configurada
- Exportação de serviços

### 5. **APIs Frontend Criadas**

#### **Rotas de API**
```typescript
- GET /api/prompts - Buscar todos os prompts
- PUT /api/prompts/[id] - Atualizar prompt específico
```

## 📊 **Estrutura de Prompts Implementada**

### **Lia (Atendente Virtual)**
| Prompt ID | Nome | Uso | Variáveis |
|-----------|------|-----|-----------|
| `lia_system` | Prompt Principal | Personalidade base | - |
| `lia_greeting` | Saudação | Primeira interação | `userName` |
| `lia_orders` | Pedidos | Consultas sobre pedidos | - |
| `lia_delivery` | Entrega | Informações de entrega | - |
| `lia_store_hours` | Horários | Funcionamento da loja | - |
| `lia_promotions` | Promoções | Ofertas e descontos | - |
| `lia_transfer` | Transferência | Passar para especialista | `userName` |

### **Zé da Obra (Especialista)**
| Prompt ID | Nome | Uso | Variáveis |
|-----------|------|-----|-----------|
| `ze_system` | Prompt Principal | Personalidade base | - |
| `ze_greeting` | Saudação | Primeira interação | `userName`, `transferredFromLia` |
| `ze_cement` | Cimento | Informações técnicas | `userName` |
| `ze_bricks` | Tijolos | Especificações | `userName` |
| `ze_calculation` | Cálculos | Dimensionamento | `userName` |
| `ze_safety` | Segurança | Dicas e normas | `userName` |

## 🎨 **Interface de Usuário**

### **Design das Tabs**
```typescript
// Tab da Lia
<TabsTrigger value="lia">
  <User className="w-4 h-4" />
  Lia (Atendente)
</TabsTrigger>

// Tab do Zé da Obra
<TabsTrigger value="ze">
  <Wrench className="w-4 h-4" />
  Zé da Obra (Especialista)
</TabsTrigger>
```

### **Cards Informativos**
- **Lia:** Fundo azul, ícone User, foco em atendimento
- **Zé da Obra:** Fundo verde, ícone Wrench, foco técnico

### **Editor de Prompts**
- Textarea com syntax highlighting
- Sistema de variáveis com inputs de teste
- Preview em tempo real
- Botões de ação (Editar, Salvar, Copiar)

## 🔧 **Integração com Sistema Existente**

### **AIPersonasService Compatível**
O sistema existente de personas já estava preparado para usar prompts específicos:

```typescript
// Já implementado
async generateLiaResponse(message: string, context: ConversationContext): Promise<PersonaResponse>
async generateZeResponse(message: string, context: ConversationContext): Promise<PersonaResponse>
```

### **Uso dos Novos Prompts**
```typescript
// Exemplo de uso
const liaGreeting = await promptsService.getLiaPrompt('greeting', { userName: 'João' });
const zeSystemPrompt = await promptsService.getZePrompt('system');
```

## 🧪 **Exemplo de Uso**

### **Prompt da Lia com Variáveis**
```
Entrada: "Olá {{userName}}! 😊 Sou a *Lia*..."
Variáveis: { userName: "Maria" }
Saída: "Olá Maria! 😊 Sou a *Lia*..."
```

### **Fluxo de Transferência**
```
1. Usuário faz pergunta técnica para Lia
2. Lia usa prompt 'lia_transfer'
3. Sistema transfere para Zé da Obra
4. Zé usa prompt 'ze_greeting' com transferredFromLia=true
```

## 📈 **Benefícios Implementados**

### **Para Administradores:**
- ✅ Controle total sobre personalidade das personas
- ✅ Edição fácil e intuitiva
- ✅ Teste de prompts antes de aplicar
- ✅ Organização clara por persona

### **Para Usuários:**
- ✅ Experiência mais consistente
- ✅ Respostas personalizadas por contexto
- ✅ Transição suave entre personas
- ✅ Comunicação mais natural

### **Para Desenvolvedores:**
- ✅ Sistema modular e extensível
- ✅ APIs bem estruturadas
- ✅ Fácil adição de novos prompts
- ✅ Integração com sistema existente

## 🚀 **Próximos Passos**

### **Melhorias Sugeridas:**
1. **Versionamento de Prompts** - Histórico de alterações
2. **A/B Testing** - Testar diferentes versões
3. **Analytics** - Métricas de efetividade
4. **Templates** - Prompts pré-definidos
5. **Importação/Exportação** - Backup e migração

### **Funcionalidades Avançadas:**
1. **Conditional Logic** - Prompts condicionais
2. **Multi-idioma** - Suporte a múltiplos idiomas
3. **Rich Media** - Suporte a imagens e links
4. **Integration Testing** - Testes automatizados

## ✅ **Status Final**

**Implementação:** ✅ **100% COMPLETA**

### **Funcionalidades Entregues:**
- ✅ Prompts específicos para Lia e Zé da Obra
- ✅ Interface de gerenciamento completa
- ✅ Sistema de variáveis funcionando
- ✅ APIs backend e frontend
- ✅ Integração com sistema existente
- ✅ Documentação completa

### **Páginas Funcionais:**
- `/admin/prompts` - ✅ Gerenciamento completo
- `/admin/ia/configuracoes` - ✅ Configurações gerais
- Sistema de personas - ✅ Usando novos prompts

O sistema agora oferece controle completo sobre o comportamento das duas personas, permitindo personalização específica para cada contexto de uso!

## 🎯 **Resultado**

Agora o sistema tem **prompts específicos e configuráveis** para ambas as personas:

- **Lia:** Focada em atendimento, informações gerais e suporte
- **Zé da Obra:** Especializado em questões técnicas e cálculos

Cada persona pode ser personalizada independentemente, oferecendo uma experiência mais rica e contextualizada para os usuários!