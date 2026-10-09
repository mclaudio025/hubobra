const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { DB } = require('./database');
const { setupWebSocket, broadcast, getClientsCount } = require('./websocket');
const { buildEscPosReceipt, buildLx300Romaneio, sendToNetworkPrinter } = require('./printer');

const PORT = process.env.PORT || 3005;
const DIST_PATH = path.join(__dirname, '..', 'dist');

// Função para descobrir o IP local da máquina na rede
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Helpers HTTP
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// MIME types para arquivos estáticos da pasta dist
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

// Servidor Principal
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // -------------------------------------------------------------
  // ROTAS DE API REST (/api/*)
  // -------------------------------------------------------------

  if (pathname.startsWith('/api/')) {
    try {
      // 1. Status do Servidor
      if (pathname === '/api/status' && req.method === 'GET') {
        return sendJson(res, 200, {
          status: 'ONLINE',
          name: 'HubObra ERP - Servidor Central da Loja',
          localIp: getLocalIp(),
          port: PORT,
          connectedTerminals: getClientsCount(),
          timestamp: new Date().toISOString()
        });
      }

      // 2. Listar Pedidos
      if (pathname === '/api/orders' && req.method === 'GET') {
        const statusFilter = url.searchParams.get('status');
        const orders = await DB.getAllOrders(statusFilter);
        return sendJson(res, 200, orders);
      }

      // 3. Criar Novo Pedido (Vendedor no Balcão ou Webhook da IA)
      if (pathname === '/api/orders' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const order = await DB.createOrder(body);

        // 🚀 DISPARO EM TEMPO REAL PARA O CAIXA CENTRAL (< 30ms)
        broadcast('NEW_ORDER', order, 'CAIXA');
        broadcast('ORDER_CREATED', order, null); // Para dashboards

        console.log(`🛒 [NOVO PEDIDO #${order.orderNumber}] Criado por ${order.sellerName || 'IA'} - Total: R$ ${order.total}`);
        return sendJson(res, 201, order);
      }

      // 4. Detalhes de um Pedido
      if (pathname.startsWith('/api/orders/') && req.method === 'GET') {
        const orderId = pathname.replace('/api/orders/', '');
        const order = await DB.getOrderById(orderId);
        if (!order) return sendJson(res, 404, { error: 'Pedido não encontrado' });
        return sendJson(res, 200, order);
      }

      // 5. Baixa / Pagamento no Caixa Central
      if (pathname.match(/^\/api\/orders\/([^\/]+)\/pay$/) && req.method === 'PUT') {
        const orderId = pathname.split('/')[3];
        const body = await parseJsonBody(req);
        const updated = await DB.payOrder(orderId, body);

        // 🚀 DISPARO EM TEMPO REAL: Avisa a Expedição para liberar e o Vendedor que recebeu
        broadcast('ORDER_PAID', updated, 'EXPEDICAO');
        broadcast('ORDER_PAID_VENDEDOR', updated, 'VENDEDOR');
        broadcast('ORDER_UPDATED', updated, null);

        console.log(`💵 [PAGAMENTO RECEBIDO #${updated.orderNumber}] Baixa efetuada por ${body.cashierName || 'Caixa'}!`);
        return sendJson(res, 200, updated);
      }

      // 6. Atualizar Status (Expedição em rota, entregue, etc.)
      if (pathname.match(/^\/api\/orders\/([^\/]+)\/status$/) && req.method === 'PUT') {
        const orderId = pathname.split('/')[3];
        const body = await parseJsonBody(req);
        const updated = await DB.updateOrderStatus(orderId, body.status, body.notes);

        broadcast('ORDER_STATUS_CHANGED', updated, null);
        return sendJson(res, 200, updated);
      }

      // 7. Catálogo de Produtos
      if (pathname === '/api/products' && req.method === 'GET') {
        const products = await DB.getAllProducts();
        return sendJson(res, 200, products);
      }

      if (pathname === '/api/products' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const saved = await DB.saveProduct(body);
        broadcast('PRODUCTS_UPDATED', saved, null);
        return sendJson(res, 200, saved);
      }

      // 8. Clientes
      if (pathname === '/api/customers' && req.method === 'GET') {
        const customers = await DB.getAllCustomers();
        return sendJson(res, 200, customers);
      }

      if (pathname === '/api/customers' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const saved = await DB.saveCustomer(body);
        return sendJson(res, 200, saved);
      }

      // 9. Disparo de Impressão de Rede (Elgin i7/i9 ou Epson LX-300)
      if (pathname === '/api/print' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const { order, printerType, printerIp, storeName } = body;

        if (!order) return sendJson(res, 400, { error: 'Dados do pedido obrigatórios' });

        let buffer;
        if (printerType === 'DOT_MATRIX_LX300') {
          buffer = buildLx300Romaneio(order, storeName);
        } else {
          // Padrão: Elgin i7 ou i9 térmico 80mm
          buffer = buildEscPosReceipt(order, storeName);
        }

        if (printerIp) {
          try {
            const result = await sendToNetworkPrinter(printerIp, buffer);
            return sendJson(res, 200, result);
          } catch (err) {
            return sendJson(res, 502, { error: err.message });
          }
        }

        // Se não passou IP de rede, devolve o buffer codificado em base64
        return sendJson(res, 200, {
          success: true,
          mode: 'RAW_BUFFER',
          base64: buffer.toString('base64')
        });
      }

      return sendJson(res, 404, { error: 'Rota de API não encontrada' });
    } catch (err) {
      console.error('❌ [API ERROR]:', err);
      return sendJson(res, 500, { error: 'Erro interno no servidor local', details: err.message });
    }
  }

  // -------------------------------------------------------------
  // SERVIR ARQUIVOS ESTÁTICOS DO FRONTEND (dist/) COM SPA FALLBACK
  // -------------------------------------------------------------

  let filePath = path.join(DIST_PATH, pathname === '/' ? 'index.html' : pathname);

  // Se o arquivo não existir (rotas de SPA tipo /caixa, /vendedor), fallback para index.html
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_PATH, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Arquivos do frontend ainda não compilados. Execute `npm run build` na pasta hubobra-erp.');
  }
});

// Inicializa WebSocket no mesmo servidor HTTP
setupWebSocket(server);

// Inicia Servidor
server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log('\n================================================================');
  console.log('   🚀 HUBOBRA ERP - SERVIDOR CENTRAL DA LOJA (ONLINE)');
  console.log('================================================================');
  console.log(`  • Acesso Local:        http://localhost:${PORT}`);
  console.log(`  • Rede dos 12 Terminais: http://${localIp}:${PORT}`);
  console.log(`  • WebSocket em Tempo Real: ws://${localIp}:${PORT}/ws`);
  console.log(`  • Banco de Dados:      SQLite Local (banco_loja.db)`);
  console.log('================================================================');
  console.log('  Terminais podem se conectar. Pressione Ctrl+C para encerrar.\n');
});
