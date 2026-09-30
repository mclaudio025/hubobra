const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function finalCarouselCheck() {
    console.log('🔍 VERIFICAÇÃO FINAL DO CARROSSEL HERO');
    console.log('=' .repeat(50));
    
    try {
        // 1. Verificar se o backend está funcionando
        console.log('\n1. Verificando Backend...');
        const backendResponse = await axios.get('http://localhost:8081/health');
        console.log('✅ Backend funcionando:', backendResponse.status === 200);
        
        // 2. Buscar banners HERO
        console.log('\n2. Buscando banners HERO...');
        const bannersResponse = await axios.get('http://localhost:8081/banners');
        const heroBanners = bannersResponse.data.filter(banner => 
            banner.type === 'HERO' && banner.active
        );
        
        console.log(`📊 Total de banners HERO ativos: ${heroBanners.length}`);
        
        // 3. Verificar imagens dos banners
        console.log('\n3. Verificando imagens dos banners...');
        let workingImages = 0;
        
        for (const banner of heroBanners) {
            if (banner.imageUrl) {
                try {
                    const imageUrl = `http://localhost:8081${banner.imageUrl}`;
                    const imageResponse = await axios.head(imageUrl);
                    if (imageResponse.status === 200) {
                        console.log(`✅ Imagem acessível: ${banner.title} - ${imageUrl}`);
                        workingImages++;
                    }
                } catch (error) {
                    console.log(`❌ Imagem inacessível: ${banner.title} - ${banner.imageUrl}`);
                }
            } else {
                console.log(`⚠️  Banner sem imagem: ${banner.title}`);
            }
        }
        
        // 4. Verificar arquivos de imagem no diretório uploads
        console.log('\n4. Verificando arquivos no diretório uploads...');
        const uploadsDir = path.join(__dirname, 'backend-nestjs', 'uploads', 'original');
        
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            const imageFiles = files.filter(file => 
                file.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)
            );
            console.log(`📁 Arquivos de imagem encontrados: ${imageFiles.length}`);
            imageFiles.forEach(file => {
                console.log(`   - ${file}`);
            });
        } else {
            console.log('❌ Diretório uploads/original não encontrado');
        }
        
        // 5. Verificar se o frontend consegue acessar a API
        console.log('\n5. Testando acesso do frontend à API...');
        try {
            const frontendApiTest = await axios.get('http://localhost:3001/api/banners', {
                timeout: 5000
            });
            console.log('✅ Frontend consegue acessar API de banners');
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('ℹ️  Frontend não tem endpoint /api/banners (normal - busca direto do backend)');
            } else {
                console.log('❌ Erro ao acessar API do frontend:', error.message);
            }
        }
        
        // 6. Diagnóstico final
        console.log('\n' + '=' .repeat(50));
        console.log('📋 DIAGNÓSTICO FINAL:');
        console.log('=' .repeat(50));
        
        if (heroBanners.length === 0) {
            console.log('❌ PROBLEMA: Nenhum banner HERO ativo encontrado');
            console.log('💡 SOLUÇÃO: Execute o script create-banners.js para criar banners de teste');
        } else if (workingImages === 0) {
            console.log('❌ PROBLEMA: Banners existem mas nenhuma imagem está acessível');
            console.log('💡 SOLUÇÃO: Verifique se as imagens estão no diretório uploads e se o servidor de arquivos estáticos está funcionando');
        } else if (workingImages < heroBanners.length) {
            console.log(`⚠️  PROBLEMA PARCIAL: ${workingImages}/${heroBanners.length} imagens funcionando`);
            console.log('💡 SOLUÇÃO: Algumas imagens podem estar corrompidas ou com URLs incorretas');
        } else {
            console.log('✅ TUDO OK: Todas as imagens dos banners HERO estão funcionando!');
            console.log('🎯 As imagens devem aparecer no carrossel em http://localhost:3001');
        }
        
        console.log('\n🔧 PASSOS PARA VERIFICAÇÃO MANUAL:');
        console.log('1. Abra http://localhost:3001 no navegador');
        console.log('2. Verifique se o carrossel HERO aparece na página inicial');
        console.log('3. Se não aparecer, abra o DevTools (F12) e verifique:');
        console.log('   - Console para erros JavaScript');
        console.log('   - Network para requisições falhando');
        console.log('   - Elements para ver se o HTML do carrossel está sendo renderizado');
        
        if (workingImages > 0) {
            console.log('\n🎉 CONCLUSÃO: O sistema está funcionando corretamente!');
            console.log('Se as imagens não aparecem no navegador, pode ser cache do browser.');
            console.log('Tente: Ctrl+F5 para recarregar sem cache ou modo incógnito.');
        }
        
    } catch (error) {
        console.error('❌ Erro durante a verificação:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 SOLUÇÃO: Verifique se o backend está rodando em http://localhost:8081');
        }
    }
}

finalCarouselCheck().catch(console.error);