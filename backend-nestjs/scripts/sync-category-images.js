const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Sincronizando imagens entre categorias mestres e suas subcategorias correspondentes...');

  // 1. Obter as 9 categorias mestres
  const masters = await prisma.category.findMany({
    where: { parentId: null }
  });

  const masterMap = {};
  masters.forEach(m => {
    masterMap[m.id] = m;
  });

  // 2. Mapeamento de subcategorias para copiar as imagens das mestres
  // Ex: "Pisos e Revestimentos" (filha) deve ter a MESMA imagem de "Pisos, Revestimentos e Acabamentos" (mestre)
  const children = await prisma.category.findMany({
    where: { parentId: { not: null } }
  });

  let synced = 0;

  for (const child of children) {
    const parent = masterMap[child.parentId];
    if (!parent || !parent.image) continue;

    const cName = child.name.toLowerCase();
    const pName = parent.name.toLowerCase();

    // Se a filha tem nome diretamente correspondente ao pai (ex: "Pisos e Revestimentos" sob "Pisos, Revestimentos e Acabamentos",
    // ou "Portas e Janelas" sob "Portas, Janelas e Ferragens", ou "Construção", "Hidráulica", etc.)
    const isDirectMatch = 
      (cName === 'pisos e revestimentos') ||
      (cName === 'portas e janelas') ||
      (cName === 'construcao' || cName === 'construção') ||
      (cName === 'hidraulica' || cName === 'hidráulica') ||
      (cName === 'eletrica' || cName === 'elétrica') ||
      (cName === 'ferramentas') ||
      (cName === 'tintas e derivados') ||
      (cName.includes('colas') && !child.image);

    if (isDirectMatch) {
      await prisma.category.update({
        where: { id: child.id },
        data: { image: parent.image }
      });
      console.log(`✅ [${child.name}] sincronizada com a imagem do pai [${parent.name}]`);
      synced++;
    }
  }

  console.log(`\n🎉 Sincronização concluída! Total de subcategorias atualizadas: ${synced}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
