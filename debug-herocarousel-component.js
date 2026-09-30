// Script para adicionar logs de debug no componente HeroCarousel

const fs = require('fs');
const path = require('path');

function addDebugToHeroCarousel() {
  console.log('🔧 Adicionando logs de debug ao componente HeroCarousel...');
  
  const componentPath = path.join(__dirname, 'frontend', 'src', 'app', 'components', 'HeroCarousel.tsx');
  
  if (!fs.existsSync(componentPath)) {
    console.log('❌ Arquivo HeroCarousel.tsx não encontrado:', componentPath);
    return;
  }
  
  let content = fs.readFileSync(componentPath, 'utf8');
  
  // Verificar se já tem debug
  if (content.includes('DEBUG_BANNERS')) {
    console.log('⚠️  Debug já foi adicionado anteriormente');
    return;
  }
  
  // Adicionar logs de debug
  const debugCode = `
  // DEBUG: Logs para investigar o problema dos banners
  useEffect(() => {
    console.log('🔍 DEBUG_BANNERS: Estado atual dos banners:', {
      loading,
      bannersLength: banners.length,
      banners: banners.map(b => ({
        id: b.id,
        title: b.title,
        imageUrl: b.imageUrl,
        hasImage: !!b.imageUrl
      }))
    });
  }, [banners, loading]);
`;
  
  // Inserir o debug após a declaração do bannersApi
  const insertPoint = 'const bannersApi = useBanners();';
  const insertIndex = content.indexOf(insertPoint);
  
  if (insertIndex === -1) {
    console.log('❌ Não foi possível encontrar o ponto de inserção');
    return;
  }
  
  const insertPosition = insertIndex + insertPoint.length;
  let newContent = content.slice(0, insertPosition) + debugCode + content.slice(insertPosition);
  
  // Adicionar debug na função loadHeroBanners
  newContent = newContent.replace(
    'const loadHeroBanners = async () => {',
    `const loadHeroBanners = async () => {
    console.log('🔍 DEBUG_BANNERS: Iniciando loadHeroBanners...');`
  );
  
  newContent = newContent.replace(
    'setBanners(response || []);',
    `console.log('🔍 DEBUG_BANNERS: Resposta da API:', response);
      setBanners(response || []);
      console.log('🔍 DEBUG_BANNERS: Banners definidos no estado');`
  );
  
  newContent = newContent.replace(
    'console.error(\'Erro ao carregar banners hero:\', error);',
    `console.error('❌ DEBUG_BANNERS: Erro ao carregar banners hero:', error);
      console.log('🔍 DEBUG_BANNERS: Usando banners de fallback');`
  );
  
  // Salvar o arquivo modificado
  fs.writeFileSync(componentPath, newContent);
  
  console.log('✅ Debug adicionado ao componente HeroCarousel');
  console.log('📋 Agora você pode:');
  console.log('1. Abrir http://localhost:3001 no navegador');
  console.log('2. Pressionar F12 e ir para Console');
  console.log('3. Recarregar a página');
  console.log('4. Procurar por mensagens que começam com "🔍 DEBUG_BANNERS"');
}

function removeDebugFromHeroCarousel() {
  console.log('🧹 Removendo logs de debug do componente HeroCarousel...');
  
  const componentPath = path.join(__dirname, 'frontend', 'src', 'app', 'components', 'HeroCarousel.tsx');
  
  if (!fs.existsSync(componentPath)) {
    console.log('❌ Arquivo HeroCarousel.tsx não encontrado:', componentPath);
    return;
  }
  
  let content = fs.readFileSync(componentPath, 'utf8');
  
  // Remover o bloco de debug principal
  const debugStart = '  // DEBUG: Logs para investigar o problema dos banners';
  const debugEnd = '  }, [banners, loading]);';
  
  const startIndex = content.indexOf(debugStart);
  if (startIndex !== -1) {
    const endIndex = content.indexOf(debugEnd, startIndex) + debugEnd.length;
    content = content.slice(0, startIndex) + content.slice(endIndex + 1);
  }
  
  // Remover logs específicos usando replace simples
  content = content.replace(
    `console.log('🔍 DEBUG_BANNERS: Iniciando loadHeroBanners...');`,
    ''
  );
  
  content = content.replace(
    `console.log('🔍 DEBUG_BANNERS: Resposta da API:', response);
      setBanners(response || []);
      console.log('🔍 DEBUG_BANNERS: Banners definidos no estado');`,
    'setBanners(response || []);'
  );
  
  content = content.replace(
    `console.error('❌ DEBUG_BANNERS: Erro ao carregar banners hero:', error);
      console.log('🔍 DEBUG_BANNERS: Usando banners de fallback');`,
    `console.error('Erro ao carregar banners hero:', error);`
  );
  
  fs.writeFileSync(componentPath, content);
  
  console.log('✅ Debug removido do componente HeroCarousel');
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.includes('--remove')) {
  removeDebugFromHeroCarousel();
} else {
  addDebugToHeroCarousel();
  console.log('\n💡 Para remover o debug depois, execute:');
  console.log('   node debug-herocarousel-component.js --remove');
}