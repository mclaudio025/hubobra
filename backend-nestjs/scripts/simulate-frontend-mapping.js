const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MASTER_CATEGORIES_DATA = [
  {
    id: '2c245d58-e6d2-41b6-a756-7dd53715498d',
    name: 'Construção e Alvenaria',
    slug: 'construcao-e-alvenaria',
    image: 'DEFAULT_UNSPLASH_1',
  },
  {
    id: '3ac44b11-fd8e-4a95-968e-12b2972f8daf',
    name: 'Hidráulica e Encanamento',
    slug: 'hidraulica-e-encanamento',
    image: 'DEFAULT_UNSPLASH_2',
  },
  {
    id: 'd4edbf01-2d38-40a5-985d-21593b8f67d3',
    name: 'Elétrica e Energia',
    slug: 'eletrica-e-energia',
    image: 'DEFAULT_UNSPLASH_3',
  },
  {
    id: '6722e47f-e883-459e-93f1-025decf5de3a',
    name: 'Tintas e Pintura',
    slug: 'tintas-e-pintura',
    image: 'DEFAULT_UNSPLASH_4',
  },
  {
    id: 'e2a77501-bedf-4193-8824-a210a60367a1',
    name: 'Ferramentas, Máquinas e Abrasivos',
    slug: 'ferramentas-maquinas-e-abrasivos',
    image: 'DEFAULT_UNSPLASH_5',
  },
  {
    id: '224ae6c0-6be4-4392-841c-f56ee381cf42',
    name: 'Pisos e Revestimentos',
    slug: 'pisos-revestimentos-e-acabamentos',
    image: 'DEFAULT_UNSPLASH_6',
  },
  {
    id: '9984a29a-2a47-41e7-a1bd-349e7a1f37f6',
    name: 'Portas e Janelas',
    slug: 'portas-janelas-e-ferragens',
    image: 'DEFAULT_UNSPLASH_7',
  },
  {
    id: '39f7ecc1-90ec-4ca4-908b-6014b0365e22',
    name: 'Iluminação e Lustres',
    slug: 'iluminacao-e-lustres',
    image: 'DEFAULT_UNSPLASH_8',
  },
  {
    id: '63c4869d-72e8-499e-8870-56a41992fc24',
    name: 'Utilidades, Casa e Jardim',
    slug: 'utilidades-casa-e-jardim',
    image: 'DEFAULT_UNSPLASH_9',
  },
];

function normalizeKey(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  if (clean.length === 0 || clean.startsWith('blob:') || clean === 'null' || clean === 'undefined') return false;
  return clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/') || clean.startsWith('data:image/');
};

async function main() {
  const res = await prisma.category.findMany({
    where: { active: true },
    orderBy: [{ order: 'asc' }, { name: 'asc' }]
  });

  console.log('--- SIMULATING EXACT DepartmentShortcuts MAPPING ---');
  MASTER_CATEGORIES_DATA.forEach((master, idx) => {
    const normMasterSlug = normalizeKey(master.slug);
    const normMasterName = normalizeKey(master.name);

    const dbMatch = res.find((dbCat) => {
      const normDbSlug = normalizeKey(dbCat.slug);
      const normDbName = normalizeKey(dbCat.name);
      return (
        dbCat.id === master.id ||
        normDbSlug === normMasterSlug ||
        normDbName === normMasterName ||
        normDbSlug.includes(normMasterSlug) ||
        normMasterSlug.includes(normDbSlug)
      );
    });

    const finalImage = (dbMatch?.image && isValidImageUrl(dbMatch.image))
      ? dbMatch.image
      : master.image;

    const isBase64 = finalImage?.startsWith('data:');
    const isDefault = finalImage?.startsWith('DEFAULT_');
    const isUnsplash = finalImage?.includes('unsplash');

    console.log(`[Card ${idx + 1}] "${master.name}" -> dbMatch: "${dbMatch?.name}" (${dbMatch?.slug})`);
    console.log(`         ID Matched? ${dbMatch?.id === master.id ? 'YES' : 'NO (WRONG ID!)'}`);
    console.log(`         Final Image Type: ${isBase64 ? 'USER BASE64' : (isUnsplash ? 'UNSPLASH' : (isDefault ? 'DEFAULT FALLBACK' : 'OTHER'))}`);
    console.log('');
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
