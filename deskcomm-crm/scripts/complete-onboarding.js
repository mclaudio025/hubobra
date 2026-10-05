const { Client } = require('pg');

const connectionString = 'postgresql://postgres.zeywqzkmevytzkdbzwni:V2DPw6RyPFJnD893@aws-0-sa-east-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Conectado ao Supabase...');

  // Set onboarded_at to now() to bypass wizard lock
  await client.query(`
    UPDATE public.organizations 
    SET onboarded_at = now(), status = 'active'
    WHERE slug = 'hubobra';
  `);

  console.log('✅ ONBOARDING DA HUBOBRA LIBERADO COM SUCESSO!');
  await client.end();
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
