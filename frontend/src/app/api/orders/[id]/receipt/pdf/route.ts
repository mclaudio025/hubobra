import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { renderToString } from 'react-dom/server';
import React from 'react';
import OrderReceipt from '../../../../../components/OrderReceipt';

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
    const orderResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}`,
      {
        headers: {
          'Authorization': request.headers.get('Authorization') || '',
        },
      }
    );

    if (!orderResponse.ok) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    const order = await orderResponse.json();

    // Gerar HTML do recibo
    const receiptHTML = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recibo - Pedido #${order.orderNumber}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          
          .receipt-container {
            max-width: 100%;
            margin: 0;
            padding: 15px;
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.3;
          }
          
          .company-header {
            border-bottom: 2px solid #ea580c;
            padding-bottom: 12px;
            margin-bottom: 15px;
          }
          
          .company-name {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 4px;
          }
          
          .receipt-title {
            color: #ea580c;
            font-size: 18px;
            font-weight: 600;
          }
          
          .info-section {
            background-color: #f9fafb;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 10px;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          .items-table th,
          .items-table td {
            border: 1px solid #d1d5db;
            padding: 6px 8px;
            text-align: left;
            font-size: 11px;
          }
          
          .items-table th {
            background-color: #f3f4f6;
            font-weight: 600;
          }
          
          .total-section {
            background-color: #f9fafb;
            padding: 10px;
            border-radius: 4px;
            text-align: right;
          }
          
          .total-amount {
            font-size: 18px;
            font-weight: bold;
            color: #ea580c;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 500;
          }
          
          .status-pending { background-color: #fef3c7; color: #d97706; }
          .status-confirmed { background-color: #dbeafe; color: #2563eb; }
          .status-processing { background-color: #fed7aa; color: #ea580c; }
          .status-shipped { background-color: #e9d5ff; color: #9333ea; }
          .status-delivered { background-color: #dcfce7; color: #16a34a; }
          .status-cancelled { background-color: #fee2e2; color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <!-- Header da Empresa -->
          <div class="company-header">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <div class="company-name">Zé da Obra - Materiais de Construção</div>
                <p style="color: #6b7280; font-size: 12px; margin: 2px 0;">
                  Av. Bezerra de Menezes, 1000 - São Gerardo, Fortaleza - CE, 60325-000
                </p>
                <p style="color: #6b7280; font-size: 12px; margin: 2px 0;">
                  📞 (85) 3456-7890 | ✉️ contato@zedaobra.com.br
                </p>
                <p style="color: #9ca3af; font-size: 10px; margin: 2px 0;">
                  CNPJ: 12.345.678/0001-90
                </p>
              </div>
              <div style="text-align: right;">
                <div class="receipt-title">🧾 RECIBO</div>
                <p style="font-size: 14px; color: #6b7280; margin: 4px 0;">
                  Pedido #${order.orderNumber}
                </p>
                <p style="font-size: 12px; color: #9ca3af;">
                  ${new Date(order.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          <!-- Informações do Cliente e Status -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="info-section">
              <h3 style="font-weight: 600; margin-bottom: 12px; color: #1f2937;">
                📦 Dados do Cliente
              </h3>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Nome:</strong> ${order.customer.name}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${order.customer.email}</p>
              ${order.customer.phone ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Telefone:</strong> ${order.customer.phone}</p>` : ''}
            </div>
            
            <div class="info-section">
              <h3 style="font-weight: 600; margin-bottom: 12px; color: #1f2937;">
                📅 Status do Pedido
              </h3>
              <p style="margin: 4px 0; font-size: 14px;">
                <strong>Status:</strong> 
                <span class="status-badge status-${order.status.toLowerCase()}">
                  ${getStatusLabel(order.status)}
                </span>
              </p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Pagamento:</strong> ${getPaymentMethodLabel(order.paymentMethod)}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Entrega:</strong> ${order.deliveryMethod === 'DELIVERY' ? 'Entrega em Casa' : 'Retirar na Loja'}</p>
            </div>
          </div>

          <!-- Endereço de Entrega -->
          ${order.deliveryMethod === 'DELIVERY' && order.deliveryAddress ? `
            <div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="font-weight: 600; margin-bottom: 12px; color: #1f2937;">
                📍 Endereço de Entrega
              </h3>
              <p style="font-size: 14px; color: #374151; margin: 2px 0;">
                ${order.deliveryAddress.street}, ${order.deliveryAddress.number}
                ${order.deliveryAddress.complement ? ` - ${order.deliveryAddress.complement}` : ''}
              </p>
              <p style="font-size: 14px; color: #374151; margin: 2px 0;">
                ${order.deliveryAddress.district} - ${order.deliveryAddress.city}/${order.deliveryAddress.state}
              </p>
              <p style="font-size: 14px; color: #374151; margin: 2px 0;">
                CEP: ${order.deliveryAddress.zipCode}
              </p>
            </div>
          ` : ''}

          <!-- Itens do Pedido -->
          <div style="margin-bottom: 20px;">
            <h3 style="font-weight: 600; margin-bottom: 16px; color: #1f2937;">
              📦 Itens do Pedido
            </h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th style="text-align: center;">Qtd</th>
                  <th style="text-align: right;">Valor Unit.</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map((item: any) => `
                  <tr>
                    <td>${item.name}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">${formatCurrency(item.price)}</td>
                    <td style="text-align: right; font-weight: 500;">${formatCurrency(item.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Totais -->
          <div class="total-section">
            <div style="width: 250px; margin-left: auto;">
              <div style="display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px;">
                <span>Subtotal:</span>
                <span>${formatCurrency(order.subtotal)}</span>
              </div>
              ${order.shipping > 0 ? `
                <div style="display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px;">
                  <span>Frete:</span>
                  <span>${formatCurrency(order.shipping)}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; margin: 8px 0; padding-top: 8px; border-top: 1px solid #d1d5db;">
                <span style="font-size: 18px; font-weight: bold;">Total:</span>
                <span class="total-amount">${formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <!-- Observações -->
          ${order.notes ? `
            <div style="background-color: #fefce8; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">Observações:</h3>
              <p style="font-size: 14px; color: #374151;">${order.notes}</p>
            </div>
          ` : ''}

          <!-- Footer -->
          <div style="border-top: 1px solid #d1d5db; padding-top: 16px; text-align: center; font-size: 12px; color: #9ca3af;">
            <p>Este é um recibo eletrônico gerado automaticamente.</p>
            <p style="margin-top: 4px;">
              Para dúvidas, entre em contato: (85) 3000-0000 | contato@materiaisceara.com.br
            </p>
            <p style="margin-top: 4px;">www.materiaisceara.com.br</p>
            <p style="margin-top: 8px; color: #d1d5db;">
              Recibo gerado em ${new Date().toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Gerar PDF com Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(receiptHTML, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15px',
        right: '15px',
        bottom: '15px',
        left: '15px'
      },
      scale: 0.8
    });

    await browser.close();

    // Retornar PDF
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="recibo-pedido-${order.orderNumber}.pdf"`
      }
    });

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

function getPaymentMethodLabel(method: string) {
  const methods = {
    'PIX': 'PIX',
    'STORE_PICKUP': 'Pagar na Entrega',
    'PAYMENT_LINK': 'Pagar na Entrega',
    'CASH_ON_DELIVERY': 'Pagar na Entrega',
    'CREDIT_CARD': 'Cartão de Crédito',
    'DEBIT_CARD': 'Cartão de Débito'
  };
  return methods[method as keyof typeof methods] || 'Pagar na Entrega';
}

function getStatusLabel(status: string) {
  const statuses = {
    'PENDING': 'Pendente',
    'CONFIRMED': 'Confirmado',
    'PROCESSING': 'Processando',
    'SHIPPED': 'Enviado',
    'DELIVERED': 'Entregue',
    'CANCELLED': 'Cancelado'
  };
  return statuses[status as keyof typeof statuses] || status;
}