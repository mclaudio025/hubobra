const { PrismaClient } = require('../backend-nestjs/node_modules/@prisma/client');
const prisma = new PrismaClient();

const CATEGORY_UPDATES = [
  {
    slug: 'construcao-e-alvenaria',
    name: 'Construção e Alvenaria',
    image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=500&auto=format&fit=crop&q=80',
  },
  {
    slug: 'hidraulica-e-encanamento',
    name: 'Hidráulica e Encanamento',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500&auto=format&fit=crop&q=80',
  },
  {
    slug: 'eletrica-e-energia',
    name: 'Elétrica e Energia',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=80',
  },
  {
    slug: 'tintas-e-pintura',
    name: 'Tintas e Pintura',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&auto=format&fit=crop&q=80',
  },
  {
    slug: 'ferramentas-maquinas-e-abrasivos',
    name: 'Ferramentas, Máquinas e Abrasivos',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=80',
  },
  {
    slug: 'pisos-revestimentos-e-acabamentos',
    name: 'Pisos, Revestimentos e Acabamentos',
    image: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=500&auto=format&fit=crop&q=80',
  },
  {
    slug: 'portas-janelas-e-ferragens',
    name: 'Portas, Janelas e Ferragens',
    image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=500&auto=format&fit=crop&q=80',
  },
  {
    slug: 'iluminacao-e-lustres',
    name: 'Iluminação e Lustres',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500&auto=format&fit=crop&q=80',
  },
  {
    slug: 'utilidades-casa-e-jardim',
    name: 'Utilidades, Casa e Jardim',
    image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=500&auto=format&fit=crop&q=80',
  },
];

async function main() {
  console.log('--- Corrigindo imagens das categorias no banco de dados ---');

  // 1. Limpar qualquer blob: URL restante
  await prisma.$executeRaw`
    UPDATE categories
    SET image = NULL
    WHERE image LIKE 'blob:%'
  `;
  console.log('✓ Blobs removidos do banco.');

  // 2. Atualizar as 9 categorias principais com as URLs públicas corretas
  for (const item of CATEGORY_UPDATES) {
    const updated = await prisma.category.updateMany({
      where: {
        OR: [
          { slug: item.slug },
          { name: { contains: item.name.split(' ')[0], mode: 'insensitive' } }
        ]
      },
      data: {
        image: item.image
      }
    });
    console.log(`✓ Categoria "${item.name}": ${updated.count} registro(s) atualizado(s) com URL válida.`);
  }

  // 3. Verificar o estado final
  const allCats = await prisma.category.findMany({
    where: {
      image: { not: null }
    },
    select: { name: true, slug: true, image: true }
  });

  console.log('\nCategorias com imagem após atualização:');
  console.log(JSON.stringify(allCats, null, 2));

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
