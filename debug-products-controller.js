const fs = require('fs');
const path = require('path');

console.log('🔍 Debugando ProductsController...\n');

// Verificar se todos os arquivos necessários existem
const filesToCheck = [
  'backend-nestjs/src/products/products.controller.ts',
  'backend-nestjs/src/products/products.service.ts',
  'backend-nestjs/src/products/products.module.ts',
  'backend-nestjs/src/products/dto/create-product.dto.ts',
  'backend-nestjs/src/products/dto/update-product.dto.ts',
  'backend-nestjs/src/products/dto/bulk-create-product.dto.ts',
  'backend-nestjs/src/cache/cache.decorator.ts'
];

console.log('📁 Verificando arquivos necessários:');
for (const file of filesToCheck) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - ARQUIVO NÃO ENCONTRADO!`);
  }
}

// Verificar se o ProductsModule está sendo importado corretamente
console.log('\n📦 Verificando importação do ProductsModule no app.module.ts:');
const appModuleContent = fs.readFileSync('backend-nestjs/src/app.module.ts', 'utf8');

if (appModuleContent.includes('ProductsModule')) {
  console.log('✅ ProductsModule está importado');
  
  // Verificar se está na lista de imports
  if (appModuleContent.includes('imports: [') && appModuleContent.includes('ProductsModule,')) {
    console.log('✅ ProductsModule está na lista de imports');
  } else {
    console.log('❌ ProductsModule NÃO está na lista de imports');
  }
} else {
  console.log('❌ ProductsModule NÃO está importado');
}

// Verificar se há erros de sintaxe óbvios no controller
console.log('\n🔧 Verificando sintaxe do ProductsController:');
const controllerContent = fs.readFileSync('backend-nestjs/src/products/products.controller.ts', 'utf8');

const syntaxChecks = [
  { check: '@Controller(\'products\')', name: 'Decorator @Controller' },
  { check: 'export class ProductsController', name: 'Declaração da classe' },
  { check: '@Get()', name: 'Decorator @Get para findAll' },
  { check: 'findAll(', name: 'Método findAll' }
];

for (const { check, name } of syntaxChecks) {
  if (controllerContent.includes(check)) {
    console.log(`✅ ${name}`);
  } else {
    console.log(`❌ ${name} - NÃO ENCONTRADO!`);
  }
}

// Verificar se há problemas com as importações
console.log('\n📥 Verificando importações do ProductsController:');
const imports = controllerContent.match(/import.*from.*['"].*['"];/g) || [];
console.log(`Encontradas ${imports.length} importações:`);
imports.forEach((imp, index) => {
  console.log(`  ${index + 1}. ${imp}`);
});

console.log('\n🎯 Diagnóstico concluído!');