const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('📦 Atualizando estoque para 10 unidades...');

  // Contagem antes
  const zeroStockBefore = await prisma.product.count({
    where: { stock: { lte: 0 } }
  });
  console.log(`Produtos com estoque <= 0 antes: ${zeroStockBefore}`);

  // Atualizar todos os produtos que estão com estoque zerado ou negativo para 10
  const result = await prisma.product.updateMany({
    where: {
      stock: { lte: 0 }
    },
    data: {
      stock: 10,
      active: true
    }
  });

  console.log(`✅ Total de produtos atualizados com estoque = 10: ${result.count}`);

  // Estatísticas pós-atualização
  const total = await prisma.product.count();
  const withStock = await prisma.product.count({ where: { stock: { gt: 0 } } });
  const zeroStockAfter = await prisma.product.count({ where: { stock: { lte: 0 } } });

  console.log('\n=== ESTATÍSTICAS ATUAIS ===');
  console.log(`Total de produtos no catálogo: ${total}`);
  console.log(`Produtos disponíveis com estoque > 0: ${withStock}`);
  console.log(`Produtos esgotados (estoque <= 0): ${zeroStockAfter}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao atualizar estoque:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
