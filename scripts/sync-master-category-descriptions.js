const { PrismaClient } = require('../backend-nestjs/node_modules/@prisma/client');
const prisma = new PrismaClient();

const MASTER_CATEGORIES = [
  {
    name: 'Construção e Alvenaria',
    slug: 'construcao-e-alvenaria',
    description: 'Materiais brutos de fundação, elevação, vedação e cobertura para obras.',
    icon: 'Hammer',
    image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&auto=format&fit=crop&q=80',
    order: 1
  },
  {
    name: 'Hidráulica e Encanamento',
    slug: 'hidraulica-e-encanamento',
    description: 'Tubulações, registros, conexões e reservatórios para instalações prediais de água e esgoto.',
    icon: 'Droplet',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80',
    order: 2
  },
  {
    name: 'Elétrica e Energia',
    slug: 'eletrica-e-energia',
    description: 'Condutores, proteção elétrica, acionamentos e cabeamento para instalações elétricas.',
    icon: 'Zap',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
    order: 3
  },
  {
    name: 'Tintas e Pintura',
    slug: 'tintas-e-pintura',
    description: 'Tintas imobiliárias, esmaltes, vernizes e ferramentas de aplicação de pintura.',
    icon: 'Paintbrush',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80',
    order: 4
  },
  {
    name: 'Ferramentas, Máquinas e Abrasivos',
    slug: 'ferramentas-maquinas-e-abrasivos',
    description: 'Equipamentos profissionais, manuais, corte, desbaste, lixamento e proteção.',
    icon: 'Wrench',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
    order: 5
  },
  {
    name: 'Pisos, Revestimentos e Acabamentos',
    slug: 'pisos-revestimentos-e-acabamentos',
    description: 'Pisos cerâmicos, porcelanatos, revestimentos de parede, rejuntes e rodapés.',
    icon: 'Grid',
    image: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800&auto=format&fit=crop&q=80',
    order: 6
  },
  {
    name: 'Portas, Janelas e Ferragens',
    slug: 'portas-janelas-e-ferragens',
    description: 'Esquadrias, fechaduras residenciais, cadeados, dobradiças e fixadores mecânicos.',
    icon: 'DoorClosed',
    image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=800&auto=format&fit=crop&q=80',
    order: 7
  },
  {
    name: 'Iluminação e Lustres',
    slug: 'iluminacao-e-lustres',
    description: 'Soluções de iluminação técnica e decorativa para ambientes internos e externos.',
    icon: 'Lightbulb',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80',
    order: 8
  },
  {
    name: 'Utilidades, Casa e Jardim',
    slug: 'utilidades-casa-e-jardim',
    description: 'Suportes de TV e eletrodomésticos, mangueiras, escadas, organização e limpeza pós-obra.',
    icon: 'Home',
    image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80',
    order: 9
  }
];

async function main() {
  console.log('🔄 Sincronizando descrições e imagens oficiais das 9 categorias...');
  
  for (const cat of MASTER_CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      await prisma.category.update({
        where: { slug: cat.slug },
        data: {
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          image: cat.image,
          order: cat.order,
          active: true
        }
      });
      console.log(`✅ Atualizada categoria: ${cat.name}`);
    } else {
      await prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          image: cat.image,
          order: cat.order,
          active: true
        }
      });
      console.log(`✨ Criada categoria: ${cat.name}`);
    }
  }

  console.log('🎉 Sincronização concluída com sucesso!');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
