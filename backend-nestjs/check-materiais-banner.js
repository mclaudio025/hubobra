const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMateriaisBanner() {
  console.log('🔍 Verificando banner "Materiais"...');
  console.log('=' .repeat(50));
  
  try {
    // Buscar banners que contenham "Materiais" no título
    const materiaisBanners = await prisma.banner.findMany({
      where: {
        title: {
          contains: 'Materiais'
        }
      }
    });
    
    console.log(`📊 Banners encontrados com "Materiais": ${materiaisBanners.length}`);
    
    if (materiaisBanners.length === 0) {
      console.log('❌ Nenhum banner com "Materiais" encontrado');
      
      // Listar todos os banners para debug
      console.log('\n📋 Todos os banners no sistema:');
      const allBanners = await prisma.banner.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      allBanners.forEach((banner, index) => {
        console.log(`   ${index + 1}. "${banner.title}" (${banner.type}) - Ativo: ${banner.active}`);
        if (banner.imageUrl) {
          console.log(`      Imagem: ${banner.imageUrl}`);
        }
      });
    } else {
      materiaisBanners.forEach((banner, index) => {
        console.log(`\n📌 Banner ${index + 1}:`);
        console.log(`   ID: ${banner.id}`);
        console.log(`   Título: ${banner.title}`);
        console.log(`   Tipo: ${banner.type}`);
        console.log(`   Ativo: ${banner.active}`);
        console.log(`   Posição: ${banner.position}`);
        console.log(`   Imagem: ${banner.imageUrl || 'Não definida'}`);
        console.log(`   Criado em: ${banner.createdAt}`);
      });
    }
    
    // Verificar banners HERO ativos
    console.log('\n🎯 Banners HERO ativos:');
    const heroBanners = await prisma.banner.findMany({
      where: {
        type: 'HERO',
        active: true
      },
      orderBy: { position: 'asc' }
    });
    
    console.log(`📊 Total de banners HERO ativos: ${heroBanners.length}`);
    heroBanners.forEach((banner, index) => {
      console.log(`   ${index + 1}. "${banner.title}" - Posição: ${banner.position}`);
      console.log(`      Imagem: ${banner.imageUrl || 'Não definida'}`);
    });
    
    if (heroBanners.length === 0) {
      console.log('\n⚠️  PROBLEMA: Nenhum banner HERO ativo!');
      console.log('   O carrossel não terá conteúdo para exibir.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar banners:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMateriaisBanner();