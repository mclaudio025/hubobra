const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createTestBanners() {
    console.log('🎯 Criando banners HERO de teste...');
    
    try {
        // Verificar imagens disponíveis
        const uploadsDir = path.join(__dirname, 'uploads', 'original');
        const imageFiles = fs.readdirSync(uploadsDir)
            .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/));
        
        console.log(`📁 Encontradas ${imageFiles.length} imagens disponíveis`);
        
        if (imageFiles.length === 0) {
            console.log('❌ Nenhuma imagem encontrada no diretório uploads/original');
            return;
        }
        
        // Limpar banners HERO existentes
        await prisma.banner.deleteMany({
            where: { type: 'HERO' }
        });
        console.log('🗑️  Banners HERO existentes removidos');
        
        // Criar banners de teste
        const bannersToCreate = [
            {
                title: 'Ofertas Especiais',
                subtitle: 'Até 50% de desconto',
                description: 'Aproveite nossas ofertas imperdíveis em produtos selecionados',
                buttonText: 'Ver Ofertas',
                buttonLink: '/ofertas',
                imageUrl: `/uploads/original/${imageFiles[0]}`,
                type: 'HERO',
                active: true,
                position: 1
            },
            {
                title: 'Novidades da Temporada',
                subtitle: 'Produtos em destaque',
                description: 'Confira os lançamentos mais esperados da temporada',
                buttonText: 'Descobrir',
                buttonLink: '/novidades',
                imageUrl: imageFiles.length > 1 ? `/uploads/original/${imageFiles[1]}` : `/uploads/original/${imageFiles[0]}`,
                type: 'HERO',
                active: true,
                position: 2
            }
        ];
        
        // Adicionar mais banners se houver mais imagens
        if (imageFiles.length > 2) {
            bannersToCreate.push({
                title: 'Qualidade Premium',
                subtitle: 'Os melhores produtos',
                description: 'Produtos selecionados com a melhor qualidade do mercado',
                buttonText: 'Explorar',
                buttonLink: '/premium',
                imageUrl: `/uploads/original/${imageFiles[2]}`,
                type: 'HERO',
                active: true,
                position: 3
            });
        }
        
        // Criar os banners no banco
        for (const bannerData of bannersToCreate) {
            const banner = await prisma.banner.create({
                data: bannerData
            });
            console.log(`✅ Banner criado: ${banner.title} (ID: ${banner.id})`);
        }
        
        console.log(`\n🎉 ${bannersToCreate.length} banners HERO criados com sucesso!`);
        console.log('🌐 Acesse http://localhost:3001 para ver o carrossel funcionando');
        
    } catch (error) {
        console.error('❌ Erro ao criar banners:', error.message);
        
        if (error.code === 'P2002') {
            console.log('💡 Erro de duplicação - alguns banners podem já existir');
        }
    } finally {
        await prisma.$disconnect();
    }
}

createBanners().catch(console.error);

// Corrigir nome da função
async function createBanners() {
    return createTestBanners();
}

if (require.main === module) {
    createTestBanners();
}