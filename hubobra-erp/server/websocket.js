const { WebSocketServer } = require('ws');

let wss = null;
const clients = new Map(); // ws => { role, name, terminalId, connectedAt }

function setupWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    const clientData = {
      role: 'DESCONHECIDO',
      name: 'Terminal ' + clientIp,
      ip: clientIp,
      connectedAt: new Date().toISOString()
    };
    clients.set(ws, clientData);

    console.log(`📡 [WS] Novo terminal conectado: ${clientIp}`);

    // Envia confirmação de boas-vindas
    ws.send(JSON.stringify({
      type: 'CONNECTED',
      message: 'Conectado ao Servidor Central HubObra ERP',
      serverTime: new Date().toISOString()
    }));

    ws.on('message', (message) => {
      try {
        const payload = JSON.parse(message);
        handleMessage(ws, payload);
      } catch (err) {
        console.error('❌ [WS] Erro ao processar mensagem JSON:', err);
      }
    });

    ws.on('close', () => {
      const info = clients.get(ws);
      console.log(`🔌 [WS] Terminal desconectado: ${info ? info.name : clientIp}`);
      clients.delete(ws);
      broadcastConnectedTerminals();
    });

    ws.on('error', (err) => {
      console.error(`⚠️ [WS] Erro na conexão:`, err.message);
    });
  });

  // Heartbeat a cada 30 segundos para manter conexões vivas através de roteadores Wi-Fi
  setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.ping();
      }
    });
  }, 30000);

  return wss;
}

function handleMessage(ws, data) {
  const current = clients.get(ws);

  switch (data.type) {
    case 'REGISTER':
      // O terminal se identifica: { type: 'REGISTER', role: 'CAIXA', name: 'Caixa 01' }
      if (current) {
        current.role = (data.role || 'VENDEDOR').toUpperCase();
        current.name = data.name || current.name;
        current.terminalId = data.terminalId || 'term_' + Math.random().toString(36).substr(2, 4);
        console.log(`✅ [WS] Terminal registrado: [${current.role}] ${current.name}`);
        
        ws.send(JSON.stringify({
          type: 'REGISTERED',
          role: current.role,
          name: current.name
        }));

        broadcastConnectedTerminals();
      }
      break;

    case 'PING':
      ws.send(JSON.stringify({ type: 'PONG', time: Date.now() }));
      break;

    default:
      console.log(`ℹ️ [WS] Mensagem recebida de ${current ? current.name : 'anon'}:`, data.type);
  }
}

// Emite para terminais de um setor específico (ou para todos)
function broadcast(eventType, data, targetRole = null) {
  if (!wss) return;

  const message = JSON.stringify({
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  });

  let count = 0;
  wss.clients.forEach((ws) => {
    if (ws.readyState === ws.OPEN) {
      const clientInfo = clients.get(ws);
      if (!targetRole || (clientInfo && clientInfo.role === targetRole.toUpperCase())) {
        ws.send(message);
        count++;
      }
    }
  });

  console.log(`📢 [WS Broadcast] ${eventType} enviado para ${count} terminais (Alvo: ${targetRole || 'TODOS'})`);
}

function broadcastConnectedTerminals() {
  const terminalList = [];
  clients.forEach((val) => {
    terminalList.push({ role: val.role, name: val.name, ip: val.ip });
  });

  broadcast('TERMINALS_UPDATE', terminalList, null);
}

module.exports = {
  setupWebSocket,
  broadcast,
  getClientsCount: () => clients.size
};
