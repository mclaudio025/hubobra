const axios = require('axios');

async function createAdminUser() {
    console.log('👑 Criando usuário administrador...');
    console.log('=' .repeat(50));

    const BACKEND_URL = 'http://localhost:8082';

    // 1. Tentar criar usuário admin
    console.log('\n1. Criando usuário admin...');
    try {
        const registerResponse = await axios.post(`${BACKEND_URL}/auth/register`, {
            name: 'Admin User',
            email: 'admin@test.com',
            password: '123456',
            role: 'ADMIN' // Tentar definir role como admin
        });
        
        console.log('✅ Usuário admin criado com sucesso');
        console.log('👤 Usuário:', registerResponse.data.user.name);
        console.log('🔑 Role:', registerResponse.data.user.role || 'USER (padrão)');
    } catch (error) {
        if (error.response?.data?.message?.includes('já existe')) {
            console.log('ℹ️ Usuário admin já existe');
        } else {
            console.log('❌ Erro ao criar usuário admin:', error.response?.data || error.message);
        }
    }

    // 2. Fazer login com admin
    console.log('\n2. Fazendo login como admin...');
    let adminToken = null;
    try {
        const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
            email: 'admin@test.com',
            password: '123456'
        });
        
        adminToken = loginResponse.data.access_token;
        console.log('✅ Login admin realizado com sucesso');
        console.log('👤 Usuário:', loginResponse.data.user.name);
        console.log('🔑 Role:', loginResponse.data.user.role || 'USER');
        console.log('🎫 Token obtido:', adminToken ? 'Sim' : 'Não');
    } catch (error) {
        console.log('❌ Erro no login admin:', error.response?.data || error.message);
        return;
    }

    // 3. Testar criação de banner com admin
    console.log('\n3. Testando criação de banner como admin...');
    let bannerId = null;
    try {
        const createResponse = await axios.post(`${BACKEND_URL}/banners`, {
            title: 'Banner Admin Test',
            subtitle: 'Teste Admin',
            description: 'Banner criado pelo admin para testar upload',
            buttonText: 'Admin Test',
            buttonLink: '/admin-test',
            isActive: true,
            order: 999
        }, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        bannerId = createResponse.data.id;
        console.log('✅ Banner criado com sucesso pelo admin');
        console.log('🆔 ID do banner:', bannerId);
    } catch (error) {
        console.log('❌ Erro ao criar banner como admin:', error.response?.data || error.message);
        
        if (error.response?.data?.message?.includes('Usuário não encontrado')) {
            console.log('🎯 ENCONTRADO! Erro "Usuário não encontrado" mesmo com admin');
        }
        
        if (error.response?.status === 403) {
            console.log('🚫 Ainda sem permissão - verificando se role ADMIN foi definido corretamente');
        }
    }

    // 4. Verificar perfil do admin
    console.log('\n4. Verificando perfil do admin...');
    try {
        const profileResponse = await axios.get(`${BACKEND_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        console.log('✅ Perfil do admin obtido:');
        console.log('📧 Email:', profileResponse.data.email);
        console.log('👤 Nome:', profileResponse.data.name);
        console.log('🔑 Role:', profileResponse.data.role || 'USER (padrão)');
        console.log('🆔 ID:', profileResponse.data.id);
    } catch (error) {
        console.log('❌ Erro ao obter perfil admin:', error.response?.data || error.message);
        
        if (error.response?.data?.message?.includes('Usuário não encontrado')) {
            console.log('🎯 ENCONTRADO! Erro "Usuário não encontrado" no perfil do admin');
            console.log('🔍 Isso indica que o problema está na validação do token JWT');
        }
    }

    // 5. Limpar banner de teste se criado
    if (bannerId) {
        console.log('\n5. Limpando banner de teste...');
        try {
            await axios.delete(`${BACKEND_URL}/banners/${bannerId}`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });
            console.log('✅ Banner de teste removido');
        } catch (error) {
            console.log('⚠️ Não foi possível remover banner de teste');
        }
    }

    console.log('\n' + '=' .repeat(50));
    console.log('🎯 DIAGNÓSTICO ADMIN COMPLETO!');
    
    if (adminToken) {
        console.log('\n🔑 Token do Admin para testes manuais:');
        console.log(adminToken);
        console.log('\n📋 Use este token no frontend para testar upload de banner');
    }
}

// Executar teste
createAdminUser().catch(console.error);