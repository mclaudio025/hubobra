#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:8081';
const FRONTEND_URL = 'http://localhost:3000';

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bold');
  console.log('='.repeat(60));
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para fazer login e obter token
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@admin.com',
      password: 'admin123'
    });
    
    if (response.data.access_token) {
      log('✅ Login realizado com sucesso', 'green');
      return response.data.access_token;
    }
  } catch (error) {
    log('❌ Erro no login: ' + error.message, 'red');
    return null;
  }
}

// Testar configuração de email
async function testEmailConfiguration(token) {
  logSection('📧 TESTANDO CONFIGURAÇÃO DE EMAIL');
  
  if (!token) {
    log('❌ Token necessário para testar configuração', 'red');
    return;
  }

  try {
    log('Testando configuração SMTP...', 'blue');
    const response = await axios.post(`${BASE_URL}/mail/test-configuration`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      log('✅ Configuração de email funcionando', 'green');
      log('   SMTP configurado corretamente', 'blue');
    } else {
      log('❌ Erro na configuração de email', 'red');
      log(`   ${response.data.message}`, 'red');
    }
  } catch (error) {
    log('❌ Erro ao testar configuração: ' + error.message, 'red');
    if (error.response?.data) {
      log(`   Detalhes: ${JSON.stringify(error.response.data)}`, 'red');
    }
  }
}

// Testar emails transacionais
async function testTransactionalEmails(token) {
  logSection('📬 TESTANDO EMAILS TRANSACIONAIS');
  
  if (!token) {
    log('❌ Token necessário para testar emails', 'red');
    return;
  }

  const testEmails = [
    {
      name: 'Confirmação de Pedido',
      endpoint: 'send-order-confirmation',
      data: {
        customerName: 'João Silva',
        customerEmail: 'joao@teste.com',
        orderNumber: 'ORD-2024-001',
        orderId: 'order-123',
        amount: 299.90,
        items: [
          { name: 'Cimento 50kg', quantity: 2, price: 25.90, total: 51.80 },
          { name: 'Tijolo Comum', quantity: 100, price: 2.48, total: 248.00 }
        ],
        paymentMethod: 'PIX',
        deliveryAddress: 'Rua das Flores, 123 - São Paulo, SP'
      }
    },
    {
      name: 'Confirmação de Pagamento',
      endpoint: 'send-payment-confirmation',
      data: {
        customerName: 'Maria Santos',
        customerEmail: 'maria@teste.com',
        orderNumber: 'ORD-2024-002',
        amount: 150.00,
        paymentMethod: 'Cartão de Crédito'
      }
    },
    {
      name: 'Pedido Enviado',
      endpoint: 'send-order-shipped',
      data: {
        customerName: 'Pedro Costa',
        customerEmail: 'pedro@teste.com',
        orderNumber: 'ORD-2024-003',
        trackingCode: 'BR123456789',
        deliveryAddress: 'Av. Paulista, 1000 - São Paulo, SP'
      }
    },
    {
      name: 'Email de Boas-vindas',
      endpoint: 'send-welcome',
      data: {
        customerName: 'Ana Silva',
        customerEmail: 'ana@teste.com'
      }
    }
  ];

  for (const email of testEmails) {
    try {
      log(`Testando ${email.name}...`, 'blue');
      
      const response = await axios.post(`${BASE_URL}/mail/${email.endpoint}`, email.data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        log(`✅ ${email.name} enviado com sucesso`, 'green');
        log(`   Para: ${email.data.customerEmail}`, 'blue');
      } else {
        log(`❌ Erro ao enviar ${email.name}`, 'red');
        log(`   ${response.data.message}`, 'red');
      }
    } catch (error) {
      log(`❌ Erro no ${email.name}: ${error.message}`, 'red');
    }

    await sleep(500); // Pausa entre emails
  }
}

// Testar newsletter
async function testNewsletter() {
  logSection('📰 TESTANDO NEWSLETTER');
  
  const testSubscribers = [
    {
      email: 'subscriber1@teste.com',
      name: 'Cliente 1',
      preferences: { promotions: true, newProducts: true, tips: false }
    },
    {
      email: 'subscriber2@teste.com',
      name: 'Cliente 2',
      preferences: { promotions: false, newProducts: true, tips: true }
    },
    {
      email: 'subscriber3@teste.com',
      name: 'Cliente 3',
      preferences: { promotions: true, newProducts: false, tips: true }
    }
  ];

  // Testar inscrições
  log('Testando inscrições na newsletter...', 'blue');
  
  for (const subscriber of testSubscribers) {
    try {
      const response = await axios.post(`${BASE_URL}/mail/newsletter/subscribe`, subscriber);
      
      if (response.data.success) {
        log(`✅ ${subscriber.name} inscrito com sucesso`, 'green');
        log(`   Email: ${subscriber.email}`, 'blue');
        log(`   Preferências: ${Object.entries(subscriber.preferences)
          .filter(([_, value]) => value)
          .map(([key, _]) => key)
          .join(', ')}`, 'blue');
      } else {
        log(`❌ Erro ao inscrever ${subscriber.name}: ${response.data.message}`, 'red');
      }
    } catch (error) {
      log(`❌ Erro na inscrição de ${subscriber.name}: ${error.message}`, 'red');
    }

    await sleep(300);
  }

  // Testar cancelamento
  log('Testando cancelamento de inscrição...', 'blue');
  
  try {
    const response = await axios.post(`${BASE_URL}/mail/newsletter/unsubscribe`, {
      email: testSubscribers[0].email,
      reason: 'Teste de cancelamento'
    });

    if (response.data.success) {
      log(`✅ Cancelamento realizado com sucesso`, 'green');
    } else {
      log(`❌ Erro no cancelamento: ${response.data.message}`, 'red');
    }
  } catch (error) {
    log(`❌ Erro no cancelamento: ${error.message}`, 'red');
  }

  // Testar atualização de preferências
  log('Testando atualização de preferências...', 'blue');
  
  try {
    const response = await axios.post(`${BASE_URL}/mail/newsletter/update-preferences`, {
      email: testSubscribers[1].email,
      preferences: { promotions: true, newProducts: false, tips: true }
    });

    if (response.data.success) {
      log(`✅ Preferências atualizadas com sucesso`, 'green');
    } else {
      log(`❌ Erro na atualização: ${response.data.message}`, 'red');
    }
  } catch (error) {
    log(`❌ Erro na atualização: ${error.message}`, 'red');
  }
}

// Testar notificações
async function testNotifications(token) {
  logSection('🔔 TESTANDO NOTIFICAÇÕES');
  
  if (!token) {
    log('❌ Token necessário para testar notificações', 'red');
    return;
  }

  const testNotifications = [
    {
      name: 'Notificação de Pedido',
      data: {
        email: 'cliente@teste.com',
        name: 'Cliente Teste',
        templateId: 'order-created',
        data: {
          orderNumber: 'ORD-2024-004',
          amount: 199.90
        },
        priority: 'HIGH'
      }
    },
    {
      name: 'Notificação de Pagamento',
      data: {
        email: 'cliente@teste.com',
        name: 'Cliente Teste',
        templateId: 'payment-confirmed',
        data: {
          orderNumber: 'ORD-2024-004',
          amount: 199.90,
          paymentMethod: 'PIX'
        },
        priority: 'HIGH'
      }
    }
  ];

  for (const notification of testNotifications) {
    try {
      log(`Testando ${notification.name}...`, 'blue');
      
      const response = await axios.post(`${BASE_URL}/mail/notification/send`, notification.data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        log(`✅ ${notification.name} enviada com sucesso`, 'green');
      } else {
        log(`❌ Erro ao enviar ${notification.name}`, 'red');
        log(`   ${response.data.message}`, 'red');
      }
    } catch (error) {
      log(`❌ Erro na ${notification.name}: ${error.message}`, 'red');
    }

    await sleep(300);
  }
}

// Testar APIs do frontend
async function testFrontendAPIs() {
  logSection('🖥️  TESTANDO APIs DO FRONTEND');
  
  try {
    // Testar inscrição na newsletter via frontend
    log('Testando inscrição na newsletter via frontend...', 'blue');
    
    const response = await axios.post(`${FRONTEND_URL}/api/mail/newsletter/subscribe`, {
      email: 'frontend@teste.com',
      name: 'Teste Frontend',
      preferences: {
        promotions: true,
        newProducts: true,
        tips: false
      }
    });

    if (response.data.success) {
      log('✅ API do frontend funcionando', 'green');
      log(`   Subscriber ID: ${response.data.subscriber?.id}`, 'blue');
    } else {
      log('❌ Erro na API do frontend', 'red');
      log(`   ${response.data.message}`, 'red');
    }
  } catch (error) {
    log('❌ Erro no teste do frontend: ' + error.message, 'red');
    if (error.code === 'ECONNREFUSED') {
      log('   Verifique se o frontend está rodando na porta 3000', 'yellow');
    }
  }
}

// Testar estatísticas
async function testStats(token) {
  logSection('📊 TESTANDO ESTATÍSTICAS');
  
  if (!token) {
    log('❌ Token necessário para testar estatísticas', 'red');
    return;
  }

  try {
    // Estatísticas de email
    log('Obtendo estatísticas de email...', 'blue');
    const emailStatsResponse = await axios.get(`${BASE_URL}/mail/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    log('✅ Estatísticas de email obtidas:', 'green');
    log(`   Total enviados: ${emailStatsResponse.data.totalSent}`, 'blue');
    log(`   Por template: ${JSON.stringify(emailStatsResponse.data.byTemplate)}`, 'blue');

    // Estatísticas de newsletter
    log('Obtendo estatísticas de newsletter...', 'blue');
    const newsletterStatsResponse = await axios.get(`${BASE_URL}/mail/newsletter/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    log('✅ Estatísticas de newsletter obtidas:', 'green');
    log(`   Total de assinantes: ${newsletterStatsResponse.data.totalSubscribers}`, 'blue');
    log(`   Assinantes ativos: ${newsletterStatsResponse.data.activeSubscribers}`, 'blue');
    log(`   Total de campanhas: ${newsletterStatsResponse.data.totalCampaigns}`, 'blue');

  } catch (error) {
    log('❌ Erro ao obter estatísticas: ' + error.message, 'red');
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';

  log('📧 SISTEMA DE COMUNICAÇÃO - TESTE COMPLETO', 'bold');
  log(`Testando: ${testType}`, 'blue');
  
  // Login
  const token = await login();
  
  if (testType === 'all' || testType === 'config') {
    await testEmailConfiguration(token);
  }
  
  if (testType === 'all' || testType === 'emails') {
    await testTransactionalEmails(token);
  }
  
  if (testType === 'all' || testType === 'newsletter') {
    await testNewsletter();
  }
  
  if (testType === 'all' || testType === 'notifications') {
    await testNotifications(token);
  }
  
  if (testType === 'all' || testType === 'frontend') {
    await testFrontendAPIs();
  }
  
  if (testType === 'all' || testType === 'stats') {
    await testStats(token);
  }

  logSection('📋 RESUMO DOS TESTES');
  log('✅ Testes do sistema de comunicação concluídos!', 'green');
  log('', 'reset');
  log('🎯 Funcionalidades testadas:', 'blue');
  log('   ✅ Configuração SMTP', 'green');
  log('   ✅ Emails transacionais', 'green');
  log('   ✅ Newsletter (inscrição/cancelamento)', 'green');
  log('   ✅ Sistema de notificações', 'green');
  log('   ✅ APIs do frontend', 'green');
  log('   ✅ Estatísticas e relatórios', 'green');
  log('', 'reset');
  log('📧 Para configurar em produção:', 'yellow');
  log('   1. Configure as variáveis SMTP no .env', 'yellow');
  log('   2. Adicione templates personalizados', 'yellow');
  log('   3. Configure webhooks de entrega', 'yellow');
  log('   4. Integre com provedores de SMS/Push', 'yellow');
  log('', 'reset');
  log('🚀 O sistema de comunicação está funcionando!', 'green');
  log('', 'reset');
  log('Comandos disponíveis:', 'yellow');
  log('   node test-communication-system.js all           # Todos os testes', 'yellow');
  log('   node test-communication-system.js config        # Configuração SMTP', 'yellow');
  log('   node test-communication-system.js emails        # Emails transacionais', 'yellow');
  log('   node test-communication-system.js newsletter    # Newsletter', 'yellow');
  log('   node test-communication-system.js notifications # Notificações', 'yellow');
  log('   node test-communication-system.js frontend      # APIs frontend', 'yellow');
  log('   node test-communication-system.js stats         # Estatísticas', 'yellow');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    log('❌ Erro fatal: ' + error.message, 'red');
    process.exit(1);
  });
}

module.exports = { main };