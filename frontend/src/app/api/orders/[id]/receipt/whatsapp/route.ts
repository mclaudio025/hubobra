import { NextRequest, NextResponse } from 'next/server';
import { STORE_CONFIG } from '@/config/store.config';
import { fetchBackend } from '@/lib/backend-client';

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

    // Preparar mensagem personalizada
    const defaultMessage = `
🧾 *Recibo Oficial do seu Pedido* - *${STORE_CONFIG.name}*

Olá, *${customerName}*! 👋

Aqui estão os detalhes do seu pedido:

📋 *Pedido:* #${order.orderNumber || order.id?.slice(0, 8)}
📅 *Data:* ${new Date(order.createdAt).toLocaleDateString('pt-BR')}
💰 *Total:* ${formatCurrency(Number(order.totalAmount || order.total || 0))}
📦 *Status:* ${getStatusLabel(order.status)}

${order.shippingAddress 
  ? `🚚 *Entrega:* ${order.shippingAddress.street || ''}, ${order.shippingAddress.number || ''} - ${order.shippingAddress.city || ''}/${order.shippingAddress.state || ''}`
  : '🏪 *Retirada:* Na Loja'
}

💳 *Pagamento:* ${getPaymentMethodLabel(order.payment?.paymentMethod || order.paymentMethod)}

🔗 *Acessar Recibo e Rastreamento Online:*
${STORE_CONFIG.siteUrl}/pedidos/${order.id}/recibo

Qualquer dúvida, fale conosco no WhatsApp Oficial: ${STORE_CONFIG.contact.whatsappFormatted}

*${STORE_CONFIG.name}* - ${STORE_CONFIG.tagline}
`.trim();

    const messageToSend = body.message || defaultMessage;

    // Enviar via WhatsApp através do backend se disponível
    const whatsappResponse = await fetchBackend('/whatsapp/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({
        phone: body.phone,
        message: messageToSend,
      }),
    });

    if (!whatsappResponse.ok) {
      // Se não houver webhook/endpoint direto de whatsapp configurado no backend, retorna mensagem formatada
      return NextResponse.json({
        success: true,
        fallbackText: messageToSend,
        message: 'Texto de recibo preparado com sucesso para envio.',
        sentTo: body.phone
      });
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

function getPaymentMethodLabel(method?: string) {
  const methods: Record<string, string> = {
    'PIX': 'PIX (Aprovação Imediata)',
    'STORE_PICKUP': 'Pagar na Entrega / Retirada',
    'PAYMENT_LINK': 'Link de Pagamento Seguro',
    'CASH_ON_DELIVERY': 'Dinheiro / Maquininha na Entrega',
    'CREDIT_CARD': 'Cartão de Crédito',
    'DEBIT_CARD': 'Cartão de Débito',
    'BOLETO': 'Boleto Bancário',
    'TRANSFER': 'Transferência Bancária'
  };
  return method ? (methods[method] || method) : 'PIX';
}

function getStatusLabel(status?: string) {
  const statuses: Record<string, string> = {
    'PENDING': 'Aguardando Pagamento',
    'CONFIRMED': 'Confirmado / Em Separação',
    'PROCESSING': 'Separando no Estoque',
    'SHIPPED': 'Em Rota de Entrega',
    'DELIVERED': 'Entregue com Sucesso',
    'CANCELLED': 'Cancelado'
  };
  return status ? (statuses[status] || status) : 'Pendente';
}