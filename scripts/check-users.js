const { PrismaClient } = require('../backend-nestjs/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      createdAt: true
    }
  });
  console.log('Total de usuários:', users.length);
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
