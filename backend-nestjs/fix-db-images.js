const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function cleanAndFixImages() {
  console.log('🔄 Verificando e corrigindo banco de imagens...');

  const allImages = await prisma.productImage.findMany();
  console.log(`Encontradas ${allImages.length} imagens na tabela ProductImage.`);

  for (const img of allImages) {
    let newUrl = img.url;

    // Substituir portas erradas (3001, 8080) por 8081
    if (newUrl.includes(':3001/')) {
      newUrl = newUrl.replace(':3001/', ':8081/');
    }
    if (newUrl.includes(':8080/')) {
      newUrl = newUrl.replace(':8080/', ':8081/');
    }

    // Verificar se o arquivo local existe em uploads/original
    if (newUrl.includes('/uploads/original/')) {
      const filename = path.basename(newUrl);
      const filePath = path.join(__dirname, 'uploads', 'original', filename);
      const exists = fs.existsSync(filePath);

      if (!exists) {
        console.log(`⚠️ Arquivo inexistente no disco para a imagem ${img.id}: ${filename}. Removendo registro órfão...`);
        await prisma.productImage.delete({ where: { id: img.id } });
        continue;
      }
    }

    if (newUrl !== img.url) {
      console.log(`✏️ Atualizando URL da imagem ${img.id}: ${img.url} -> ${newUrl}`);
      await prisma.productImage.update({
        where: { id: img.id },
        data: { url: newUrl },
      });
    }
  }

  console.log('✅ Verificação concluída!');
}

cleanAndFixImages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
