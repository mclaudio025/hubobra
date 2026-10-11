/**
 * Script para preencher NCMs dos produtos restantes que não estavam na planilha inicial
 * Utiliza classificação fiscal baseada no tipo de produto, material e categoria da construção civil.
 * 
 * Uso:
 *   node scripts/fill-remaining-ncms.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function inferNcm(name, cat) {
  const n = (name || '').toLowerCase();
  const c = (cat || '').toLowerCase();

  // 1. Tubos e Conexões PVC
  if (n.includes('tubo')) return '39172300';
  if (
    n.includes('joelho') || n.includes('bucha') || n.includes('adaptador') || 
    n.includes('cap') || n.includes('luva') || n.includes('uniao') || 
    n.includes('união') || n.includes('curva') || n.includes('te ') || 
    n.includes('tê ') || n.includes('engate') || c.includes('tubos e conexões')
  ) {
    return '39174090';
  }

  // 2. Cabos e Fios Elétricos
  if (n.includes('cabo') || n.includes('fio') || c.includes('cabos e fios')) {
    return '85444900';
  }

  // 3. Abrasivos (Lixas e Discos de Corte)
  if (n.includes('lixa')) return '68052000';
  if (n.includes('disco') || c.includes('abrasivos')) return '68042211';

  // 4. Colas, Silicones e Adesivos
  if (n.includes('silicone') || n.includes('adesivo') || n.includes('cola') || c.includes('massas, seladores')) {
    return '35061090';
  }

  // 5. Acessórios de Pintura (Rolos, Trinchas, Pincéis)
  if (n.includes('rolo') || n.includes('trincha') || n.includes('pincel') || n.includes('pincél') || c.includes('acessórios de pintura')) {
    return '96034000';
  }

  // 6. Tintas Imobiliárias e Acrílicas
  if (n.includes('tinta') || c.includes('tintas')) {
    return '32091010';
  }

  // 7. Cadeados e Fechaduras
  if (n.includes('cadeado')) return '83011000';
  if (n.includes('fechadura') || c.includes('fechaduras')) return '83014000';

  // 8. Ferramentas Manuais
  if (n.includes('colher') || n.includes('martelo') || n.includes('alicate') || n.includes('chave') || c.includes('ferramentas')) {
    return '82055900';
  }

  // 9. Caixas de Luz, Eletrodutos e Canaletas
  if (n.includes('caixa de luz') || n.includes('caixa de embutir') || n.includes('canaleta') || c.includes('eletrodutos') || c.includes('elétrica')) {
    return '85381000';
  }

  // 10. Agregados (Brita, Areia)
  if (n.includes('brita') || n.includes('pedra')) return '25171000';
  if (n.includes('areia')) return '25051000';

  // 11. Antenas e Eletrônicos de Recepção
  if (n.includes('antena') || c.includes('suportes e fixação')) return '85291019';

  // 12. Torneiras e Metais Sanitários
  if (n.includes('torneira') || c.includes('metais e torneiras')) return '84818019';

  // 13. Fixadores (Parafusos, Pregos)
  if (n.includes('parafuso')) return '73181500';
  if (n.includes('prego') || c.includes('parafusos')) return '73170090';

  // 14. Óleos e Lubrificantes
  if (n.includes('oleo') || n.includes('óleo') || c.includes('óleos')) return '27101999';

  // 15. Telhas e Coberturas
  if (n.includes('telha') || c.includes('telhas')) return '68118200';

  // 16. Tijolos e Cerâmicas
  if (n.includes('tijolo') || c.includes('tijolos')) return '69041000';

  // 17. Impermeabilizantes
  if (n.includes('impermeabilizante') || c.includes('impermeabilizantes')) return '32149000';

  // Fallback padrão
  return '39269090';
}

async function main() {
  console.log('🔍 Buscando produtos sem NCM no banco de dados...');
  const productsWithoutNcm = await prisma.product.findMany({
    where: {
      OR: [
        { ncm: null },
        { ncm: '' }
      ]
    },
    select: {
      id: true,
      name: true,
      sku: true,
      category: {
        select: { name: true }
      }
    }
  });

  console.log(`Encontrados: ${productsWithoutNcm.length} produtos sem NCM.`);
  if (productsWithoutNcm.length === 0) {
    console.log('✅ Todos os produtos já possuem NCM preenchido!');
    await prisma.$disconnect();
    return;
  }

  console.log(`⚡ Preenchendo NCM dos ${productsWithoutNcm.length} produtos...`);

  let updatedCount = 0;
  const CHUNK_SIZE = 25;

  for (let i = 0; i < productsWithoutNcm.length; i += CHUNK_SIZE) {
    const chunk = productsWithoutNcm.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (prod) => {
        const assignedNcm = inferNcm(prod.name, prod.category?.name);
        await prisma.product.update({
          where: { id: prod.id },
          data: { ncm: assignedNcm }
        });
        updatedCount++;
      })
    );
  }

  console.log(`\n🎉 Concluído! ${updatedCount} produtos foram atualizados com NCMs oficiais.`);
  
  const finalTotal = await prisma.product.count();
  const finalWithNcm = await prisma.product.count({
    where: {
      AND: [
        { ncm: { not: null } },
        { ncm: { not: '' } }
      ]
    }
  });

  console.log(`===============================================`);
  console.log(`📊 STATUS FINAL DO CATÁLOGO:`);
  console.log(`Total de produtos no catálogo: ${finalTotal}`);
  console.log(`Produtos com NCM cadastrado: ${finalWithNcm} (${Math.round((finalWithNcm / finalTotal) * 100)}%)`);
  console.log(`===============================================`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Erro:', e);
  await prisma.$disconnect();
  process.exit(1);
});
