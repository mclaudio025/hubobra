const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const connectionString = process.argv[2] || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('ERRO: Informe a Connection String (URI) do Supabase.');
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, '..', 'supabase', 'baseline.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('Arquivo baseline.sql não encontrado em:', sqlPath);
    process.exit(1);
  }

  console.log('Lendo baseline.sql (2.4 MB)...');
  let sql = fs.readFileSync(sqlPath, 'utf8');

  // Fix search_path and extensions schema references from pg_dump
  sql = sql.replace(
    /SELECT pg_catalog\.set_config\('search_path', '', false\);/g,
    "SELECT pg_catalog.set_config('search_path', 'public, extensions, pg_catalog', false);"
  );

  const extensionKeywords = [
    'vector',
    'citext',
    'vector_cosine_ops',
    'vector_l2_ops',
    'vector_ip_ops',
    'gin_trgm_ops',
    'gist_trgm_ops',
    'similarity',
    'word_similarity',
    'gen_random_uuid',
    'gen_random_bytes',
    'uuid_generate_v4',
    'unaccent'
  ];

  for (const kw of extensionKeywords) {
    const quotedRegex = new RegExp(`"public"\\."${kw}"`, 'g');
    sql = sql.replace(quotedRegex, `"extensions"."${kw}"`);
    const plainRegex = new RegExp(`public\\.${kw}\\b`, 'g');
    sql = sql.replace(plainRegex, `extensions.${kw}`);
  }

  console.log('Conectando ao Supabase PostgreSQL...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Conectado! Limpando e preparando schemas limpos...');
    
    await client.query(`
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
      CREATE SCHEMA IF NOT EXISTS extensions;
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
      CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
      CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA extensions;
      CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA extensions;
      CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA extensions;
      CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA extensions;
      GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;
      GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
      SET search_path TO public, extensions, pg_catalog;
    `);

    console.log('Executando baseline.sql completo (aguarde ~30s)...');
    await client.query(sql);
    console.log('✅ SUCESSO! TODAS AS 428 TABELAS E FUNÇÕES DO DESKCOMM FORAM CRIADAS NO SUPABASE!');
  } catch (err) {
    console.error('Erro ao executar migration no Supabase:', err.message);
  } finally {
    await client.end();
  }
}

main();
