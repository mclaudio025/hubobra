import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Running safe SQL migration...');
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "isCategoryLocked" BOOLEAN DEFAULT false;
    `);
    console.log('Column isCategoryLocked successfully added or already exists on products table.');
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "products_isCategoryLocked_idx" ON "products"("isCategoryLocked");
    `);
    console.log('Index products_isCategoryLocked_idx successfully created or already exists.');
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
