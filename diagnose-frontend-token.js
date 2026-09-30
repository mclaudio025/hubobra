// Script para diagnosticar problema de token no frontend
// Execute este script no console do navegador (F12) em http://localhost:3000

console.log('🔍 Diagnóstico do Token no Frontend...');

// Função para verificar o estado do localStorage
function checkLocalStorage() {
  console.log('\n📋 Estado do localStorage:');
  const authToken = localStorage.getItem('auth_token');
  const authUser = localStorage.getItem('auth_user');
  const token = localStorage.getItem('token'); // Token antigo
  
  console.log('auth_token:', authToken ? 'EXISTE' : 'NÃO EXISTE');
  console.log('auth_user:', authUser ? 'EXISTE' : 'NÃO EXISTE');
  console.log('token (antigo):', token ? 'EXISTE' : 'NÃO EXISTE');
  
  if (authToken) {
    console.log('🔑 Token atual (primeiros 50 chars):', authToken.substring(0, 50) + '...');
  }
  
  if (authUser) {
    try {
      const user = JSON.parse(authUser);
      console.log('👤 Usuário:', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } catch (e) {
      console.log('❌ Erro ao parsear usuário:', e.message);
    }
  }
  
  return { authToken, authUser, token };
}

// Função para testar chamada à API
async function testApiCall() {
  console.log('\n🧪 Testando chamada à API...');
  
  const authToken = localStorage.getItem('auth_token');
  if (!authToken) {
    console.log('❌ Nenhum token encontrado');
    return;
  }
  
  try {
    const response = await fetch('http://localhost:8081/cart', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API respondeu com sucesso:', data);
    } else {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      console.log('❌ API retornou erro:', {
        status: response.status,
        statusText: response.statusText,
        error: error
      });
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }
}

// Função para verificar se há tokens duplicados ou conflitantes
function checkTokenConflicts() {
  console.log('\n🔍 Verificando conflitos de token...');
  
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('token') || key.includes('auth'))) {
      keys.push(key);
    }
  }
  
  console.log('🔑 Chaves relacionadas à autenticação:', keys);
  
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`  ${key}:`, value ? value.substring(0, 50) + '...' : 'null');
  });
}

// Função para verificar o contexto React (se disponível)
function checkReactContext() {
  console.log('\n⚛️ Verificando contexto React...');
  
  // Tentar acessar o contexto através do React DevTools
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools detectado');
  } else {
    console.log('❌ React DevTools não detectado');
  }
  
  // Verificar se há componentes React na página
  const reactElements = document.querySelectorAll('[data-reactroot], [data-react-helmet]');
  console.log('📦 Elementos React encontrados:', reactElements.length);
}

// Função para simular o problema
async function simulateCartLoad() {
  console.log('\n🛒 Simulando carregamento do carrinho...');
  
  const authToken = localStorage.getItem('auth_token');
  if (!authToken) {
    console.log('❌ Usuário não autenticado');
    return;
  }
  
  // Simular delay como no CartContext
  console.log('⏳ Aguardando 100ms (como no CartContext)...');
  await new Promise(resolve => setTimeout(resolve, 100));
  
  try {
    const response = await fetch('http://localhost:8081/cart', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Carrinho carregado após delay:', data);
    } else {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      console.log('❌ Erro no carrinho após delay:', error);
    }
  } catch (error) {
    console.log('❌ Erro na requisição do carrinho:', error.message);
  }
}

// Função principal de diagnóstico
async function runDiagnosis() {
  console.log('🚀 Iniciando diagnóstico completo...');
  
  checkLocalStorage();
  checkTokenConflicts();
  checkReactContext();
  await testApiCall();
  await simulateCartLoad();
  
  console.log('\n✅ Diagnóstico concluído!');
  console.log('\n💡 Próximos passos:');
  console.log('1. Se o token existe mas a API falha, pode ser um token expirado');
  console.log('2. Se há tokens duplicados, limpe o localStorage');
  console.log('3. Se o React não está carregado, recarregue a página');
  console.log('4. Se tudo parece OK, o problema pode estar no timing do React');
}

// Executar diagnóstico
runDiagnosis();

// Disponibilizar funções globalmente para uso manual
window.diagnoseFrontend = {
  checkLocalStorage,
  testApiCall,
  checkTokenConflicts,
  checkReactContext,
  simulateCartLoad,
  runDiagnosis
};

console.log('\n🛠️ Funções disponíveis:');
console.log('- diagnoseFrontend.checkLocalStorage()');
console.log('- diagnoseFrontend.testApiCall()');
console.log('- diagnoseFrontend.checkTokenConflicts()');
console.log('- diagnoseFrontend.simulateCartLoad()');
console.log('- diagnoseFrontend.runDiagnosis()');