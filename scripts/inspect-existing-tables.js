const { Pool } = require('../deskcomm-crm/node_modules/pg');

const connectionString = 'postgresql://postgres.zeywqzkmevytzkdbzwni:V2DPw6RyPFJnD893@aws-0-sa-east-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Tabelas existentes no schema public:', res.rows.map(r => r.table_name));

    if (res.rows.some(r => r.table_name === 'orders')) {
      const cols = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'orders';
      `);
      console.log('Colunas de orders:', cols.rows);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
