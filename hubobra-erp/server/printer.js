const net = require('net');

/**
 * Módulo de Impressão de Rede Direta para HubObra ERP
 * Suporta:
 * 1. Elgin i7 e Elgin i9: Térmicas não-fiscais 80mm via protocolo ESC/POS (porta 9100 ou USB RAW).
 * 2. Epson LX-300: Matricial de impacto contínua para romaneio de entrega em 2/3 vias (modo texto ESC/P).
 */

const ESC = '\x1B';
const GS = '\x1D';

// Funções Auxiliares de Formatação
function padLine(left, right, width = 48) {
  const space = width - left.length - right.length;
  if (space <= 0) return (left + ' ' + right).substring(0, width);
  return left + ' '.repeat(space) + right;
}

function divider(char = '-', width = 48) {
  return char.repeat(width) + '\n';
}

/**
 * 1. Gera comandos ESC/POS para Elgin i7 e Elgin i9 (Cupom Térmico 80mm)
 */
function buildEscPosReceipt(order, storeName = 'HUBOBRA MATERIAIS DE CONSTRUCAO') {
  let buffer = '';

  // Inicializa impressora
  buffer += ESC + '@';

  // Alinhamento Centralizado + Negrito
  buffer += ESC + 'a' + '\x01';
  buffer += ESC + 'E' + '\x01';
  buffer += `${storeName}\n`;
  buffer += ESC + 'E' + '\x00';
  buffer += `COMPROVANTE DE CONFERENCIA / VENDA\n`;
  buffer += divider('=', 48);

  // Alinhamento à Esquerda
  buffer += ESC + 'a' + '\x00';
  buffer += `PEDIDO: #${order.orderNumber || order.id}\n`;
  buffer += `DATA:   ${new Date(order.createdAt || Date.now()).toLocaleString('pt-BR')}\n`;
  buffer += `VENDEDOR: ${order.sellerName || 'Balcão'}\n`;
  buffer += `CLIENTE:  ${order.customerName || 'Consumidor Final'}\n`;
  if (order.customerCpfCnpj) buffer += `CPF/CNPJ: ${order.customerCpfCnpj}\n`;
  if (order.origin === 'LIA_AI') buffer += `ORIGEM:   ATENDIMENTO WHATSAPP (IA)\n`;
  buffer += divider('-', 48);

  // Cabeçalho dos Itens
  buffer += padLine('ITEM / DESCRICAO', 'QTD x UNIT    TOTAL', 48) + '\n';
  buffer += divider('-', 48);

  // Itens
  (order.items || []).forEach((item, index) => {
    const itemName = `${index + 1}. ${item.name}`.substring(0, 48);
    buffer += `${itemName}\n`;
    const qtdPrice = `${item.quantity} ${item.unit || 'UN'} x R$ ${(item.unitPrice || 0).toFixed(2)}`;
    const totalItem = `R$ ${(item.total || 0).toFixed(2)}`;
    buffer += padLine(`   ${qtdPrice}`, totalItem, 48) + '\n';
  });

  buffer += divider('-', 48);

  // Totais
  buffer += padLine('SUBTOTAL:', `R$ ${(order.subtotal || order.total || 0).toFixed(2)}`, 48) + '\n';
  if (order.discount > 0) {
    buffer += padLine('DESCONTO:', `- R$ ${(order.discount).toFixed(2)}`, 48) + '\n';
  }
  if (order.shipping > 0) {
    buffer += padLine('FRETE / ENTREGA:', `+ R$ ${(order.shipping).toFixed(2)}`, 48) + '\n';
  }

  // Total em Destaque (Negrito + Tamanho Duplo)
  buffer += ESC + 'E' + '\x01';
  buffer += ESC + '!' + '\x30'; // Tamanho duplo
  buffer += padLine('TOTAL:', `R$ ${(order.total || 0).toFixed(2)}`, 24) + '\n';
  buffer += ESC + '!' + '\x00'; // Normal
  buffer += ESC + 'E' + '\x00';

  buffer += divider('-', 48);

  // Formas de Pagamento
  buffer += `FORMA DE PAGAMENTO: ${order.paymentCondition || 'A Vista'}\n`;
  if (order.payments && order.payments.length > 0) {
    order.payments.forEach(p => {
      buffer += ` - ${p.method}: R$ ${(p.amount || 0).toFixed(2)}\n`;
    });
  }

  // Modalidade de Entrega / Saldo de Obra
  if (order.deliveryMode === 'FUTURE_PICKUP') {
    buffer += ESC + 'E' + '\x01';
    buffer += `\n*** SALDO DE OBRA / RETIRADA FUTURA ***\n`;
    buffer += `Material permanece em custodia no galpao.\n`;
    buffer += ESC + 'E' + '\x00';
  }

  buffer += '\n';
  buffer += ESC + 'a' + '\x01'; // Centralizado
  buffer += `Obrigado pela preferencia!\n`;
  buffer += `Guarde este cupom para retirada.\n\n\n\n\n`;

  // Corte de papel automático (Guilhotina Elgin i7/i9)
  buffer += GS + 'V' + '\x00';

  return Buffer.from(buffer, 'latin1');
}

/**
 * 2. Gera comandos ESC/P para Epson LX-300 (Matricial de Formulário Contínuo)
 * Modo Texto Puro Ultra-Rápido para Romaneio de Carga e Entrega (2 vias)
 */
function buildLx300Romaneio(order, storeName = 'HUBOBRA MATERIAIS DE CONSTRUCAO') {
  let text = '';

  // Reset da Matricial Epson
  text += ESC + '@';
  // Fonte 12 CPI (Condensado/Econômico)
  text += ESC + 'M';

  text += '========================================================================\n';
  text += `                ${storeName}\n`;
  text += `             ROMANEIO DE SEPARACAO E ENTREGA DE CARGA\n`;
  text += '========================================================================\n';
  text += `PEDIDO N.: #${order.orderNumber || order.id}       DATA: ${new Date().toLocaleString('pt-BR')}\n`;
  text += `CLIENTE..: ${order.customerName || 'BALCAO'}       FONE: ${order.customerPhone || 'N/A'}\n`;
  text += `VENDEDOR.: ${order.sellerName || 'LOJA'}       CAIXA: ${order.cashierName || 'PAGO'}\n`;
  text += `TIPO.....: ${order.deliveryMode === 'FUTURE_PICKUP' ? 'RETIRADA FUTURA (SALDO)' : 'CARGA IMEDIATA'}\n`;
  text += '------------------------------------------------------------------------\n';
  text += 'ITEM  CODIGO     DESCRICAO DO MATERIAL             UN     QTD.  CONFERIDO\n';
  text += '------------------------------------------------------------------------\n';

  (order.items || []).forEach((item, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const sku = (item.sku || 'N/A').padEnd(10, ' ').substring(0, 10);
    const desc = (item.name || '').padEnd(32, ' ').substring(0, 32);
    const un = (item.unit || 'UN').padEnd(4, ' ').substring(0, 4);
    const qtd = String(item.quantity).padStart(5, ' ');
    text += `${num}   ${sku} ${desc}  ${un}  ${qtd}   [   ]\n`;
  });

  text += '------------------------------------------------------------------------\n';
  text += `OBSERVACOES: ${order.notes || 'Carga conferida no patio da loja.'}\n\n`;
  text += 'RECEBIDO EM PERFEITO ESTADO: ___________________________________________\n';
  text += '                             ASSINATURA DO CLIENTE / RESPONSAVEL DA OBRA\n\n';
  text += 'CONFERIDO POR: ________________________ MOTORISTA: _____________________\n';
  text += '========================================================================\n\n\n';

  // Avanço para o picote do formulário contínuo
  text += '\x0C'; // Form Feed (pula para o picote exato da próxima folha)

  return Buffer.from(text, 'latin1');
}

/**
 * Envia Buffer bruto via Socket TCP direto para uma impressora de rede (Porta 9100)
 */
function sendToNetworkPrinter(printerIp, buffer, port = 9100) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    client.setTimeout(5000);

    client.connect(port, printerIp, () => {
      client.write(buffer, () => {
        client.end();
        resolve({ success: true, message: `Impresso com sucesso em ${printerIp}:${port}` });
      });
    });

    client.on('error', (err) => {
      client.destroy();
      reject(new Error(`Falha de comunicacao com impressora ${printerIp}: ${err.message}`));
    });

    client.on('timeout', () => {
      client.destroy();
      reject(new Error(`Tempo esgotado ao conectar na impressora ${printerIp}:${port}`));
    });
  });
}

module.exports = {
  buildEscPosReceipt,
  buildLx300Romaneio,
  sendToNetworkPrinter
};
