const { Pool } = require('../deskcomm-crm/node_modules/pg');
const bcrypt = require('../backend-nestjs/node_modules/bcryptjs');

const connectionString = 'postgresql://postgres.zeywqzkmevytzkdbzwni:V2DPw6RyPFJnD893@aws-0-sa-east-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const ddl = `
CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subdomain TEXT UNIQUE,
  "customDomain" TEXT UNIQUE,
  document TEXT,
  phone TEXT,
  email TEXT,
  logo TEXT,
  "primaryColor" TEXT DEFAULT '#f97316',
  address TEXT,
  city TEXT,
  state TEXT,
  active BOOLEAN DEFAULT true,
  plan TEXT DEFAULT 'PRO',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'USER',
  active BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "storeId" TEXT REFERENCES stores(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  image TEXT,
  icon TEXT,
  "order" INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "parentId" TEXT REFERENCES categories(id) ON DELETE SET NULL,
  "storeId" TEXT REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  specifications TEXT,
  price DOUBLE PRECISION NOT NULL,
  "comparePrice" DOUBLE PRECISION,
  cost DOUBLE PRECISION,
  stock INTEGER DEFAULT 0,
  "minStock" INTEGER DEFAULT 5,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  brand TEXT,
  model TEXT,
  weight DOUBLE PRECISION,
  dimensions TEXT,
  warranty TEXT,
  origin TEXT,
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  "hasVariations" BOOLEAN DEFAULT false,
  "isVariation" BOOLEAN DEFAULT false,
  "isCategoryLocked" BOOLEAN DEFAULT false,
  unit TEXT DEFAULT 'UN',
  "unitMultiplier" DOUBLE PRECISION DEFAULT 1,
  rating DOUBLE PRECISION DEFAULT 0,
  "reviewCount" INTEGER DEFAULT 0,
  "viewCount" INTEGER DEFAULT 0,
  "saleCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "categoryId" TEXT NOT NULL REFERENCES categories(id),
  "parentProductId" TEXT REFERENCES products(id) ON DELETE SET NULL,
  "storeId" TEXT REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_images (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  url TEXT NOT NULL,
  alt TEXT,
  "order" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "productId" TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_tags (
  "productId" TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  "tagId" TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY ("productId", "tagId")
);

CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  quantity INTEGER NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "productId" TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE ("userId", "productId")
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderNumber" TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'PENDING',
  total DOUBLE PRECISION NOT NULL,
  subtotal DOUBLE PRECISION NOT NULL,
  shipping DOUBLE PRECISION DEFAULT 0,
  tax DOUBLE PRECISION DEFAULT 0,
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "userId" TEXT NOT NULL REFERENCES users(id),
  "storeId" TEXT REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  quantity INTEGER NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  total DOUBLE PRECISION NOT NULL,
  "orderId" TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  "productId" TEXT NOT NULL REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS shipping_addresses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  district TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  "zipCode" TEXT NOT NULL,
  country TEXT DEFAULT 'Brasil',
  "orderId" TEXT UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  method TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  amount DOUBLE PRECISION NOT NULL,
  "transactionId" TEXT,
  "paidAt" TIMESTAMP WITH TIME ZONE,
  metadata TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "orderId" TEXT UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  type TEXT DEFAULT 'TEXT',
  category TEXT DEFAULT 'GENERAL',
  label TEXT NOT NULL,
  description TEXT,
  required BOOLEAN DEFAULT false,
  encrypted BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "storeId" TEXT REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  "buttonText" TEXT,
  "buttonLink" TEXT,
  "imageUrl" TEXT,
  "bgColor" TEXT,
  "textColor" TEXT DEFAULT 'text-white',
  type TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  "startDate" TIMESTAMP WITH TIME ZONE,
  "endDate" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "storeId" TEXT REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS security_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event TEXT NOT NULL,
  severity TEXT NOT NULL,
  "userId" TEXT REFERENCES users(id),
  ip TEXT NOT NULL,
  "userAgent" TEXT,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "productId" TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  "oldPrice" DOUBLE PRECISION NOT NULL,
  "newPrice" DOUBLE PRECISION NOT NULL,
  reason TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES users(id),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "quoteNumber" TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'OPEN',
  "customerName" TEXT NOT NULL,
  "customerPhone" TEXT NOT NULL,
  "customerEmail" TEXT,
  subtotal DOUBLE PRECISION NOT NULL,
  discount DOUBLE PRECISION DEFAULT 0,
  shipping DOUBLE PRECISION DEFAULT 0,
  total DOUBLE PRECISION NOT NULL,
  "validUntil" TIMESTAMP WITH TIME ZONE NOT NULL,
  "pdfUrl" TEXT,
  notes TEXT,
  "userId" TEXT REFERENCES users(id) ON DELETE SET NULL,
  "storeId" TEXT REFERENCES stores(id) ON DELETE CASCADE,
  "convertedOrderId" TEXT UNIQUE REFERENCES orders(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "quoteId" TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  "productId" TEXT REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  brand TEXT,
  unit TEXT DEFAULT 'UN',
  quantity INTEGER DEFAULT 1,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  total DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_ai_profiles (
  phone VARCHAR(30) PRIMARY KEY,
  name VARCHAR(255),
  client_type VARCHAR(50) DEFAULT 'proprietario',
  delivery_neighborhood VARCHAR(255),
  preferred_payment VARCHAR(50) DEFAULT 'PIX',
  current_construction_stage VARCHAR(100) DEFAULT 'alvenaria',
  last_purchased_products JSONB DEFAULT '[]',
  ai_notes TEXT DEFAULT '',
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(12,2) DEFAULT 0.00,
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function main() {
  console.log('🔌 Conectando ao PostgreSQL do Supabase...');
  const client = await pool.connect();
  
  try {
    console.log('🔨 Executando DDL das tabelas da loja...');
    await client.query(ddl);
    console.log('✅ Tabelas criadas com sucesso!');

    // 1. Criar Loja Padrão
    console.log('🏬 Criando loja padrão...');
    const storeRes = await client.query(`
      INSERT INTO stores (slug, name, subdomain, phone, document, email, "primaryColor", address, city, state, plan, active)
      VALUES ('matriz', 'ObraHub Materiais - Matriz', 'matriz', '5511999999999', '00.000.000/0001-00', 'contato@obrahub.com.br', '#f97316', 'Av. Principal da Construção, 1000', 'São Paulo', 'SP', 'PRO', true)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name;
    `);
    const storeId = storeRes.rows[0].id;
    console.log('✅ Loja OK:', storeRes.rows[0].name, storeId);

    // 2. Criar Admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (email, name, password, role, active, "storeId")
      VALUES ('admin@loja.com', 'Administrador Matriz', $1, 'ADMIN', true, $2)
      ON CONFLICT (email) DO NOTHING;
    `, [hashedPassword, storeId]);
    console.log('✅ Admin OK: admin@loja.com');

    // 3. Categorias
    const categories = [
      { name: 'Cimento e Argamassa', slug: 'cimento-e-argamassa', icon: 'fas fa-hammer', order: 1 },
      { name: 'Tijolos e Blocos', slug: 'tijolos-e-blocos', icon: 'fas fa-cube', order: 2 },
      { name: 'Tintas e Vernizes', slug: 'tintas-e-vernizes', icon: 'fas fa-paint-brush', order: 3 },
      { name: 'Hidráulica', slug: 'hidraulica', icon: 'fas fa-tint', order: 4 },
      { name: 'Elétrica', slug: 'eletrica', icon: 'fas fa-bolt', order: 5 },
      { name: 'Ferramentas', slug: 'ferramentas', icon: 'fas fa-wrench', order: 6 },
      { name: 'Pisos e Revestimentos', slug: 'pisos-e-revestimentos', icon: 'fas fa-th-large', order: 7 }
    ];

    const catMap = {};
    for (const cat of categories) {
      const catRes = await client.query(`
        INSERT INTO categories (name, slug, icon, "order", active, "storeId")
        VALUES ($1, $2, $3, $4, true, $5)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, slug;
      `, [cat.name, cat.slug, cat.icon, cat.order, storeId]);
      catMap[cat.slug] = catRes.rows[0].id;
    }
    console.log(`✅ ${Object.keys(catMap).length} Categorias criadas!`);

    // 4. Produtos
    const products = [
      {
        name: 'Cimento CP II 50kg',
        description: 'Cimento Portland composto com adição de pozolana. Alta durabilidade e resistência.',
        price: 25.90,
        stock: 500,
        sku: 'CIM-CPII-50KG',
        brand: 'Votoran',
        featured: true,
        unit: 'SACO',
        catSlug: 'cimento-e-argamassa'
      },
      {
        name: 'Tinta Acrílica Branca Fosco 18L',
        description: 'Tinta acrílica premium de alta cobertura e rendimento para ambientes internos e externos.',
        price: 89.90,
        stock: 120,
        sku: 'TNT-ACR-18L',
        brand: 'Suvinil',
        featured: true,
        unit: 'LITRO',
        catSlug: 'tintas-e-vernizes'
      },
      {
        name: 'Joelho 90° Soldável 25mm Tigre',
        description: 'Conexão hidráulica soldável em PVC para água fria predial.',
        price: 1.46,
        stock: 1500,
        sku: 'JOL-90-25MM',
        brand: 'Tigre',
        featured: false,
        unit: 'UN',
        catSlug: 'hidraulica'
      },
      {
        name: 'Tijolo Cerâmico 6 Furos 9x14x19cm',
        description: 'Tijolo cerâmico para alvenaria de vedação. Alta resistência e excelente isolamento.',
        price: 0.85,
        stock: 10000,
        sku: 'TIJ-6F-91419',
        brand: 'Cerâmica São Bento',
        featured: false,
        unit: 'MILHEIRO',
        catSlug: 'tijolos-e-blocos'
      },
      {
        name: 'Cabo Flexível 2,5mm 750V 100m Azul',
        description: 'Cabo flexível condutor em cobre para instalações elétricas residenciais e comerciais.',
        price: 149.90,
        stock: 45,
        sku: 'CAB-FLX-25-AZ',
        brand: 'Prysmian',
        featured: true,
        unit: 'ROLO',
        catSlug: 'eletrica'
      },
      {
        name: 'Argamassa ACIII 20kg Cinza',
        description: 'Argamassa colante de alto desempenho para porcelanatos e pisos em áreas externas e piscinas.',
        price: 32.50,
        stock: 300,
        sku: 'ARG-AC3-20KG',
        brand: 'Quartzolit',
        featured: false,
        unit: 'SACO',
        catSlug: 'cimento-e-argamassa'
      },
      {
        name: 'Porcelanato Polido 60x60cm Caixa 2,16m²',
        description: 'Porcelanato polido retificado acabamento brilhante de alto padrão.',
        price: 69.90,
        stock: 200,
        sku: 'POR-POL-6060',
        brand: 'Eliane',
        featured: true,
        unit: 'M2',
        catSlug: 'pisos-e-revestimentos'
      },
      {
        name: 'Trena Métrica Profissional 5m com Trava',
        description: 'Trena resistente a impactos com fita de aço temperado e graduação em milímetros.',
        price: 18.90,
        stock: 80,
        sku: 'TRN-MET-5M',
        brand: 'Starrett',
        featured: false,
        unit: 'UN',
        catSlug: 'ferramentas'
      }
    ];

    for (const p of products) {
      const catId = catMap[p.catSlug];
      await client.query(`
        INSERT INTO products (name, description, price, stock, sku, brand, featured, unit, "categoryId", "storeId", active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
        ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price, stock = EXCLUDED.stock, active = true
      `, [p.name, p.description, p.price, p.stock, p.sku, p.brand, p.featured, p.unit, catId, storeId]);
    }
    console.log(`✅ ${products.length} Produtos cadastrados com sucesso!`);

    // 5. Configurações básicas
    const settings = [
      { key: 'STORE_NAME', value: 'HubObra Materiais de Construção', label: 'Nome da Loja' },
      { key: 'STORE_PHONE', value: '5511999999999', label: 'WhatsApp de Atendimento' },
      { key: 'FREE_SHIPPING_THRESHOLD', value: '299.00', label: 'Frete Grátis acima de' }
    ];
    for (const s of settings) {
      await client.query(`
        INSERT INTO settings (key, value, label, active, "storeId")
        VALUES ($1, $2, $3, true, $4)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
      `, [s.key, s.value, s.label, storeId]);
    }
    console.log('✅ Configurações salvas!');

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('❌ Erro na execução:', err);
  process.exit(1);
});
