const { Client } = require('pg');

const connectionString = 'postgresql://postgres.zeywqzkmevytzkdbzwni:V2DPw6RyPFJnD893@aws-0-sa-east-1.pooler.supabase.com:5432/postgres';

async function test() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const res = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'conversations' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `);
  console.log('Columns in public.conversations:', res.rows.map(r => r.column_name));

  const orgs = await client.query(`SELECT id, slug, display_name, status, onboarded_at FROM public.organizations;`);
  console.log('Orgs:', orgs.rows);

  const memberships = await client.query(`SELECT * FROM public.user_organizations;`);
  console.log('Memberships:', memberships.rows);

  await client.end();
}
test().catch(console.error);
