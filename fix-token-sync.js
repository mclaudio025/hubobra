// Script para corrigir problemas de sincronização de token
// Execute este script no console do navegador (F12) em http://localhost:3000

console.log('🔧 Corrigindo problemas de sincronização de token...');

// Função para limpar todos os tokens antigos
function clearOldTokens() {
  console.log('\n🧹 Limpando tokens antigos...');
  
  const keysToRemove = ['token', 'access_token', 'authToken', 'user'];
  let removedKeys = [];
  
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      removedKeys.push(key);
    }
    if (sessionStorage.getItem(key)) {
      sessionStorage.removeItem(key);
      removedKeys.push(key + ' (session)');
    }
  });
  
  if (removedKeys.length > 0) {
    console.log('✅ Tokens antigos removidos:', removedKeys);
  } else {
    console.log('ℹ️ Nenhum token antigo encontrado');
  }
}

// Função para verificar e corrigir o token atual
function fixCurrentToken() {
  console.log('\n🔧 Verificando token atual...');
  
  const authToken = localStorage.getItem('auth_token');
  const authUser = localStorage.getItem('auth_user');
  
  if (!authToken || !authUser) {
    console.log('❌ Token ou usuário não encontrado. Faça login novamente.');
    return false;
  }
  
  try {
    const user = JSON.parse(authUser);
    console.log('✅ Token e usuário válidos:', {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      tokenLength: authToken.length
    });
    return true;
  } catch (error) {
    console.log('❌ Erro ao parsear dados do usuário:', error.message);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    return false;
  }
}

// Função para testar o token com o backend
async function validateTokenWithBackend() {
  console.log('\n🔍 Validando token com o backend...');
  
  const authToken = localStorage.getItem('auth_token');
  if (!authToken) {
    console.log('❌ Nenhum token para validar');
    return false;
  }
  
  try {
    // Testar com endpoint de perfil
    const response = await fetch('http://localhost:8081/users/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const profile = await response.json();
      console.log('✅ Token válido! Perfil do usuário:', {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role
      });
      return true;
    } else {
      const error = await response.json().catch(() => ({ message: 'Token inválido' }));
      console.log('❌ Token inválido:', error.message);
      
      // Se o token é inválido, limpar localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao validar token:', error.message);
    return false;
  }
}

// Função para forçar re-login se necessário
async function forceReLoginIfNeeded() {
  console.log('\n🔄 Verificando necessidade de re-login...');
  
  const isValid = await validateTokenWithBackend();
  
  if (!isValid) {
    console.log('\n⚠️ Token inválido ou expirado!');
    console.log('📝 Instruções para corrigir:');
    console.log('1. Faça logout (se possível)');
    console.log('2. Limpe o cache do navegador (Ctrl+Shift+Delete)');
    console.log('3. Recarregue a página (F5)');
    console.log('4. Faça login novamente');
    
    // Limpar tudo
    localStorage.clear();
    sessionStorage.clear();
    
    console.log('✅ Cache limpo. Recarregue a página e faça login novamente.');
    return false;
  }
  
  return true;
}

// Função para testar o carrinho após correção
async function testCartAfterFix() {
  console.log('\n🛒 Testando carrinho após correção...');
  
  const authToken = localStorage.getItem('auth_token');
  if (!authToken) {
    console.log('❌ Nenhum token disponível para teste');
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
      const cart = await response.json();
      console.log('✅ Carrinho funcionando perfeitamente!', {
        items: cart.items?.length || 0,
        total: cart.total || 0,
        totalItems: cart.totalItems || 0
      });
    } else {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      console.log('❌ Ainda há problemas com o carrinho:', error.message);
    }
  } catch (error) {
    console.log('❌ Erro ao testar carrinho:', error.message);
  }
}

// Função para monitorar mudanças no localStorage
function setupTokenMonitoring() {
  console.log('\n👁️ Configurando monitoramento de token...');
  
  // Interceptar mudanças no localStorage
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    if (key.includes('token') || key.includes('auth')) {
      console.log(`🔄 Token atualizado: ${key}`);
    }
    return originalSetItem.apply(this, arguments);
  };
  
  const originalRemoveItem = localStorage.removeItem;
  localStorage.removeItem = function(key) {
    if (key.includes('token') || key.includes('auth')) {
      console.log(`🗑️ Token removido: ${key}`);
    }
    return originalRemoveItem.apply(this, arguments);
  };
  
  console.log('✅ Monitoramento ativo. Mudanças no token serão logadas.');
}

// Função principal de correção
async function fixTokenSync() {
  console.log('🚀 Iniciando correção de sincronização de token...');
  
  // Passo 1: Limpar tokens antigos
  clearOldTokens();
  
  // Passo 2: Verificar token atual
  const hasValidToken = fixCurrentToken();
  
  if (hasValidToken) {
    // Passo 3: Validar com backend
    const isBackendValid = await forceReLoginIfNeeded();
    
    if (isBackendValid) {
      // Passo 4: Testar carrinho
      await testCartAfterFix();
      
      // Passo 5: Configurar monitoramento
      setupTokenMonitoring();
      
      console.log('\n🎉 Correção concluída com sucesso!');
      console.log('✅ Token sincronizado e funcionando');
      console.log('✅ Carrinho acessível');
      console.log('✅ Monitoramento ativo');
    }
  } else {
    console.log('\n⚠️ Faça login novamente para continuar');
  }
}

// Executar correção
fixTokenSync();

// Disponibilizar funções para uso manual
window.fixToken = {
  clearOldTokens,
  fixCurrentToken,
  validateTokenWithBackend,
  forceReLoginIfNeeded,
  testCartAfterFix,
  setupTokenMonitoring,
  fixTokenSync
};

console.log('\n🛠️ Funções de correção disponíveis:');
console.log('- fixToken.clearOldTokens()');
console.log('- fixToken.validateTokenWithBackend()');
console.log('- fixToken.testCartAfterFix()');
console.log('- fixToken.fixTokenSync() // Executa tudo');