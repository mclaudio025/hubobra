import { NextRequest, NextResponse } from 'next/server';

interface WhatsAppSendRequest {
  phone: string;
  message?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body: WhatsAppSendRequest = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID do pedido não fornecido' },
        { status: 400 }
      );
    }

    if (!body.phone) {
      return NextResponse.json(
        { error: 'Número do WhatsApp é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar dados do pedido
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

    // Gerar PDF do recibo
    const pdfResponse = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/orders/${orderId}/receipt/pdf`,
      {
        headers: {
          'Authorization': request.headers.get('Authorization') || '',
        },
      }
    );

    if (!pdfResponse.ok) {
      return NextResponse.json(
        { error: 'Erro ao gerar PDF do recibo' },
        { status: 500 }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Preparar mensagem personalizada
    const defaultMessage = `
🧾 *Recibo do seu pedido*

Olá ${order.customer.name}! 👋

Segue o recibo do seu pedido:

📋 *Pedido:* #${order.orderNumber}
📅 *Data:* ${new Date(order.createdAt).toLocaleDateString('pt-BR')}
💰 *Total:* ${formatCurrency(order.total)}
📦 *Status:* ${getStatusLabel(order.status)}

${order.deliveryMethod === 'DELIVERY' 
  ? '🚚 *Entrega:* Será entregue no endereço cadastrado'
  : '🏪 *Retirada:* Disponível para retirada na loja'
}

${order.paymentMethod === 'PIX' 
  ? '💳 *Pagamento:* PIX'
  : order.paymentMethod === 'STORE_PICKUP'
  ? '💰 *Pagamento:* Na entrega'
  : '💳 *Pagamento:* ' + getPaymentMethodLabel(order.paymentMethod)
}

Qualquer dúvida, estamos à disposição! 😊

*Materiais de Construção Ceará*
📞 (85) 3000-0000
`.trim();

    const messageToSend = body.message || defaultMessage;

    // Enviar via WhatsApp através do backend
    const whatsappResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/whatsapp/send-document`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        body: JSON.stringify({
          phone: body.phone,
          message: messageToSend,
          document: {
            data: Buffer.from(pdfBuffer).toString('base64'),
            filename: `recibo-pedido-${order.orderNumber}.pdf`,
            mimetype: 'application/pdf'
          }
        }),
      }
    );

    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Erro ao enviar WhatsApp' },
        { status: whatsappResponse.status }
      );
    }

    const result = await whatsappResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Recibo enviado por WhatsApp com sucesso',
      whatsappId: result.id,
      sentTo: body.phone
    });

  } catch (error) {
    console.error('Erro ao enviar recibo por WhatsApp:', error);
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
    'PAYMENT_LINK': 'Link de Pagamento',
    'CASH_ON_DELIVERY': 'Pagamento na Entrega',
    'CREDIT_CARD': 'Cartão de Crédito',
    'DEBIT_CARD': 'Cartão de Débito'
  };
  return methods[method as keyof typeof methods] || method;
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