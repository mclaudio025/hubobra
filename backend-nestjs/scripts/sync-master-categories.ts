import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SubcategoryDef {
  name: string;
  slug: string;
  description: string;
  order: number;
}

interface MasterDepartmentDef {
  name: string;
  slug: string;
  description: string;
  icon?: string;
  image?: string;
  order: number;
  subcategories: SubcategoryDef[];
}

const MASTER_TAXONOMY: MasterDepartmentDef[] = [
  {
    name: 'Construção e Alvenaria',
    slug: 'construcao-e-alvenaria',
    description: 'Materiais brutos de fundação, elevação, vedação e cobertura para obras.',
    icon: 'Hammer',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&auto=format&fit=crop&q=80',
    order: 1,
    subcategories: [
      {
        name: 'Cimentos e Argamassas',
        slug: 'cimentos-e-argamassas',
        description: 'Cimento CP II, CP III, argamassa colante AC-I, AC-II, AC-III, graute, cal hidratada.',
        order: 1,
      },
      {
        name: 'Blocos e Tijolos',
        slug: 'blocos-e-tijolos',
        description: 'Tijolos cerâmicos, blocos de concreto estrutural e vedação, canaletas.',
        order: 2,
      },
      {
        name: 'Telhas e Coberturas',
        slug: 'telhas-e-coberturas',
        description: 'Telhas de fibrocimento, PVC, cerâmicas, cumeeiras, calhas e rufos.',
        order: 3,
      },
      {
        name: 'Impermeabilizantes e Aditivos',
        slug: 'impermeabilizantes-e-aditivos',
        description: 'Mantas líquidas, impermeabilizantes asfálticos, aditivos plastificantes, vedacit.',
        order: 4,
      },
      {
        name: 'Areia, Brita e Agregados',
        slug: 'areia-brita-e-agregados',
        description: 'Areia lavada, brita graduada, pedra britada, saibro e aterro.',
        order: 5,
      },
    ],
  },
  {
    name: 'Hidráulica e Encanamento',
    slug: 'hidraulica-e-encanamento',
    description: 'Tubulações, registros, conexões e reservatórios para instalações prediais de água e esgoto.',
    icon: 'Droplet',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=300&auto=format&fit=crop&q=80',
    order: 2,
    subcategories: [
      {
        name: 'Tubos e Conexões PVC',
        slug: 'tubos-e-conexoes-pvc',
        description: 'Tubos de esgoto, soldável água fria, joelhos 90, cotovelos, luvas, tes, adaptadores, curvas e reduções.',
        order: 1,
      },
      {
        name: 'Caixas d\'Água e Cisternas',
        slug: 'caixas-dagua-e-cisternas',
        description: 'Reservatórios de água de polietileno e fibra, tanques, boias de nível mecânicas e flanges.',
        order: 2,
      },
      {
        name: 'Registros e Válvulas',
        slug: 'registros-e-valvulas',
        description: 'Registros de gaveta, registros de pressão, registros de esfera, válvulas de retenção e válvulas de poço.',
        order: 3,
      },
      {
        name: 'Metais e Torneiras Sanitárias',
        slug: 'metais-e-torneiras',
        description: 'Torneiras para pia, lavatório, jardim, banheiro, misturadores, duchas higiênicas e chuveiros elétricos.',
        order: 4,
      },
      {
        name: 'Ralos, Sifões e Grelhas',
        slug: 'ralos-sifoes-e-grelhas',
        description: 'Ralos sifonados, caixas sifonadas, sifões sanfonados universais e grelhas de inox e PVC.',
        order: 5,
      },
      {
        name: 'Bombas e Pressurizadores',
        slug: 'bombas-e-pressurizadores',
        description: 'Bombas d água periféricas, autoaspirantes, submersas e pressurizadores de rede hidráulica.',
        order: 6,
      },
    ],
  },
  {
    name: 'Elétrica e Energia',
    slug: 'eletrica-e-energia',
    description: 'Condutores, proteção elétrica, acionamentos e cabeamento para instalações elétricas.',
    icon: 'Zap',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300&auto=format&fit=crop&q=80',
    order: 3,
    subcategories: [
      {
        name: 'Cabos e Fios Elétricos',
        slug: 'cabos-e-fios-eletricos',
        description: 'Fios flexíveis 1.5mm, 2.5mm, 4mm, 6mm, 10mm, cabos paralelos, cabos coaxiais e cabos de rede.',
        order: 1,
      },
      {
        name: 'Disjuntores e Quadros',
        slug: 'disjuntores-e-quadros',
        description: 'Disjuntores DIN monopolares, bipolares e tripolares, quadros de distribuição, DPS e DRs.',
        order: 2,
      },
      {
        name: 'Interruptores e Tomadas',
        slug: 'interruptores-e-tomadas',
        description: 'Placas, módulos de tomada 10A e 20A, interruptores simples, paralelos, intermediários e pulsadores.',
        order: 3,
      },
      {
        name: 'Eletrodutos e Conduítes',
        slug: 'eletrodutos-e-conduites',
        description: 'Conduítes corrugados flexíveis amarelos e laranjas, caixas de luz 4x2 e 4x4, eletrodutos rígidos.',
        order: 4,
      },
      {
        name: 'Extensões e Adaptadores',
        slug: 'extensoes-e-adaptadores',
        description: 'Filtros de linha, benjamins, adaptadores universais e plugues macho e fêmea.',
        order: 5,
      },
    ],
  },
  {
    name: 'Tintas e Pintura',
    slug: 'tintas-e-pintura',
    description: 'Tintas imobiliárias, esmaltes, vernizes e ferramentas de aplicação de pintura.',
    icon: 'Paintbrush',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=300&auto=format&fit=crop&q=80',
    order: 4,
    subcategories: [
      {
        name: 'Tintas Imobiliárias',
        slug: 'tintas-imobiliarias',
        description: 'Tintas acrílicas foscas, acetinadas, semi-brilho, látex PVA, tintas piso, emborrachadas e laváveis.',
        order: 1,
      },
      {
        name: 'Esmaltes e Vernizes',
        slug: 'esmaltes-e-vernizes',
        description: 'Esmaltes sintéticos base água e solvente para madeira e metal, vernizes marítimos e stain.',
        order: 2,
      },
      {
        name: 'Acessórios de Pintura',
        slug: 'acessorios-de-pintura',
        description: 'Rolos de lã, rolos de espuma, trinchas, pincéis, bandejas de pintura, cabos extensores e fitas crepe.',
        order: 3,
      },
      {
        name: 'Massas, Seladores e Solventes',
        slug: 'massas-seladores-e-solventes',
        description: 'Massa corrida PVA, massa acrílica exterior, selador acrílico, fundo preparador, aguarrás e thinner.',
        order: 4,
      },
    ],
  },
  {
    name: 'Ferramentas, Máquinas e Abrasivos',
    slug: 'ferramentas-maquinas-e-abrasivos',
    description: 'Equipamentos profissionais, manuais, corte, desbaste, lixamento e proteção.',
    icon: 'Wrench',
    image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=300&auto=format&fit=crop&q=80',
    order: 5,
    subcategories: [
      {
        name: 'Abrasivos e Corte',
        slug: 'abrasivos-e-corte',
        description: 'Lixas para massa, lixas d água, lixas para ferro, lixas madeira, discos de corte diamantados, rebolos e discos flap.',
        order: 1,
      },
      {
        name: 'Ferramentas Manuais',
        slug: 'ferramentas-manuais',
        description: 'Martelos, alicates, chaves de fenda, chaves phillips, serrotes, desempenadeiras de aço e plástico, colheres de pedreiro.',
        order: 2,
      },
      {
        name: 'Ferramentas Elétricas e Bateria',
        slug: 'ferramentas-eletricas',
        description: 'Furadeiras de impacto, parafusadeiras a bateria, serras mármore, lixadeiras angulares, politrizes e marteletes.',
        order: 3,
      },
      {
        name: 'EPIs e Segurança',
        slug: 'epis-e-seguranca',
        description: 'Capacetes de segurança, óculos de proteção, luvas de vaqueta e pigmentadas, botas bico de aço e máscaras PFF2.',
        order: 4,
      },
      {
        name: 'Medição e Níveis',
        slug: 'medicao-e-niveis',
        description: 'Trenas manuais e trenas a laser, níveis de bolha de alumínio, esquadros metálicos e prumos de centro.',
        order: 5,
      },
    ],
  },
  {
    name: 'Pisos, Revestimentos e Acabamentos',
    slug: 'pisos-revestimentos-e-acabamentos',
    description: 'Pisos cerâmicos, porcelanatos, revestimentos de parede, rejuntes e rodapés.',
    icon: 'Grid',
    image: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=300&auto=format&fit=crop&q=80',
    order: 6,
    subcategories: [
      {
        name: 'Pisos e Porcelanatos',
        slug: 'pisos-e-porcelanatos',
        description: 'Porcelanatos polidos, acetinados, pisos cerâmicos internos e externos antiderrapantes.',
        order: 1,
      },
      {
        name: 'Revestimentos de Parede',
        slug: 'revestimentos-de-parede',
        description: 'Azulejos, revestimentos cerâmicos decorativos, pastilhas de vidro e faixas decorativas.',
        order: 2,
      },
      {
        name: 'Rejuntes e Niveladores',
        slug: 'rejuntes-e-niveladores',
        description: 'Rejunte cimentício colorido, rejunte epóxi, espaçadores cruceta, cunhas e alicates de nivelamento de piso.',
        order: 3,
      },
      {
        name: 'Rodapés e Acabamentos',
        slug: 'rodapes-e-acabamentos',
        description: 'Rodapés de poliestireno, rodapés cerâmicos, cantoneiras de alumínio e perfis de acabamento.',
        order: 4,
      },
    ],
  },
  {
    name: 'Portas, Janelas e Ferragens',
    slug: 'portas-janelas-e-ferragens',
    description: 'Esquadrias, fechaduras residenciais, cadeados, dobradiças e fixadores mecânicos.',
    icon: 'DoorClosed',
    image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=300&auto=format&fit=crop&q=80',
    order: 7,
    subcategories: [
      {
        name: 'Fechaduras e Cadeados',
        slug: 'fechaduras-e-cadeados',
        description: 'Fechaduras externas, internas, para banheiro, bicos de papagaio para portas de correr e cadeados de latão.',
        order: 1,
      },
      {
        name: 'Dobradiças e Ferragens',
        slug: 'dobradicas-e-ferragens',
        description: 'Dobradiças com e sem anel, trincos, fechos de segurança, travas e cremonas para portas e janelas.',
        order: 2,
      },
      {
        name: 'Parafusos, Pregos e Buchas',
        slug: 'parafusos-pregos-e-buchas',
        description: 'Parafusos chipboard, autobrocantes, sextavados, buchas de nylon com anel, pregos com e sem cabeça.',
        order: 3,
      },
      {
        name: 'Portas e Janelas',
        slug: 'portas-e-janelas',
        description: 'Portas de madeira maciça e prancheta, portas sanfonadas em PVC, janelas e venezianas de alumínio.',
        order: 4,
      },
    ],
  },
  {
    name: 'Iluminação e Lustres',
    slug: 'iluminacao-e-lustres',
    description: 'Soluções de iluminação técnica e decorativa para ambientes internos e externos.',
    icon: 'Lightbulb',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=300&auto=format&fit=crop&q=80',
    order: 8,
    subcategories: [
      {
        name: 'Lâmpadas LED',
        slug: 'lampadas-led',
        description: 'Lâmpadas bulbo LED 9W, 12W, 15W, lâmpadas tubulares T8, lâmpadas vintage de filamento de carbono e LED.',
        order: 1,
      },
      {
        name: 'Plafons e Painéis LED',
        slug: 'plafons-e-paineis-led',
        description: 'Painéis de embutir e sobrepor quadrados e redondos 18W, 24W, 36W branco frio e quente.',
        order: 2,
      },
      {
        name: 'Refletores e Fitas LED',
        slug: 'refletores-e-fitas-led',
        description: 'Refletores LED IP65 e IP66 para áreas externas, fitas LED 12V e 220V com fontes e drivers.',
        order: 3,
      },
      {
        name: 'Luminárias e Arandelas',
        slug: 'luminarias-e-arandelas',
        description: 'Spots direcionáveis, arandelas internas e externas de parede, luminárias tipo tartaruga e balizadores.',
        order: 4,
      },
    ],
  },
  {
    name: 'Utilidades, Casa e Jardim',
    slug: 'utilidades-casa-e-jardim',
    description: 'Suportes de TV e eletrodomésticos, mangueiras, escadas, organização e limpeza pós-obra.',
    icon: 'Home',
    image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=300&auto=format&fit=crop&q=80',
    order: 9,
    subcategories: [
      {
        name: 'Suportes e Fixação de Aparelhos',
        slug: 'suportes-e-fixacao-aparelhos',
        description: 'Suportes articulados e fixos para TV LCD LED, suportes para micro-ondas, ar condicionado e mãos francesas.',
        order: 1,
      },
      {
        name: 'Jardim e Irrigação',
        slug: 'jardim-e-irrigacao',
        description: 'Mangueiras de jardim trançadas, esguichos reguláveis, engates rápidos, regadores e pulverizadores manuais.',
        order: 2,
      },
      {
        name: 'Escadas e Cavaletes',
        slug: 'escadas-e-cavaletes',
        description: 'Escadas de alumínio domésticas de 3 a 8 degraus, escadas extensivas, cavaletes de madeira e metal.',
        order: 3,
      },
      {
        name: 'Limpeza Pós-Obra e Químicos',
        slug: 'limpeza-pos-obra-e-quimicos',
        description: 'Desincrustantes ácidos, limpa pós-obra, removedores de cimento, saponáceos industriais, baldes e panos.',
        order: 4,
      },
    ],
  },
];

async function main() {
  console.log('Iniciando sincronização da Matriz Master de Categorias...');

  for (const dept of MASTER_TAXONOMY) {
    // 1. Criar ou atualizar departamento principal (pai)
    let parent = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: dept.slug },
          { name: { equals: dept.name, mode: 'insensitive' } },
        ],
        parentId: null,
      },
    });

    if (parent) {
      parent = await prisma.category.update({
        where: { id: parent.id },
        data: {
          name: dept.name,
          slug: dept.slug,
          description: dept.description,
          icon: dept.icon,
          image: dept.image,
          order: dept.order,
          active: true,
        },
      });
      console.log(`✓ Departamento atualizado: ${dept.name} (${dept.slug})`);
    } else {
      parent = await prisma.category.create({
        data: {
          name: dept.name,
          slug: dept.slug,
          description: dept.description,
          icon: dept.icon,
          image: dept.image,
          order: dept.order,
          active: true,
        },
      });
      console.log(`+ Departamento criado: ${dept.name} (${dept.slug})`);
    }

    // 2. Criar ou atualizar subcategorias vinculadas
    for (const sub of dept.subcategories) {
      let child = await prisma.category.findFirst({
        where: {
          OR: [
            { slug: sub.slug },
            { name: { equals: sub.name, mode: 'insensitive' }, parentId: parent.id },
          ],
        },
      });

      if (child) {
        await prisma.category.update({
          where: { id: child.id },
          data: {
            name: sub.name,
            slug: sub.slug,
            description: sub.description,
            parentId: parent.id,
            order: sub.order,
            active: true,
          },
        });
        console.log(`  ✓ Subcategoria sincronizada: ${sub.name} -> ${dept.name}`);
      } else {
        await prisma.category.create({
          data: {
            name: sub.name,
            slug: sub.slug,
            description: sub.description,
            parentId: parent.id,
            order: sub.order,
            active: true,
          },
        });
        console.log(`  + Subcategoria criada: ${sub.name} -> ${dept.name}`);
      }
    }
  }

  console.log('Sincronização da taxonomia concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro ao sincronizar taxonomia:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
