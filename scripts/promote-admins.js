const { PrismaClient } = require('../backend-nestjs/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Atualizando permissões de administradores...');
  
  // Promover mclaudioms@gmail.com, admin@loja.com, admin@test.com para ADMIN
  const emailsToAdmin = ['mclaudioms@gmail.com', 'admin@loja.com', 'admin@test.com'];
  
  for (const email of emailsToAdmin) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN', active: true }
      });
      console.log(`✅ Usuário ${email} agora é ADMIN.`);
    }
  }

  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true }
  });
  console.log('\nLista atualizada de usuários no banco:');
  console.log(JSON.stringify(allUsers, null, 2));

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
