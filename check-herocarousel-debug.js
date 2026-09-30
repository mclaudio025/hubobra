const http = require('http');
const fs = require('fs');
const path = require('path');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        resolve({ ok: response.statusCode === 200, text: () => data, json: () => JSON.parse(data) });
      });
    });
    request.on('error', reject);
    request.setTimeout(5000, () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

(async () => {
  try {
    console.log('🔍 Verificando sistema de banners e HeroCarousel...');
    
    // 1. Verificar se o frontend está respondendo
    console.log('\n1. 🌐 Testando frontend em http://localhost:3001...');
    try {
      const frontendResponse = await makeRequest('http://localhost:3001');
      if (frontendResponse.ok) {
        console.log('✅ Frontend está respondendo');
        const html = frontendResponse.text();
        
        // Verificar se o HeroCarousel está no HTML
        if (html.includes('hero-carousel') || html.includes('HeroCarousel')) {
          console.log('✅ HeroCarousel encontrado no HTML');
        } else {
          console.log('⚠️ HeroCarousel não encontrado no HTML');
        }
      } else {
        console.log('❌ Frontend não está respondendo corretamente');
      }
    } catch (error) {
      console.log('❌ Erro ao acessar frontend:', error.message);
    }
    
    // 2. Verificar API de banners
    console.log('\n2. 🎯 Testando API de banners...');
    try {
      const bannersResponse = await makeRequest('http://localhost:8081/banners?type=HERO');
      if (bannersResponse.ok) {
        const banners = bannersResponse.json();
        console.log('✅ API de banners funcionando');
        console.log(`📊 Banners HERO encontrados: ${banners.length}`);
        
        if (banners.length > 0) {
          console.log('\n📋 Detalhes dos banners:');
          banners.forEach((banner, index) => {
            console.log(`  ${index + 1}. ${banner.title} - Ativo: ${banner.isActive}`);
            if (banner.imageUrl) {
              console.log(`     Imagem: ${banner.imageUrl}`);
            }
          });
        }
      } else {
        console.log('❌ API de banners não está respondendo');
      }
    } catch (error) {
      console.log('❌ Erro ao acessar API de banners:', error.message);
    }
    
    // 3. Verificar se os logs de debug foram adicionados
    console.log('\n3. 🔍 Verificando logs de debug no HeroCarousel...');
    
    const heroCarouselPath = path.join(__dirname, 'frontend', 'src', 'app', 'components', 'HeroCarousel.tsx');
    
    if (fs.existsSync(heroCarouselPath)) {
      const content = fs.readFileSync(heroCarouselPath, 'utf8');
      
      if (content.includes('🔍 DEBUG_BANNERS')) {
        console.log('✅ Logs de debug encontrados no HeroCarousel');
        
        // Contar quantos logs de debug existem
        const debugMatches = content.match(/🔍 DEBUG_BANNERS/g);
        console.log(`📊 Número de logs de debug: ${debugMatches ? debugMatches.length : 0}`);
      } else {
        console.log('❌ Logs de debug NÃO encontrados no HeroCarousel');
        console.log('💡 Execute novamente: node debug-herocarousel-component.js');
      }
    } else {
      console.log('❌ Arquivo HeroCarousel.tsx não encontrado');
    }
    
    // 4. Verificar estrutura do projeto
    console.log('\n4. 📁 Verificando estrutura do projeto...');
    const frontendDir = path.join(__dirname, 'frontend');
    const componentsDir = path.join(frontendDir, 'src', 'app', 'components');
    
    console.log(`Frontend existe: ${fs.existsSync(frontendDir) ? '✅' : '❌'}`);
    console.log(`Diretório components existe: ${fs.existsSync(componentsDir) ? '✅' : '❌'}`);
    
    if (fs.existsSync(componentsDir)) {
      const files = fs.readdirSync(componentsDir);
      console.log('Arquivos em components:', files.join(', '));
    }
    
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Abra o navegador em http://localhost:3001');
    console.log('2. Abra o Console do Desenvolvedor (F12)');
    console.log('3. Procure por mensagens que começam com "🔍 DEBUG_BANNERS"');
    console.log('4. Verifique se o carrossel está visível na página');
    console.log('5. Se não houver logs, recarregue a página (F5)');
    
    console.log('\n✅ Verificação concluída.');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
  }
})();