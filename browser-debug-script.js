
// Script para executar no console do navegador (F12)
console.log('🔍 Verificando localStorage...');
console.log('auth_token:', localStorage.getItem('auth_token'));
console.log('auth_user:', localStorage.getItem('auth_user'));
console.log('token (antigo):', localStorage.getItem('token'));

// Limpar tokens antigos
if (localStorage.getItem('token')) {
    localStorage.removeItem('token');
    console.log('🧹 Token antigo removido');
}

// Testar API do carrinho
async function testCartAPI() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        console.log('❌ Nenhum token encontrado');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:8082/cart', {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Carrinho:', data);
        } else {
            const error = await response.text();
            console.log('❌ Erro:', response.status, error);
        }
    } catch (error) {
        console.log('❌ Erro na requisição:', error);
    }
}

// Executar teste
testCartAPI();

// Função para forçar re-login
function forceReLogin() {
    localStorage.clear();
    window.location.reload();
}

console.log('
🔧 Funções disponíveis:');
console.log('- testCartAPI() - Testa a API do carrinho');
console.log('- forceReLogin() - Força novo login');
