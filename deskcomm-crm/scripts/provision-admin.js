const { Client } = require('pg');

const connectionString = 'postgresql://postgres.zeywqzkmevytzkdbzwni:V2DPw6RyPFJnD893@aws-0-sa-east-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Conectado ao Supabase...');

  const userRes = await client.query("SELECT id, email FROM auth.users WHERE email = 'mclaudioms@gmail.com'");
  if (userRes.rows.length === 0) {
    console.error('Usuário não encontrado em auth.users');
    process.exit(1);
  }

  const user = userRes.rows[0];
  console.log('Usuário encontrado:', user);

  // 1. Inserir Organização HubObra
  const orgRes = await client.query(`
    INSERT INTO public.organizations (slug, display_name, legal_name, status, created_by)
    VALUES ('hubobra', 'HubObra', 'HubObra Materiais', 'active', $1)
    ON CONFLICT (slug) DO UPDATE SET display_name = 'HubObra'
    RETURNING id;
  `, [user.id]);

  const orgId = orgRes.rows[0].id;
  console.log('Organização HubObra ID:', orgId);

  // 2. Inserir vínculo do usuário como Admin
  await client.query(`
    INSERT INTO public.user_organizations (user_id, organization_id, role, accepted_at)
    VALUES ($1, $2, 'admin', now())
    ON CONFLICT (user_id, organization_id) DO UPDATE SET role = 'admin', revoked_at = null;
  `, [user.id, orgId]);

  // 3. Inserir como Platform Admin
  await client.query(`
    INSERT INTO public.platform_admins (user_id, granted_by, scope, reason)
    VALUES ($1, $1, 'full', 'Instalação inicial')
    ON CONFLICT (user_id) DO NOTHING;
  `, [user.id]);

  console.log('✅ USUÁRIO VINCULADO COMO ADMIN E PLATFORM ADMIN COM SUCESSO!');
  await client.end();
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
