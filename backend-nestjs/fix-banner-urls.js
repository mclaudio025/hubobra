const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Script já está sendo executado no diretório correto

const prisma = new PrismaClient();

async function fixBannerUrls() {
  console.log('🔧 Corrigindo URLs dos banners...');
  console.log('=' .repeat(50));
  
  try {
    // Buscar todos os banners
    const banners = await prisma.banner.findMany();
    console.log(`📊 Encontrados ${banners.length} banners`);
    
    let updatedCount = 0;
    
    for (const banner of banners) {
      if (banner.imageUrl && banner.imageUrl.startsWith('/uploads/')) {
        // Converter URL relativa para URL completa
        const newImageUrl = `http://localhost:8081${banner.imageUrl}`;
        
        await prisma.banner.update({
          where: { id: banner.id },
          data: { imageUrl: newImageUrl }
        });
        
        console.log(`✅ Banner "${banner.title}":`);
        console.log(`   Antes: ${banner.imageUrl}`);
        console.log(`   Depois: ${newImageUrl}`);
        
        updatedCount++;
      } else if (banner.imageUrl) {
        console.log(`ℹ️  Banner "${banner.title}": URL já está correta`);
      } else {
        console.log(`⚠️  Banner "${banner.title}": sem imagem configurada`);
      }
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log(`🎉 Correção concluída! ${updatedCount} banners atualizados`);
    
    // Verificar banners HERO ativos após a correção
    console.log('\n🔍 Verificando banners HERO ativos...');
    const heroBanners = await prisma.banner.findMany({
      where: {
        type: 'HERO',
        active: true
      },
      orderBy: {
        position: 'asc'
      }
    });
    
    console.log(`📊 Banners HERO ativos: ${heroBanners.length}`);
    heroBanners.forEach((banner, index) => {
      console.log(`   ${index + 1}. ${banner.title}`);
      console.log(`      Imagem: ${banner.imageUrl || 'Não definida'}`);
      console.log(`      Posição: ${banner.position}`);
    });
    
    if (heroBanners.length === 0) {
      console.log('\n⚠️  ATENÇÃO: Nenhum banner HERO ativo encontrado!');
      console.log('   Execute: node create-banners.js para criar banners de teste');
    } else {
      console.log('\n✅ Banners HERO configurados corretamente!');
      console.log('   As imagens devem aparecer no carrossel agora.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao corrigir URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBannerUrls();