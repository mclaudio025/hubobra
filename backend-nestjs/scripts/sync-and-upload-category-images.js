require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const bucketName = process.env.SUPABASE_BUCKET_NAME || 'products';

class FakeSocket {
  constructor() {}
  close() {}
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: FakeSocket }
});

async function run() {
  console.log('🚀 Iniciando sincronização e upload de imagens de categorias...');
  
  // 1. Garantir pasta frontend/public/categories
  const frontendPublicDir = path.resolve(__dirname, '../../frontend/public/categories');
  if (!fs.existsSync(frontendPublicDir)) {
    fs.mkdirSync(frontendPublicDir, { recursive: true });
    console.log(`📁 Criado diretório: ${frontendPublicDir}`);
  }

  const exportedDir = path.join(__dirname, 'exported_category_images');
  const files = fs.readdirSync(exportedDir);

  const uploadedUrls = {};

  for (const file of files) {
    const srcPath = path.join(exportedDir, file);
    const destPath = path.join(frontendPublicDir, file);
    
    // Copiar para frontend/public/categories
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copiado localmente: /categories/${file}`);

    // Upload para Supabase Storage
    const buffer = fs.readFileSync(srcPath);
    const supabasePath = `categories/${file}`;
    
    try {
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(supabasePath, buffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.warn(`⚠️ Supabase upload warning para ${file}:`, uploadError.message);
      } else {
        const { data: publicData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(supabasePath);
        
        uploadedUrls[file] = publicData.publicUrl;
        console.log(`☁️ Supabase Storage URL: ${publicData.publicUrl}`);
      }
    } catch (e) {
      console.warn(`⚠️ Erro ao enviar para Supabase ${file}:`, e.message);
    }
  }

  // 2. Atualizar o banco de dados PostgreSQL
  console.log('\n🔄 Atualizando categorias no banco de dados...');
  const roots = await prisma.category.findMany({ where: { parentId: null } });

  for (const root of roots) {
    const filename = `${root.slug}.png`;
    const localUrl = `/categories/${filename}`;
    const supabaseUrl = uploadedUrls[filename] || localUrl;

    // Atualizar no banco
    await prisma.category.update({
      where: { id: root.id },
      data: {
        image: localUrl
      }
    });

    console.log(`🎯 Categoria [${root.name}] (${root.slug}) atualizada para: ${localUrl}`);
  }

  console.log('\n✨ Concluído com sucesso!');
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error('❌ Falha:', e);
  await prisma.$disconnect();
  process.exit(1);
});
