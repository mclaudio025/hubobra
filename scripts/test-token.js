const jwt = require('../backend-nestjs/node_modules/jsonwebtoken');
const bcrypt = require('../backend-nestjs/node_modules/bcryptjs');
const { PrismaClient } = require('../backend-nestjs/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  console.log('Admin encontrado:', admin?.email, 'Role:', admin?.role);

  if (!admin) {
    console.error('Nenhum admin encontrado!');
    return;
  }

  // Gerar token exatamente como AuthService faz
  const payload = {
    email: admin.email,
    sub: admin.id,
    role: admin.role,
  };
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const token = jwt.sign(payload, secret, { expiresIn: '7d' });
  console.log('Token JWT gerado:', token);

  // Testar decodificação
  const decoded = jwt.verify(token, secret);
  console.log('Token decodificado com sucesso:', decoded);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
