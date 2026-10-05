# 🧾 Guia Completo de Configuração Fiscal (NFC-e & NF-e)
### Loja de Materiais de Construção em Fortaleza - Ceará (SEFAZ-CE) • HubObra ERP

Este documento detalha o passo a passo completo para ativar a emissão fiscal de **NFC-e (Cupom Fiscal Eletrônico no Caixa)** e **NF-e (Nota Grande para Construtoras e Empresas)** utilizando o seu **Certificado Digital A1**.

---

## 🏗️ 1. Como Funciona a Emissão com Certificado A1

Com o **Certificado Digital A1 (`.pfx` ou `.p12`)**, toda a loja opera de forma integrada e sem limitações físicas:

```mermaid
graph LR
    subgraph LOJA["🏬 SUA LOJA DE CONSTRUÇÃO (TERMINAIS)"]
        Balcao1["🛒 Balcão Vendas 1"]
        Balcao2["🛒 Balcão Vendas 2"]
        Caixa["💵 Caixa Central / Frente"]
        Mobile["📱 Vendedor no Pátio"]
        Impressora["🧾 Impressora Térmica 80mm\n(DANFE NFC-e com QR Code)"]
    end

    subgraph MOTOR["☁️ MOTOR FISCAL EM NUVEM (API)"]
        CertA1["🔐 Certificado A1 (.pfx)\n(Instalado com Segurança)"]
        Signer["⚡ Assinador XML + Validador"]
    end

    subgraph SEFAZ["🏛️ SEFAZ DO CEARÁ"]
        SefazCE["📡 Servidores SEFAZ-CE"]
    end

    Balcao1 -.->|Envia Pedido| Caixa
    Balcao2 -.->|Envia Pedido| Caixa
    Mobile -.->|Envia Pedido| Caixa

    Caixa -->|1. Transmite JSON da Venda| Signer
    CertA1 --> Signer
    Signer -->|2. Assina Digitalmente| SefazCE
    SefazCE -->|3. Autorização OK (Protocolo)| Signer
    Signer -->|4. Retorna XML + PDF| Caixa
    Caixa -->|5. Imprime Cupom Fiscal| Impressora
```

---

## 🏆 2. Vantagens do Certificado A1 no Modelo Local-First

1. **Multi-Terminais Simultâneos:** Todos os computadores do balcão e caixas podem emitir notas ao mesmo tempo.
2. **Sem Hardware Plugado:** Zero risco de pendrive USB quebrar, dar mau contato ou travar portas.
3. **Velocidade Recorde:** A nota é autorizada e impressa no caixa em **menos de 1,5 segundo**.
4. **Contingência Automática:** Se a internet da loja oscilar, o sistema emite em contingência offline e transmite assim que a rede voltar.

---

## 📋 3. Passo a Passo Prático para Ativar a Emissão

### **Passo 1: Criar Conta na API Fiscal em Nuvem**
A forma mais barata, moderna e sem manutenção é utilizar uma API fiscal parceira:
* **Opções Homologadas no HubObra:**
  * [Nuvem Fiscal](https://www.nuvemfiscal.com.br) *(Planos a partir de R$ 29/mês)*
  * [Focus NFe](https://focusnfe.com.br) *(Planos a partir de R$ 49/mês ou por consumo)*
  * [PlugNotas / TecnoSpeed](https://plugnotas.com.br)

**O que fazer no painel da API:**
1. Cadastre o CNPJ e a Razão Social da sua loja.
2. Faça o upload do arquivo **`certificado.pfx`** e informe a senha dele.
3. Copie o **Token de Acesso (API Key)** gerado no painel.

---

### **Passo 2: Obter o CSC da SEFAZ-CE com o seu Contador**
O **CSC (Código de Segurança do Contribuinte)** é o código exigido pela SEFAZ do Ceará para gerar o **QR Code** impresso no cupom do consumidor.

👉 **Copie e envie esta mensagem para o seu contador:**
> *"Olá! Estamos ativando a emissão de NFC-e (Cupom Fiscal Eletrônico) no sistema PDV da nossa loja. Poderia me fornecer por gentileza o **CSC (Código de Segurança do Contribuinte)** e o **ID do Token (ex: 000001)** da nossa Inscrição Estadual na SEFAZ-CE?"*

---

### **Passo 3: Configurar no HubObra ERP**
1. Acesse o sistema HubObra ERP com usuário Administrador.
2. Clique na aba **"Fiscal NFC-e"** (ou Configurações Fiscais).
3. Preencha os campos:
   * **Provedor:** `Nuvem Fiscal` ou `Focus NFe`
   * **Ambiente:** `Produção` *(ou `Homologação` se quiser emitir notas de teste)*
   * **Token da API:** Cole a chave gerada no Passo 1
   * **Série da NFC-e:** `1`
   * **Próximo Número da Nota:** *(Número da última nota emitida + 1)*
4. Clique em **"Salvar Configurações Fiscais"**.

---

## 🧱 4. Principais NCMs e Regras Tributárias para Materiais de Construção

Ao cadastrar produtos no estoque do HubObra, certifique-se de preencher o NCM correto para cálculo automático de impostos:

| Categoria do Material | Descrição Exemplo | NCM Padrão | CFOP Padrão (Estadual) |
| :--- | :--- | :--- | :--- |
| **Cimento** | Cimento Poty / Votoran 50kg CP II | `2523.29.10` | `5.405` (Subst. Tributária) / `5.102` |
| **Argamassas e Rejuntes** | Argamassa AC-I / AC-II / AC-III Quartzolit | `3824.50.00` | `5.405` / `5.102` |
| **Aço e Vergalhões** | Vergalhão Gerdau CA-50 3/8" (10mm) | `7214.20.00` | `5.102` |
| **Tubos e Conexões PVC** | Joelho 90° 25mm Tigre / Krona Soldável | `3917.23.00` | `5.405` |
| **Blocos e Cerâmica** | Tijolo 8 Furos 9x19x19 / Bloco de Concreto | `6904.10.00` | `5.102` |
| **Porcelanatos e Pisos** | Porcelanato Delta 84x84 Polido Extra | `6907.21.00` | `5.102` |
| **Tintas e Solventes** | Tinta Acrílica Fosca 18L Coral / Suvinil | `3209.10.10` | `5.405` (Subst. Tributária) |

> 💡 **Regime Tributário (Simples Nacional):**
> * **CSOSN 102 / 103:** Tributado pelo Simples Nacional sem permissão de crédito.
> * **CSOSN 500:** Produtos com ICMS recolhido anteriormente por Substituição Tributária (muito comum em tintas, cimentos e PVC no Ceará).

---

## 📶 5. Contingência Offline na SEFAZ-CE (Quando a Internet Cair)

Se a internet da loja ou os servidores da SEFAZ-CE ficarem fora do ar:

1. O **HubObra ERP** detecta a perda de conexão e entra em **Modo de Contingência Offline**.
2. O caixa continua finalizando vendas normalmente e a impressora térmica emite o DANFE NFC-e com a mensagem obrigatória:
   > *"EMITIDA EM CONTINGÊNCIA - Pendente de autorização"*
3. O sistema armazena o XML assinado localmente no banco IndexedDB.
4. Assim que a internet volta, o serviço de sincronização do HubObra envia automaticamente todas as notas acumuladas para a SEFAZ-CE dentro do prazo legal de **24 horas**.

---

## 🖨️ 6. Impressoras Compatíveis para Emissão

* **Impressoras Térmicas de Cupom Fiscal 80mm (ESC/POS):**
  * Elgin (i7, i8, i9)
  * Bematech (MP-4200 TH, MP-100s TH)
  * Epson (TM-T20X, TM-T88)
  * Daruma (DR800)
* **Impressoras Matriciais (3 Vias de Orçamento/Separação):**
  * Epson LX-300 / LX-350 (Formulário Contínuo)
* **Impressoras Laser/Jato de Tinta A4:**
  * Para DANFE NF-e grande de entrega em obras e construtoras.

---

## 📞 Suporte e Dúvidas Frequentes

* **P: Preciso emitir nota de tudo o que vendo no balcão?**
  * R: O vendedor no balcão gera apenas o **Pedido de Venda / Orçamento**. A emissão fiscal ocorre apenas quando o cliente passa no **Caixa Central** e o pagamento é confirmado.
* **P: Posso cancelar uma NFC-e emitida errada?**
  * R: Sim! Pela regra da SEFAZ-CE, o cancelamento de NFC-e pode ser feito em até **30 minutos** após a autorização. Após isso, pode-se emitir uma NF-e de estorno/devolução.
