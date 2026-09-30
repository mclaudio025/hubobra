const axios = require('axios');

const BASE_URL = 'http://localhost:8081';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testPriceManagement() {
  log('💰 Testando Sistema de Gestão de Preços\n', 'cyan');

  try {
    // 1. Testar relatório de preços
    log('📊 Testando relatório de preços...', 'yellow');
    const reportResponse = await axios.get(`${BASE_URL}/price-management/report`);
    
    if (reportResponse.status === 200) {
      const report = reportResponse.data;
      log(`✅ Relatório gerado com sucesso!`, 'green');
      log(`   📦 Total de produtos: ${report.stats.totalProducts}`, 'white');
      log(`   💵 Preço médio: R$ ${report.stats.averagePrice.toFixed(2)}`, 'white');
      log(`   🏷️ Com promoção: ${report.stats.productsWithPromotion}`, 'white');
      log(`   ⚠️ Sem estoque: ${report.stats.outOfStock}`, 'white');
    }

    // 2. Testar atualização individual (se houver produtos)
    if (reportResponse.data.products.length > 0) {
      const firstProduct = reportResponse.data.products[0];
      log(`\n🔧 Testando atualização individual...`, 'yellow');
      log(`   Produto: ${firstProduct.name}`, 'white');
      log(`   Preço atual: R$ ${firstProduct.price.toFixed(2)}`, 'white');
      
      const newPrice = firstProduct.price * 1.1; // Aumentar 10%
      
      const updateResponse = await axios.post(`${BASE_URL}/price-management/update-single`, {
        productId: firstProduct.id,
        newPrice: newPrice,
        reason: 'Teste de atualização individual'
      });

      if (updateResponse.status === 200) {
        log(`✅ Preço atualizado com sucesso!`, 'green');
        log(`   Novo preço: R$ ${newPrice.toFixed(2)}`, 'white');
      }
    }

    // 3. Testar atualização em massa por categoria
    log(`\n📈 Testando atualização em massa...`, 'yellow');
    
    const bulkUpdateResponse = await axios.post(`${BASE_URL}/price-management/bulk-update`, {
      updateType: 'percentage',
      value: 5, // Aumentar 5%
      reason: 'Teste de atualização em massa - aumento de 5%',
      applyToPromotional: false
    });

    if (bulkUpdateResponse.status === 200) {
      const result = bulkUpdateResponse.data;
      log(`✅ Atualização em massa concluída!`, 'green');
      log(`   Produtos atualizados: ${result.updatedCount}`, 'white');
      log(`   Mensagem: ${result.message}`, 'white');
    }

    // 4. Testar exportação para Excel
    log(`\n📄 Testando exportação para Excel...`, 'yellow');
    
    const exportResponse = await axios.get(`${BASE_URL}/price-management/export/excel`, {
      responseType: 'arraybuffer'
    });

    if (exportResponse.status === 200) {
      log(`✅ Arquivo Excel gerado com sucesso!`, 'green');
      log(`   Tamanho: ${exportResponse.data.byteLength} bytes`, 'white');
    }

    // 5. Verificar histórico de preços (se houver produtos)
    if (reportResponse.data.products.length > 0) {
      const firstProduct = reportResponse.data.products[0];
      log(`\n📜 Testando histórico de preços...`, 'yellow');
      
      const historyResponse = await axios.get(`${BASE_URL}/price-management/history/${firstProduct.id}?limit=5`);
      
      if (historyResponse.status === 200) {
        const history = historyResponse.data;
        log(`✅ Histórico recuperado com sucesso!`, 'green');
        log(`   Registros encontrados: ${history.length}`, 'white');
        
        if (history.length > 0) {
          log(`   Última alteração:`, 'white');
          log(`     De: R$ ${history[0].oldPrice.toFixed(2)}`, 'white');
          log(`     Para: R$ ${history[0].newPrice.toFixed(2)}`, 'white');
          log(`     Motivo: ${history[0].reason}`, 'white');
        }
      }
    }

    log('\n🎉 Todos os testes concluídos com sucesso!', 'green');

  } catch (error) {
    log(`❌ Erro durante os testes: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Dados: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

async function showUsageExamples() {
  log('📋 Exemplos de Uso do Sistema de Gestão de Preços\n', 'cyan');
  
  log('1. 📊 Gerar Relatório:', 'yellow');
  log('   GET /price-management/report', 'white');
  log('   GET /price-management/report?categoryId=uuid', 'white');
  log('   GET /price-management/report?priceRange[min]=10&priceRange[max]=100', 'white');
  
  log('\n2. 🔧 Atualização Individual:', 'yellow');
  log('   POST /price-management/update-single', 'white');
  log('   Body: { "productId": "uuid", "newPrice": 99.90, "reason": "Ajuste de margem" }', 'white');
  
  log('\n3. 📈 Atualização em Massa:', 'yellow');
  log('   POST /price-management/bulk-update', 'white');
  log('   Body: { "updateType": "percentage", "value": 10, "reason": "Reajuste geral" }', 'white');
  log('   Body: { "categoryId": "uuid", "updateType": "fixed", "value": 50.00, "reason": "Promoção" }', 'white');
  
  log('\n4. 📄 Exportar/Importar:', 'yellow');
  log('   GET /price-management/export/excel', 'white');
  log('   POST /price-management/import/excel (FormData com arquivo)', 'white');
  
  log('\n5. 📜 Histórico:', 'yellow');
  log('   GET /price-management/history/:productId', 'white');
  log('   GET /price-management/history/:productId?limit=10', 'white');
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'test':
      await testPriceManagement();
      break;
    case 'examples':
      await showUsageExamples();
      break;
    default:
      log('💰 Sistema de Gestão de Preços\n', 'cyan');
      log('Comandos disponíveis:', 'white');
      log('  node test-price-management.js test      # Executar testes', 'cyan');
      log('  node test-price-management.js examples  # Ver exemplos de uso', 'cyan');
      break;
  }
}

main().catch(console.error);