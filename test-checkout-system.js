const axios = require('axios');

const API_BASE = 'http://localhost:3001';

// Configurar axios para incluir cookies de autenticação
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

class CheckoutSystemTester {
  constructor() {
    this.authToken = null;
    this.testUser = null;
    this.testOrder = null;
    this.testPayment = null;
  }

  async runAllTests() {
    console.log('🚀 Iniciando testes do Sistema de Checkout...\n');

    try {
      await this.testAuthentication();
      await this.testProductCatalog();
      await this.testCartOperations();
      await this.testOrderCreation();
      await this.testPixPayment();
      await this.testOrderTracking();
      await this.testPaymentConfirmation();
      
      console.log('\n✅ Todos os testes do sistema de checkout passaram!');
      console.log('\n📊 Resumo dos testes:');
      console.log('- ✅ Autenticação de usuário');
      console.log('- ✅ Catálogo de produtos');
      console.log('- ✅ Operações do carrinho');
      console.log('- ✅ Criação de pedidos');
      console.log('- ✅ Pagamento PIX');
      console.log('- ✅ Rastreamento de pedidos');
      console.log('- ✅ Confirmação de pagamento');
      
    } catch (error) {
      console.error('\n❌ Erro nos testes:', error.message);
      if (error.response?.data) {
        console.error('Detalhes:', error.response.data);
      }
    }
  }

  async testAuthentication() {
    console.log('🔐 Testando autenticação...');
    
    try {
      // Tentar fazer login
      const loginResponse = await api.post('/auth/login', {
        email: 'admin@loja.com',
        password: 'admin123'
      });

      this.authToken = loginResponse.data.access_token;
      this.testUser = loginResponse.data.user;
      
      // Configurar token para próximas requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;
      
      console.log('✅ Login realizado com sucesso');
      console.log(`   Usuário: ${this.testUser.name} (${this.testUser.email})`);
      
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️  Usuário não encontrado, criando conta de teste...');
        
        // Criar usuário de teste
        const registerResponse = await api.post('/auth/register', {
          name: 'Usuário Teste',
          email: 'teste@checkout.com',
          password: 'teste123',
          phone: '11999999999'
        });

        this.authToken = registerResponse.data.access_token;
        this.testUser = registerResponse.data.user;
        
        api.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;
        
        console.log('✅ Usuário de teste criado e autenticado');
      } else {
        throw error;
      }
    }
  }

  async testProductCatalog() {
    console.log('\n📦 Testando catálogo de produtos...');
    
    // Buscar produtos disponíveis
    const productsResponse = await api.get('/products?limit=5');
    const products = productsResponse.data.data;
    
    if (products.length === 0) {
      console.log('⚠️  Nenhum produto encontrado, criando produtos de teste...');
      
      // Criar alguns produtos de teste
      const testProducts = [
        {
          name: 'Cimento Portland 50kg',
          description: 'Cimento de alta qualidade para construção',
          price: 25.90,
          stock: 100,
          sku: 'CIM001',
          categoryId: null
        },
        {
          name: 'Tijolo Comum 6 furos',
          description: 'Tijolo cerâmico para alvenaria',
          price: 0.45,
          stock: 5000,
          sku: 'TIJ001',
          categoryId: null
        }
      ];

      for (const product of testProducts) {
        await api.post('/products', product);
      }
      
      // Buscar produtos novamente
      const newProductsResponse = await api.get('/products?limit=5');
      this.testProducts = newProductsResponse.data.data;
    } else {
      this.testProducts = products;
    }
    
    console.log(`✅ ${this.testProducts.length} produtos encontrados no catálogo`);
    this.testProducts.forEach(product => {
      console.log(`   - ${product.name}: R$ ${product.price.toFixed(2)} (Estoque: ${product.stock})`);
    });
  }

  async testCartOperations() {
    console.log('\n🛒 Testando operações do carrinho...');
    
    // Limpar carrinho
    await api.delete('/cart/clear');
    console.log('✅ Carrinho limpo');
    
    // Adicionar produtos ao carrinho
    const product1 = this.testProducts[0];
    const product2 = this.testProducts[1];
    
    await api.post('/cart/add', {
      productId: product1.id,
      quantity: 2
    });
    
    await api.post('/cart/add', {
      productId: product2.id,
      quantity: 10
    });
    
    console.log('✅ Produtos adicionados ao carrinho');
    
    // Verificar carrinho
    const cartResponse = await api.get('/cart');
    const cartItems = cartResponse.data;
    
    console.log(`✅ Carrinho contém ${cartItems.length} tipos de produtos`);
    
    let cartTotal = 0;
    cartItems.forEach(item => {
      const itemTotal = item.quantity * item.product.price;
      cartTotal += itemTotal;
      console.log(`   - ${item.product.name}: ${item.quantity}x R$ ${item.product.price.toFixed(2)} = R$ ${itemTotal.toFixed(2)}`);
    });
    
    console.log(`   Total do carrinho: R$ ${cartTotal.toFixed(2)}`);
    this.cartItems = cartItems;
    this.cartTotal = cartTotal;
  }

  async testOrderCreation() {
    console.log('\n📋 Testando criação de pedido...');
    
    const orderData = {
      items: this.cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      })),
      shippingAddress: {
        street: 'Rua das Flores',
        number: '123',
        complement: 'Apto 45',
        district: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        country: 'Brasil'
      },
      payment: {
        method: 'PIX',
        amount: this.cartTotal + 15.90 // + frete
      },
      shipping: 15.90,
      tax: 0,
      notes: 'Pedido de teste do sistema de checkout'
    };

    const orderResponse = await api.post('/orders', orderData);
    this.testOrder = orderResponse.data;
    
    console.log('✅ Pedido criado com sucesso');
    console.log(`   Número: ${this.testOrder.orderNumber}`);
    console.log(`   Status: ${this.testOrder.status}`);
    console.log(`   Total: R$ ${this.testOrder.total.toFixed(2)}`);
    console.log(`   Itens: ${this.testOrder.items.length} produtos`);
  }

  async testPixPayment() {
    console.log('\n💰 Testando pagamento PIX...');
    
    const pixData = {
      orderId: this.testOrder.id,
      amount: this.testOrder.total,
      customerName: this.testUser.name,
      customerEmail: this.testUser.email,
      customerPhone: this.testUser.phone || '11999999999',
      description: `Pedido #${this.testOrder.orderNumber}`
    };

    const pixResponse = await api.post('/payments/pix', pixData);
    this.testPayment = pixResponse.data;
    
    console.log('✅ Pagamento PIX criado');
    console.log(`   ID: ${this.testPayment.id}`);
    console.log(`   Valor: R$ ${this.testPayment.amount.toFixed(2)}`);
    console.log(`   Status: ${this.testPayment.status}`);
    console.log(`   Expira em: ${new Date(this.testPayment.expiresAt).toLocaleString('pt-BR')}`);
    console.log(`   Código PIX: ${this.testPayment.pixCode.substring(0, 50)}...`);
  }

  async testOrderTracking() {
    console.log('\n📍 Testando rastreamento de pedido...');
    
    // Buscar pedido por ID
    const orderResponse = await api.get(`/orders/${this.testOrder.id}`);
    const order = orderResponse.data;
    
    console.log('✅ Pedido encontrado');
    console.log(`   Status: ${order.status}`);
    console.log(`   Pagamento: ${order.payment.status}`);
    
    // Buscar pedidos do usuário
    const userOrdersResponse = await api.get('/orders/my-orders');
    const userOrders = userOrdersResponse.data.data;
    
    console.log(`✅ Usuário possui ${userOrders.length} pedido(s)`);
    
    // Verificar se o pedido de teste está na lista
    const foundOrder = userOrders.find(o => o.id === this.testOrder.id);
    if (foundOrder) {
      console.log('✅ Pedido de teste encontrado na lista do usuário');
    }
  }

  async testPaymentConfirmation() {
    console.log('\n✅ Testando confirmação de pagamento...');
    
    // Simular confirmação do pagamento PIX (apenas em desenvolvimento)
    try {
      await api.post(`/payments/pix/${this.testPayment.id}/simulate`);
      console.log('✅ Pagamento PIX simulado com sucesso');
      
      // Verificar status do pagamento
      const statusResponse = await api.get(`/payments/pix/${this.testPayment.id}/status`);
      console.log(`✅ Status do pagamento: ${statusResponse.data.status}`);
      
      // Verificar se o pedido foi confirmado
      const orderResponse = await api.get(`/orders/${this.testOrder.id}`);
      const updatedOrder = orderResponse.data;
      
      console.log(`✅ Status do pedido atualizado: ${updatedOrder.status}`);
      console.log(`✅ Status do pagamento: ${updatedOrder.payment.status}`);
      
      if (updatedOrder.payment.paidAt) {
        console.log(`✅ Pagamento confirmado em: ${new Date(updatedOrder.payment.paidAt).toLocaleString('pt-BR')}`);
      }
      
    } catch (error) {
      if (error.response?.status === 500 && error.response?.data?.message?.includes('produção')) {
        console.log('⚠️  Simulação não disponível em produção (comportamento esperado)');
      } else {
        throw error;
      }
    }
  }

  async testSpecificFeature(feature) {
    console.log(`🧪 Testando funcionalidade específica: ${feature}\n`);
    
    switch (feature) {
      case 'auth':
        await this.testAuthentication();
        break;
      case 'products':
        await this.testAuthentication();
        await this.testProductCatalog();
        break;
      case 'cart':
        await this.testAuthentication();
        await this.testProductCatalog();
        await this.testCartOperations();
        break;
      case 'order':
        await this.testAuthentication();
        await this.testProductCatalog();
        await this.testCartOperations();
        await this.testOrderCreation();
        break;
      case 'pix':
        await this.testAuthentication();
        await this.testProductCatalog();
        await this.testCartOperations();
        await this.testOrderCreation();
        await this.testPixPayment();
        break;
      default:
        console.log('❌ Funcionalidade não reconhecida');
        console.log('Funcionalidades disponíveis: auth, products, cart, order, pix');
    }
  }
}

// Executar testes
async function main() {
  const tester = new CheckoutSystemTester();
  
  const args = process.argv.slice(2);
  const feature = args[0];
  
  if (feature) {
    await tester.testSpecificFeature(feature);
  } else {
    await tester.runAllTests();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = CheckoutSystemTester;