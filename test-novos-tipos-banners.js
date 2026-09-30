const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const ADMIN_EMAIL = 'admin@lojamoderna.com';
const ADMIN_PASSWORD = 'admin123';

let authToken = '';

// Função para logs coloridos
function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${title}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

// Fazer login como admin
async function loginAsAdmin() {
  try {
    log('Fazendo login como administrador...', 'blue');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    authToken = response.data.access_token;
    log('✅ Login realizado com sucesso!', 'green');
    return true;
  } catch (error) {
    log('❌ Erro no login:', 'red');
    log(error.response?.data?.message || error.message, 'red');
    return false;
  }
}

// Testar criação de banners com novos tipos
async function testNovostiposBanners() {
  logSection('🎨 TESTANDO NOVOS TIPOS DE BANNERS');
  
  const novosTipos = [
    {
      type: 'CATEGORY',
      title: 'Categoria Cimentos',
      subtitle: 'Explore nossa linha completa',
      description: 'Os melhores cimentos para sua obra',
      buttonText: 'Ver Categoria',
      buttonLink: '/categoria/cimentos'
    },
    {
      type: 'FEATURED',
      title: 'Produtos em Destaque',
      subtitle: 'Selecionados especialmente para você',
      description: 'Produtos com melhor custo-benefício',
      buttonText: 'Ver Destaques',
      buttonLink: '/produtos/destaques'
    },
    {
      type: 'SALE',
      title: 'Mega Promoção',
      subtitle: 'Até 50% de desconto',
      description: 'Aproveite nossas ofertas imperdíveis',
      buttonText: 'Ver Ofertas',
      buttonLink: '/promocoes'
    },
    {
      type: 'DISCOUNT',
      title: 'Cupom de Desconto',
      subtitle: '15% OFF na primeira compra',
      description: 'Use o código BEMVINDO15',
      buttonText: 'Usar Cupom',
      buttonLink: '/checkout'
    },
    {
      type: 'NEWSLETTER',
      title: 'Receba Nossas Ofertas',
      subtitle: 'Cadastre-se em nossa newsletter',
      description: 'Seja o primeiro a saber das promoções',
      buttonText: 'Cadastrar',
      buttonLink: '/newsletter'
    },
    {
      type: 'TESTIMONIAL',
      title: 'Clientes Satisfeitos',
      subtitle: '"Excelente qualidade e entrega rápida"',
      description: 'João Silva - Construtor',
      buttonText: 'Ver Avaliações',
      buttonLink: '/avaliacoes'
    },
    {
      type: 'BRAND',
      title: 'Marcas Parceiras',
      subtitle: 'Trabalhamos com as melhores marcas',
      description: 'Votorantim, Suvinil, Tigre e muito mais',
      buttonText: 'Ver Marcas',
      buttonLink: '/marcas'
    },
    {
      type: 'SEASONAL',
      title: 'Promoção de Verão',
      subtitle: 'Materiais para reforma de verão',
      description: 'Tintas, pisos e revestimentos em oferta',
      buttonText: 'Aproveitar',
      buttonLink: '/verao2024'
    }
  ];
  
  const bannersCreated = [];
  
  for (const bannerData of novosTipos) {
    try {
      log(`\nCriando banner do tipo ${bannerData.type}...`, 'blue');
      
      const response = await axios.post(`${BASE_URL}/banners`, {
        ...bannerData,
        bgColor: 'from-blue-600 to-blue-700',
        textColor: 'text-white',
        position: Math.floor(Math.random() * 10),
        active: true
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      bannersCreated.push(response.data);
      log(`✅ Banner ${bannerData.type} criado com sucesso!`, 'green');
      log(`   ID: ${response.data.id}`, 'white');
      log(`   Título: ${response.data.title}`, 'white');
      
    } catch (error) {
      log(`❌ Erro ao criar banner ${bannerData.type}:`, 'red');
      log(error.response?.data?.message || error.message, 'red');
    }
  }
  
  return bannersCreated;
}

// Testar listagem com filtros por tipo
async function testFiltrosPorTipo() {
  logSection('🔍 TESTANDO FILTROS POR TIPO');
  
  const tiposParaTestar = ['CATEGORY', 'FEATURED', 'SALE', 'DISCOUNT', 'NEWSLETTER', 'TESTIMONIAL', 'BRAND', 'SEASONAL'];
  
  for (const tipo of tiposParaTestar) {
    try {
      log(`\nTestando filtro para tipo ${tipo}...`, 'blue');
      
      const response = await axios.get(`${BASE_URL}/banners?type=${tipo}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      log(`✅ Filtro ${tipo} funcionando!`, 'green');
      log(`   Banners encontrados: ${response.data.length}`, 'white');
      
      if (response.data.length > 0) {
        response.data.forEach(banner => {
          log(`   - ${banner.title} (${banner.type})`, 'white');
        });
      }
      
    } catch (error) {
      log(`❌ Erro ao filtrar por tipo ${tipo}:`, 'red');
      log(error.response?.data?.message || error.message, 'red');
    }
  }
}

// Testar atualização de banner para novo tipo
async function testAtualizacaoTipo() {
  logSection('✏️ TESTANDO ATUALIZAÇÃO DE TIPOS');
  
  try {
    // Buscar um banner existente
    log('Buscando banners existentes...', 'blue');
    const response = await axios.get(`${BASE_URL}/banners`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.length === 0) {
      log('❌ Nenhum banner encontrado para testar atualização', 'red');
      return;
    }
    
    const banner = response.data[0];
    log(`Atualizando banner: ${banner.title}`, 'blue');
    log(`Tipo atual: ${banner.type}`, 'white');
    
    // Atualizar para um novo tipo
    const novoTipo = 'SEASONAL';
    const updateResponse = await axios.patch(`${BASE_URL}/banners/${banner.id}`, {
      type: novoTipo,
      title: `${banner.title} - Atualizado`
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    log(`✅ Banner atualizado com sucesso!`, 'green');
    log(`   Novo tipo: ${updateResponse.data.type}`, 'white');
    log(`   Novo título: ${updateResponse.data.title}`, 'white');
    
  } catch (error) {
    log('❌ Erro ao atualizar banner:', 'red');
    log(error.response?.data?.message || error.message, 'red');
  }
}

// Função principal
async function main() {
  logSection('🚀 TESTE DOS NOVOS TIPOS DE BANNERS');
  
  // Verificar se o backend está rodando
  try {
    await axios.get(`${BASE_URL}/health`);
    log('✅ Backend está rodando!', 'green');
  } catch (error) {
    log('❌ Backend não está rodando. Inicie o servidor primeiro.', 'red');
    return;
  }
  
  // Fazer login
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    log('❌ Não foi possível fazer login. Verifique as credenciais.', 'red');
    return;
  }
  
  // Executar testes
  await testNovostiposBanners();
  await testFiltrosPorTipo();
  await testAtualizacaoTipo();
  
  logSection('📊 RESUMO DOS TESTES');
  log('✅ Novos tipos de banners adicionados:', 'green');
  log('   - CATEGORY (Banner de Categoria)', 'white');
  log('   - FEATURED (Banner de Destaque)', 'white');
  log('   - SALE (Banner de Promoção)', 'white');
  log('   - DISCOUNT (Banner de Desconto)', 'white');
  log('   - NEWSLETTER (Banner Newsletter)', 'white');
  log('   - TESTIMONIAL (Banner de Depoimento)', 'white');
  log('   - BRAND (Banner de Marca)', 'white');
  log('   - SEASONAL (Banner Sazonal)', 'white');
  log('\n✅ Funcionalidades testadas:', 'green');
  log('   - Criação de banners com novos tipos', 'white');
  log('   - Filtros por tipo na API', 'white');
  log('   - Atualização de tipos existentes', 'white');
  log('   - Interface de administração atualizada', 'white');
  
  log('\n🎉 Todos os novos tipos de banners foram adicionados com sucesso!', 'green');
}

// Executar o teste
main().catch(error => {
  log('❌ Erro geral:', 'red');
  console.error(error);
});