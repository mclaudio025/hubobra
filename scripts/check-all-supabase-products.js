const { Pool } = require('../deskcomm-crm/node_modules/pg');

const connectionString = 'postgresql://postgres.zeywqzkmevytzkdbzwni:V2DPw6RyPFJnD893@aws-0-sa-east-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    // 1. Schemas existentes
    const schemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast');
    `);
    console.log('Schemas encontrados:', schemas.rows.map(r => r.schema_name));

    // 2. Todas as tabelas que contêm "prod", "item", "store", "cat", "estoque" no nome
    const tables = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name ~* 'prod|item|store|cat|estoque|hub'
      AND table_schema NOT IN ('pg_catalog', 'information_schema');
    `);
    console.log('Tabelas relacionadas a produtos/loja:', tables.rows);

    // 3. Contar registros nas tabelas encontradas
    for (const t of tables.rows) {
      try {
        const countRes = await client.query(`SELECT count(*) FROM "${t.table_schema}"."${t.table_name}"`);
        console.log(`- ${t.table_schema}.${t.table_name}: ${countRes.rows[0].count} registros`);
      } catch (e) {
        console.log(`- ${t.table_schema}.${t.table_name}: erro ao contar (${e.message})`);
      }
    }

    // 4. Verificar se catalog_products tem produtos
    try {
      const catProds = await client.query(`SELECT * FROM catalog_products LIMIT 5`);
      console.log('Exemplo de catalog_products:', catProds.rows);
    } catch (e) {}

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
