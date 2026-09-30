// Script para ser executado no console do navegador
// Acesse http://localhost:3000 e cole este código no console (F12)

console.log('🧹 Limpando localStorage do frontend...');

// Verificar o que está armazenado
console.log('📋 Dados atuais no localStorage:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  console.log(`  ${key}:`, value?.substring(0, 100) + (value?.length > 100 ? '...' : ''));
}

// Limpar dados relacionados à autenticação
const authKeys = ['token', 'access_token', 'auth_token', 'user', 'authToken'];
let removedKeys = [];

for (const key of authKeys) {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    removedKeys.push(key);
  }
}

// Verificar também sessionStorage
console.log('\n📋 Dados atuais no sessionStorage:');
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  const value = sessionStorage.getItem(key);
  console.log(`  ${key}:`, value?.substring(0, 100) + (value?.length > 100 ? '...' : ''));
}

for (const key of authKeys) {
  if (sessionStorage.getItem(key)) {
    sessionStorage.removeItem(key);
    removedKeys.push(key + ' (session)');
  }
}

if (removedKeys.length > 0) {
  console.log('✅ Chaves removidas:', removedKeys);
} else {
  console.log('ℹ️ Nenhuma chave de autenticação encontrada');
}

console.log('\n🔄 Recarregue a página (F5) e tente fazer login novamente');
console.log('\n📝 Instruções:');
console.log('1. Recarregue a página');
console.log('2. Faça login novamente');
console.log('3. Verifique se o erro "Usuário não encontrado" ainda aparece');

// Função para verificar o estado atual
window.checkAuthState = function() {
  console.log('\n🔍 Estado atual da autenticação:');
  console.log('localStorage token:', localStorage.getItem('token') ? 'EXISTE' : 'NÃO EXISTE');
  console.log('sessionStorage token:', sessionStorage.getItem('token') ? 'EXISTE' : 'NÃO EXISTE');
  
  // Verificar se há contexto de autenticação
  if (window.React && window.React.version) {
    console.log('React detectado, versão:', window.React.version);
  }
};

console.log('\n💡 Use checkAuthState() para verificar o estado da autenticação a qualquer momento');