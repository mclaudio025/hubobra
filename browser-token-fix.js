// ===== SCRIPT DE CORREÇÃO PARA O NAVEGADOR =====
// Execute este script no console do navegador (F12)

console.log('🔧 Corrigindo inconsistência de tokens...');

// 1. Verificar tokens atuais
console.log('📋 Tokens atuais:');
console.log('auth_token:', localStorage.getItem('auth_token'));
console.log('token (antigo):', localStorage.getItem('token'));

// 2. Sincronizar tokens
const authToken = localStorage.getItem('auth_token');
if (authToken) {
    // Copiar auth_token para token (para compatibilidade com useUpload)
    localStorage.setItem('token', authToken);
    console.log('✅ Token sincronizado: auth_token -> token');
} else {
    console.log('⚠️ Nenhum auth_token encontrado');
}

// 3. Limpar tokens antigos/inválidos se existirem
const allKeys = Object.keys(localStorage);
allKeys.forEach(key => {
    if (key.includes('token') && key !== 'auth_token' && key !== 'token') {
        localStorage.removeItem(key);
        console.log('🧹 Token antigo removido:', key);
    }
});

// 4. Verificar resultado
console.log('\n📋 Tokens após correção:');
console.log('auth_token:', localStorage.getItem('auth_token'));
console.log('token:', localStorage.getItem('token'));

// 5. Função para testar upload
window.testBannerUpload = async function() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ Nenhum token encontrado');
        return;
    }
    
    console.log('🧪 Testando upload de banner...');
    
    // Criar arquivo de teste
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, 800, 400);
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Teste Banner', 400, 200);
    
    canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append('file', blob, 'test-banner.png');
        
        try {
            const response = await fetch('http://localhost:8081/upload/image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Upload de banner funcionou!', result);
            } else {
                const error = await response.json();
                console.log('❌ Erro no upload:', error);
            }
        } catch (error) {
            console.log('❌ Erro na requisição:', error);
        }
    });
};

console.log('\n🎯 Correção aplicada!');
console.log('💡 Para testar upload: testBannerUpload()');
console.log('🔄 Se ainda houver problemas, faça logout e login novamente');