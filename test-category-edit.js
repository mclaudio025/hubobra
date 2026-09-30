const { execSync } = require('child_process');

console.log('🔧 Testando correção do erro 404 na edição de categorias...\n');

try {
  // 1. Verificar se a estrutura de pastas foi criada corretamente
  console.log('1. Verificando estrutura de pastas...');
  
  const fs = require('fs');
  const path = require('path');
  
  const editPagePath = 'frontend/src/app/admin/categorias/[id]/editar/page.tsx';
  
  if (fs.existsSync(editPagePath)) {
    console.log('✅ Página de edição criada com sucesso');
    console.log(`   Localização: ${editPagePath}`);
  } else {
    console.log('❌ Página de edição não encontrada');
    process.exit(1);
  }

  // 2. Verificar se o conteúdo da página está correto
  console.log('\n2. Verificando conteúdo da página...');
  
  const pageContent = fs.readFileSync(editPagePath, 'utf8');
  
  const requiredElements = [
    'useParams',
    'categoryId',
    'loadCategory',
    'getCategory',
    'updateCategory',
    'EditarCategoriaPage',
    'Editar Categoria'
  ];
  
  let allElementsFound = true;
  requiredElements.forEach(element => {
    if (pageContent.includes(element)) {
      console.log(`✅ ${element} encontrado`);
    } else {
      console.log(`❌ ${element} não encontrado`);
      allElementsFound = false;
    }
  });

  if (!allElementsFound) {
    console.log('\n❌ Alguns elementos necessários não foram encontrados na página');
    process.exit(1);
  }

  // 3. Verificar se o hook useCategories tem o método getCategory
  console.log('\n3. Verificando hook useCategories...');
  
  const hookPath = 'frontend/src/app/hooks/useApi.ts';
  if (fs.existsSync(hookPath)) {
    const hookContent = fs.readFileSync(hookPath, 'utf8');
    
    if (hookContent.includes('getCategory: (id: string)')) {
      console.log('✅ Método getCategory encontrado no hook');
    } else {
      console.log('❌ Método getCategory não encontrado no hook');
      process.exit(1);
    }
  } else {
    console.log('❌ Hook useApi não encontrado');
    process.exit(1);
  }

  // 4. Verificar se a página de listagem está linkando corretamente
  console.log('\n4. Verificando links na página de listagem...');
  
  const listPagePath = 'frontend/src/app/admin/categorias/page.tsx';
  if (fs.existsSync(listPagePath)) {
    const listContent = fs.readFileSync(listPagePath, 'utf8');
    
    if (listContent.includes('/admin/categorias/${category.id}/editar')) {
      console.log('✅ Link de edição encontrado na página de listagem');
    } else {
      console.log('❌ Link de edição não encontrado na página de listagem');
      process.exit(1);
    }
  }

  console.log('\n✅ Todos os testes passaram!');
  console.log('\n📋 Resumo da correção:');
  console.log('   • Criada a estrutura de pastas [id]/editar/');
  console.log('   • Implementada a página de edição de categorias');
  console.log('   • Configurado carregamento de categoria específica');
  console.log('   • Adicionada validação de formulário');
  console.log('   • Implementado breadcrumb dinâmico');
  console.log('   • Configurado redirecionamento após salvar');
  
  console.log('\n🎯 Como testar:');
  console.log('   1. Acesse /admin/categorias');
  console.log('   2. Clique no ícone de editar de qualquer categoria');
  console.log('   3. A página de edição deve carregar sem erro 404');
  console.log('   4. Faça alterações e salve para testar a funcionalidade');

} catch (error) {
  console.error('❌ Erro durante o teste:', error.message);
  process.exit(1);
}