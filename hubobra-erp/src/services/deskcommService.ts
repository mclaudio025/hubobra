// Serviço de Integração em Tempo Real com o Deskcomm CRM / Supabase da HubObra

const SUPABASE_URL = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';
const ORGANIZATION_ID = '2e60a3c9-c92f-45df-82f2-19aa9f4abbd9';
const UAZAPI_TOKEN = '2b8e068e-e174-4419-a64c-9b97f4760527';

export interface DeskcommConversation {
  id: string;
  customerName: string;
  customerPhone: string;
  companyName?: string;
  unreadCount: number;
  lastMessageTime: string;
  avatarText: string;
  lastMessagePreview?: string;
  assignedToUserId?: string | null;
  pendingItemsToImport?: Array<{
    productName: string;
    sku: string;
    quantity: number;
    unit: string;
  }>;
}

export interface DeskcommMessage {
  id: string;
  sender: 'CUSTOMER' | 'SELLER' | 'LIA_AI' | 'SYSTEM';
  senderName: string;
  text: string;
  time: string;
  isVoiceAudio?: boolean;
  audioDuration?: string;
  audioTranscript?: string;
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

export async function getRealtimeConversations(): Promise<DeskcommConversation[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/conversations?organization_id=eq.${ORGANIZATION_ID}&select=id,contact_id,assigned_to_user_id,unread_count_for_assignee,last_message_at,last_message_preview,contacts(id,name,display_name,phone_number)&order=last_message_at.desc.nullslast`,
      { headers }
    );

    if (!res.ok) {
      console.warn('Erro ao buscar conversas Deskcomm:', res.status);
      return [];
    }

    const data = await res.json();
    return data.map((item: any) => {
      const contact = item.contacts || {};
      const name = contact.display_name || contact.name || contact.phone_number || 'Cliente WhatsApp';
      const phone = contact.phone_number || '';
      const initials = name
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'CL';

      const date = item.last_message_at ? new Date(item.last_message_at) : new Date();
      const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // Extração de itens prováveis caso haja menção a cimento / argamassa
      const preview = item.last_message_preview || '';
      const pendingItems: Array<{ productName: string; sku: string; quantity: number; unit: string }> = [];
      
      if (preview.toLowerCase().includes('cimento')) {
        const match = preview.match(/(\d+)\s*(?:sacos?|sc)?\s*(?:de\s*)?cimento/i);
        const qty = match ? parseInt(match[1], 10) : 40;
        pendingItems.push({
          productName: 'Cimento Poty Todas as Obras 50kg CP II-F',
          sku: '001100',
          quantity: qty,
          unit: 'SACO',
        });
      }
      if (preview.toLowerCase().includes('argamassa')) {
        const match = preview.match(/(\d+)\s*(?:sacos?|sc)?\s*(?:de\s*)?argamassa/i);
        const qty = match ? parseInt(match[1], 10) : 10;
        pendingItems.push({
          productName: 'Argamassa AC-III Cinza 20kg Quartzolit',
          sku: 'ARG001',
          quantity: qty,
          unit: 'SACO',
        });
      }

      return {
        id: item.id,
        customerName: name,
        customerPhone: phone,
        unreadCount: item.unread_count_for_assignee || 0,
        lastMessageTime: timeStr,
        avatarText: initials,
        lastMessagePreview: preview,
        assignedToUserId: item.assigned_to_user_id,
        pendingItemsToImport: pendingItems.length > 0 ? pendingItems : undefined,
      };
    });
  } catch (err) {
    console.error('Falha de conexão com Deskcomm CRM:', err);
    return [];
  }
}

export async function getRealtimeMessages(conversationId: string): Promise<DeskcommMessage[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/messages?conversation_id=eq.${conversationId}&order=created_at.asc`,
      { headers }
    );

    if (!res.ok) return [];

    const data = await res.json();
    return data.map((m: any) => {
      const isOut = m.direction === 'outbound';
      const isLia = m.sent_via === 'ai_agent' || m.metadata?.sender_name?.includes('Lia') || m.body?.includes('Lia');
      let sender: 'CUSTOMER' | 'SELLER' | 'LIA_AI' | 'SYSTEM' = 'CUSTOMER';
      let senderName = m.metadata?.sender_name || 'Cliente';

      if (isOut) {
        if (isLia) {
          sender = 'LIA_AI';
          senderName = 'Lia (IA)';
        } else {
          sender = 'SELLER';
          senderName = 'Carlos Eduardo';
        }
      }

      const date = m.created_at ? new Date(m.created_at) : new Date();
      const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const isAudio = m.type === 'audio' || m.body?.includes('[Áudio') || m.metadata?.is_audio;

      return {
        id: m.id,
        sender,
        senderName,
        text: m.body || '',
        time: timeStr,
        isVoiceAudio: isAudio,
        audioDuration: isAudio ? '0:18' : undefined,
        audioTranscript: isAudio ? m.body : undefined,
      };
    });
  } catch (err) {
    console.error('Erro ao buscar mensagens do Deskcomm:', err);
    return [];
  }
}

export async function sendWhatsAppMessage(
  conversationId: string,
  phoneNumber: string,
  text: string,
  sellerName = 'Carlos Eduardo'
): Promise<boolean> {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    // 1. Enviar mensagem via Uazapi diretamente para o WhatsApp do cliente
    await fetch('https://hubobra.uazapi.com/send/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token: UAZAPI_TOKEN,
      },
      body: JSON.stringify({
        number: cleanPhone,
        text,
      }),
    });

    // 2. Gravar no Supabase / Deskcomm CRM
    await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        organization_id: ORGANIZATION_ID,
        conversation_id: conversationId,
        channel_session_id: 'd19b8703-4ff5-4221-9b42-bb50d75ddf02',
        direction: 'outbound',
        type: 'text',
        body: text,
        sent_via: 'user',
        status: 'delivered',
        metadata: {
          sender_name: sellerName,
          seller_portal: true,
        },
      }),
    });

    return true;
  } catch (err) {
    console.error('Erro ao enviar mensagem WhatsApp:', err);
    return false;
  }
}
