#!/usr/bin/env node

/**
 * Script para testar a correção do erro de phone undefined
 * Simula diferentes estruturas de dados de pedido
 */

console.log('🔧 Testando correção do erro de phone undefined...\n');

// Simular diferentes estruturas de dados que podem vir da API
const testCases = [
  {
    name: 'Pedido com customer.phone',
    order: {
      id: '1',
      orderNumber: 'ORD-001',
      customer: {
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '(85) 99999-9999'
      }
    }
  },
  {
    name: 'Pedido com customerInfo.phone',
    order: {
      id: '2',
      orderNumber: 'ORD-002',
      customerInfo: {
        name: 'Maria Santos',
        email: 'maria@email.com',
        phone: '(85) 88888-8888'
      }
    }
  },
  {
    name: 'Pedido com phone direto',
    order: {
      id: '3',
      orderNumber: 'ORD-003',
      customer: {
        name: 'Pedro Costa',
        email: 'pedro@email.com'
      },
      phone: '(85) 77777-7777'
    }
  },
  {
    name: 'Pedido sem phone (caso problemático)',
    order: {
      id: '4',
      orderNumber: 'ORD-004',
      customer: {
        name: 'Ana Lima',
        email: 'ana@email.com'
      }
    }
  },
  {
    name: 'Pedido com customer null',
    order: {
      id: '5',
      orderNumber: 'ORD-005',
      customer: null
    }
  },
  {
    name: 'Pedido com customer undefined',
    order: {
      id: '6',
      orderNumber: 'ORD-006'
    }
  }
];

// Função que simula a lógica corrigida
function extractPhoneFromOrder(orderData) {
  let phone = '';
  
  if (orderData?.customer?.phone) {
    phone = orderData.customer.phone;
    console.log(`  ✅ Phone encontrado em customer.phone: ${phone}`);
  } else if (orderData?.customerInfo?.phone) {
    phone = orderData.customerInfo.phone;
    console.log(`  ✅ Phone encontrado em customerInfo.phone: ${phone}`);
  } else if (orderData?.phone) {
    phone = orderData.phone;
    console.log(`  ✅ Phone encontrado diretamente no order: ${phone}`);
  } else {
    console.log(`  ⚠️  Nenhum phone encontrado - campo ficará vazio`);
  }
  
  return phone;
}

// Testar todos os casos
testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}:`);
  
  try {
    const phone = extractPhoneFromOrder(testCase.order);
    console.log(`  📱 Resultado: "${phone}"`);
  } catch (error) {
    console.log(`  ❌ Erro: ${error.message}`);
  }
  
  console.log('');
});

console.log('📋 Resumo da correção:');
console.log('- Adicionado optional chaining (?.) para evitar erros');
console.log('- Implementado fallback para customerInfo.phone');
console.log('- Implementado fallback para phone direto no order');
console.log('- Campo fica vazio se nenhum phone for encontrado');
console.log('');

console.log('✅ Teste concluído! A correção deve resolver o erro TypeError.');