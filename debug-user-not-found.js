const axios = require('axios');
const fs = require('fs');

// Configurações
let BACKEND_URL = 'http://localhost:8081';
const FRONTEND_URL = 'http://localhost:3000';

async function debugUserNotFound() {
    console.log('🔍 Iniciando diagnóstico do erro "Usuário não encontrado"...');
    console.log('=' .repeat(60));

    // 1. Verificar se o backend está rodando
    console.log('\n1. Verificando status do backend...');
    try {
        const healthResponse = await axios.get(`${BACKEND_URL}/health`);
        console.log('✅ Backend está rodando:', healthResponse.data);
    } catch (error) {
        console.log('❌ Backend não está acessível:', error.message);
        
        // Tentar porta 8082
        try {
            const healthResponse = await axios.get('http://localhost:8082/health');
            console.log('✅ Backend está rodando na porta 8082:', healthResponse.data);
            BACKEND_URL = 'http://localhost:8082';
        } catch (error2) {
            console.log('❌ Backend também não está na porta 8082:', error2.message);
            return;
        }
    }

    // 2. Verificar usuários no banco
    console.log('\n2. Verificando usuários no banco de dados...');
    try {
        const usersResponse = await axios.get(`${BACKEND_URL}/users`);
        console.log('👥 Usuários encontrados:', usersResponse.data.length);
        
        if (usersResponse.data.length > 0) {
            console.log('📋 Primeiro usuário:', {
                id: usersResponse.data[0].id,
                email: usersResponse.data[0].email,
                name: usersResponse.data[0].name
            });
        }
    } catch (error) {
        console.log('❌ Erro ao buscar usuários:', error.response?.data || error.message);
    }

    // 3. Testar login com usuário de teste
    console.log('\n3. Testando login...');
    let authToken = null;
    try {
        const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
            email: 'admin@test.com',
            password: '123456'
        });
        
        authToken = loginResponse.data.access_token;
        console.log('✅ Login realizado com sucesso');
        console.log('🔑 Token obtido:', authToken ? 'Sim' : 'Não');
        
        if (loginResponse.data.user) {
            console.log('👤 Dados do usuário:', {
                id: loginResponse.data.user.id,
                email: loginResponse.data.user.email,
                name: loginResponse.data.user.name
            });
        }
    } catch (error) {
        console.log('❌ Erro no login:', error.response?.data || error.message);
        
        // Tentar criar usuário de teste
        console.log('\n📝 Tentando criar usuário de teste...');
        try {
            const registerResponse = await axios.post(`${BACKEND_URL}/auth/register`, {
                name: 'Admin Test',
                email: 'admin@test.com',
                password: '123456'
            });
            
            authToken = registerResponse.data.access_token;
            console.log('✅ Usuário criado e login realizado');
        } catch (regError) {
            console.log('❌ Erro ao criar usuário:', regError.response?.data || regError.message);
        }
    }

    if (!authToken) {
        console.log('❌ Não foi possível obter token de autenticação');
        return;
    }

    // 4. Testar endpoint do carrinho
    console.log('\n4. Testando endpoint do carrinho...');
    try {
        const cartResponse = await axios.get(`${BACKEND_URL}/cart`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        console.log('✅ Carrinho acessado com sucesso:', cartResponse.data);
    } catch (error) {
        console.log('❌ Erro ao acessar carrinho:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('🔍 Erro 401 - Token inválido ou expirado');
        }
        
        if (error.response?.data?.message?.includes('Usuário não encontrado')) {
            console.log('🎯 ENCONTRADO! Este é o erro "Usuário não encontrado"');
            
            // Verificar se o usuário realmente existe
            console.log('\n5. Verificando se o usuário do token existe...');
            try {
                const profileResponse = await axios.get(`${BACKEND_URL}/users/profile`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                
                console.log('✅ Perfil do usuário encontrado:', profileResponse.data);
            } catch (profileError) {
                console.log('❌ Erro ao buscar perfil:', profileError.response?.data || profileError.message);
            }
        }
    }

    // 5. Verificar token decodificado
    console.log('\n6. Analisando token JWT...');
    try {
        const tokenParts = authToken.split('.');
        if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            console.log('📋 Payload do token:', {
                sub: payload.sub,
                email: payload.email,
                iat: new Date(payload.iat * 1000),
                exp: new Date(payload.exp * 1000)
            });
            
            // Verificar se o token expirou
            const now = Date.now() / 1000;
            if (payload.exp < now) {
                console.log('⚠️ Token expirado!');
            } else {
                console.log('✅ Token válido');
            }
        }
    } catch (error) {
        console.log('❌ Erro ao decodificar token:', error.message);
    }

    // 6. Gerar script para o navegador
    console.log('\n7. Gerando script para o navegador...');
    const browserScript = `
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
        const response = await fetch('${BACKEND_URL}/cart', {
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

console.log('\n🔧 Funções disponíveis:');
console.log('- testCartAPI() - Testa a API do carrinho');
console.log('- forceReLogin() - Força novo login');
`;
    
    fs.writeFileSync('browser-debug-script.js', browserScript);
    console.log('✅ Script salvo em: browser-debug-script.js');
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('1. Execute este script: node debug-user-not-found.js');
    console.log('2. Abra o navegador em http://localhost:3000');
    console.log('3. Abra o console (F12) e execute o conteúdo de browser-debug-script.js');
    console.log('4. Analise os logs para identificar a causa do erro');
}

// Executar diagnóstico
debugUserNotFound().catch(console.error);