const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testBannerUploadAuth() {
    console.log('🖼️ Testando upload de banner com autenticação...');
    console.log('=' .repeat(60));

    const BACKEND_URL = 'http://localhost:8082';

    // 1. Fazer login para obter token
    console.log('\n1. Fazendo login...');
    let authToken = null;
    try {
        const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
            email: 'teste.final@test.com',
            password: '123456'
        });
        
        authToken = loginResponse.data.access_token;
        console.log('✅ Login realizado com sucesso');
        console.log('👤 Usuário:', loginResponse.data.user.name);
        console.log('🔑 Token obtido:', authToken ? 'Sim' : 'Não');
    } catch (error) {
        console.log('❌ Erro no login:', error.response?.data || error.message);
        return;
    }

    // 2. Testar endpoint de banners sem autenticação
    console.log('\n2. Testando endpoint de banners (público)...');
    try {
        const bannersResponse = await axios.get(`${BACKEND_URL}/banners`);
        console.log('✅ Banners obtidos com sucesso');
        console.log('📊 Total de banners:', bannersResponse.data.length);
        
        if (bannersResponse.data.length > 0) {
            console.log('🎯 Primeiro banner:', {
                id: bannersResponse.data[0].id,
                title: bannersResponse.data[0].title,
                hasImage: !!bannersResponse.data[0].imageUrl
            });
        }
    } catch (error) {
        console.log('❌ Erro ao obter banners:', error.response?.data || error.message);
    }

    // 3. Testar criação de banner (requer autenticação)
    console.log('\n3. Testando criação de banner...');
    let bannerId = null;
    try {
        const createResponse = await axios.post(`${BACKEND_URL}/banners`, {
            title: 'Banner Teste Upload',
            subtitle: 'Teste de Upload',
            description: 'Banner criado para testar upload de imagem',
            buttonText: 'Testar',
            buttonLink: '/test',
            isActive: true,
            order: 999
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        bannerId = createResponse.data.id;
        console.log('✅ Banner criado com sucesso');
        console.log('🆔 ID do banner:', bannerId);
    } catch (error) {
        console.log('❌ Erro ao criar banner:', error.response?.data || error.message);
        
        if (error.response?.data?.message?.includes('Usuário não encontrado')) {
            console.log('🎯 ENCONTRADO! Erro "Usuário não encontrado" na criação de banner');
            
            // Verificar se o token é válido
            console.log('\n🔍 Verificando validade do token...');
            try {
                const profileResponse = await axios.get(`${BACKEND_URL}/users/profile`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                
                console.log('✅ Token válido - perfil obtido:', profileResponse.data.name);
            } catch (profileError) {
                console.log('❌ Token inválido:', profileError.response?.data || profileError.message);
            }
        }
        return;
    }

    // 4. Criar uma imagem de teste simples
    console.log('\n4. Criando imagem de teste...');
    const testImagePath = path.join(__dirname, 'test-banner-image.txt');
    fs.writeFileSync(testImagePath, 'Conteúdo de teste para simular uma imagem');
    console.log('✅ Arquivo de teste criado:', testImagePath);

    // 5. Testar upload de imagem para o banner
    console.log('\n5. Testando upload de imagem...');
    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testImagePath));
        
        const uploadResponse = await axios.post(
            `${BACKEND_URL}/banners/${bannerId}/upload-image`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    ...formData.getHeaders()
                }
            }
        );
        
        console.log('✅ Upload realizado com sucesso!');
        console.log('📸 Resposta:', uploadResponse.data);
    } catch (error) {
        console.log('❌ Erro no upload:', error.response?.data || error.message);
        
        if (error.response?.data?.message?.includes('Usuário não encontrado')) {
            console.log('🎯 ENCONTRADO! Erro "Usuário não encontrado" no upload de imagem');
        }
    }

    // 6. Limpar arquivo de teste
    try {
        fs.unlinkSync(testImagePath);
        console.log('🧹 Arquivo de teste removido');
    } catch (error) {
        console.log('⚠️ Não foi possível remover arquivo de teste');
    }

    // 7. Limpar banner de teste
    if (bannerId) {
        console.log('\n6. Limpando banner de teste...');
        try {
            await axios.delete(`${BACKEND_URL}/banners/${bannerId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            console.log('✅ Banner de teste removido');
        } catch (error) {
            console.log('⚠️ Não foi possível remover banner de teste:', error.response?.data || error.message);
        }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🎯 DIAGNÓSTICO COMPLETO!');
    console.log('\n📋 PRÓXIMOS PASSOS SE O ERRO PERSISTIR:');
    console.log('1. Abra o navegador em http://localhost:3000');
    console.log('2. Abra o console (F12)');
    console.log('3. Execute o conteúdo de clear-browser-cache.js');
    console.log('4. Faça login novamente');
    console.log('5. Tente o upload do banner novamente');
}

// Executar teste
testBannerUploadAuth().catch(console.error);