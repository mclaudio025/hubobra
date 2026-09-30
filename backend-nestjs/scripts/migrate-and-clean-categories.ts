import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MASTER_ROOT_SLUGS = [
  'construcao-e-alvenaria',
  'hidraulica-e-encanamento',
  'eletrica-e-energia',
  'tintas-e-pintura',
  'ferramentas-maquinas-e-abrasivos',
  'pisos-revestimentos-e-acabamentos',
  'portas-janelas-e-ferragens',
  'iluminacao-e-lustres',
  'utilidades-casa-e-jardim',
];

async function main() {
  console.log('=== INICIANDO MIGRAÇÃO E LIMPEZA DE CATEGORIAS ===\n');

  // 1. Obter todas as categorias Master (Raízes e Filhas)
  const masterCategories = await prisma.category.findMany({
    where: {
      OR: [
        { slug: { in: MASTER_ROOT_SLUGS } },
        { parent: { slug: { in: MASTER_ROOT_SLUGS } } },
      ],
    },
    include: { parent: true },
  });

  const masterCategoryMap = new Map<string, typeof masterCategories[0]>();
  masterCategories.forEach((c) => masterCategoryMap.set(c.slug, c));

  const masterIds = new Set(masterCategories.map((c) => c.id));

  // 2. Buscar produtos que estão em categorias legadas
  const legacyProducts = await prisma.product.findMany({
    where: {
      categoryId: { notIn: Array.from(masterIds) },
    },
    include: { category: { include: { parent: true } } },
  });

  console.log(`Encontrados ${legacyProducts.length} produtos em categorias antigas para migrar.\n`);

  // Helper para buscar ID da subcategoria por slug
  const getSubcategoryId = (slug: string): string => {
    const found = masterCategoryMap.get(slug);
    if (!found) {
      throw new Error(`Subcategoria Master '${slug}' não encontrada!`);
    }
    return found.id;
  };

  // Mapeamento semântico dos 35 produtos legados
  for (const product of legacyProducts) {
    const name = product.name.toLowerCase();
    const oldCatName = (product.category?.name || '').toLowerCase();
    const oldParentName = (product.category?.parent?.name || '').toLowerCase();

    let targetSlug = 'utilidades-casa-e-jardim'; // Fallback seguro
    let targetReason = 'Geral';

    if (name.includes('rolo') || name.includes('trincha') || name.includes('pincel') || name.includes('bandeja')) {
      targetSlug = 'acessorios-de-pintura';
      targetReason = 'Acessório de Pintura (Rolo/Pincel)';
    } else if (name.includes('caixa dagua') || name.includes('caixa d\'agua') || name.includes('caixa d agua') || name.includes('tanque')) {
      targetSlug = 'caixas-dagua-e-cisternas';
      targetReason = 'Reservatório / Caixa d\'Água';
    } else if (name.includes('bucha reducao') || name.includes('plug') || name.includes('joelho') || name.includes('tubo') || name.includes('cano') || name.includes('soldavel') || name.includes('esgoto')) {
      targetSlug = 'tubos-e-conexoes-pvc';
      targetReason = 'Tubo e Conexão PVC';
    } else if (name.includes('torneira') || name.includes('misturador') || name.includes('chuveiro') || name.includes('ducha')) {
      targetSlug = 'metais-e-torneiras';
      targetReason = 'Metal / Torneira Sanitária';
    } else if (name.includes('tinta') || name.includes('spray') || name.includes('latex') || name.includes('acrilica') || name.includes('rende muito')) {
      targetSlug = 'tintas-imobiliarias';
      targetReason = 'Tinta Imobiliária / Acabamento';
    } else if (name.includes('4x2') || name.includes('4 x 2') || name.includes('4x4') || name.includes('caixa pvc embutir') || name.includes('conduite') || name.includes('corrugado')) {
      targetSlug = 'eletrodutos-e-conduites';
      targetReason = 'Eletroduto / Caixa de Luz';
    } else if (name.includes('fio') || name.includes('cabo flexivel') || name.includes('cabo')) {
      targetSlug = 'cabos-e-fios-eletricos';
      targetReason = 'Condutor Elétrico';
    } else if (name.includes('extensao') || name.includes('plugue') || name.includes('adaptador') || name.includes('benjamim')) {
      targetSlug = 'extensoes-e-adaptadores';
      targetReason = 'Extensão / Adaptador Elétrico';
    } else if (name.includes('manta') || name.includes('impermeabilizante') || name.includes('vedacit') || name.includes('sika')) {
      targetSlug = 'impermeabilizantes-e-aditivos';
      targetReason = 'Impermeabilizante / Aditivo';
    } else if (name.includes('telha') || name.includes('cumeeira')) {
      targetSlug = 'telhas-e-coberturas';
      targetReason = 'Telha e Cobertura';
    } else if (name.includes('tijolo') || name.includes('bloco')) {
      targetSlug = 'blocos-e-tijolos';
      targetReason = 'Bloco e Tijolo';
    } else if (name.includes('espatula') || name.includes('colher de pedreiro') || name.includes('martelo') || name.includes('alicate')) {
      targetSlug = 'ferramentas-manuais';
      targetReason = 'Ferramenta Manual';
    } else if (name.includes('lamina de serra') || name.includes('lixa') || name.includes('disco')) {
      targetSlug = 'abrasivos-e-corte';
      targetReason = 'Abrasivo e Corte';
    } else if (name.includes('cola') || name.includes('adesivo') || name.includes('silicone') || name.includes('limpa-contato') || name.includes('wmax')) {
      targetSlug = 'massas-seladores-e-solventes';
      targetReason = 'Químico / Consumível de Fixação e Limpeza';
    } else if (name.includes('fechadura') || name.includes('cadeado')) {
      targetSlug = 'fechaduras-e-cadeados';
      targetReason = 'Fechadura e Cadeado';
    } else if (name.includes('parafuso') || name.includes('prego') || name.includes('bucha')) {
      targetSlug = 'parafusos-pregos-e-buchas';
      targetReason = 'Fixador / Parafuso e Bucha';
    } else if (name.includes('suporte') || name.includes('antena')) {
      targetSlug = 'suportes-e-fixacao-aparelhos';
      targetReason = 'Suporte / Fixação de Aparelho';
    }

    const newCategoryId = getSubcategoryId(targetSlug);
    const targetCat = masterCategoryMap.get(targetSlug)!;

    await prisma.product.update({
      where: { id: product.id },
      data: {
        categoryId: newCategoryId,
        isCategoryLocked: true,
      },
    });

    console.log(`✓ Mapeado: "${product.name.substring(0, 38)}..." ➔ [${targetCat.name}] (${targetReason})`);
  }

  console.log('\n--- TODOS OS PRODUTOS FORAM MIGRADOS COM SUCESSO! ---\n');

  // 3. Excluir todas as categorias legadas que não pertencem à Matriz Master
  const allCategories = await prisma.category.findMany({
    include: { parent: true, children: true, _count: { select: { products: true } } },
  });

  const legacyCategories = allCategories.filter((c) => !masterIds.has(c.id));
  console.log(`Total de categorias antigas/legadas a serem removidas: ${legacyCategories.length}\n`);

  // Primeiro deletar as filhas legadas
  const legacyChildren = legacyCategories.filter((c) => c.parentId !== null);
  for (const child of legacyChildren) {
    await prisma.category.delete({
      where: { id: child.id },
    });
    console.log(`- Subcategoria antiga removida: "${child.name}" (${child.slug})`);
  }

  // Depois deletar as raízes legadas
  const legacyRoots = legacyCategories.filter((c) => c.parentId === null);
  for (const root of legacyRoots) {
    await prisma.category.delete({
      where: { id: root.id },
    });
    console.log(`- Departamento antigo removido: "${root.name}" (${root.slug})`);
  }

  // 4. Contagem final de validação
  const finalRoots = await prisma.category.findMany({
    where: { parentId: null },
    include: { children: true },
    orderBy: { order: 'asc' },
  });

  console.log(`\n=== LIMPEZA CONCLUÍDA COM SUCESSO! ===`);
  console.log(`Total de Departamentos Principais no Banco: ${finalRoots.length}`);
  finalRoots.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.name}] (${r.slug}) - ${r.children.length} subcategorias`);
  });
}

main()
  .catch((e) => {
    console.error('Erro na migração e limpeza:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
