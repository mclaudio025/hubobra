const { execSync } = require('child_process');

console.log('🔍 Investigando problema dos produtos não aparecerem na loja...\n');

async function testProductsAPI() {
  try {
    console.log('1. Testando API de produtos...');
    
    // Testar endpoint de produtos
    const response = await fetch('http://localhost:8081/products?active=true&limit=10');
    
    if (!response.ok) {
      console.log(`❌ API de produtos retornou erro: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ API de produtos funcionando`);
    console.log(`   Total de produtos: ${data.products ? data.products.length : 0}`);
    
    if (data.products && data.products.length > 0) {
      console.log(`   Primeiro produto: ${data.products[0].name}`);
      console.log(`   Produto ativo: ${data.products[0].active}`);
      console.log(`   Produto em destaque: ${data.products[0].featured}`);
    } else {
      console.log('❌ Nenhum produto encontrado na API');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Erro ao testar API de produtos: ${error.message}`);
    return false;
  }
}

async function testComponentsConfig() {
  try {
    console.log('\n2. Testando configuração de componentes...');
    
    const response = await fetch('http://localhost:8081/components/config-public');
    
    if (!response.ok) {
      console.log(`❌ API de componentes retornou erro: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ API de componentes funcionando`);
    
    const featuredProductsComponent = data.find(c => c.id === 'featured-products');
    if (featuredProductsComponent) {
      console.log(`   Componente 'featured-products' encontrado`);
      console.log(`   Habilitado: ${featuredProductsComponent.enabled}`);
      console.log(`   Ordem: ${featuredProductsComponent.order}`);
    } else {
      console.log('❌ Componente featured-products não encontrado');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Erro ao testar configuração de componentes: ${error.message}`);
    return false;
  }
}

function checkFrontendFiles() {
  console.log('\n3. Verificando arquivos do frontend...');
  
  const fs = require('fs');
  
  const filesToCheck = [
    'frontend/src/app/page.tsx',
    'frontend/src/app/components/FeaturedProductsCarousel.tsx',
    'frontend/src/app/components/ProductCard.tsx',
    'frontend/src/app/hooks/useComponentsConfig.ts',
    'frontend/src/app/hooks/useApi.ts'
  ];
  
  let allFilesExist = true;
  
  filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} existe`);
    } else {
      console.log(`❌ ${file} não encontrado`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

function analyzePageStructure() {
  console.log('\n4. Analisando estrutura da página principal...');
  
  const fs = require('fs');
  const pageContent = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');
  
  // Verificar se os componentes estão sendo importados
  const imports = [
    'FeaturedProductsCarousel',
    'WeeklyOfferCarousel',
    'useComponentsConfig'
  ];
  
  imports.forEach(importName => {
    if (pageContent.includes(importName)) {
      console.log(`✅ ${importName} importado`);
    } else {
      console.log(`❌ ${importName} não importado`);
    }
  });
  
  // Verificar se o mapeamento de componentes está correto
  if (pageContent.includes("'featured-products': <FeaturedProductsCarousel")) {
    console.log('✅ FeaturedProductsCarousel mapeado corretamente');
  } else {
    console.log('❌ FeaturedProductsCarousel não mapeado ou mapeamento incorreto');
  }
  
  // Verificar se está usando getSortedEnabledComponents
  if (pageContent.includes('getSortedEnabledComponents')) {
    console.log('✅ Usando getSortedEnabledComponents');
  } else {
    console.log('❌ Não está usando getSortedEnabledComponents');
  }
}

function checkBackendComponents() {
  console.log('\n5. Verificando configuração do backend...');
  
  const fs = require('fs');
  const controllerContent = fs.readFileSync('backend-nestjs/src/components/components.controller.ts', 'utf8');
  
  // Verificar se featured-products está na configuração
  if (controllerContent.includes("'featured-products'")) {
    console.log('✅ featured-products configurado no backend');
  } else {
    console.log('❌ featured-products não configurado no backend');
  }
  
  // Verificar ordem dos componentes
  const orderMatches = controllerContent.match(/order: (\d+)/g);
  if (orderMatches) {
    console.log('✅ Ordens dos componentes encontradas:');
    orderMatches.forEach(match => {
      console.log(`   ${match}`);
    });
  }
}

async function main() {
  try {
    const apiWorking = await testProductsAPI();
    const componentsWorking = await testComponentsConfig();
    const filesExist = checkFrontendFiles();
    
    analyzePageStructure();
    checkBackendComponents();
    
    console.log('\n📋 Resumo do diagnóstico:');
    console.log(`   API de produtos: ${apiWorking ? '✅' : '❌'}`);
    console.log(`   API de componentes: ${componentsWorking ? '✅' : '❌'}`);
    console.log(`   Arquivos do frontend: ${filesExist ? '✅' : '❌'}`);
    
    if (!apiWorking) {
      console.log('\n🔧 Possíveis soluções:');
      console.log('   • Verificar se o backend está rodando');
      console.log('   • Verificar se existem produtos ativos no banco');
      console.log('   • Executar o seed do banco de dados');
    }
    
    if (!componentsWorking) {
      console.log('\n🔧 Possíveis soluções:');
      console.log('   • Verificar se o módulo ComponentsModule está registrado');
      console.log('   • Verificar se a rota /components/config-public está funcionando');
    }
    
    console.log('\n🎯 Próximos passos:');
    console.log('   1. Verificar se o backend está rodando na porta 8081');
    console.log('   2. Testar as APIs manualmente no navegador');
    console.log('   3. Verificar logs do console no frontend');
    console.log('   4. Verificar se há produtos cadastrados e ativos');
    
  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error.message);
  }
}

main();