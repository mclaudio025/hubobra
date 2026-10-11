/**
 * Script de Correção e Padronização das Imagens e Nomes de Categorias
 * 
 * 1. Define imagens profissionais de alta resolução (Unsplash curado para construção civil)
 *    para TODAS as categorias do banco que estão sem foto.
 * 2. Normaliza os nomes de categorias que ficaram em CAIXA ALTA para Title Case elegante.
 * 
 * Uso:
 *   node scripts/fix-category-images.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CATEGORY_IMAGE_MAP = {
  // Hidráulica
  'hidraulica': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80',
  'tubos e conexoes pvc': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80',
  'caixas dagua e cisternas': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80',

  // Ferramentas e Máquinas
  'ferramentas': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
  'ferramentas manuais': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
  'ferramentas, maquinas e abrasivos': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
  'abrasivos': 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&auto=format&fit=crop&q=80',
  'abrasivos e corte': 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&auto=format&fit=crop&q=80',

  // Elétrica
  'eletrica': 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=600&auto=format&fit=crop&q=80',
  'eletrica e energia': 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=600&auto=format&fit=crop&q=80',
  'cabos e fios eletricos': 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=600&auto=format&fit=crop&q=80',
  'eletrodutos e conduites': 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=600&auto=format&fit=crop&q=80',

  // Tintas e Pintura
  'tintas e derivados': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
  'tintas e pintura': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
  'tintas imobiliarias': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
  'tintas acrilicas': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
  'acessorios de pintura': 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&auto=format&fit=crop&q=80',
  'massas, seladores e solventes': 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&auto=format&fit=crop&q=80',
  'vernizes': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
  'esmaltes': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',

  // Construção e Alvenaria
  'construcao': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
  'construcao e alvenaria': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
  'cimento e argamassa': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
  'cimento portland': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
  'argamassa': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
  'tijolos e blocos': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
  'tijolos ceramicos': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
  'blocos de concreto': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
  'premoldados': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  'telhas e coberturas': 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=600&auto=format&fit=crop&q=80',
  'madeiras': 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&auto=format&fit=crop&q=80',
  'impermeabilizantes': 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=600&auto=format&fit=crop&q=80',
  'impermeabilizantes e aditivos': 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=600&auto=format&fit=crop&q=80',

  // Ferragens e Acessórios
  'ferragens': 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&auto=format&fit=crop&q=80',
  'fechaduras e cadeados': 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&auto=format&fit=crop&q=80',
  'parafusos, pregos e buchas': 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&auto=format&fit=crop&q=80',
  'portas e janelas': 'https://images.unsplash.com/photo-1534237710431-e2fc698436d0?w=600&auto=format&fit=crop&q=80',
  'portas, janelas e ferragens': 'https://images.unsplash.com/photo-1534237710431-e2fc698436d0?w=600&auto=format&fit=crop&q=80',

  // Banheiro e Cozinha
  'banheiro': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
  'tanques e pias': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
  'metais e torneiras sanitarias': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
  'cozinha': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',

  // Pisos e Revestimentos
  'pisos e revestimentos': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
  'pisos, revestimentos e acabamentos': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
  'marmore e granito': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',

  // Utilidades, EPI e Diversos
  'colas,silicones e adesivos': 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=600&auto=format&fit=crop&q=80',
  'epi': 'https://images.unsplash.com/photo-1578873375969-d652174f8849?w=600&auto=format&fit=crop&q=80',
  'variedades uso geral': 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80',
  'utilidades, casa e jardim': 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80',
  'casa acessorios': 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80',
  'suportes e fixacao de aparelhos': 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80',
  'limpeza e conservacao': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
  'iluminacao e lustres': 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&auto=format&fit=crop&q=80',
  'forros': 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&auto=format&fit=crop&q=80',
  'oleos e lubrificantes': 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80',
  'auto pecas': 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80',
  'sem grupo': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
};

// Formatação amigável para nomes de categorias em caixa alta
const PRETTY_CATEGORY_NAMES = {
  'HIDRAÚLICA': 'Hidráulica',
  'FERRAMENTAS': 'Ferramentas',
  'ELÉTRICA': 'Elétrica',
  'FERRAGENS': 'Ferragens',
  'TINTAS E DERIVADOS': 'Tintas e Derivados',
  'VARIEDADES USO GERAL': 'Variedades e Uso Geral',
  'BANHEIRO': 'Banheiro',
  'CONSTRUÇÃO': 'Construção',
  'PISOS E REVESTIMENTOS': 'Pisos e Revestimentos',
  'SEM GRUPO': 'Outros / Sem Grupo',
  'PREMOLDADOS': 'Pré-Moldados',
  'PORTAS E JANELAS': 'Portas e Janelas',
  'COLAS,SILICONES E ADESIVOS': 'Colas, Silicones e Adesivos',
  'MARMORE E GRANITO': 'Mármore e Granito',
  'EPI': 'EPI e Segurança',
  'ABRASIVOS': 'Abrasivos e Corte',
  'TANQUES E PIAS': 'Tanques e Pias',
  'ACESSORIOS DE PINTURA': 'Acessórios de Pintura',
  'IMPERMEABILIZANTES': 'Impermeabilizantes',
  'LIMPEZA E CONSERVACAO': 'Limpeza e Conservação',
  'FORROS': 'Forros e Gesso',
  'CASA ACESSORIOS': 'Casa e Decoração',
  'COZINHA': 'Cozinha',
  'AUTO PECAS': 'Auto Peças e Mecânica',
};

function normalizeText(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  console.log('🔄 Sincronizando imagens e nomes de categorias...');
  const categories = await prisma.category.findMany();
  console.log(`Total de categorias no banco: ${categories.length}`);

  let updatedImages = 0;
  let updatedNames = 0;

  for (const cat of categories) {
    const cleanKey = normalizeText(cat.name);
    const targetImage = CATEGORY_IMAGE_MAP[cleanKey] || 
      Object.entries(CATEGORY_IMAGE_MAP).find(([key]) => cleanKey.includes(key) || key.includes(cleanKey))?.[1];

    const prettyName = PRETTY_CATEGORY_NAMES[cat.name];

    const dataToUpdate = {};

    // Atualizar imagem se estiver vazia ou for fallback genérico
    if (targetImage && (!cat.image || cat.image.includes('1585338107529'))) {
      dataToUpdate.image = targetImage;
      updatedImages++;
    } else if (targetImage && !cat.image) {
      dataToUpdate.image = targetImage;
      updatedImages++;
    }

    // Atualizar nome se estiver em caixa alta feia
    if (prettyName && prettyName !== cat.name) {
      dataToUpdate.name = prettyName;
      updatedNames++;
    }

    if (Object.keys(dataToUpdate).length > 0) {
      await prisma.category.update({
        where: { id: cat.id },
        data: dataToUpdate,
      });
      console.log(`✅ [${cat.name}] -> ${prettyName || cat.name} (Imagem atualizada)`);
    }
  }

  console.log(`\n🎉 Processamento concluído!`);
  console.log(`- Imagens atualizadas: ${updatedImages}`);
  console.log(`- Nomes padronizados: ${updatedNames}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Erro:', e);
  await prisma.$disconnect();
  process.exit(1);
});
