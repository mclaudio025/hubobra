const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Verificando loja padrão...');
  let store = await prisma.store.findFirst();
  if (!store) {
    store = await prisma.store.create({
      data: {
        name: 'HubObra Materiais de Construção',
        slug: 'matriz',
        subdomain: 'matriz',
        phone: '5585999999999',
        document: '00.000.000/0001-00',
        email: 'contato@hubobra.com.br',
        primaryColor: '#f97316',
        address: 'Fortaleza - CE',
        city: 'Fortaleza',
        state: 'CE',
        plan: 'PRO',
        active: true,
      },
    });
  }

  console.log('Criando/atualizando usuário Administrador (admin@loja.com)...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@loja.com' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
      active: true,
      storeId: store.id,
      name: 'Administrador',
    },
    create: {
      email: 'admin@loja.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
      active: true,
      storeId: store.id,
    },
  });
  console.log('Admin criado/atualizado com ID:', admin.id);

  console.log('Criando/atualizando usuário Expedição (expedicao@hubobra.com.br)...');
  const expPassword = await bcrypt.hash('223344', 12);
  const expedicao = await prisma.user.upsert({
    where: { email: 'expedicao@hubobra.com.br' },
    update: {
      password: expPassword,
      role: 'EXPEDITION',
      active: true,
      storeId: store.id,
      name: 'Expedição HubObra',
    },
    create: {
      email: 'expedicao@hubobra.com.br',
      name: 'Expedição HubObra',
      password: expPassword,
      role: 'EXPEDITION',
      active: true,
      storeId: store.id,
    },
  });
  console.log('Expedição criado/atualizado com ID:', expedicao.id);
}

main()
  .catch((e) => {
    console.error('Erro ao criar usuários:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
