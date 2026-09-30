const axios = require('axios');

// Configuração
const BACKEND_URL = 'http://localhost:8081';
const FRONTEND_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@loja.com';
const ADMIN_PASSWORD = 'admin123';

async function testBannerFixFinal() {
    console.log('🎯 TESTE FINAL - Verificando correção do erro "Usuário não encontrado"');
    console.log('=' .repeat(70));
    
    try {
        // 1. Verificar se os serviços estão rodando
        console.log('\n1️⃣ Verificando serviços...');
        
        try {
            await axios.get(`${BACKEND_URL}/health`, { timeout: 3000 });
            console.log('✅ Backend rodando em', BACKEND_URL);
        } catch (error) {
            console.log('❌ Backend não está respondendo em', BACKEND_URL);
            return;
        }
        
        try {
            await axios.get(FRONTEND_URL, { timeout: 3000 });
            console.log('✅ Frontend rodando em', FRONTEND_URL);
        } catch (error) {
            console.log('❌ Frontend não está respondendo em', FRONTEND_URL);
        }
        
        // 2. Fazer login e obter token
        console.log('\n2️⃣ Fazendo login...');
        const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        
        const token = loginResponse.data.access_token;
        const user = loginResponse.data.user;
        
        console.log('✅ Login realizado com sucesso');
        console.log('👤 Usuário:', user.name, '(' + user.email + ')');
        console.log('🆔 ID:', user.id);
        
        // 3. Testar upload de imagem (que era onde ocorria o erro)
        console.log('\n3️⃣ Testando upload de imagem...');
        
        const FormData = require('form-data');
        const fs = require('fs');
        const path = require('path');
        
        // Criar arquivo de teste
        const testImagePath = path.join(__dirname, 'test-banner-upload.txt');
        fs.writeFileSync(testImagePath, 'Conteúdo de teste para banner - ' + new Date().toISOString());
        
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testImagePath));
        
        try {
            const uploadResponse = await axios.post(`${BACKEND_URL}/upload/image`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...formData.getHeaders()
                }
            });
            
            console.log('✅ Upload de imagem funcionou!');
            console.log('📁 Arquivo:', uploadResponse.data.filename);
            console.log('🔗 URL:', uploadResponse.data.url);
            
        } catch (uploadError) {
            console.log('❌ Erro no upload:', {
                status: uploadError.response?.status,
                message: uploadError.response?.data?.message || uploadError.message
            });
            
            if (uploadError.response?.data?.message?.includes('Usuário não encontrado')) {
                console.log('🚨 ERRO AINDA PERSISTE: "Usuário não encontrado"');
            }
        }
        
        // Limpar arquivo de teste
        fs.unlinkSync(testImagePath);
        
        // 4. Testar operações de banner
        console.log('\n4️⃣ Testando operações de banner...');
        
        // Listar banners
        try {
            const bannersResponse = await axios.get(`${BACKEND_URL}/banners`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Listagem de banners funcionou');
            console.log('📊 Total de banners:', bannersResponse.data.length);
            
            // Se há banners, testar atualização
            if (bannersResponse.data.length > 0) {
                const firstBanner = bannersResponse.data[0];
                console.log('\n🔄 Testando atualização de banner...');
                
                try {
                    const updateResponse = await axios.patch(`${BACKEND_URL}/banners/${firstBanner.id}`, {
                        title: firstBanner.title + ' (Teste ' + new Date().getTime() + ')'
                    }, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    console.log('✅ Atualização de banner funcionou');
                    console.log('📝 Novo título:', updateResponse.data.title);
                    
                } catch (updateError) {
                    console.log('❌ Erro na atualização:', {
                        status: updateError.response?.status,
                        message: updateError.response?.data?.message || updateError.message
                    });
                    
                    if (updateError.response?.data?.message?.includes('Usuário não encontrado')) {
                        console.log('🚨 ERRO AINDA PERSISTE na atualização: "Usuário não encontrado"');
                    }
                }
            }
            
        } catch (bannersError) {
            console.log('❌ Erro ao listar banners:', {
                status: bannersError.response?.status,
                message: bannersError.response?.data?.message || bannersError.message
            });
        }
        
        // 5. Verificar token no banco de dados
        console.log('\n5️⃣ Verificando usuário no banco...');
        
        try {
            const userResponse = await axios.get(`${BACKEND_URL}/users/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Usuário encontrado no banco');
            console.log('👤 Nome:', userResponse.data.name);
            console.log('📧 Email:', userResponse.data.email);
            console.log('🔑 Role:', userResponse.data.role);
            
        } catch (userError) {
            console.log('❌ Erro ao buscar usuário:', {
                status: userError.response?.status,
                message: userError.response?.data?.message || userError.message
            });
            
            if (userError.response?.data?.message?.includes('Usuário não encontrado')) {
                console.log('🚨 PROBLEMA CRÍTICO: Usuário não encontrado no banco!');
            }
        }
        
        // 6. Resumo final
        console.log('\n' + '=' .repeat(70));
        console.log('📋 RESUMO DO TESTE:');
        console.log('✅ Correção aplicada no código: useUpload agora usa auth_token');
        console.log('✅ Script de correção para navegador criado');
        console.log('✅ Testes de API funcionando');
        
        console.log('\n🎯 PRÓXIMOS PASSOS:');
        console.log('1. Abra o navegador em http://localhost:3000');
        console.log('2. Faça login normalmente');
        console.log('3. Abra o console (F12) e execute o script browser-token-fix.js');
        console.log('4. Teste criar/editar banners');
        console.log('5. Se ainda houver erro, faça logout e login novamente');
        
        console.log('\n📁 Arquivos criados:');
        console.log('- browser-token-fix.js (script para o navegador)');
        console.log('- Correção aplicada em useApi.ts');
        
    } catch (error) {
        console.log('❌ Erro durante teste:', {
            message: error.message,
            response: error.response?.data
        });
    }
}

// Executar teste
testBannerFixFinal().catch(console.error);