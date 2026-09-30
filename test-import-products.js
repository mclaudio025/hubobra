const axios = require('axios');
const fs = require('fs');
const XLSX = require('xlsx');

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

// Dados de exemplo para materiais de construção
const sampleProducts = [
  {
    name: 'Cimento Portland CP II-E 32 50kg',
    price: 25.90,
    category: 'Cimentos',
    subcategory: 'Cimento Portland',
    brand: 'Votorantim',
    description: 'Cimento Portland composto com escória, ideal para uso geral em construção civil',
    specifications: 'Resistência: 32 MPa aos 28 dias. Norma: NBR 11578. Composição: Clínquer + escória + gesso',
    stock: 100,
    sku: 'CIM-CP2-50KG-001',
    barcode: '7891234567890',
    weight: 50,
    dimensions: '60x40x10 cm',
    images: 'https://exemplo.com/cimento1.jpg|https://exemplo.com/cimento2.jpg',
    tags: 'cimento,construção,portland,50kg',
    active: true
  },
  {
    name: 'Tijolo Cerâmico 6 Furos 9x14x19cm',
    price: 0.45,
    category: 'Tijolos e Blocos',
    subcategory: 'Tijolo Cerâmico',
    brand: 'Cerâmica São João',
    description: 'Tijolo cerâmico de 6 furos para alvenaria de vedação',
    specifications: 'Dimensões: 9x14x19cm. Resistência à compressão: 3,0 MPa. Absorção de água: 22%',
    stock: 5000,
    sku: 'TIJ-CER-6F-001',
    barcode: '7891234567891',
    weight: 2.5,
    dimensions: '19x14x9 cm',
    images: 'https://exemplo.com/tijolo1.jpg',
    tags: 'tijolo,cerâmico,alvenaria,vedação',
    active: true
  },
  {
    name: 'Tinta Acrílica Premium Branco 18L',
    price: 89.90,
    category: 'Tintas',
    subcategory: 'Tinta Acrílica',
    brand: 'Suvinil',
    description: 'Tinta acrílica premium para paredes internas e externas',
    specifications: 'Rendimento: 200-250 m²/L. Secagem: 30 min ao toque. Diluição: até 20% com água',
    stock: 50,
    sku: 'TIN-ACR-BR-18L-001',
    barcode: '7891234567892',
    weight: 20,
    dimensions: '25x25x35 cm',
    images: 'https://exemplo.com/tinta1.jpg|https://exemplo.com/tinta2.jpg',
    tags: 'tinta,acrílica,branco,parede',
    active: true
  },
  {
    name: 'Areia Média Lavada - m³',
    price: 45.00,
    category: 'Areia e Pedra',
    subcategory: 'Areia',
    brand: 'Mineração ABC',
    description: 'Areia média lavada para construção civil, ideal para argamassa e concreto',
    specifications: 'Granulometria: 0,6 a 2,0mm. Módulo de finura: 2,4. Livre de impurezas',
    stock: 200,
    sku: 'ARE-MED-LAV-M3-001',
    barcode: '7891234567893',
    weight: 1600,
    dimensions: '1x1x1 m',
    images: 'https://exemplo.com/areia1.jpg',
    tags: 'areia,construção,argamassa,concreto',
    active: true
  },
  {
    name: 'Ferro 10mm CA-50 12m',
    price: 28.50,
    category: 'Ferragens',
    subcategory: 'Ferro para Construção',
    brand: 'Gerdau',
    description: 'Barra de ferro CA-50 de 10mm para estruturas de concreto armado',
    specifications: 'Diâmetro: 10mm. Comprimento: 12m. Categoria: CA-50. Resistência: 500 MPa',
    stock: 300,
    sku: 'FER-10MM-CA50-12M-001',
    barcode: '7891234567894',
    weight: 7.4,
    dimensions: '1200x1x1 cm',
    images: 'https://exemplo.com/ferro1.jpg',
    tags: 'ferro,construção,ca50,estrutura',
    active: true
  },
  {
    name: 'Telha Cerâmica Portuguesa',
    price: 1.25,
    category: 'Telhas',
    subcategory: 'Telha Cerâmica',
    brand: 'Cerâmica Martins',
    description: 'Telha cerâmica modelo português para cobertura residencial',
    specifications: 'Dimensões: 46x24cm. Rendimento: 15 telhas/m². Absorção: 12%',
    stock: 2000,
    sku: 'TEL-CER-PORT-001',
    barcode: '7891234567895',
    weight: 2.8,
    dimensions: '46x24x2 cm',
    images: 'https://exemplo.com/telha1.jpg',
    tags: 'telha,cerâmica,cobertura,portuguesa',
    active: true
  },
  {
    name: 'Piso Cerâmico 45x45cm Bege',
    price: 18.90,
    category: 'Pisos e Revestimentos',
    subcategory: 'Piso Cerâmico',
    brand: 'Portobello',
    description: 'Piso cerâmico esmaltado 45x45cm cor bege para ambientes internos',
    specifications: 'Dimensões: 45x45cm. PEI: 4. Absorção: 3%. Antiderrapante',
    stock: 500,
    sku: 'PIS-CER-45X45-BEG-001',
    barcode: '7891234567896',
    weight: 1.8,
    dimensions: '45x45x0.8 cm',
    images: 'https://exemplo.com/piso1.jpg|https://exemplo.com/piso2.jpg',
    tags: 'piso,cerâmico,bege,interno',
    active: true
  },
  {
    name: 'Torneira Cromada 1/2" Mesa',
    price: 45.90,
    category: 'Hidráulica',
    subcategory: 'Torneiras',
    brand: 'Deca',
    description: 'Torneira cromada de mesa 1/2" para pia de cozinha',
    specifications: 'Rosca: 1/2". Acabamento: Cromado. Garantia: 5 anos',
    stock: 80,
    sku: 'TOR-CRO-12-MES-001',
    barcode: '7891234567897',
    weight: 0.8,
    dimensions: '15x10x20 cm',
    images: 'https://exemplo.com/torneira1.jpg',
    tags: 'torneira,cromada,cozinha,mesa',
    active: true
  },
  {
    name: 'Fio Elétrico 2,5mm² 100m',
    price: 89.90,
    category: 'Elétrica',
    subcategory: 'Fios e Cabos',
    brand: 'Pirelli',
    description: 'Fio elétrico flexível 2,5mm² para instalações residenciais',
    specifications: 'Seção: 2,5mm². Isolação: PVC. Tensão: 750V. Comprimento: 100m',
    stock: 150,
    sku: 'FIO-ELE-25MM-100M-001',
    barcode: '7891234567898',
    weight: 2.1,
    dimensions: '30x30x15 cm',
    images: 'https://exemplo.com/fio1.jpg',
    tags: 'fio,elétrico,instalação,residencial',
    active: true
  },
  {
    name: 'Porta de Madeira 80x210cm',
    price: 189.90,
    category: 'Madeiras',
    subcategory: 'Portas',
    brand: 'Madeireira Silva',
    description: 'Porta de madeira maciça 80x210cm para ambientes internos',
    specifications: 'Dimensões: 80x210cm. Espessura: 3,5cm. Madeira: Pinus tratado',
    stock: 25,
    sku: 'POR-MAD-80X210-001',
    barcode: '7891234567899',
    weight: 25,
    dimensions: '80x210x3.5 cm',
    images: 'https://exemplo.com/porta1.jpg|https://exemplo.com/porta2.jpg',
    tags: 'porta,madeira,interna,pinus',
    active: true
  }
];

async function createTestFile() {
  log('📄 Criando arquivo de teste para importação...', 'blue');
  
  try {
    const worksheet = XLSX.utils.json_to_sheet(sampleProducts);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');
    
    const filename = 'test-import-products.xlsx';
    XLSX.writeFile(workbook, filename);
    
    log(`✅ Arquivo criado: ${filename}`, 'green');
    log(`   📦 ${sampleProducts.length} produtos de exemplo`, 'white');
    log(`   🏗️ Categorias: ${[...new Set(sampleProducts.map(p => p.category))].length}`, 'white');
    
    return filename;
  } catch (error) {
    log(`❌ Erro ao criar arquivo: ${error.message}`, 'red');
    throw error;
  }
}

async function testImport(filename) {
  log('\n📤 Testando importação de produtos...', 'blue');
  
  try {
    const FormData = require('form-data');
    const form = new FormData();
    
    form.append('file', fs.createReadStream(filename));
    form.append('options', JSON.stringify({
      updateExisting: true,
      createCategories: true,
      skipErrors: true,
      batchSize: 100
    }));
    
    const response = await axios.post(`${BASE_URL}/products/import`, form, {
      headers: {
        ...form.getHeaders(),
        // 'Authorization': 'Bearer your-token-here'
      },
      timeout: 30000
    });
    
    if (response.status === 201) {
      const result = response.data;
      
      log('✅ Importação concluída!', 'green');
      log(`   📦 Sucessos: ${result.success}`, 'green');
      log(`   ❌ Erros: ${result.errors.length}`, result.errors.length > 0 ? 'red' : 'white');
      log(`   ⚠️ Avisos: ${result.warnings.length}`, result.warnings.length > 0 ? 'yellow' : 'white');
      log(`   💬 Mensagem: ${result.message}`, 'white');
      
      if (result.errors.length > 0) {
        log('\n❌ Erros encontrados:', 'red');
        result.errors.slice(0, 5).forEach(error => {
          log(`   Linha ${error.row}: ${error.message}`, 'red');
        });
        if (result.errors.length > 5) {
          log(`   ... e mais ${result.errors.length - 5} erros`, 'red');
        }
      }
      
      if (result.warnings.length > 0) {
        log('\n⚠️ Avisos encontrados:', 'yellow');
        result.warnings.slice(0, 5).forEach(warning => {
          log(`   Linha ${warning.row}: ${warning.message}`, 'yellow');
        });
        if (result.warnings.length > 5) {
          log(`   ... e mais ${result.warnings.length - 5} avisos`, 'yellow');
        }
      }
      
      return result;
    }
    
  } catch (error) {
    if (error.response) {
      log(`❌ Erro HTTP ${error.response.status}: ${error.response.data?.message || error.message}`, 'red');
    } else {
      log(`❌ Erro: ${error.message}`, 'red');
    }
    throw error;
  }
}

async function testTemplate() {
  log('\n📋 Testando download do template...', 'blue');
  
  try {
    const response = await axios.get(`${BASE_URL}/products/import/template`, {
      responseType: 'arraybuffer',
      headers: {
        // 'Authorization': 'Bearer your-token-here'
      }
    });
    
    if (response.status === 200) {
      const filename = 'template-downloaded.xlsx';
      fs.writeFileSync(filename, response.data);
      
      log('✅ Template baixado com sucesso!', 'green');
      log(`   📄 Arquivo: ${filename}`, 'white');
      log(`   📊 Tamanho: ${response.data.byteLength} bytes`, 'white');
      
      return filename;
    }
    
  } catch (error) {
    log(`❌ Erro ao baixar template: ${error.message}`, 'red');
    throw error;
  }
}

async function testProductsList() {
  log('\n📋 Verificando produtos importados...', 'blue');
  
  try {
    const response = await axios.get(`${BASE_URL}/products?limit=20`);
    
    if (response.status === 200) {
      const data = response.data;
      
      log('✅ Lista de produtos obtida!', 'green');
      log(`   📦 Total: ${data.total} produtos`, 'white');
      log(`   📄 Página atual: ${data.data.length} produtos`, 'white');
      
      if (data.data.length > 0) {
        log('\n📦 Últimos produtos:', 'cyan');
        data.data.slice(0, 5).forEach(product => {
          log(`   • ${product.name} - R$ ${product.price} (${product.sku})`, 'white');
        });
      }
      
      return data;
    }
    
  } catch (error) {
    log(`❌ Erro ao listar produtos: ${error.message}`, 'red');
  }
}

async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'create':
        await createTestFile();
        break;
        
      case 'template':
        await testTemplate();
        break;
        
      case 'import':
        const filename = await createTestFile();
        await testImport(filename);
        await testProductsList();
        break;
        
      case 'test':
        log('🧪 Executando teste completo de importação...\n', 'cyan');
        
        // 1. Baixar template
        await testTemplate();
        
        // 2. Criar arquivo de teste
        const testFile = await createTestFile();
        
        // 3. Importar produtos
        await testImport(testFile);
        
        // 4. Verificar resultados
        await testProductsList();
        
        log('\n🎉 Teste completo concluído!', 'green');
        break;
        
      default:
        log('📦 Sistema de Importação de Produtos\n', 'cyan');
        log('Comandos disponíveis:', 'white');
        log('  node test-import-products.js create    # Criar arquivo de teste', 'cyan');
        log('  node test-import-products.js template  # Baixar template', 'cyan');
        log('  node test-import-products.js import    # Testar importação', 'cyan');
        log('  node test-import-products.js test      # Teste completo', 'cyan');
        break;
    }
    
  } catch (error) {
    log('\n💥 Teste falhou!', 'red');
    process.exit(1);
  }
}

main();