const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- 1. Atualizando comparePrice de todos os produtos existentes ---');
  const prods = await prisma.product.findMany({
    where: {
      OR: [
        { comparePrice: null },
        { comparePrice: 0 }
      ]
    }
  });

  console.log(`Encontrados ${prods.length} produtos sem comparePrice.`);
  for (const p of prods) {
    const comparePrice = Math.round(Number(p.price) * 1.15 * 100) / 100;
    await prisma.product.update({
      where: { id: p.id },
      data: { comparePrice }
    });
  }
  console.log('✅ Todos os produtos agora possuem Preço De/Por (comparePrice)!');

  console.log('--- 2. Ajustando fontes das seções da Home para diversidade real ---');
  const setting = await prisma.setting.findUnique({ where: { key: 'home_sections_config' } });
  if (setting && setting.value) {
    let sections = JSON.parse(setting.value);
    sections = sections.map((s) => {
      if (s.id === 'section-ofertas-tempo-limitado') {
        return { ...s, productSource: 'discount', title: 'Ofertas Por Tempo Limitado!' };
      }
      if (s.id === 'section-tintas-oferta') {
        return { ...s, productSource: 'featured', title: 'Mega Ofertas' };
      }
      if (s.id === 'section-mais-vendidos') {
        return { ...s, productSource: 'bestsellers', title: 'Mais Vendidos' };
      }
      if (s.id === 'section-ofertas-exclusivas') {
        return { ...s, productSource: 'newest', title: 'Novidades & Ofertas Exclusivas' };
      }
      return s;
    });

    await prisma.setting.update({
      where: { key: 'home_sections_config' },
      data: { value: JSON.stringify(sections) }
    });
    console.log('✅ Seções da Home reconfiguradas com fontes diversificadas!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
