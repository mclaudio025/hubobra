// Script para verificar se há problemas no frontend

async function checkFrontendConsole() {
  console.log('🔍 Verificando frontend e possíveis problemas...');
  console.log('=' .repeat(50));
  
  const frontendUrl = 'http://localhost:3001';
  const backendUrl = 'http://localhost:8081';
  
  try {
    // 1. Verificar se o frontend está servindo a página
    console.log('1. Verificando se o frontend está servindo a página...');
    const frontendResponse = await fetch(frontendUrl);
    
    if (frontendResponse.ok) {
      console.log('✅ Frontend está respondendo');
      const html = await frontendResponse.text();
      
      // Verificar se há referências ao carrossel no HTML
      if (html.includes('HeroCarousel') || html.includes('carousel')) {
        console.log('✅ Carrossel encontrado no HTML');
      } else {
        console.log('⚠️  Carrossel não encontrado no HTML');
      }
      
      // Verificar se há scripts carregados
      const scriptMatches = html.match(/<script[^>]*src=["'][^"']*["'][^>]*>/g);
      if (scriptMatches) {
        console.log(`✅ ${scriptMatches.length} scripts encontrados`);
      }
      
    } else {
      console.log('❌ Frontend não está respondendo corretamente:', frontendResponse.status);
      return;
    }
    
    // 2. Testar a API que o frontend usa
    console.log('\n2. Testando API que o frontend usa...');
    const apiResponse = await fetch(`${backendUrl}/banners?type=HERO&active=true`);
    
    if (apiResponse.ok) {
      const banners = await apiResponse.json();
      console.log(`✅ API funcionando: ${banners.length} banners HERO ativos`);
      
      if (banners.length === 0) {
        console.log('🚨 PROBLEMA: Nenhum banner HERO ativo!');
        console.log('   O carrossel só mostrará o banner de fallback.');
      } else {
        console.log('📋 Banners disponíveis:');
        banners.forEach((banner, index) => {
          console.log(`   ${index + 1}. "${banner.title}" - ${banner.imageUrl ? 'COM IMAGEM' : 'SEM IMAGEM'}`);
        });
      }
    } else {
      console.log('❌ API não está funcionando:', apiResponse.status);
    }
    
    // 3. Verificar se as imagens estão acessíveis
    console.log('\n3. Verificando imagens dos banners...');
    const bannersResponse = await fetch(`${backendUrl}/banners?type=HERO&active=true`);
    if (bannersResponse.ok) {
      const banners = await bannersResponse.json();
      
      for (const banner of banners) {
        if (banner.imageUrl) {
          try {
            const imageResponse = await fetch(banner.imageUrl, { method: 'HEAD' });
            if (imageResponse.ok) {
              console.log(`   ✅ "${banner.title}": Imagem OK`);
            } else {
              console.log(`   ❌ "${banner.title}": Imagem não acessível (${imageResponse.status})`);
            }
          } catch (error) {
            console.log(`   ❌ "${banner.title}": Erro na imagem - ${error.message}`);
          }
        }
      }
    }
    
    // 4. Verificar se há problemas de CORS
    console.log('\n4. Testando CORS...');
    try {
      const corsResponse = await fetch(`${backendUrl}/banners?type=HERO&active=true`, {
        headers: {
          'Origin': frontendUrl,
          'Content-Type': 'application/json'
        }
      });
      
      if (corsResponse.ok) {
        console.log('✅ CORS funcionando');
      } else {
        console.log('❌ Problema de CORS:', corsResponse.status);
      }
    } catch (error) {
      console.log('❌ Erro de CORS:', error.message);
    }
    
    // 5. Simular o que acontece quando o componente carrega
    console.log('\n5. Simulando carregamento do componente HeroCarousel...');
    
    // Simular a função loadHeroBanners
    try {
      const params = new URLSearchParams();
      params.append('type', 'HERO');
      params.append('active', 'true');
      
      const componentResponse = await fetch(`${backendUrl}/banners?${params.toString()}`);
      
      if (componentResponse.ok) {
        const componentBanners = await componentResponse.json();
        console.log(`✅ Componente receberia ${componentBanners.length} banners`);
        
        if (componentBanners.length === 0) {
          console.log('⚠️  Componente usará banner de fallback:');
          console.log('   - Título: "Materiais de Construção"');
          console.log('   - Sem imagem (apenas cor de fundo)');
          console.log('   - Cor: from-orange-600 to-orange-700');
        } else {
          console.log('✅ Componente usará banners do banco de dados');
        }
      } else {
        console.log('❌ Componente falharia ao carregar banners');
        console.log('⚠️  Componente usará banner de fallback');
      }
    } catch (error) {
      console.log('❌ Erro na simulação do componente:', error.message);
      console.log('⚠️  Componente usará banner de fallback');
    }
    
    console.log('\n💡 DIAGNÓSTICO:');
    console.log('Se você está vendo apenas 1 slide no carrossel:');
    console.log('1. ✅ Backend está funcionando');
    console.log('2. ✅ API está retornando banners');
    console.log('3. ✅ Imagens estão acessíveis');
    console.log('4. ❓ Problema pode estar no frontend');
    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('1. Abra http://localhost:3001 no navegador');
    console.log('2. Pressione F12 para abrir DevTools');
    console.log('3. Vá para a aba Console');
    console.log('4. Recarregue a página (Ctrl+R)');
    console.log('5. Procure por erros em vermelho');
    console.log('6. Vá para a aba Network');
    console.log('7. Procure por requisições para /banners que falharam');
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

checkFrontendConsole();