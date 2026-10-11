const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Adicionando coluna ncm na tabela products...');
  await prisma.$executeRawUnsafe('ALTER TABLE products ADD COLUMN IF NOT EXISTS ncm TEXT;');
  console.log('✅ Coluna ncm criada com sucesso na tabela products!');
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
