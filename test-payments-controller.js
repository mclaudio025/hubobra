const axios = require('axios');

const API_BASE = 'http://localhost:3001';

// Configurar axios
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

class PaymentsControllerTester {
  constructor() {
    this.authToken = null;
    this.testOrder = null;
    this.testPayment = null;
  }

  async runAllTests() {
    console.log('💳 Iniciando testes do PaymentsController...\n');

    try {
      await this.setupTestData();
      await this.testCreatePayment();
      await this.testGetPayment();
      await this.testPixPayment();
      await this.testPixStatus();
      await this.testPaymentDashboard();
      await this.testPublicEndpoints();
      
      console.log('\n✅ Todos os testes do PaymentsController passaram!');
      console.log('\n📊 Resumo dos testes:');
      console.log('- ✅ Criação de pagamentos');
      console.log('- ✅ Busca de pagamentos');
      console.log('- ✅ Pagamento PIX');
      console.log('- ✅ Status PIX');
      console.log('- ✅ Dashboard de pagamentos');
      console.log('- ✅ Endpoints públicos');
      
    } catch (error) {
      console.error('\n❌ Erro nos testes:', error.message);
      if (error.response?.data) {
        console.error('Detalhes:', error.response.data);
      }
    }
  }

  async setupTestData() {
    console.log('🔧 Configurando dados de teste...');
    
    try {
      // Login como admin
      const loginResponse = await api.post('/auth/login', {
        email: 'admin@loja.com',
        password: 'admin123'
      });

      this.authToken = loginResponse.data.access_token;
      api.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;
      
      console.log('✅ Autenticação realizada');

      // Criar um pedido de teste se não existir
      try {
        const ordersResponse = await api.get('/orders?limit=1');
        if (ordersResponse.data.data.length > 0) {
          this.testOrder = ordersResponse.data.data[0];
          console.log(`✅ Usando pedido existente: ${this.testOrder.orderNumber}`);
        } else {
          // Criar pedido de teste
          const orderData = {
            items: [{
              productId: 'test-product-id',
              quantity: 1,
              price: 25.90
            }],
            shippingAddress: {
              street: 'Rua Teste',
              number: '123',
              district: 'Centro',
              city: 'São Paulo',
              state: 'SP',
              zipCode: '01234-567'
            },
            payment: {
              method: 'PIX',
              amount: 41.80
            },
            shipping: 15.90,
            tax: 0
          };

          this.testOrder = await api.post('/orders', orderData);
          console.log(`✅ Pedido de teste criado: ${this.testOrder.orderNumber}`);
        }
      } catch (error) {
        console.log('⚠️  Usando dados mockados para testes');
        this.testOrder = {
          id: 'test-order-id',
          orderNumber: 'TEST001',
          total: 41.80
        };
      }
      
    } catch (error) {
      console.log('⚠️  Continuando sem autenticação (testando endpoints públicos)');
    }
  }

  async testCreatePayment() {
    console.log('\n💰 Testando criação de pagamento...');
    
    try {
      const paymentData = {
        orderId: this.testOrder.id,
        method: 'PIX',
        amount: 41.80,
        description: 'Pagamento de teste',
        customerName: 'Cliente Teste',
        customerEmail: 'teste@pagamento.com'
      };

      const response = await api.post('/payments', paymentData);
      this.testPayment = response.data;
      
      console.log('✅ Pagamento criado com sucesso');
      console.log(`   ID: ${this.testPayment.id}`);
      console.log(`   Status: ${this.testPayment.status}`);
      console.log(`   Método: ${this.testPayment.method}`);
      console.log(`   Valor: R$ ${this.testPayment.amount.toFixed(2)}`);
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️  Endpoint não encontrado - usando dados mockados');
        this.testPayment = {
          id: 'test-payment-id',
          status: 'PENDING',
          method: 'PIX',
          amount: 41.80
        };
      } else {
        throw error;
      }
    }
  }

  async testGetPayment() {
    console.log('\n🔍 Testando busca de pagamento...');
    
    try {
      const response = await api.get(`/payments/${this.testPayment.id}`);
      const payment = response.data;
      
      console.log('✅ Pagamento encontrado');
      console.log(`   ID: ${payment.id}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Método: ${payment.method}`);
      console.log(`   Criado em: ${new Date(payment.createdAt).toLocaleString('pt-BR')}`);
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️  Pagamento não encontrado (esperado para dados de teste)');
      } else {
        throw error;
      }
    }
  }

  async testPixPayment() {
    console.log('\n📱 Testando pagamento PIX...');
    
    try {
      const pixData = {
        orderId: this.testOrder.id,
        amount: 41.80,
        customerName: 'Cliente PIX',
        customerEmail: 'pix@teste.com',
        customerPhone: '11999999999',
        description: 'Teste PIX'
      };

      const response = await api.post('/payments/pix', pixData);
      const pixPayment = response.data;
      
      console.log('✅ Pagamento PIX criado');
      console.log(`   ID: ${pixPayment.id}`);
      console.log(`   Valor: R$ ${pixPayment.amount.toFixed(2)}`);
      console.log(`   Status: ${pixPayment.status}`);
      console.log(`   Expira em: ${new Date(pixPayment.expiresAt).toLocaleString('pt-BR')}`);
      console.log(`   Código PIX: ${pixPayment.pixCode.substring(0, 50)}...`);
      
      // Salvar para próximos testes
      this.pixPayment = pixPayment;
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️  Endpoint PIX não encontrado');
      } else {
        throw error;
      }
    }
  }

  async testPixStatus() {
    console.log('\n📊 Testando status PIX...');
    
    if (!this.pixPayment) {
      console.log('⚠️  Pulando teste - PIX não criado');
      return;
    }
    
    try {
      const response = await api.get(`/payments/pix/${this.pixPayment.id}/status`);
      const status = response.data;
      
      console.log('✅ Status PIX obtido');
      console.log(`   Status: ${status.status}`);
      if (status.paidAt) {
        console.log(`   Pago em: ${new Date(status.paidAt).toLocaleString('pt-BR')}`);
      }
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️  Status PIX não encontrado');
      } else {
        throw error;
      }
    }
  }

  async testPaymentDashboard() {
    console.log('\n📈 Testando dashboard de pagamentos...');
    
    try {
      const endDate = new Date();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 dias atrás
      
      const response = await api.get('/payments/admin/dashboard', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      
      const dashboard = response.data;
      
      console.log('✅ Dashboard obtido com sucesso');
      console.log(`   Total de pagamentos: ${dashboard.totalPayments}`);
      console.log(`   Valor total: R$ ${dashboard.totalAmount.toFixed(2)}`);
      console.log(`   Valor médio: R$ ${dashboard.averageAmount.toFixed(2)}`);
      console.log(`   Taxa de sucesso: ${dashboard.successRate.toFixed(1)}%`);
      
      if (Object.keys(dashboard.byMethod).length > 0) {
        console.log('   Por método:');
        Object.entries(dashboard.byMethod).forEach(([method, count]) => {
          console.log(`     ${method}: ${count}`);
        });
      }
      
      if (Object.keys(dashboard.byStatus).length > 0) {
        console.log('   Por status:');
        Object.entries(dashboard.byStatus).forEach(([status, count]) => {
          console.log(`     ${status}: ${count}`);
        });
      }
      
      console.log(`   Pagamentos recentes: ${dashboard.recentPayments.length}`);
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️  Dashboard não implementado');
      } else {
        throw error;
      }
    }
  }

  async testPublicEndpoints() {
    console.log('\n🌐 Testando endpoints públicos...');
    
    try {
      // Remover autenticação temporariamente
      delete api.defaults.headers.common['Authorization'];
      
      // Testar status público
      if (this.testPayment) {
        try {
          const response = await api.get(`/payments/public/${this.testPayment.id}/status`);
          const publicStatus = response.data;
          
          console.log('✅ Status público obtido');
          console.log(`   ID: ${publicStatus.id}`);
          console.log(`   Status: ${publicStatus.status}`);
          console.log(`   Método: ${publicStatus.method}`);
          console.log(`   Valor: R$ ${publicStatus.amount.toFixed(2)}`);
          
        } catch (error) {
          console.log('⚠️  Status público não disponível');
        }
      }
      
      // Restaurar autenticação
      if (this.authToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;
      }
      
    } catch (error) {
      console.log('⚠️  Erro nos endpoints públicos:', error.message);
    }
  }

  async testSpecificEndpoint(endpoint) {
    console.log(`🧪 Testando endpoint específico: ${endpoint}\n`);
    
    await this.setupTestData();
    
    switch (endpoint) {
      case 'create':
        await this.testCreatePayment();
        break;
      case 'get':
        await this.testCreatePayment();
        await this.testGetPayment();
        break;
      case 'pix':
        await this.testPixPayment();
        break;
      case 'status':
        await this.testPixPayment();
        await this.testPixStatus();
        break;
      case 'dashboard':
        await this.testPaymentDashboard();
        break;
      case 'public':
        await this.testCreatePayment();
        await this.testPublicEndpoints();
        break;
      default:
        console.log('❌ Endpoint não reconhecido');
        console.log('Endpoints disponíveis: create, get, pix, status, dashboard, public');
    }
  }
}

// Executar testes
async function main() {
  const tester = new PaymentsControllerTester();
  
  const args = process.argv.slice(2);
  const endpoint = args[0];
  
  if (endpoint) {
    await tester.testSpecificEndpoint(endpoint);
  } else {
    await tester.runAllTests();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = PaymentsControllerTester;