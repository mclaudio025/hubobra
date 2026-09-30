const axios = require('axios');

// Configuração
const BASE_URL = 'http://localhost:8081';
const ADMIN_EMAIL = 'admin@loja.com';
const ADMIN_PASSWORD = 'admin123';

async function debugRealTimeBannerError() {
    console.log('🔍 Iniciando debug em tempo real do erro de banner...');
    console.log('📍 Backend URL:', BASE_URL);
    
    try {
        // 1. Verificar se o backend está respondendo
        console.log('\n1️⃣ Verificando saúde do backend...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Backend respondendo:', healthResponse.data);
        
        // 2. Fazer login
        console.log('\n2️⃣ Fazendo login...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        
        const token = loginResponse.data.access_token;
        console.log('✅ Login realizado com sucesso');
        console.log('🔑 Token obtido:', token.substring(0, 50) + '...');
        
        // 3. Decodificar o token para ver o ID do usuário
        const tokenPayload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        console.log('👤 Dados do token:', {
            userId: tokenPayload.sub,
            email: tokenPayload.email,
            iat: new Date(tokenPayload.iat * 1000),
            exp: new Date(tokenPayload.exp * 1000)
        });
        
        // 4. Verificar perfil do usuário
        console.log('\n3️⃣ Verificando perfil do usuário...');
        try {
            const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Perfil obtido:', profileResponse.data);
        } catch (profileError) {
            console.log('❌ ERRO ao obter perfil:', {
                status: profileError.response?.status,
                message: profileError.response?.data?.message,
                error: profileError.response?.data?.error
            });
        }
        
        // 5. Listar banners (operação que pode falhar)
        console.log('\n4️⃣ Listando banners...');
        try {
            const bannersResponse = await axios.get(`${BASE_URL}/banners`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Banners listados:', bannersResponse.data.length, 'banners encontrados');
            
            if (bannersResponse.data.length > 0) {
                const firstBanner = bannersResponse.data[0];
                console.log('📋 Primeiro banner:', {
                    id: firstBanner.id,
                    title: firstBanner.title,
                    isActive: firstBanner.isActive
                });
                
                // 6. Tentar atualizar o banner (operação que falha)
                console.log('\n5️⃣ Tentando atualizar banner...');
                try {
                    const updateResponse = await axios.patch(`${BASE_URL}/banners/${firstBanner.id}`, {
                        title: `Banner Atualizado - ${new Date().toISOString()}`,
                        description: 'Teste de atualização em tempo real'
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log('✅ Banner atualizado com sucesso:', updateResponse.data);
                } catch (updateError) {
                    console.log('❌ ERRO ao atualizar banner:', {
                        status: updateError.response?.status,
                        message: updateError.response?.data?.message,
                        error: updateError.response?.data?.error,
                        details: updateError.response?.data
                    });
                    
                    // Log detalhado do erro
                    console.log('\n🔍 Detalhes completos do erro:');
                    console.log('Status Code:', updateError.response?.status);
                    console.log('Headers:', updateError.response?.headers);
                    console.log('Data:', JSON.stringify(updateError.response?.data, null, 2));
                }
            }
        } catch (listError) {
            console.log('❌ ERRO ao listar banners:', {
                status: listError.response?.status,
                message: listError.response?.data?.message,
                error: listError.response?.data?.error
            });
        }
        
        // 7. Verificar diretamente o usuário no banco
        console.log('\n6️⃣ Verificando usuário diretamente...');
        try {
            const userResponse = await axios.get(`${BASE_URL}/users/${tokenPayload.sub}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Usuário encontrado no banco:', userResponse.data);
        } catch (userError) {
            console.log('❌ ERRO ao buscar usuário:', {
                status: userError.response?.status,
                message: userError.response?.data?.message,
                error: userError.response?.data?.error
            });
        }
        
    } catch (error) {
        console.log('❌ Erro geral:', {
            message: error.message,
            response: error.response?.data
        });
    }
}

// Executar o debug
debugRealTimeBannerError().catch(console.error);