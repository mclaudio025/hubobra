// Usando fetch global do Node.js 18+

async function debugCarouselRealTime() {
  console.log('🔍 Debugando carrossel em tempo real...');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar se o frontend está rodando
    console.log('1. Verificando frontend...');
    try {
      const frontendResponse = await fetch('http://localhost:3001');
      if (frontendResponse.ok) {
        console.log('✅ Frontend rodando em http://localhost:3001');
      } else {
        console.log(`❌ Frontend com problema: ${frontendResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Frontend não acessível: ${error.message}`);
      return;
    }
    
    // 2. Verificar se o backend está rodando
    console.log('\n2. Verificando backend...');
    try {
      const backendResponse = await fetch('http://localhost:8081/health');
      if (backendResponse.ok) {
        console.log('✅ Backend rodando em http://localhost:8081');
      } else {
        console.log(`❌ Backend com problema: ${backendResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Backend não acessível: ${error.message}`);
      return;
    }
    
    // 3. Testar API de banners diretamente
    console.log('\n3. Testando API de banners...');
    try {
      const bannersResponse = await fetch('http://localhost:8081/banners?type=HERO&active=true');
      if (bannersResponse.ok) {
        const banners = await bannersResponse.json();
        console.log(`✅ API de banners funcionando: ${banners.length} banners encontrados`);
        
        banners.forEach((banner, index) => {
          console.log(`   ${index + 1}. "${banner.title}" - ${banner.imageUrl}`);
        });
      } else {
        console.log(`❌ API de banners com erro: ${bannersResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Erro na API de banners: ${error.message}`);
    }
    
    // 4. Testar CORS fazendo uma requisição como o frontend faria
    console.log('\n4. Testando CORS...');
    try {
      const corsResponse = await fetch('http://localhost:8081/banners?type=HERO&active=true', {
        method: 'GET',
        headers: {
          'Origin': 'http://localhost:3001',
          'Content-Type': 'application/json'
        }
      });
      
      if (corsResponse.ok) {
        console.log('✅ CORS funcionando corretamente');
      } else {
        console.log(`❌ Problema de CORS: ${corsResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Erro de CORS: ${error.message}`);
    }
    
    // 5. Verificar se as imagens estão acessíveis
    console.log('\n5. Verificando imagens...');
    const testImages = [
      'http://localhost:8081/uploads/original/34a8c259-5f85-439e-bf17-78ce7c1c5515.jpeg',
      'http://localhost:8081/uploads/original/01b6296c-f0be-44ab-a139-6e1bdeab1b47.png',
      'http://localhost:8081/uploads/original/049401b8-b3cf-4846-b883-eeb04d9c6904.png',
      'http://localhost:8081/uploads/original/0509d759-fe17-46ff-9911-2a7692999560.png'
    ];
    
    for (const imageUrl of testImages) {
      try {
        const imageResponse = await fetch(imageUrl);
        if (imageResponse.ok) {
          console.log(`✅ Imagem acessível: ${imageUrl}`);
        } else {
          console.log(`❌ Imagem com problema: ${imageUrl} (${imageResponse.status})`);
        }
      } catch (error) {
        console.log(`❌ Erro ao acessar imagem: ${imageUrl} (${error.message})`);
      }
    }
    
    // 6. Simular requisição do frontend
    console.log('\n6. Simulando requisição do frontend...');
    try {
      const frontendApiResponse = await fetch('http://localhost:8081/banners?type=HERO&active=true', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3001',
          'Referer': 'http://localhost:3001/'
        }
      });
      
      if (frontendApiResponse.ok) {
        const data = await frontendApiResponse.json();
        console.log('✅ Requisição simulada do frontend funcionou');
        console.log(`   Dados recebidos: ${data.length} banners`);
        
        // Verificar estrutura dos dados
        if (data.length > 0) {
          const firstBanner = data[0];
          console.log('   Estrutura do primeiro banner:');
          console.log(`     - id: ${firstBanner.id}`);
          console.log(`     - title: ${firstBanner.title}`);
          console.log(`     - imageUrl: ${firstBanner.imageUrl}`);
          console.log(`     - type: ${firstBanner.type}`);
          console.log(`     - active: ${firstBanner.active}`);
        }
      } else {
        console.log(`❌ Requisição simulada falhou: ${frontendApiResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Erro na requisição simulada: ${error.message}`);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('📋 RESUMO DO DEBUG:');
    console.log('Se tudo está ✅ mas o carrossel não aparece:');
    console.log('1. Verifique o console do navegador (F12)');
    console.log('2. Verifique a aba Network para requisições');
    console.log('3. Limpe o cache do navegador (Ctrl+Shift+Del)');
    console.log('4. Tente modo incógnito');
    console.log('5. Verifique se há erros JavaScript no console');
    
  } catch (error) {
    console.error('❌ Erro geral no debug:', error);
  }
}

debugCarouselRealTime();