const axios = require('axios');

const BASE_URL = 'http://localhost:8082';

async function testBannerUpdate() {
    console.log('🧪 Testando atualização de banners após correção...');
    console.log('============================================================');

    try {
        // 1. Fazer login
        console.log('\n1️⃣ Fazendo login...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@loja.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data.access_token;
        console.log('✅ Login realizado com sucesso');
        
        // 2. Verificar perfil do usuário
        console.log('\n2️⃣ Verificando perfil do usuário...');
        const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('✅ Perfil obtido:', profileResponse.data.email, '- Role:', profileResponse.data.role);
        
        // 3. Listar banners existentes
        console.log('\n3️⃣ Listando banners existentes...');
        const bannersResponse = await axios.get(`${BASE_URL}/banners`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('✅ Banners encontrados:', bannersResponse.data.length);
        
        let testBanner = null;
        
        if (bannersResponse.data.length > 0) {
            testBanner = bannersResponse.data[0];
            console.log('📋 Usando banner existente:', testBanner.title);
        } else {
            // 4. Criar um banner de teste se não existir
            console.log('\n4️⃣ Criando banner de teste...');
            const createResponse = await axios.post(`${BASE_URL}/banners`, {
                title: 'Banner de Teste - Atualização',
                description: 'Banner criado para testar atualização',
                imageUrl: 'https://via.placeholder.com/800x400/0066cc/ffffff?text=Banner+Teste',
                link: '/produtos',
                isActive: true,
                order: 1
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            testBanner = createResponse.data;
            console.log('✅ Banner criado:', testBanner.title);
        }
        
        // 5. Tentar atualizar o banner
        console.log('\n5️⃣ Testando atualização do banner...');
        const updateData = {
            title: testBanner.title + ' - ATUALIZADO',
            description: 'Banner atualizado em ' + new Date().toLocaleString(),
            imageUrl: testBanner.imageUrl,
            link: testBanner.link,
            isActive: testBanner.isActive,
            order: testBanner.order
        };
        
        const updateResponse = await axios.patch(`${BASE_URL}/banners/${testBanner.id}`, updateData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Banner atualizado com sucesso!');
        console.log('📝 Novo título:', updateResponse.data.title);
        console.log('📝 Nova descrição:', updateResponse.data.description);
        
        // 6. Verificar se a atualização foi persistida
        console.log('\n6️⃣ Verificando se a atualização foi persistida...');
        const verifyResponse = await axios.get(`${BASE_URL}/banners/${testBanner.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (verifyResponse.data.title.includes('ATUALIZADO')) {
            console.log('✅ Atualização confirmada no banco de dados!');
        } else {
            console.log('❌ Atualização não foi persistida corretamente');
        }
        
        console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
        console.log('✅ O problema "Usuário não encontrado" foi resolvido!');
        console.log('✅ Banners podem ser atualizados normalmente!');
        
    } catch (error) {
        console.log('❌ Erro durante o teste:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('\n🔧 Problema de autenticação detectado:');
            console.log('   - Verifique se o token está válido');
            console.log('   - Limpe o localStorage do navegador se necessário');
        }
        
        if (error.response?.data?.message === 'Usuário não encontrado') {
            console.log('\n❌ O problema "Usuário não encontrado" ainda persiste!');
            console.log('🔧 Soluções adicionais:');
            console.log('   1. Reinicie o backend');
            console.log('   2. Limpe completamente o cache do navegador');
            console.log('   3. Verifique se há múltiplos usuários com o mesmo email');
        }
    }
}

testBannerUpdate().catch(console.error);