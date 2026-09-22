const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function fixMateriaisBanner() {
  console.log('🔧 Corrigindo banner "Materiais"...');
  console.log('=' .repeat(50));
  
  try {
    // Buscar o banner "Materiais"
    const materiaisBanner = await prisma.banner.findFirst({
      where: {
        title: 'Materiais'
      }
    });
    
    if (!materiaisBanner) {
      console.log('❌ Banner "Materiais" não encontrado');
      return;
    }
    
    console.log(`📌 Banner encontrado: ${materiaisBanner.title}`);
    console.log(`   ID: ${materiaisBanner.id}`);
    console.log(`   Tipo: ${materiaisBanner.type}`);
    console.log(`   Ativo: ${materiaisBanner.active}`);
    
    // Verificar se a imagem é base64
    if (materiaisBanner.imageUrl && materiaisBanner.imageUrl.startsWith('data:image/')) {
      console.log('🔍 Imagem detectada como base64, convertendo para arquivo...');
      
      // Extrair dados da imagem base64
      const matches = materiaisBanner.imageUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches) {
        console.log('❌ Formato base64 inválido');
        return;
      }
      
      const imageType = matches[1]; // jpeg, png, etc.
      const imageData = matches[2];
      
      // Gerar nome único para o arquivo
      const fileName = `${crypto.randomUUID()}.${imageType}`;
      const uploadsDir = path.join(process.cwd(), 'uploads', 'original');
      const filePath = path.join(uploadsDir, fileName);
      
      // Criar diretório se não existir
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log(`📁 Diretório criado: ${uploadsDir}`);
      }
      
      // Salvar arquivo
      const buffer = Buffer.from(imageData, 'base64');
      fs.writeFileSync(filePath, buffer);
      console.log(`💾 Arquivo salvo: ${fileName}`);
      console.log(`📏 Tamanho: ${(buffer.length / 1024).toFixed(2)} KB`);
      
      // Atualizar URL no banco de dados
      const newImageUrl = `http://localhost:8081/uploads/original/${fileName}`;
      
      await prisma.banner.update({
        where: { id: materiaisBanner.id },
        data: { imageUrl: newImageUrl }
      });
      
      console.log(`✅ URL atualizada: ${newImageUrl}`);
      
      // Verificar se o arquivo é acessível
      const fetch = require('node:fetch');
      try {
        const response = await fetch(newImageUrl);
        if (response.ok) {
          console.log('✅ Imagem acessível via URL');
        } else {
          console.log(`❌ Erro ao acessar imagem: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Erro ao testar URL: ${error.message}`);
      }
      
    } else if (materiaisBanner.imageUrl) {
      console.log(`ℹ️  Imagem já é uma URL: ${materiaisBanner.imageUrl}`);
    } else {
      console.log('⚠️  Banner não possui imagem definida');
    }
    
    // Verificar banners HERO ativos após correção
    console.log('\n🎯 Verificando banners HERO ativos:');
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
    
  } catch (error) {
    console.error('❌ Erro ao corrigir banner:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMateriaisBanner();