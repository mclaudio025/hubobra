import { NextRequest, NextResponse } from 'next/server';
import { STORE_CONFIG } from '@/config/store.config';
import { fetchBackend } from '@/lib/backend-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID do pedido não fornecido' },
        { status: 400 }
      );
    }

    // Buscar dados do pedido no backend
    const orderResponse = await fetchBackend(`/orders/${orderId}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    if (!orderResponse.ok) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    const order = await orderResponse.json();
    const customerName = order.user?.name || order.customer?.name || order.shippingAddress?.recipientName || 'Cliente';
    const customerEmail = order.user?.email || order.customer?.email || 'N/A';
    const customerPhone = order.user?.phone || order.customer?.phone || order.shippingAddress?.phone || 'N/A';
    const orderItems = order.items || [];
    const total = Number(order.totalAmount || order.total || 0);
    const subtotal = Number(order.subtotal || total);
    const shipping = Number(order.shippingFee || order.shipping || 0);
    const discount = Number(order.discount || 0);

    // Gerar HTML do recibo
    const receiptHTML = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recibo Oficial - Pedido #${order.orderNumber || order.id?.slice(0, 8)}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            background: #fff;
            padding: 24px;
            font-size: 13px;
            line-height: 1.4;
          }
          .header {
            border-bottom: 2px solid #ea580c;
            padding-bottom: 16px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .brand-name {
            font-size: 24px;
            font-weight: 800;
            color: #ea580c;
            letter-spacing: -0.5px;
          }
          .brand-sub {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
          }
          .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .badge-pending { background: #fef3c7; color: #b45309; }
          .badge-confirmed { background: #dcfce7; color: #15803d; }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 20px;
          }
          .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 16px;
          }
          .card-title {
            font-size: 12px;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            margin-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background: #f1f5f9;
            color: #475569;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            padding: 8px 10px;
            border-bottom: 2px solid #cbd5e1;
            text-align: left;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 12px;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .totals-box {
            margin-left: auto;
            width: 280px;
            background: #fff7ed;
            border: 1px solid #fed7aa;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 24px;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 12px;
            color: #64748b;
          }
          .grand-total {
            display: flex;
            justify-content: space-between;
            padding-top: 8px;
            border-top: 2px dashed #ea580c;
            font-size: 16px;
            font-weight: 800;
            color: #ea580c;
          }
          .sign-boxes {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-top: 32px;
            padding-top: 16px;
          }
          .sign-line {
            border-top: 1px solid #94a3b8;
            padding-top: 6px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
          }
          .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
            margin-top: 24px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand-name">${STORE_CONFIG.name}</div>
            <div class="brand-sub">${STORE_CONFIG.tagline}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
              CNPJ: ${STORE_CONFIG.cnpj} &bull; ${STORE_CONFIG.contact.address}
            </div>
            <div style="font-size: 11px; color: #64748b;">
              WhatsApp: ${STORE_CONFIG.contact.whatsappFormatted} &bull; ${STORE_CONFIG.domain}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 16px; font-weight: 800; color: #1e293b;">
              PEDIDO #${order.orderNumber || order.id?.slice(0, 8)}
            </div>
            <div style="font-size: 11px; color: #64748b; margin: 4px 0;">
              Data: ${new Date(order.createdAt).toLocaleString('pt-BR')}
            </div>
            <span class="badge ${order.status === 'CONFIRMED' || order.status === 'DELIVERED' ? 'badge-confirmed' : 'badge-pending'}">
              ${getStatusLabel(order.status)}
            </span>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-title">Dados do Cliente</div>
            <p><strong>Nome:</strong> ${customerName}</p>
            <p><strong>Email:</strong> ${customerEmail}</p>
            <p><strong>Telefone:</strong> ${customerPhone}</p>
          </div>
          <div class="card">
            <div class="card-title">Entrega & Pagamento</div>
            <p><strong>Forma de Pagamento:</strong> ${getPaymentMethodLabel(order.payment?.paymentMethod || order.paymentMethod)}</p>
            <p><strong>Endereço:</strong> ${order.shippingAddress ? `${order.shippingAddress.street}, ${order.shippingAddress.number || 'S/N'} - ${order.shippingAddress.neighborhood || ''}, ${order.shippingAddress.city}/${order.shippingAddress.state}` : 'Retirada na Loja'}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;" class="text-center">#</th>
              <th>Material / Descrição</th>
              <th class="text-center" style="width: 70px;">Qtd</th>
              <th class="text-right" style="width: 90px;">Unitário</th>
              <th class="text-right" style="width: 100px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderItems.map((item: any, idx: number) => `
              <tr>
                <td class="text-center" style="color: #94a3b8;">${idx + 1}</td>
                <td>
                  <div style="font-weight: 600;">${item.product?.name || item.name || 'Produto'}</div>
                  ${item.product?.sku ? `<div style="font-size: 10px; color: #94a3b8;">SKU: ${item.product.sku}</div>` : ''}
                </td>
                <td class="text-center font-bold">${item.quantity}</td>
                <td class="text-right">${formatCurrency(Number(item.price || item.unitPrice || 0))}</td>
                <td class="text-right font-bold">${formatCurrency(Number(item.totalPrice || item.price * item.quantity || 0))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals-box">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>${formatCurrency(subtotal)}</span>
          </div>
          ${shipping > 0 ? `
            <div class="total-line">
              <span>Frete:</span>
              <span>${formatCurrency(shipping)}</span>
            </div>
          ` : ''}
          ${discount > 0 ? `
            <div class="total-line" style="color: #16a34a;">
              <span>Desconto:</span>
              <span>-${formatCurrency(discount)}</span>
            </div>
          ` : ''}
          <div class="grand-total">
            <span>TOTAL GERAL:</span>
            <span>${formatCurrency(total)}</span>
          </div>
        </div>

        <div class="sign-boxes">
          <div class="sign-line">
            Assinatura do Responsável pela Separação (${STORE_CONFIG.name})
          </div>
          <div class="sign-line">
            Assinatura do Recebedor / Cliente
          </div>
        </div>

        <div class="footer">
          Documento gerado eletronicamente por ${STORE_CONFIG.name} (${STORE_CONFIG.domain}) em ${new Date().toLocaleString('pt-BR')}.
        </div>
      </body>
      </html>
    `;

    // Retornar HTML para impressão / visualização direta se preferir ou PDF se puppeteer estiver disponível
    try {
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(receiptHTML, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15px', right: '15px', bottom: '15px', left: '15px' },
        scale: 0.85
      });

      await browser.close();

      return new NextResponse(pdf as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="recibo-pedido-${order.orderNumber || order.id}.pdf"`
        }
      });
    } catch (pdfErr) {
      // Fallback para HTML imprimível se puppeteer nativo não estiver rodando no contêiner
      return new NextResponse(receiptHTML, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        }
      });
    }

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Funções auxiliares
function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function getPaymentMethodLabel(method?: string) {
  const methods: Record<string, string> = {
    'PIX': 'PIX',
    'STORE_PICKUP': 'Pagar na Entrega / Retirada',
    'PAYMENT_LINK': 'Link de Pagamento',
    'CASH_ON_DELIVERY': 'Dinheiro / Cartão na Entrega',
    'CREDIT_CARD': 'Cartão de Crédito',
    'DEBIT_CARD': 'Cartão de Débito'
  };
  return method ? (methods[method] || method) : 'PIX';
}

function getStatusLabel(status?: string) {
  const statuses: Record<string, string> = {
    'PENDING': 'Pendente',
    'CONFIRMED': 'Confirmado',
    'PROCESSING': 'Separando',
    'SHIPPED': 'Enviado',
    'DELIVERED': 'Entregue',
    'CANCELLED': 'Cancelado'
  };
  return status ? (statuses[status] || status) : 'Pendente';
}