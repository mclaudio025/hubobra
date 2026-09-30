const axios = require('axios');

// Configuração
const BACKEND_URL = 'http://localhost:8081';
const ADMIN_EMAIL = 'admin@loja.com';
const ADMIN_PASSWORD = 'admin123';

async function fixTokenInconsistency() {
    console.log('🔍 Investigando inconsistência de tokens...');
    console.log('=' .repeat(60));
    
    console.log('\n📋 PROBLEMA IDENTIFICADO:');
    console.log('- AuthContext usa: localStorage.getItem(\'auth_token\')');
    console.log('- useUpload usa: localStorage.getItem(\'token\')');
    console.log('- Esta inconsistência pode causar o erro "Usuário não encontrado"');
    
    try {
        // 1. Fazer login para obter token válido
        console.log('\n1️⃣ Fazendo login para obter token válido...');
        const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        
        const validToken = loginResponse.data.access_token;
        const userData = loginResponse.data.user;
        
        console.log('✅ Login realizado com sucesso');
        console.log('👤 Usuário:', userData.name, '(' + userData.email + ')');
        console.log('🆔 ID do usuário:', userData.id);
        console.log('🔑 Token válido obtido');
        
        // 2. Simular o problema - testar upload com token inconsistente
        console.log('\n2️⃣ Simulando problema de upload com token inconsistente...');
        
        // Simular FormData para upload
        const FormData = require('form-data');
        const fs = require('fs');
        const path = require('path');
        
        // Criar arquivo de teste temporário
        const testImagePath = path.join(__dirname, 'test-banner-image.txt');
        fs.writeFileSync(testImagePath, 'Conteúdo de teste para simular imagem');
        
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testImagePath));
        
        // Testar com token inválido (simulando o problema)
        console.log('\n🧪 Testando upload com token inválido...');
        try {
            const invalidUploadResponse = await axios.post(`${BACKEND_URL}/upload/image`, formData, {
                headers: {
                    'Authorization': 'Bearer token_invalido_do_localstorage',
                    ...formData.getHeaders()
                }
            });
        } catch (invalidError) {
            console.log('❌ Upload falhou com token inválido (esperado):', invalidError.response?.status);
            if (invalidError.response?.data?.message?.includes('Usuário não encontrado')) {
                console.log('🎯 CONFIRMADO: Erro "Usuário não encontrado" com token inválido!');
            }
        }
        
        // Testar com token válido
        console.log('\n✅ Testando upload com token válido...');
        try {
            const validUploadResponse = await axios.post(`${BACKEND_URL}/upload/image`, formData, {
                headers: {
                    'Authorization': `Bearer ${validToken}`,
                    ...formData.getHeaders()
                }
            });
            console.log('✅ Upload funcionou com token válido!');
            console.log('📁 Arquivo enviado:', validUploadResponse.data.filename);
        } catch (validError) {
            console.log('❌ Upload falhou mesmo com token válido:', validError.response?.data);
        }
        
        // Limpar arquivo de teste
        fs.unlinkSync(testImagePath);
        
        // 3. Gerar script de correção para o navegador
        console.log('\n3️⃣ Gerando script de correção para o navegador...');
        
        const browserFixScript = `
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
            const response = await fetch('${BACKEND_URL}/upload/image', {
                method: 'POST',
                headers: {
                    'Authorization': \`Bearer \${token}\`
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
`;
        
        // Salvar script em arquivo
        const scriptPath = path.join(__dirname, 'browser-token-fix.js');
        fs.writeFileSync(scriptPath, browserFixScript);
        
        console.log('\n✅ Script de correção gerado!');
        console.log('📁 Arquivo:', scriptPath);
        console.log('\n📋 INSTRUÇÕES:');
        console.log('1. Abra o navegador e vá para http://localhost:3000');
        console.log('2. Faça login normalmente');
        console.log('3. Abra o console do navegador (F12)');
        console.log('4. Copie e cole o conteúdo do arquivo browser-token-fix.js');
        console.log('5. Execute o comando: testBannerUpload()');
        console.log('6. Tente salvar um banner normalmente');
        
        // 4. Verificar se há outros problemas de inconsistência
        console.log('\n4️⃣ Verificando outras possíveis inconsistências...');
        
        // Verificar se o backend está usando a porta correta
        const apiUrlFromEnv = process.env.NEXT_PUBLIC_API_URL;
        console.log('🌐 API_URL configurada:', apiUrlFromEnv || 'Não definida (usando padrão)');
        
        if (!apiUrlFromEnv) {
            console.log('⚠️ NEXT_PUBLIC_API_URL não está definida no .env');
            console.log('💡 Isso pode causar problemas se o backend não estiver na porta 8081');
        }
        
        // Verificar se o AuthContext está usando a URL correta
        console.log('🔍 Verificando conectividade com diferentes portas...');
        
        const portsToTest = [8081, 8082];
        for (const port of portsToTest) {
            try {
                const testResponse = await axios.get(`http://localhost:${port}/health`, { timeout: 2000 });
                console.log(`✅ Porta ${port}: Backend respondendo`);
            } catch (error) {
                console.log(`❌ Porta ${port}: Backend não responde`);
            }
        }
        
        console.log('\n🎯 RESUMO DO DIAGNÓSTICO:');
        console.log('1. ✅ Inconsistência de tokens identificada');
        console.log('2. ✅ Script de correção gerado');
        console.log('3. ✅ Teste de upload preparado');
        console.log('4. 📋 Próximo passo: Aplicar correção no navegador');
        
    } catch (error) {
        console.log('❌ Erro durante diagnóstico:', {
            message: error.message,
            response: error.response?.data
        });
    }
}

// Executar diagnóstico
fixTokenInconsistency().catch(console.error);