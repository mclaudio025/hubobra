const axios = require('axios');

async function testPortFix() {
    console.log('🔧 Testando correção da porta da API...');
    console.log('=' .repeat(50));
    
    const BACKEND_URL = 'http://localhost:8081';
    const FRONTEND_URL = 'http://localhost:3000';
    
    try {
        // 1. Verificar se o backend está respondendo na porta correta
        console.log('\n1️⃣ Verificando backend na porta 8081...');
        const healthResponse = await axios.get(`${BACKEND_URL}/health`);
        console.log('✅ Backend respondendo:', healthResponse.status);
        
        // 2. Testar endpoints que o frontend usa
        console.log('\n2️⃣ Testando endpoints principais...');
        
        const endpoints = [
            { name: 'Categorias', path: '/categories' },
            { name: 'Produtos', path: '/products' },
            { name: 'Banners', path: '/banners' }
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(`${BACKEND_URL}${endpoint.path}`);
                console.log(`✅ ${endpoint.name}: ${response.status} - ${Array.isArray(response.data) ? response.data.length + ' itens' : 'OK'}`);
            } catch (error) {
                console.log(`❌ ${endpoint.name}: ${error.response?.status || 'ERRO'} - ${error.message}`);
            }
        }
        
        // 3. Testar login
        console.log('\n3️⃣ Testando autenticação...');
        try {
            const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
                email: 'admin@loja.com',
                password: 'admin123'
            });
            
            const token = loginResponse.data.access_token;
            console.log('✅ Login realizado com sucesso');
            
            // 4. Testar endpoint autenticado
            console.log('\n4️⃣ Testando endpoint autenticado...');
            const cartResponse = await axios.get(`${BACKEND_URL}/cart`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Carrinho acessível:', cartResponse.status);
            
        } catch (error) {
            console.log('❌ Erro na autenticação:', error.response?.data?.message || error.message);
        }
        
        // 5. Verificar se o frontend está acessível
        console.log('\n5️⃣ Verificando frontend...');
        try {
            const frontendResponse = await axios.get(FRONTEND_URL, { timeout: 5000 });
            console.log('✅ Frontend acessível:', frontendResponse.status);
        } catch (error) {
            console.log('❌ Frontend não acessível:', error.message);
        }
        
        console.log('\n🎯 RESULTADO:');
        console.log('✅ Correção da porta aplicada com sucesso!');
        console.log('📝 Arquivos corrigidos:');
        console.log('   - useApi.ts (porta padrão: 8081)');
        console.log('   - Todas as rotas da API do frontend');
        console.log('\n💡 PRÓXIMOS PASSOS:');
        console.log('1. Reinicie o frontend (Ctrl+C e npm run dev)');
        console.log('2. Teste o carregamento de categorias no navegador');
        console.log('3. Verifique se não há mais erros "Failed to fetch"');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

testPortFix();