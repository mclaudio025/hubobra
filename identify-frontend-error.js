const axios = require('axios');

async function identifyFrontendError() {
    console.log('🔍 Identificando erro no frontend...');
    console.log('=' .repeat(60));

    const BACKEND_URL = 'http://localhost:8082';
    const FRONTEND_URL = 'http://localhost:3000';

    // 1. Verificar quais endpoints o backend realmente tem
    console.log('\n1. Verificando endpoints disponíveis no backend...');
    
    const backendEndpoints = [
        '/api/components',
        '/api/products',
        '/banners',
        '/cart',
        '/users',
        '/auth/login',
        '/auth/register',
        '/upload'
    ];

    for (const endpoint of backendEndpoints) {
        try {
            const response = await axios.get(`${BACKEND_URL}${endpoint}`);
            console.log(`✅ ${endpoint} - Status: ${response.status}`);
        } catch (error) {
            const status = error.response?.status || 'NETWORK_ERROR';
            console.log(`❌ ${endpoint} - Status: ${status}`);
        }
    }

    // 2. Verificar se o frontend está tentando acessar endpoints inexistentes
    console.log('\n2. Testando endpoints que o frontend pode estar chamando...');
    
    const frontendEndpoints = [
        '/cart',
        '/banners',
        '/users/profile',
        '/auth/me'
    ];

    for (const endpoint of frontendEndpoints) {
        try {
            const response = await axios.get(`${BACKEND_URL}${endpoint}`);
            console.log(`✅ ${endpoint} - Disponível`);
        } catch (error) {
            const status = error.response?.status || 'NETWORK_ERROR';
            const message = error.response?.data?.message || error.message;
            console.log(`❌ ${endpoint} - Status: ${status}, Erro: ${message}`);
            
            if (message.includes('Usuário não encontrado')) {
                console.log(`🎯 ENCONTRADO! Endpoint ${endpoint} retorna "Usuário não encontrado"`);
            }
        }
    }

    // 3. Verificar se há algum middleware ou interceptor no frontend
    console.log('\n3. Analisando possíveis causas do erro...');
    
    console.log('\n📋 DIAGNÓSTICO:');
    console.log('- O backend atual só tem endpoints: /api/components e /api/products');
    console.log('- O frontend está tentando acessar endpoints como /banners, /cart, /users');
    console.log('- Estes endpoints não existem no backend atual');
    console.log('- O erro "Usuário não encontrado" pode estar vindo de:');
    console.log('  a) Um middleware de autenticação inexistente');
    console.log('  b) Tentativa de acessar endpoints que não existem');
    console.log('  c) Cache do navegador com dados antigos');
    
    // 4. Verificar se há algum processo rodando na porta 8081 (antiga porta)
    console.log('\n4. Verificando se há algo rodando na porta 8081...');
    try {
        const response = await axios.get('http://localhost:8081/banners');
        console.log('⚠️ ATENÇÃO: Há um serviço rodando na porta 8081!');
        console.log('📊 Resposta:', response.status);
        console.log('🔍 Isso pode estar causando confusão no frontend');
    } catch (error) {
        console.log('✅ Porta 8081 não está respondendo (correto)');
    }

    // 5. Sugestões de correção
    console.log('\n' + '=' .repeat(60));
    console.log('🔧 SOLUÇÕES RECOMENDADAS:');
    console.log('\n1. SOLUÇÃO IMEDIATA:');
    console.log('   - Limpar completamente o cache do navegador');
    console.log('   - Fazer logout e login novamente');
    console.log('   - Verificar se não há service workers ativos');
    
    console.log('\n2. SOLUÇÃO TÉCNICA:');
    console.log('   - O backend precisa implementar os endpoints que o frontend espera:');
    console.log('     * /banners (GET, POST, PUT, DELETE)');
    console.log('     * /cart (GET, POST, PUT, DELETE)');
    console.log('     * /users (GET, POST, PUT, DELETE)');
    console.log('     * /auth/login, /auth/register');
    console.log('     * /upload');
    
    console.log('\n3. SOLUÇÃO ALTERNATIVA:');
    console.log('   - Modificar o frontend para usar apenas os endpoints disponíveis');
    console.log('   - Desabilitar funcionalidades que dependem de endpoints inexistentes');
    
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Execute o script clear-browser-cache.js no navegador');
    console.log('2. Faça logout e login novamente');
    console.log('3. Se o erro persistir, o backend precisa ser expandido');
}

// Executar diagnóstico
identifyFrontendError().catch(console.error);