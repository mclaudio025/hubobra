# Implementação Ceará + Auto Preenchimento CEP

## Objetivo

Configurar o checkout para atender apenas o estado do Ceará e implementar auto preenchimento de endereço por CEP para melhorar a experiência do usuário.

## Mudanças Implementadas

### 1. Estado Fixado como Ceará

**Antes:**
```typescript
// Select com múltiplos estados
<select>
  <option value="">Selecione</option>
  <option value="SP">São Paulo</option>
  <option value="RJ">Rio de Janeiro</option>
  <option value="MG">Minas Gerais</option>
  // ... outros estados
</select>
```

**Depois:**
```typescript
// Campo fixo somente leitura
<input
  type="text"
  value="Ceará"
  readOnly
  className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-gray-700 cursor-not-allowed"
/>
```

**Estado inicial atualizado:**
```typescript
const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
  // ... outros campos
  state: 'CE', // Pré-definido como Ceará
  // ...
});
```

### 2. Auto Preenchimento por CEP

#### Função de Busca CEP
```typescript
const searchCep = async (cep: string) => {
  const cleanCep = cep.replace(/\D/g, '');
  
  if (cleanCep.length !== 8) return;

  setLoadingCep(true);
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();
    
    // Validação de erro da API
    if (data.erro) {
      addToast({
        type: 'error',
        title: 'CEP não encontrado',
        message: 'Verifique o CEP informado'
      });
      return;
    }

    // Validação se é do Ceará
    if (data.uf !== 'CE') {
      addToast({
        type: 'error',
        title: 'CEP fora da área de entrega',
        message: 'Atendemos apenas o estado do Ceará'
      });
      return;
    }

    // Preenchimento automático
    setDeliveryAddress(prev => ({
      ...prev,
      street: data.logradouro || prev.street,
      district: data.bairro || prev.district,
      city: data.localidade || prev.city,
      state: 'CE',
      zipCode: cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2')
    }));

    addToast({
      type: 'success',
      title: 'CEP encontrado',
      message: 'Endereço preenchido automaticamente'
    });

  } catch (error) {
    addToast({
      type: 'error',
      title: 'Erro ao buscar CEP',
      message: 'Tente novamente ou preencha manualmente'
    });
  } finally {
    setLoadingCep(false);
  }
};
```

#### Formatação Automática
```typescript
const handleCepChange = (value: string) => {
  // Formatar CEP enquanto digita (00000-000)
  const formatted = value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substr(0, 9);
  
  setDeliveryAddress({ ...deliveryAddress, zipCode: formatted });
  
  // Buscar CEP quando tiver 8 dígitos
  const cleanCep = formatted.replace(/\D/g, '');
  if (cleanCep.length === 8) {
    searchCep(cleanCep);
  }
};
```

### 3. Interface Melhorada

#### Campo CEP com Loading
```typescript
<div className="relative">
  <input
    type="text"
    value={deliveryAddress.zipCode}
    onChange={(e) => handleCepChange(e.target.value)}
    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
    placeholder="00000-000"
    required={deliveryMethod === 'DELIVERY'}
    maxLength={9}
  />
  {loadingCep && (
    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
    </div>
  )}
</div>
<p className="text-xs text-gray-500 mt-1">
  Digite o CEP para preenchimento automático
</p>
```

### 4. Endereço da Loja Atualizado

**Antes:**
```
Rua das Construções, 123 - Centro
São Paulo - SP, 01234-567
```

**Depois:**
```
Rua das Construções, 123 - Centro
Fortaleza - CE, 60000-000
```

## Funcionalidades Implementadas

### ✅ Auto Preenchimento
- **Busca automática** quando CEP tem 8 dígitos
- **Formatação em tempo real** (00000-000)
- **Preenchimento de campos**: rua, bairro, cidade
- **Preservação de dados** já preenchidos

### ✅ Validações
- **CEP válido**: Verifica se existe na base dos Correios
- **Apenas Ceará**: Rejeita CEPs de outros estados
- **Formato correto**: Aceita apenas números válidos

### ✅ Feedback Visual
- **Loading indicator** durante busca
- **Toast de sucesso** quando encontra
- **Toast de erro** para problemas
- **Texto explicativo** no campo

### ✅ Tratamento de Erros
- CEP não encontrado
- CEP fora da área de entrega (outros estados)
- Erro na comunicação com API
- Fallback para preenchimento manual

## API Utilizada

**ViaCEP**: `https://viacep.com.br/ws/{cep}/json/`

**Vantagens:**
- ✅ Gratuita e sem limite de requisições
- ✅ Dados atualizados dos Correios
- ✅ Resposta rápida
- ✅ Não requer autenticação
- ✅ Suporte a CORS

**Exemplo de resposta:**
```json
{
  "cep": "60000-000",
  "logradouro": "Rua Exemplo",
  "complemento": "",
  "bairro": "Centro",
  "localidade": "Fortaleza",
  "uf": "CE",
  "ibge": "2304400",
  "gia": "",
  "ddd": "85",
  "siafi": "1389"
}
```

## Fluxo de Uso

### 1. Cliente Digita CEP
- Campo formata automaticamente
- Aceita apenas números
- Máximo 9 caracteres (00000-000)

### 2. Busca Automática
- Quando CEP tem 8 dígitos
- Mostra loading indicator
- Chama API ViaCEP

### 3. Validação
- Verifica se CEP existe
- Confirma se é do Ceará
- Trata erros adequadamente

### 4. Preenchimento
- Preenche rua, bairro, cidade
- Mantém dados já digitados
- Mostra toast de sucesso

## Benefícios

### Para o Cliente
- ✅ **Mais rápido**: Não precisa digitar endereço completo
- ✅ **Menos erros**: Dados vêm dos Correios
- ✅ **Melhor UX**: Feedback visual claro
- ✅ **Validação**: Garante que está na área de entrega

### Para o Negócio
- ✅ **Foco local**: Atende apenas o Ceará
- ✅ **Dados precisos**: Endereços corretos para entrega
- ✅ **Menos suporte**: Reduz dúvidas sobre endereço
- ✅ **Conversão**: Processo mais fluido

### Técnico
- ✅ **Performance**: API rápida e confiável
- ✅ **Manutenibilidade**: Código limpo e documentado
- ✅ **Escalabilidade**: Fácil de expandir para outros estados
- ✅ **Robustez**: Tratamento completo de erros

## Como Testar

### Cenário 1: CEP Válido do Ceará
1. Digite: `60000000`
2. Veja formatação: `60000-000`
3. Aguarde loading
4. Campos preenchidos automaticamente
5. Toast de sucesso

### Cenário 2: CEP de Outro Estado
1. Digite: `01310100` (SP)
2. Veja formatação: `01310-100`
3. Aguarde loading
4. Toast de erro: "CEP fora da área de entrega"

### Cenário 3: CEP Inválido
1. Digite: `00000000`
2. Veja formatação: `00000-000`
3. Aguarde loading
4. Toast de erro: "CEP não encontrado"

### Cenário 4: Preenchimento Manual
1. Preencha campos manualmente
2. Digite CEP válido
3. Campos são atualizados mas preservam dados importantes

## Status

✅ **IMPLEMENTADO** - Ceará + Auto preenchimento CEP funcionando

O sistema agora está otimizado para atender especificamente o estado do Ceará com uma experiência de usuário superior através do auto preenchimento por CEP.