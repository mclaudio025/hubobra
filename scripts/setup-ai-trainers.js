const { PrismaClient } = require('../backend-nestjs/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔌 Conectando ao Supabase PostgreSQL via Prisma...');

  // 1. Criar tabela ai_trainers
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.ai_trainers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone VARCHAR(30) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'master_trainer',
      is_active BOOLEAN DEFAULT TRUE,
      notes TEXT DEFAULT 'Treinador com permissão master para ensinar gírias e regras',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('✅ Tabela ai_trainers verificada/criada!');

  // 2. Habilitar RLS
  await prisma.$executeRawUnsafe(`ALTER TABLE public.ai_trainers ENABLE ROW LEVEL SECURITY;`);
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'ai_trainers' AND policyname = 'allow_all_ai_trainers'
      ) THEN
        CREATE POLICY allow_all_ai_trainers ON public.ai_trainers FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END
    $$;
  `);
  console.log('✅ Políticas RLS para ai_trainers configuradas!');

  // 3. Cadastrar o número do Claudio Sousa como Master Trainer
  const masterPhone = '558589219126';
  await prisma.$executeRawUnsafe(`
    INSERT INTO public.ai_trainers (phone, name, role, is_active, notes, updated_at)
    VALUES ($1, $2, 'master_trainer', true, 'Administrador e Mestre da Loja', NOW())
    ON CONFLICT (phone) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      is_active = true,
      updated_at = NOW();
  `, masterPhone, 'Claudio Sousa (Master)');
  console.log(`✅ Treinador Master cadastrado com sucesso: ${masterPhone} (Claudio Sousa)!`);

  // 4. Listar treinadores ativos
  const trainers = await prisma.$queryRawUnsafe(`SELECT phone, name, role, is_active FROM public.ai_trainers;`);
  console.log('📋 Treinadores Autorizados:', trainers);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('❌ Erro:', err);
  prisma.$disconnect();
  process.exit(1);
});
