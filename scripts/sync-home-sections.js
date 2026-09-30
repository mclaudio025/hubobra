const { PrismaClient } = require('../backend-nestjs/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function syncHomeSections() {
  const updatedSections = [
    {
      id: 'hero-main',
      type: 'hero',
      title: 'Hero Principal',
      enabled: true,
      order: 1
    },
    {
      id: 'partner-network-bar',
      type: 'partner_bar',
      title: 'Rede de Lojas Parceiras & CEP',
      enabled: true,
      order: 2
    },
    {
      id: 'promo-banners-top',
      type: 'banner',
      title: 'Banner Promocional - Ofertas da Semana',
      bannerImageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&auto=format&fit=crop&q=80',
      bannerLinkUrl: '/produtos',
      bannerAlt: 'Desconto da Independência - Até 15% OFF',
      enabled: true,
      order: 3
    },
    {
      id: 'dept-shortcuts',
      type: 'department_shortcuts',
      title: 'Atalhos de Departamentos',
      enabled: true,
      order: 4
    },
    {
      id: 'section-hidraulica',
      type: 'product_carousel',
      title: 'Hidráulica & Encanamento',
      titleColor: '#009de0',
      productSource: 'category',
      categorySlug: 'hidraulica-e-encanamento',
      categoryName: 'Hidráulica e Encanamento',
      limit: 12,
      enabled: true,
      order: 5
    },
    {
      id: 'section-mega-ofertas',
      type: 'product_carousel',
      title: 'Mega Ofertas',
      titleColor: '#ea580c',
      productSource: 'discount',
      minDiscountPercent: 10,
      limit: 12,
      enabled: true,
      order: 6
    },
    {
      id: 'banner-seguranca-meio',
      type: 'banner',
      title: 'Banner Intercalado - Comunicação e Segurança',
      bannerImageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1200&auto=format&fit=crop&q=80',
      bannerLinkUrl: '/busca?q=seguranca',
      bannerAlt: 'Comunicação e Segurança - Até 50% OFF',
      enabled: true,
      order: 7
    },
    {
      id: 'section-abrasivos',
      type: 'product_carousel',
      title: 'Abrasivos & Ferramentas de Corte',
      titleColor: '#009de0',
      productSource: 'category',
      categorySlug: 'abrasivos-e-corte',
      categoryName: 'Abrasivos e Corte',
      limit: 12,
      enabled: true,
      order: 8
    },
    {
      id: 'section-eletrica',
      type: 'product_carousel',
      title: 'Cabos & Instalações Elétricas',
      titleColor: '#009de0',
      productSource: 'category',
      categorySlug: 'eletrica-e-energia',
      categoryName: 'Elétrica e Energia',
      limit: 12,
      enabled: true,
      order: 9
    },
    {
      id: 'section-tintas',
      type: 'product_carousel',
      title: 'Tintas & Pintura',
      titleColor: '#009de0',
      productSource: 'category',
      categorySlug: 'tintas-e-pintura',
      categoryName: 'Tintas e Pintura',
      limit: 12,
      enabled: true,
      order: 10
    }
  ];

  await prisma.setting.upsert({
    where: { key: 'home_sections_config' },
    update: { value: JSON.stringify(updatedSections) },
    create: {
      key: 'home_sections_config',
      value: JSON.stringify(updatedSections),
      type: 'JSON',
      category: 'HOME_LAYOUT',
      label: 'Configuração de Camadas da Home'
    }
  });

  console.log('✅ Configuração de seções sincronizada com sucesso!');
}

syncHomeSections()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
