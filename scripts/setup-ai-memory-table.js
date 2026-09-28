const { PrismaClient } = require('../backend-nestjs/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔌 Conectando ao Supabase PostgreSQL via Prisma...');
  
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS customer_ai_profiles (
      phone VARCHAR(30) PRIMARY KEY,
      name VARCHAR(255),
      client_type VARCHAR(50) DEFAULT 'proprietario',
      delivery_neighborhood VARCHAR(255),
      preferred_payment VARCHAR(50) DEFAULT 'PIX',
      current_construction_stage VARCHAR(100) DEFAULT 'alvenaria',
      last_purchased_products JSONB DEFAULT '[]'::jsonb,
      ai_notes TEXT DEFAULT '',
      total_orders INTEGER DEFAULT 0,
      total_spent NUMERIC(12,2) DEFAULT 0.00,
      last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('✅ Tabela customer_ai_profiles criada/verificada com sucesso!');

  await prisma.$executeRawUnsafe(`
    ALTER TABLE customer_ai_profiles ENABLE ROW LEVEL SECURITY;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'customer_ai_profiles' AND policyname = 'allow_all_ops'
      ) THEN
        CREATE POLICY allow_all_ops ON customer_ai_profiles
          FOR ALL
          USING (true)
          WITH CHECK (true);
      END IF;
    END
    $$;
  `);
  console.log('✅ Políticas de segurança e RLS configuradas!');

  const columns = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'customer_ai_profiles';
  `);
  console.log('📋 Colunas na tabela:', columns.map(c => `${c.column_name} (${c.data_type})`).join(', '));

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('❌ Erro:', err);
  prisma.$disconnect();
  process.exit(1);
});
