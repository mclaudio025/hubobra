# 📱 HubScanner - Coletor de Estoque e Scanner Mobile Inteligente em Flutter

Aplicativo móvel desenvolvido em **Flutter** para gestão ágil de depósito, inventário e auto-cadastro de produtos por código de barras (**EAN-13 / EAN-8 / QR Code**), conectado diretamente ao banco de dados **Supabase PostgreSQL**.

---

## ⚡ Principais Funcionalidades

1. 📷 **Leitor de Código de Barras Ultrarrápido:** Aceleração de hardware nativa na câmera traseira com laser animado e controle de lanterna (flash).
2. 🔄 **Ajuste de Estoque em 1 Toque:** Bipa o produto físico no galpão e ajusta a quantidade com botões rápidos `[+1]`, `[+5]`, `[+10]` ou contagem física de balanço.
3. 💰 **Atualização Instantânea de Preço:** Altera o preço de venda no aplicativo e o valor é atualizado em tempo real no Supabase, no site e no WhatsApp do Zé da Obra.
4. 🤖 **Auto-Cadastro Inteligente:** Se o produto não existir no banco, a IA pré-carrega o nome oficial, marca, especificações e foto da embalagem para cadastro em 3 segundos.
5. 📊 **Visão Geral do Estoque:** Listagem de produtos recentes, busca em tempo real e identificação de estoque baixo.

---

## 🏗️ Estrutura do Projeto

```
app_flutter_scanner/
├── lib/
│   ├── config/
│   │   ├── supabase_config.dart   # URL e Chaves do Supabase
│   │   └── theme.dart             # Tema escuro de alto contraste
│   ├── models/
│   │   ├── product_model.dart     # Modelo Product mapeado para o PostgreSQL
│   │   └── category_model.dart    # Modelo Category
│   ├── services/
│   │   ├── supabase_service.dart  # CRUD direto no Supabase
│   │   └── barcode_lookup_service.dart # Auto-enriquecimento por IA
│   ├── screens/
│   │   ├── scanner_screen.dart    # Câmera com mira laser
│   │   ├── product_detail_sheet.dart # Modal de ajuste de estoque/preço
│   │   ├── auto_create_screen.dart   # Ficha de cadastro automático
│   │   ├── inventory_list_screen.dart # Lista de estoque e busca
│   │   └── settings_screen.dart   # Diagnóstico de conexão
│   └── main.dart                  # Inicialização e abas de navegação
```

---

## 🚀 Como Executar o Aplicativo

### 1. Conectar o Celular via USB ou Iniciar o Emulador
Certifique-se de que a depuração USB esteja ativada no seu celular Android ou abra o simulador iOS.

### 2. Entrar na pasta do app
```bash
cd app_flutter_scanner
```

### 3. Baixar dependências
```bash
flutter pub get
```

### 4. Rodar o App
```bash
flutter run
```

### 5. Gerar o APK para instalar no celular
```bash
flutter build apk --release
```
O arquivo `.apk` será gerado em: `build/app/outputs/flutter-apk/app-release.apk`.
Basta enviar para o WhatsApp do lojista ou estoquista e instalar diretamente no celular Android!
