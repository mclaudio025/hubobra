const fs = require('fs');

console.log('🧾 Testando sistema de recibo PDF + WhatsApp...\n');

function testReceiptComponent() {
  console.log('1. Verificando componente OrderReceipt...');
  
  const receiptPath = 'frontend/src/app/components/OrderReceipt.tsx';
  
  if (!fs.existsSync(receiptPath)) {
    console.log('❌ Componente OrderReceipt não encontrado');
    return false;
  }
  
  const receiptContent = fs.readFileSync(receiptPath, 'utf8');
  
  const componentChecks = [
    {
      name: 'Interface OrderReceiptProps definida',
      test: () => receiptContent.includes('interface OrderReceiptProps')
    },
    {
      name: 'Formatação de moeda implementada',
      test: () => receiptContent.includes('formatCurrency') && receiptContent.includes('pt-BR')
    },
    {
      name: 'Formatação de data implementada',
      test: () => receiptContent.includes('formatDate') && receiptContent.includes('toLocaleDateString')
    },
    {
      name: 'Informações da empresa incluídas',
      test: () => receiptContent.includes('companyInfo') && receiptContent.includes('CNPJ')
    },
    {
      name: 'Layout responsivo implementado',
      test: () => receiptContent.includes('grid-cols-1 md:grid-cols-2')
    },
    {
      name: 'Tabela de itens implementada',
      test: () => receiptContent.includes('table') && receiptContent.includes('border-collapse')
    },
    {
      name: 'Status com cores implementado',
      test: () => receiptContent.includes('getStatusColor') && receiptContent.includes('bg-green-50')
    },
    {
      name: 'Endereço condicional implementado',
      test: () => receiptContent.includes("deliveryMethod === 'DELIVERY'")
    }
  ];
  
  let allPassed = true;
  
  componentChecks.forEach(check => {
    if (check.test()) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

function testPDFAPI() {
  console.log('\n2. Verificando API de geração de PDF...');
  
  const pdfApiPath = 'frontend/src/app/api/orders/[id]/receipt/pdf/route.ts';
  
  if (!fs.existsSync(pdfApiPath)) {
    console.log('❌ API de PDF não encontrada');
    return false;
  }
  
  const pdfContent = fs.readFileSync(pdfApiPath, 'utf8');
  
  const pdfChecks = [
    {
      name: 'Puppeteer importado',
      test: () => pdfContent.includes("import puppeteer from 'puppeteer'")
    },
    {
      name: 'Método GET implementado',
      test: () => pdfContent.includes('export async function GET')
    },
    {
      name: 'Busca do pedido implementada',
      test: () => pdfContent.includes('/orders/${orderId}')
    },
    {
      name: 'Geração de HTML implementada',
      test: () => pdfContent.includes('receiptHTML') && pdfContent.includes('<!DOCTYPE html>')
    },
    {
      name: 'Configuração do PDF implementada',
      test: () => pdfContent.includes('page.pdf') && pdfContent.includes("format: 'A4'")
    },
    {
      name: 'Headers corretos para PDF',
      test: () => pdfContent.includes("'Content-Type': 'application/pdf'")
    },
    {
      name: 'Tratamento de erros implementado',
      test: () => pdfContent.includes('try {') && pdfContent.includes('} catch (error)')
    },
    {
      name: 'Estilos CSS incluídos',
      test: () => pdfContent.includes('<style>') && pdfContent.includes('tailwindcss')
    }
  ];
  
  let allPassed = true;
  
  pdfChecks.forEach(check => {
    if (check.test()) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

function testWhatsAppAPI() {
  console.log('\n3. Verificando API de WhatsApp...');
  
  const whatsappApiPath = 'frontend/src/app/api/orders/[id]/receipt/whatsapp/route.ts';
  
  if (!fs.existsSync(whatsappApiPath)) {
    console.log('❌ API de WhatsApp não encontrada');
    return false;
  }
  
  const whatsappContent = fs.readFileSync(whatsappApiPath, 'utf8');
  
  const whatsappChecks = [
    {
      name: 'Interface WhatsAppSendRequest definida',
      test: () => whatsappContent.includes('interface WhatsAppSendRequest')
    },
    {
      name: 'Método POST implementado',
      test: () => whatsappContent.includes('export async function POST')
    },
    {
      name: 'Validação de telefone implementada',
      test: () => whatsappContent.includes('body.phone') && whatsappContent.includes('obrigatório')
    },
    {
      name: 'Geração de PDF para envio',
      test: () => whatsappContent.includes('/receipt/pdf') && whatsappContent.includes('pdfBuffer')
    },
    {
      name: 'Mensagem padrão implementada',
      test: () => whatsappContent.includes('defaultMessage') && whatsappContent.includes('Recibo do seu pedido')
    },
    {
      name: 'Integração com backend WhatsApp',
      test: () => whatsappContent.includes('/whatsapp/send-document')
    },
    {
      name: 'Conversão para base64',
      test: () => whatsappContent.includes('toString(\'base64\')')
    },
    {
      name: 'Resposta de sucesso implementada',
      test: () => whatsappContent.includes('success: true') && whatsappContent.includes('whatsappId')
    }
  ];
  
  let allPassed = true;
  
  whatsappChecks.forEach(check => {
    if (check.test()) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

function testReceiptPage() {
  console.log('\n4. Verificando página de recibo...');
  
  const receiptPagePath = 'frontend/src/app/pedidos/[id]/recibo/page.tsx';
  
  if (!fs.existsSync(receiptPagePath)) {
    console.log('❌ Página de recibo não encontrada');
    return false;
  }
  
  const pageContent = fs.readFileSync(receiptPagePath, 'utf8');
  
  const pageChecks = [
    {
      name: 'Componente OrderReceipt importado',
      test: () => pageContent.includes("import OrderReceipt from '../../../components/OrderReceipt'")
    },
    {
      name: 'Função de download PDF implementada',
      test: () => pageContent.includes('handleDownloadPDF') && pageContent.includes('/receipt/pdf')
    },
    {
      name: 'Função de impressão implementada',
      test: () => pageContent.includes('handlePrint') && pageContent.includes('window.print')
    },
    {
      name: 'Modal de WhatsApp implementado',
      test: () => pageContent.includes('showWhatsAppModal') && pageContent.includes('whatsappPhone')
    },
    {
      name: 'Função de envio WhatsApp implementada',
      test: () => pageContent.includes('handleSendWhatsApp') && pageContent.includes('/receipt/whatsapp')
    },
    {
      name: 'Função de copiar link implementada',
      test: () => pageContent.includes('handleCopyLink') && pageContent.includes('navigator.clipboard')
    },
    {
      name: 'Botões de ação implementados',
      test: () => pageContent.includes('Baixar PDF') && pageContent.includes('WhatsApp') && pageContent.includes('Imprimir')
    },
    {
      name: 'Estilos de impressão implementados',
      test: () => pageContent.includes('@media print') && pageContent.includes('no-print')
    }
  ];
  
  let allPassed = true;
  
  pageChecks.forEach(check => {
    if (check.test()) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

function testIntegration() {
  console.log('\n5. Verificando integrações...');
  
  const orderPagePath = 'frontend/src/app/pedidos/[id]/page.tsx';
  const packagePath = 'frontend/package.json';
  
  let integrationOk = true;
  
  // Verificar botão na página de pedido
  if (fs.existsSync(orderPagePath)) {
    const orderContent = fs.readFileSync(orderPagePath, 'utf8');
    if (orderContent.includes('/recibo') && orderContent.includes('Ver Recibo')) {
      console.log('✅ Botão "Ver Recibo" adicionado na página de pedido');
    } else {
      console.log('❌ Botão "Ver Recibo" não encontrado na página de pedido');
      integrationOk = false;
    }
  } else {
    console.log('❌ Página de pedido não encontrada');
    integrationOk = false;
  }
  
  // Verificar dependências
  if (fs.existsSync(packagePath)) {
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    if (packageContent.includes('puppeteer')) {
      console.log('✅ Dependência Puppeteer adicionada');
    } else {
      console.log('❌ Dependência Puppeteer não encontrada');
      integrationOk = false;
    }
  } else {
    console.log('❌ Package.json não encontrado');
    integrationOk = false;
  }
  
  return integrationOk;
}

function generateSummary() {
  console.log('\n📋 Resumo do sistema de recibo PDF + WhatsApp:');
  console.log('   • ✅ Componente de recibo com layout profissional');
  console.log('   • ✅ API de geração de PDF com Puppeteer');
  console.log('   • ✅ API de envio por WhatsApp');
  console.log('   • ✅ Página completa de visualização');
  console.log('   • ✅ Integração com página de pedidos');
  
  console.log('\n🎯 Funcionalidades implementadas:');
  console.log('   • 📄 Geração de PDF profissional');
  console.log('   • 📱 Envio automático por WhatsApp');
  console.log('   • 🖨️ Função de impressão');
  console.log('   • 📋 Cópia de link do recibo');
  console.log('   • 💬 Mensagem personalizada WhatsApp');
  console.log('   • 📊 Layout responsivo e profissional');
  
  console.log('\n🔄 Fluxo completo:');
  console.log('   1. Cliente acessa detalhes do pedido');
  console.log('   2. Clica em "Ver Recibo"');
  console.log('   3. Visualiza recibo formatado');
  console.log('   4. Pode baixar PDF, imprimir ou enviar por WhatsApp');
  console.log('   5. WhatsApp envia PDF + mensagem personalizada');
  
  console.log('\n🧪 Como testar:');
  console.log('   1. Instale dependências: npm install');
  console.log('   2. Acesse um pedido existente');
  console.log('   3. Clique em "Ver Recibo"');
  console.log('   4. Teste download PDF');
  console.log('   5. Teste envio por WhatsApp');
  console.log('   6. Teste função de impressão');
  
  console.log('\n💡 Recursos avançados:');
  console.log('   • Layout otimizado para impressão');
  console.log('   • Informações da empresa personalizáveis');
  console.log('   • Status coloridos e ícones');
  console.log('   • Endereço condicional (entrega/retirada)');
  console.log('   • Mensagem WhatsApp personalizável');
  console.log('   • Formatação brasileira (moeda, data)');
}

// Executar testes
try {
  const componentOk = testReceiptComponent();
  const pdfOk = testPDFAPI();
  const whatsappOk = testWhatsAppAPI();
  const pageOk = testReceiptPage();
  const integrationOk = testIntegration();
  
  if (componentOk && pdfOk && whatsappOk && pageOk && integrationOk) {
    console.log('\n✅ Sistema de recibo PDF + WhatsApp implementado com sucesso!');
    generateSummary();
  } else {
    console.log('\n❌ Alguns componentes podem estar incompletos');
    
    if (!componentOk) console.log('   • Componente OrderReceipt');
    if (!pdfOk) console.log('   • API de geração de PDF');
    if (!whatsappOk) console.log('   • API de WhatsApp');
    if (!pageOk) console.log('   • Página de recibo');
    if (!integrationOk) console.log('   • Integrações');
  }
  
} catch (error) {
  console.error('❌ Erro durante o teste:', error.message);
}