const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuração
const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:8081';
const ADMIN_EMAIL = 'admin@loja.com';
const ADMIN_PASSWORD = 'admin123';

async function testFrontendBannerError() {
    console.log('🔍 Testando erro de banner no frontend...');
    console.log('🌐 Frontend URL:', FRONTEND_URL);
    console.log('🔧 Backend URL:', BACKEND_URL);
    
    try {
        // 1. Verificar se o frontend está respondendo
        console.log('\n1️⃣ Verificando se o frontend está acessível...');
        try {
            const frontendResponse = await axios.get(FRONTEND_URL, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            console.log('✅ Frontend acessível, status:', frontendResponse.status);
        } catch (frontendError) {
            console.log('❌ Frontend não acessível:', frontendError.message);
            return;
        }
        
        // 2. Fazer login via API do backend
        console.log('\n2️⃣ Fazendo login via backend...');
        const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        
        const token = loginResponse.data.access_token;
        console.log('✅ Login realizado, token obtido');
        
        // 3. Simular o que o frontend faz - verificar localStorage
        console.log('\n3️⃣ Simulando comportamento do frontend...');
        
        // Verificar se há tokens antigos que podem estar causando conflito
        const tokenPayload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        console.log('👤 Dados do token atual:', {
            userId: tokenPayload.sub,
            email: tokenPayload.email,
            exp: new Date(tokenPayload.exp * 1000)
        });
        
        // 4. Testar todas as operações de banner que o frontend faz
        console.log('\n4️⃣ Testando operações de banner...');
        
        // 4.1 Listar banners
        console.log('📋 Listando banners...');
        const bannersResponse = await axios.get(`${BACKEND_URL}/banners`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Banners listados:', bannersResponse.data.length);
        
        if (bannersResponse.data.length > 0) {
            const banner = bannersResponse.data[0];
            console.log('📌 Banner de teste:', {
                id: banner.id,
                title: banner.title
            });
            
            // 4.2 Obter banner específico
            console.log('\n📖 Obtendo banner específico...');
            try {
                const singleBannerResponse = await axios.get(`${BACKEND_URL}/banners/${banner.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ Banner específico obtido');
            } catch (singleBannerError) {
                console.log('❌ Erro ao obter banner específico:', {
                    status: singleBannerError.response?.status,
                    message: singleBannerError.response?.data?.message
                });
            }
            
            // 4.3 Atualizar banner (operação que pode falhar)
            console.log('\n✏️ Atualizando banner...');
            try {
                const updateData = {
                    title: `Teste Frontend - ${new Date().toISOString()}`,
                    description: 'Teste de atualização via frontend'
                };
                
                const updateResponse = await axios.patch(`${BACKEND_URL}/banners/${banner.id}`, updateData, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('✅ Banner atualizado com sucesso');
                
                // 4.4 Verificar se a atualização persistiu
                console.log('\n🔍 Verificando persistência da atualização...');
                const verifyResponse = await axios.get(`${BACKEND_URL}/banners/${banner.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (verifyResponse.data.title === updateData.title) {
                    console.log('✅ Atualização persistiu corretamente');
                } else {
                    console.log('⚠️ Atualização não persistiu:', {
                        esperado: updateData.title,
                        atual: verifyResponse.data.title
                    });
                }
                
            } catch (updateError) {
                console.log('❌ ERRO ao atualizar banner:', {
                    status: updateError.response?.status,
                    message: updateError.response?.data?.message,
                    error: updateError.response?.data?.error,
                    stack: updateError.response?.data?.stack
                });
                
                // Log detalhado para debug
                console.log('\n🔍 Análise detalhada do erro:');
                if (updateError.response?.data?.message?.includes('Usuário não encontrado')) {
                    console.log('🎯 ERRO ENCONTRADO: "Usuário não encontrado"');
                    console.log('🔍 Investigando causa...');
                    
                    // Verificar se o usuário ainda existe
                    try {
                        const userCheckResponse = await axios.get(`${BACKEND_URL}/users/${tokenPayload.sub}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        console.log('✅ Usuário ainda existe no banco:', userCheckResponse.data.id);
                    } catch (userCheckError) {
                        console.log('❌ Usuário não encontrado no banco:', userCheckError.response?.data);
                    }
                    
                    // Verificar se o token ainda é válido
                    try {
                        const profileResponse = await axios.get(`${BACKEND_URL}/auth/profile`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        console.log('✅ Token ainda válido, perfil:', profileResponse.data.id);
                    } catch (profileError) {
                        console.log('❌ Token inválido:', profileError.response?.data);
                    }
                }
            }
        }
        
        // 5. Testar com token expirado/inválido
        console.log('\n5️⃣ Testando com token inválido...');
        try {
            const invalidTokenResponse = await axios.patch(`${BACKEND_URL}/banners/${bannersResponse.data[0]?.id}`, {
                title: 'Teste com token inválido'
            }, {
                headers: { Authorization: 'Bearer token_invalido' }
            });
        } catch (invalidTokenError) {
            console.log('✅ Token inválido rejeitado corretamente:', invalidTokenError.response?.status);
        }
        
        console.log('\n✅ Teste concluído!');
        
    } catch (error) {
        console.log('❌ Erro geral no teste:', {
            message: error.message,
            response: error.response?.data
        });
    }
}

// Executar o teste
testFrontendBannerError().catch(console.error);