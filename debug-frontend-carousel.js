const axios = require('axios');

async function debugFrontendCarousel() {
  console.log('🔍 Debugando carrossel do frontend...\n');

  const frontendURL = 'http://localhost:3001';
  const backendURL = 'http://localhost:8081';

  // 1. Verificar se backend está funcionando
  console.log('1️⃣ Verificando backend...');
  try {
    const backendHealth = await axios.get(`${backendURL}/health`, { timeout: 5000 });
    console.log('✅ Backend está funcionando');
  } catch (error) {
    console.log('❌ Backend não está acessível:', error.message);
    return;
  }

  // 2. Verificar banners HERO no backend
  console.log('\n2️⃣ Verificando banners HERO no backend...');
  try {
    const bannersResponse = await axios.get(`${backendURL}/banners?type=HERO&active=true`);
    const banners = bannersResponse.data;
    
    console.log(`📊 Encontrados ${banners.length} banners HERO`);
    
    if (banners.length === 0) {
      console.log('⚠️ PROBLEMA ENCONTRADO: Nenhum banner HERO ativo!');
      console.log('💡 Isso explica por que o carrossel está vazio.');
      
      // Verificar todos os banners
      console.log('\n🔍 Verificando todos os banners...');
      const allBannersResponse = await axios.get(`${backendURL}/banners`);
      const allBanners = allBannersResponse.data;
      
      console.log(`📊 Total de banners: ${allBanners.length}`);
      allBanners.forEach((banner, index) => {
        console.log(`   ${index + 1}. ${banner.title} - Tipo: ${banner.type} - Ativo: ${banner.active}`);
      });
      
      return;
    }
    
    banners.forEach((banner, index) => {
      console.log(`\n🎨 Banner ${index + 1}:`);
      console.log(`   Título: ${banner.title}`);
      console.log(`   ID: ${banner.id}`);
      console.log(`   Tipo: ${banner.type}`);
      console.log(`   Ativo: ${banner.active}`);
      console.log(`   Imagem: ${banner.imageUrl || 'Não configurada'}`);
      console.log(`   Cor de fundo: ${banner.bgColor || 'Não configurada'}`);
      console.log(`   Posição: ${banner.position || 'Não definida'}`);
    });
    
    // Testar acessibilidade das imagens
    console.log('\n🖼️ Testando acessibilidade das imagens...');
    let workingImages = 0;
    let totalImages = 0;
    
    for (const banner of banners) {
      if (banner.imageUrl) {
        totalImages++;
        try {
          const imageResponse = await axios.get(banner.imageUrl, {
            timeout: 5000,
            responseType: 'arraybuffer'
          });
          const size = imageResponse.data.length;
          console.log(`   ✅ ${banner.title}: ${(size / 1024).toFixed(1)} KB`);
          workingImages++;
        } catch (error) {
          console.log(`   ❌ ${banner.title}: ${error.response?.status || error.code}`);
        }
      }
    }
    
    console.log(`\n📈 Resumo de imagens: ${workingImages}/${totalImages} funcionando`);
    
  } catch (error) {
    console.log('❌ Erro ao buscar banners:', error.message);
    return;
  }

  // 3. Verificar se frontend está funcionando
  console.log('\n3️⃣ Verificando frontend...');
  try {
    const frontendResponse = await axios.get(frontendURL, { timeout: 10000 });
    console.log('✅ Frontend está acessível');
  } catch (error) {
    console.log('❌ Frontend não está acessível:', error.message);
    return;
  }

  // 4. Testar endpoint de banners do frontend (se existir)
  console.log('\n4️⃣ Testando endpoint de banners do frontend...');
  try {
    const frontendBannersResponse = await axios.get(`${frontendURL}/api/banners?type=HERO&active=true`, { timeout: 5000 });
    const frontendBanners = frontendBannersResponse.data;
    console.log(`✅ Frontend retornou ${frontendBanners.length} banners`);
    
    // Comparar com backend
    const backendBannersResponse = await axios.get(`${backendURL}/banners?type=HERO&active=true`);
    const backendBanners = backendBannersResponse.data;
    
    if (frontendBanners.length === backendBanners.length) {
      console.log('✅ Dados consistentes entre frontend e backend');
    } else {
      console.log(`⚠️ Inconsistência: Backend tem ${backendBanners.length}, Frontend tem ${frontendBanners.length}`);
    }
    
  } catch (error) {
    console.log(`❌ Endpoint do frontend não disponível: ${error.response?.status || error.code}`);
    console.log('💡 Frontend provavelmente busca dados diretamente do backend');
  }

  // 5. Verificar variáveis de ambiente
  console.log('\n5️⃣ Verificando configuração...');
  console.log(`🔧 Backend URL: ${backendURL}`);
  console.log(`🔧 Frontend URL: ${frontendURL}`);
  
  // Testar CORS
  console.log('\n6️⃣ Testando CORS...');
  try {
    const corsResponse = await axios.get(`${backendURL}/banners?type=HERO&active=true`, {
      headers: {
        'Origin': frontendURL,
        'Access-Control-Request-Method': 'GET'
      }
    });
    console.log('✅ CORS parece estar funcionando');
  } catch (error) {
    if (error.response?.status === 403 || error.response?.status === 405) {
      console.log('⚠️ Possível problema de CORS');
    } else {
      console.log('✅ CORS parece estar funcionando (erro não relacionado)');
    }
  }

  // 7. Diagnóstico final
  console.log('\n🎯 DIAGNÓSTICO FINAL:');
  console.log('=' .repeat(50));
  
  // Verificar novamente os banners para diagnóstico
  const finalBannersCheck = await axios.get(`${backendURL}/banners?type=HERO&active=true`);
  const finalBanners = finalBannersCheck.data;
  
  if (finalBanners.length === 0) {
    console.log('❌ PROBLEMA PRINCIPAL: Nenhum banner HERO ativo!');
    console.log('\n🔧 SOLUÇÕES:');
    console.log('1. Criar banners HERO no painel administrativo');
    console.log('2. Ativar banners existentes do tipo HERO');
    console.log('3. Verificar se há banners com tipo diferente de HERO');
  } else {
    console.log('✅ Banners HERO disponíveis');
    console.log('✅ Backend funcionando');
    console.log('✅ Frontend acessível');
    
    const bannersWithImages = finalBanners.filter(b => b.imageUrl).length;
    if (bannersWithImages === 0) {
      console.log('⚠️ Nenhum banner tem imagem configurada');
      console.log('💡 Banners aparecerão apenas com cor de fundo');
    } else {
      console.log(`✅ ${bannersWithImages}/${finalBanners.length} banners têm imagens`);
    }
    
    console.log('\n💡 SE AS IMAGENS AINDA NÃO APARECEM:');
    console.log('1. Limpe o cache do navegador (Ctrl+Shift+R)');
    console.log('2. Verifique o console do navegador (F12)');
    console.log('3. Verifique a aba Network para requisições falhando');
    console.log('4. Reinicie o frontend se necessário');
  }
  
  console.log('\n🌐 PARA VERIFICAR MANUALMENTE:');
  console.log(`1. Abra ${frontendURL} no navegador`);
  console.log('2. Pressione F12 e vá para Console');
  console.log('3. Procure por erros relacionados a banners ou imagens');
  console.log('4. Vá para a aba Network e recarregue a página');
  console.log('5. Procure por requisições para /banners que falharam');
}

debugFrontendCarousel();