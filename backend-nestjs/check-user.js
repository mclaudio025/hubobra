const { PrismaClient } = require('@prisma/client');

async function checkUser() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Verificando usuários no banco de dados...');
    
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

    console.log(`📊 Total de usuários: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n👥 Usuários encontrados:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role} - ${user.active ? 'Ativo' : 'Inativo'}`);
      });
      
      // Verificar especificamente o admin
      const admin = users.find(u => u.email === 'admin@loja.com');
      if (admin) {
        console.log('\n✅ Usuário admin encontrado!');
        console.log('📋 Dados do admin:', admin);
      } else {
        console.log('\n❌ Usuário admin não encontrado!');
      }
    } else {
      console.log('\n❌ Nenhum usuário encontrado no banco de dados!');
      console.log('💡 Execute: npm run seed para criar usuários');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();