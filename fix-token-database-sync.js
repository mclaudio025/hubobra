const axios = require('axios');

const BASE_URL = 'http://localhost:8082';

async function fixTokenDatabaseSync() {
    console.log('🔧 Sincronizando tokens com banco de dados...');
    console.log('============================================================');

    try {
        // 1. Verificar backend
        console.log('\n1️⃣ Verificando backend...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Backend está funcionando:', healthResponse.status);

        // 2. Tentar login para obter token atual
        console.log('\n2️⃣ Obtendo token atual...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@loja.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data.access_token;
        console.log('✅ Token obtido com sucesso');
        
        // 3. Decodificar token para ver o ID do usuário
        const tokenPayload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        console.log('🆔 ID do usuário no token:', tokenPayload.sub);
        console.log('📧 Email do usuário no token:', tokenPayload.email);
        console.log('⏰ Token expira em:', new Date(tokenPayload.exp * 1000).toLocaleString());
        
        // 4. Verificar se o usuário existe no banco
        console.log('\n3️⃣ Verificando usuário no banco...');
        try {
            const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('✅ Usuário encontrado no banco:', profileResponse.data.email);
            console.log('✅ Token e banco estão sincronizados!');
            
        } catch (profileError) {
            if (profileError.response?.status === 401 && 
                profileError.response?.data?.message === 'Usuário não encontrado') {
                
                console.log('❌ Usuário do token não existe no banco');
                console.log('\n4️⃣ Tentando recriar usuário com mesmo ID...');
                
                // Tentar recriar o usuário com o mesmo ID do token
                try {
                    const recreateResponse = await axios.post(`${BASE_URL}/auth/recreate-user`, {
                        id: tokenPayload.sub,
                        email: tokenPayload.email,
                        name: 'Administrador',
                        password: 'admin123',
                        role: 'ADMIN'
                    });
                    
                    console.log('✅ Usuário recriado com sucesso!');
                    
                    // Verificar se agora funciona
                    const newProfileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    console.log('✅ Token agora funciona com o usuário recriado!');
                    
                } catch (recreateError) {
                    console.log('❌ Não foi possível recriar usuário automaticamente');
                    console.log('\n📋 Solução manual necessária:');
                    console.log('   1. Limpe o localStorage do navegador (F12 > Application > Local Storage > Clear All)');
                    console.log('   2. Recarregue a página do frontend');
                    console.log('   3. Faça login novamente');
                    console.log('   4. Isso criará um novo token com um usuário válido');
                }
            } else {
                console.log('❌ Erro inesperado ao verificar perfil:', profileError.response?.data || profileError.message);
            }
        }
        
    } catch (error) {
        console.log('❌ Erro durante a sincronização:', error.response?.data || error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n🔧 Backend não está rodando. Inicie o backend primeiro:');
            console.log('   cd backend-nestjs && npm run start:dev');
        }
    }
    
    console.log('\n✅ Processo de sincronização concluído!');
}

fixTokenDatabaseSync().catch(console.error);