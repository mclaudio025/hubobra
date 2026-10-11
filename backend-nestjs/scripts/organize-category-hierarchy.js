/**
 * Script de Organização da Hierarquia de Categorias
 * 
 * Vincula todas as categorias importadas e secundárias aos 9 Departamentos Oficiais (Mestres),
 * garantindo que o carrossel da Home exiba os 9 Departamentos com fotos perfeitas e ícones,
 * e que cada departamento agregue os produtos das suas subcategorias filhas.
 * 
 * Uso:
 *   node scripts/organize-category-hierarchy.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mapeamento das 9 Categorias Mestres Oficiais (com imagens HD e ícones neon)
const MASTER_DEPARTMENTS = [
  {
    name: 'Construção e Alvenaria',
    slug: 'construcao-e-alvenaria',
    description: 'Materiais brutos de fundação, elevação, vedação e cobertura para obras.',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    icon: 'alvenaria',
    childrenPatterns: [
      'construcao', 'alvenaria', 'cimento', 'argamassa', 'tijolo', 'bloco', 
      'premoldado', 'telha', 'madeira', 'impermeabiliz'
    ]
  },
  {
    name: 'Hidráulica e Encanamento',
    slug: 'hidraulica-e-encanamento',
    description: 'Tubulações, registros, conexões e reservatórios para instalações prediais de água e esgoto.',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80',
    icon: 'hidraulica',
    childrenPatterns: [
      'hidraulica', 'tubo', 'conex', 'esgoto', 'cisterna', 'caixa d', 'banheiro', 
      'tanque', 'pia', 'torneira', 'sanitari'
    ]
  },
  {
    name: 'Elétrica e Energia',
    slug: 'eletrica-e-energia',
    description: 'Condutores, proteção elétrica, acionamentos e cabeamento para instalações elétricas.',
    image: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=600&auto=format&fit=crop&q=80',
    icon: 'eletrica',
    childrenPatterns: [
      'eletric', 'fio', 'cabo', 'conduit', 'eletroduto', 'energia'
    ]
  },
  {
    name: 'Tintas e Pintura',
    slug: 'tintas-e-pintura',
    description: 'Tintas imobiliárias, esmaltes, vernizes e ferramentas de aplicação de pintura.',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    icon: 'tintas',
    childrenPatterns: [
      'tinta', 'pintura', 'verniz', 'esmalte', 'massa', 'selador', 'solvente', 'acessorios de pintura'
    ]
  },
  {
    name: 'Ferramentas, Máquinas e Abrasivos',
    slug: 'ferramentas-maquinas-e-abrasivos',
    description: 'Equipamentos profissionais, manuais, corte, desbaste, lixamento e proteção.',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
    icon: 'ferramentas',
    childrenPatterns: [
      'ferramenta', 'maquina', 'abrasiv', 'lixa', 'corte', 'disco', 'cola', 'silicone', 'adesiv'
    ]
  },
  {
    name: 'Pisos, Revestimentos e Acabamentos',
    slug: 'pisos-revestimentos-e-acabamentos',
    description: 'Pisos cerâmicos, porcelanatos, revestimentos de parede, rejuntes e rodapés.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
    icon: 'pisos',
    childrenPatterns: [
      'piso', 'revestimento', 'acabamento', 'ceramica', 'porcelanato', 'marmore', 'granito'
    ]
  },
  {
    name: 'Portas, Janelas e Ferragens',
    slug: 'portas-janelas-e-ferragens',
    description: 'Esquadrias, fechaduras residenciais, cadeados, dobradiças e fixadores mecânicos.',
    image: 'https://images.unsplash.com/photo-1534237710431-e2fc698436d0?w=600&auto=format&fit=crop&q=80',
    icon: 'portas',
    childrenPatterns: [
      'porta', 'janela', 'ferrag', 'fechadur', 'cadeado', 'parafuso', 'prego', 'bucha'
    ]
  },
  {
    name: 'Iluminação e Lustres',
    slug: 'iluminacao-e-lustres',
    description: 'Soluções de iluminação técnica e decorativa para ambientes internos e externos.',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&auto=format&fit=crop&q=80',
    icon: 'iluminacao',
    childrenPatterns: [
      'ilumin', 'lustre', 'lampada', 'led', 'refletor', 'spot'
    ]
  },
  {
    name: 'Utilidades, Casa e Jardim',
    slug: 'utilidades-casa-e-jardim',
    description: 'Suportes de TV e eletrodomésticos, mangueiras, escadas, organização e limpeza pós-obra.',
    image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80',
    icon: 'utilidades',
    childrenPatterns: [
      'utilidade', 'casa', 'jardim', 'variedades', 'limpeza', 'forro', 'gesso', 
      'cozinha', 'auto', 'suporte', 'epi', 'seguranca', 'sem grupo', 'outro'
    ]
  }
];

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  console.log('🏗️ Organizando hierarquia de categorias e departamentos...');

  // 1. Garantir que os 9 Departamentos Mestres existem como Raiz (parentId: null)
  const masterCategoryMap = new Map();

  for (const master of MASTER_DEPARTMENTS) {
    let cat = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: master.slug },
          { name: master.name }
        ]
      }
    });

    if (cat) {
      // Atualizar como raiz com imagem HD e descrição oficial
      cat = await prisma.category.update({
        where: { id: cat.id },
        data: {
          name: master.name,
          slug: master.slug,
          description: master.description,
          image: master.image,
          icon: master.icon,
          parentId: null,
          active: true,
        }
      });
    } else {
      cat = await prisma.category.create({
        data: {
          name: master.name,
          slug: master.slug,
          description: master.description,
          image: master.image,
          icon: master.icon,
          parentId: null,
          active: true,
        }
      });
    }

    masterCategoryMap.set(master.slug, cat);
    console.log(`⭐ Departamento Mestre garantido: [${cat.name}] (ID: ${cat.id})`);
  }

  // 2. Buscar todas as outras categorias
  const masterIds = new Set(Array.from(masterCategoryMap.values()).map(c => c.id));
  const subCategories = await prisma.category.findMany({
    where: {
      id: { notIn: Array.from(masterIds) }
    }
  });

  console.log(`\n📂 Vinculando ${subCategories.length} categorias filhas aos seus departamentos...`);

  let linkedCount = 0;

  for (const sub of subCategories) {
    const cleanSubName = normalize(sub.name);
    const cleanSubSlug = normalize(sub.slug);

    // Encontrar o melhor departamento mestre correspondente
    let matchedMaster = null;

    for (const master of MASTER_DEPARTMENTS) {
      const isMatch = master.childrenPatterns.some(pattern => {
        const normPattern = normalize(pattern);
        return cleanSubName.includes(normPattern) || cleanSubSlug.includes(normPattern);
      });

      if (isMatch) {
        matchedMaster = masterCategoryMap.get(master.slug);
        break;
      }
    }

    // Se não achou correspondência específica, cai em Utilidades, Casa e Jardim
    if (!matchedMaster) {
      matchedMaster = masterCategoryMap.get('utilidades-casa-e-jardim');
    }

    if (matchedMaster && sub.parentId !== matchedMaster.id) {
      await prisma.category.update({
        where: { id: sub.id },
        data: {
          parentId: matchedMaster.id,
        }
      });
      console.log(`  ↳ [${sub.name}] vinculado a -> [${matchedMaster.name}]`);
      linkedCount++;
    }
  }

  console.log(`\n🎉 Organização concluída!`);
  console.log(`- 9 Departamentos Mestres ativos como raiz`);
  console.log(`- ${linkedCount} categorias organizadas sob seus respectivos departamentos`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Erro:', e);
  await prisma.$disconnect();
  process.exit(1);
});
