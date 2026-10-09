/**
 * Sincronizador de Produtos: HubObra -> GestãoClick ERP
 * Este script lê todos os produtos cadastrados no banco de dados local (Supabase/Prisma)
 * e os cadastra na conta GestãoClick via API REST oficial.
 */

const path = require('path');
const fs = require('fs');
const { PrismaClient } = require(path.resolve('f:/Apps/Projeto Loja Moderna/backend-nestjs/node_modules/@prisma/client'));
const prisma = new PrismaClient();

const ACCESS_TOKEN = 'bd161d881ae27c5d0fa02900b86d68d584346da8';
const SECRET_ACCESS_TOKEN = '66b2bbbd5e6918afc10541dfaaaf5ddf00d4f06f';
const API_URL = 'https://api.gestaoclick.com/produtos';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function syncProducts() {
  console.log('========================================================');
  console.log('🚀 INICIANDO SINCRONIZAÇÃO DE PRODUTOS -> GESTÃOCLICK');
  console.log('========================================================\n');

  const products = await prisma.product.findMany({
    include: {
      category: true,
      images: {
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`📦 Total de produtos encontrados no banco do site: ${products.length}\n`);

  const results = {
    total: products.length,
    sucessos: [],
    falhas: [],
    iniciadoEm: new Date().toISOString()
  };

  let contador = 0;

  for (const p of products) {
    contador++;
    const progresso = `[${contador}/${products.length}]`;
    
    // Preparação dos dados com fallback seguro
    const precoVenda = Number(p.price || 0).toFixed(2);
    const precoCusto = Number(p.cost && p.cost > 0 ? p.cost : (p.price * 0.70)).toFixed(2);
    const estoque = p.stock !== null && p.stock !== undefined ? p.stock : 0;
    const nomeGrupo = p.category ? p.category.name : 'Geral';
    const codigoInterno = p.sku || `SKU-${p.id.substring(0, 8).toUpperCase()}`;

    const payload = {
      nome: p.name.trim(),
      codigo_interno: codigoInterno,
      codigo_barra: p.barcode ? p.barcode.trim() : '',
      valor_custo: precoCusto,
      valor_venda: precoVenda,
      estoque: estoque,
      ativo: p.active ? '1' : '0',
      nome_grupo: nomeGrupo,
      descricao: p.description ? p.description.trim() : p.name.trim()
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access-token': ACCESS_TOKEN,
          'secret-access-token': SECRET_ACCESS_TOKEN
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json().catch(() => null);

      if (response.ok && (resData?.code === 200 || resData?.status === 'success')) {
        const gestaoClickId = resData?.data?.id || resData?.data?.produto_id;
        console.log(`✅ ${progresso} SUCESSO: "${p.name.substring(0, 40)}..." (SKU: ${codigoInterno}) -> GestãoClick ID: ${gestaoClickId}`);
        results.sucessos.push({
          localId: p.id,
          nome: p.name,
          sku: codigoInterno,
          gestaoClickId: gestaoClickId,
          precoVenda,
          estoque
        });
      } else {
        const erroMsg = resData?.message || resData?.error || JSON.stringify(resData);
        console.error(`❌ ${progresso} FALHA: "${p.name.substring(0, 40)}..." -> Erro: ${erroMsg}`);
        results.falhas.push({
          localId: p.id,
          nome: p.name,
          sku: codigoInterno,
          erro: erroMsg
        });
      }
    } catch (err) {
      console.error(`💥 ${progresso} EXCEÇÃO: "${p.name.substring(0, 40)}..." -> ${err.message}`);
      results.falhas.push({
        localId: p.id,
        nome: p.name,
        sku: codigoInterno,
        erro: err.message
      });
    }

    // Intervalo de 150ms para respeitar a taxa da API
    await delay(150);
  }

  results.finalizadoEm = new Date().toISOString();

  console.log('\n========================================================');
  console.log('🏁 SINCRONIZAÇÃO CONCLUÍDA!');
  console.log(`✅ Sucessos: ${results.sucessos.length}`);
  console.log(`❌ Falhas: ${results.falhas.length}`);
  console.log('========================================================\n');

  // Salvar relatório em JSON
  const reportPath = path.resolve('f:/Apps/Projeto Loja Moderna/RELATORIO_SINCRONIZACAO_GESTAOCLICK.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`📄 Relatório salvo em: ${reportPath}`);

  return results;
}

syncProducts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
