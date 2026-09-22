import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados (Multi-Tenant & Material de Construção)...');

  // 1. Criar a Loja Padrão (ObraHub / Loja Piloto da Irmã)
  const defaultStore = await prisma.store.upsert({
    where: { slug: 'matriz' },
    update: {},
    create: {
      name: 'ObraHub Materiais - Matriz',
      slug: 'matriz',
      subdomain: 'matriz',
      phone: '5511999999999',
      document: '00.000.000/0001-00',
      email: 'contato@obrahub.com.br',
      primaryColor: '#f97316',
      address: 'Av. Principal da Construção, 1000',
      city: 'São Paulo',
      state: 'SP',
      plan: 'PRO',
      active: true,
    },
  });

  console.log('🏬 Loja principal criada/carregada:', defaultStore.name, `(ID: ${defaultStore.id})`);

  // 2. Criar usuário admin vinculado à loja
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@loja.com' },
    update: {
      storeId: defaultStore.id,
    },
    create: {
      email: 'admin@loja.com',
      name: 'Administrador Matriz',
      password: adminPassword,
      role: 'ADMIN',
      storeId: defaultStore.id,
    },
  });

  console.log('👤 Usuário admin criado:', admin.email);

  // 3. Criar categorias principais vinculadas à loja
  const mainCategories = [
    {
      name: 'Cimento e Argamassa',
      description: 'Produtos para construção civil como cimentos, argamassas e aditivos',
      slug: 'cimento-e-argamassa',
      icon: 'fas fa-hammer',
      order: 1,
      storeId: defaultStore.id,
    },
    {
      name: 'Tijolos e Blocos',
      description: 'Tijolos cerâmicos, blocos de concreto e materiais para alvenaria',
      slug: 'tijolos-e-blocos',
      icon: 'fas fa-cube',
      order: 2,
      storeId: defaultStore.id,
    },
    {
      name: 'Telhas e Coberturas',
      description: 'Telhas cerâmicas, metálicas e materiais para cobertura',
      slug: 'telhas-e-coberturas',
      icon: 'fas fa-home',
      order: 3,
      storeId: defaultStore.id,
    },
    {
      name: 'Pisos e Revestimentos',
      description: 'Pisos cerâmicos, porcelanatos e revestimentos',
      slug: 'pisos-e-revestimentos',
      icon: 'fas fa-th-large',
      order: 4,
      storeId: defaultStore.id,
    },
    {
      name: 'Tintas e Vernizes',
      description: 'Tintas, vernizes, esmaltes e produtos para pintura',
      slug: 'tintas-e-vernizes',
      icon: 'fas fa-paint-brush',
      order: 5,
      storeId: defaultStore.id,
    },
    {
      name: 'Ferragens',
      description: 'Parafusos, pregos, dobradiças e ferragens em geral',
      slug: 'ferragens',
      icon: 'fas fa-tools',
      order: 6,
      storeId: defaultStore.id,
    },
    {
      name: 'Elétrica',
      description: 'Materiais elétricos, fios, cabos e componentes',
      slug: 'eletrica',
      icon: 'fas fa-bolt',
      order: 7,
      storeId: defaultStore.id,
    },
    {
      name: 'Hidráulica',
      description: 'Tubos, conexões e materiais hidráulicos',
      slug: 'hidraulica',
      icon: 'fas fa-tint',
      order: 8,
      storeId: defaultStore.id,
    },
    {
      name: 'Madeiras',
      description: 'Madeiras para construção e acabamento',
      slug: 'madeiras',
      icon: 'fas fa-tree',
      order: 9,
      storeId: defaultStore.id,
    },
    {
      name: 'Ferramentas',
      description: 'Ferramentas manuais e elétricas para construção',
      slug: 'ferramentas',
      icon: 'fas fa-wrench',
      order: 10,
      storeId: defaultStore.id,
    },
  ];

  const createdCategories = [];
  for (const category of mainCategories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { storeId: defaultStore.id },
      create: category,
    });
    createdCategories.push(created);
  }

  console.log(`📂 ${createdCategories.length} categorias principais criadas`);

  // 4. Criar subcategorias
  const cimentoCategory = createdCategories.find(c => c.name === 'Cimento e Argamassa');
  const tijoloCategory = createdCategories.find(c => c.name === 'Tijolos e Blocos');
  const tintaCategory = createdCategories.find(c => c.name === 'Tintas e Vernizes');

  if (cimentoCategory) {
    const subcategorias = [
      {
        name: 'Cimento Portland',
        description: 'Cimentos Portland diversos tipos',
        slug: 'cimento-portland',
        parentId: cimentoCategory.id,
        order: 1,
        storeId: defaultStore.id,
      },
      {
        name: 'Argamassa',
        description: 'Argamassas prontas e aditivos',
        slug: 'argamassa',
        parentId: cimentoCategory.id,
        order: 2,
        storeId: defaultStore.id,
      },
      {
        name: 'Aditivos',
        description: 'Aditivos para concreto e argamassa',
        slug: 'aditivos',
        parentId: cimentoCategory.id,
        order: 3,
        storeId: defaultStore.id,
      },
    ];

    for (const sub of subcategorias) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: { storeId: defaultStore.id },
        create: sub,
      });
    }
  }

  if (tijoloCategory) {
    const subcategorias = [
      {
        name: 'Tijolos Cerâmicos',
        description: 'Tijolos cerâmicos diversos furos',
        slug: 'tijolos-ceramicos',
        parentId: tijoloCategory.id,
        order: 1,
        storeId: defaultStore.id,
      },
      {
        name: 'Blocos de Concreto',
        description: 'Blocos de concreto estruturais',
        slug: 'blocos-concreto',
        parentId: tijoloCategory.id,
        order: 2,
        storeId: defaultStore.id,
      },
    ];

    for (const sub of subcategorias) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: { storeId: defaultStore.id },
        create: sub,
      });
    }
  }

  if (tintaCategory) {
    const subcategorias = [
      {
        name: 'Tintas Acrílicas',
        description: 'Tintas acrílicas para paredes',
        slug: 'tintas-acrilicas',
        parentId: tintaCategory.id,
        order: 1,
        storeId: defaultStore.id,
      },
      {
        name: 'Esmaltes',
        description: 'Esmaltes para madeira e metal',
        slug: 'esmaltes',
        parentId: tintaCategory.id,
        order: 2,
        storeId: defaultStore.id,
      },
      {
        name: 'Vernizes',
        description: 'Vernizes e seladores',
        slug: 'vernizes',
        parentId: tintaCategory.id,
        order: 3,
        storeId: defaultStore.id,
      },
    ];

    for (const sub of subcategorias) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: { storeId: defaultStore.id },
        create: sub,
      });
    }
  }

  console.log('📁 Subcategorias criadas');

  // 5. Criar produtos de exemplo com unidades de medida específicas
  const cimentoCategoryForProducts = createdCategories.find(c => c.name === 'Cimento e Argamassa');
  const tijoloCategoryForProducts = createdCategories.find(c => c.name === 'Tijolos e Blocos');
  const tintaCategoryForProducts = createdCategories.find(c => c.name === 'Tintas e Vernizes');

  if (cimentoCategoryForProducts && tijoloCategoryForProducts && tintaCategoryForProducts) {
    const products = [
      {
        name: 'Cimento CP II 50kg',
        description: 'Cimento Portland CP II-E-32 para uso geral em construção civil',
        specifications: 'Resistência: 32 MPa, Tempo de pega: 1-10h, Ideal para concretos e argamassas',
        price: 32.90,
        stock: 500,
        sku: 'CIM001',
        barcode: '7891234567890',
        brand: 'Votoran',
        weight: 50,
        dimensions: '50x30x10cm',
        unit: 'SACO',
        unitMultiplier: 1,
        categoryId: cimentoCategoryForProducts.id,
        storeId: defaultStore.id,
        active: true,
        featured: true,
      },
      {
        name: 'Tijolo Cerâmico 6 Furos (Milheiro)',
        description: 'Tijolo cerâmico de 6 furos para alvenaria de vedação',
        specifications: 'Dimensões: 14x19x29cm, Resistência: 2,5 MPa, Absorção de água: 8-22%',
        price: 850.00,
        stock: 20,
        sku: 'TIJ001',
        barcode: '7891234567891',
        brand: 'Cerâmica São João',
        weight: 2800,
        dimensions: '14x19x29cm',
        unit: 'MILHEIRO',
        unitMultiplier: 1000,
        categoryId: tijoloCategoryForProducts.id,
        storeId: defaultStore.id,
        active: true,
        featured: true,
      },
      {
        name: 'Tinta Acrílica Fosca Branca 18L',
        description: 'Tinta acrílica premium para paredes internas e externas',
        specifications: 'Cobertura: até 380m² por demão, Secagem: 30min ao toque',
        price: 289.90,
        stock: 80,
        sku: 'TIN001',
        barcode: '7891234567892',
        brand: 'Suvinil',
        weight: 18,
        dimensions: '25x25x35cm',
        unit: 'LATA',
        unitMultiplier: 1,
        categoryId: tintaCategoryForProducts.id,
        storeId: defaultStore.id,
        active: true,
        featured: true,
      },
    ];

    for (const product of products) {
      await prisma.product.upsert({
        where: { sku: product.sku },
        update: {
          storeId: defaultStore.id,
          unit: product.unit,
          unitMultiplier: product.unitMultiplier,
        },
        create: product,
      });
    }

    console.log(`📦 ${products.length} produtos criados com unidades de medida específicas`);
  }

  // 6. Criar banners vinculados à loja
  const banners = [
    {
      title: 'Materiais de Construção',
      subtitle: 'Tudo para sua obra com qualidade e preço direto da loja',
      description: 'Encontre cimento, tijolos, telhas, tintas e muito mais com entrega rápida',
      buttonText: 'Ver Catálogo',
      buttonLink: '/produtos',
      imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=2070&auto=format&fit=crop',
      textColor: 'text-white',
      type: 'HERO',
      position: 0,
      active: true,
      storeId: defaultStore.id,
    },
    {
      title: 'Entrega na Sua Obra',
      subtitle: 'Caminhão próprio para entregas locais',
      description: 'Receba materiais pesados direto no canteiro de obras',
      buttonText: 'Fazer Pedido',
      buttonLink: '/produtos',
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop',
      textColor: 'text-white',
      type: 'HERO',
      position: 1,
      active: true,
      storeId: defaultStore.id,
    },
  ];

  for (const banner of banners) {
    await prisma.banner.upsert({
      where: {
        title_type: {
          title: banner.title,
          type: banner.type,
        },
      },
      update: { storeId: defaultStore.id },
      create: banner,
    });
  }

  console.log(`🎨 ${banners.length} banners criados`);
  console.log('✅ Seed Multi-Tenant concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });