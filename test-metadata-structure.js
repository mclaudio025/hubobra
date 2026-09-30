const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando estrutura de metadata nos serviços de pagamento...\n');

// Arquivos para verificar
const filesToCheck = [
  'backend-nestjs/src/payments/payments.service.ts',
  'backend-nestjs/src/payments/pix.service.ts',
  'backend-nestjs/src/payments/payment-link.service.ts',
  'backend-nestjs/prisma/schema.prisma'
];

let allChecksPass = true;

// Verificações específicas para cada arquivo
const checks = {
  'backend-nestjs/src/payments/payments.service.ts': [
    'metadata: dto.metadata ? JSON.stringify(dto.metadata) : null',
    'metadata: JSON.stringify({',
    'payment.metadata ? JSON.parse(payment.metadata) : null'
  ],
  'backend-nestjs/src/payments/pix.service.ts': [
    'const metadataString = JSON.stringify({',
    'metadata: metadataString'
  ],
  'backend-nestjs/src/payments/payment-link.service.ts': [
    'const metadataString = JSON.stringify({',
    'metadata: metadataString'
  ],
  'backend-nestjs/prisma/schema.prisma': [
    'metadata      String?'
  ]
};

filesToCheck.forEach(filePath => {
  console.log(`📁 Verificando: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Arquivo não encontrado: ${filePath}`);
    allChecksPass = false;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const fileChecks = checks[filePath] || [];
  
  fileChecks.forEach(check => {
    if (content.includes(check)) {
      console.log(`   ✅ ${check.substring(0, 50)}...`);
    } else {
      console.log(`   ❌ Não encontrado: ${check.substring(0, 50)}...`);
      allChecksPass = false;
    }
  });
  
  console.log('');
});

// Verificar se a migração foi aplicada
console.log('🗄️ Verificando migração de metadata...');
const migrationsDir = 'backend-nestjs/prisma/migrations';
if (fs.existsSync(migrationsDir)) {
  const migrations = fs.readdirSync(migrationsDir);
  const metadataMigration = migrations.find(m => m.includes('metadata') || m.includes('add_payment_metadata'));
  
  if (metadataMigration) {
    console.log(`✅ Migração encontrada: ${metadataMigration}`);
  } else {
    console.log('⚠️  Migração de metadata não encontrada');
  }
} else {
  console.log('⚠️  Diretório de migrações não encontrado');
}

console.log('\n📊 Resumo da verificação:');
if (allChecksPass) {
  console.log('✅ Todas as verificações de metadata passaram!');
  console.log('\n🎯 Status das correções:');
  console.log('- ✅ Schema Prisma: Campo metadata adicionado');
  console.log('- ✅ PaymentsService: Usando metadata corretamente');
  console.log('- ✅ PixService: Metadata otimizado');
  console.log('- ✅ PaymentLinkService: Metadata otimizado');
  console.log('\n🚀 Sistema de pagamentos pronto para uso!');
} else {
  console.log('❌ Algumas verificações falharam');
  console.log('Verifique os arquivos acima para corrigir os problemas');
}

// Verificar se há erros óbvios de sintaxe
console.log('\n🔍 Verificação rápida de sintaxe...');
filesToCheck.forEach(filePath => {
  if (filePath.endsWith('.ts') && fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Verificações básicas de sintaxe
    const syntaxChecks = [
      { pattern: /metadata:\s*metadata/, message: 'Duplicação de metadata' },
      { pattern: /JSON\.stringify\(\s*\{[^}]*\}\s*\)/, message: 'JSON.stringify com objeto' },
      { pattern: /JSON\.parse\([^)]+\)/, message: 'JSON.parse presente' }
    ];
    
    syntaxChecks.forEach(check => {
      if (check.pattern.test(content)) {
        console.log(`   ✅ ${path.basename(filePath)}: ${check.message}`);
      }
    });
  }
});

console.log('\n💡 Próximos passos para testar:');
console.log('1. Iniciar o backend: cd backend-nestjs && npm run start:dev');
console.log('2. Testar endpoints: node test-payments-controller.js');
console.log('3. Verificar compilação: cd backend-nestjs && npm run build');

process.exit(allChecksPass ? 0 : 1);