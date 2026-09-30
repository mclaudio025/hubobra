// Script para executar no console do navegador (F12)
// Este script limpa completamente o cache e localStorage

console.log('🧹 Limpando cache e dados do navegador...');

// 1. Limpar localStorage
console.log('📦 Limpando localStorage...');
const oldData = {
    auth_token: localStorage.getItem('auth_token'),
    auth_user: localStorage.getItem('auth_user'),
    token: localStorage.getItem('token')
};

console.log('📋 Dados antigos encontrados:', oldData);

// Limpar tudo
localStorage.clear();
console.log('✅ localStorage limpo');

// 2. Limpar sessionStorage
sessionStorage.clear();
console.log('✅ sessionStorage limpo');

// 3. Limpar cookies relacionados ao auth
document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});
console.log('✅ Cookies limpos');

// 4. Forçar reload da página
console.log('🔄 Recarregando página...');
setTimeout(() => {
    window.location.reload(true); // Hard reload
}, 1000);

console.log('\n🎯 INSTRUÇÕES:');
console.log('1. A página será recarregada automaticamente em 1 segundo');
console.log('2. Faça login novamente');
console.log('3. Tente salvar o banner novamente');
console.log('4. Se o erro persistir, verifique o console para novos erros');