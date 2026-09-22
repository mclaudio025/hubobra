/**
 * Centralized Store Configuration
 * HubObra - Marketplace e Plataforma da Construção Civil
 * 
 * Todas as informações comerciais, canais de atendimento, PIX e redes sociais
 * são gerenciadas neste arquivo e podem ser customizadas via variáveis de ambiente (.env.local).
 */

export interface StoreConfig {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  cnpj: string;
  domain: string;
  siteUrl: string;
  contact: {
    whatsapp: string;
    whatsappFormatted: string;
    phone: string;
    email: string;
    privacyEmail: string;
    address: string;
    workingHours: string;
  };
  social: {
    instagram: string;
    facebook: string;
    youtube: string;
  };
  payments: {
    pixKey: string;
    pixMerchantName: string;
    pixMerchantCity: string;
  };
}

export const STORE_CONFIG: StoreConfig = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || 'HubObra',
  shortName: process.env.NEXT_PUBLIC_PWA_SHORT_NAME || 'HubObra',
  tagline: process.env.NEXT_PUBLIC_STORE_TAGLINE || 'Marketplace e Plataforma de Materiais de Construção',
  description:
    process.env.NEXT_PUBLIC_PWA_DESCRIPTION ||
    'Plataforma de e-commerce e marketplace para materiais de construção e depósitos',
  cnpj: process.env.NEXT_PUBLIC_STORE_CNPJ || '00.000.000/0001-00',
  domain: process.env.NEXT_PUBLIC_STORE_DOMAIN || 'hubobra.com.br',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',

  contact: {
    whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '5585999999999').replace(/\D/g, ''),
    whatsappFormatted: process.env.NEXT_PUBLIC_WHATSAPP_FORMATTED || '(85) 99999-9999',
    phone: process.env.NEXT_PUBLIC_STORE_PHONE || '(85) 99999-9999',
    email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'contato@hubobra.com.br',
    privacyEmail: process.env.NEXT_PUBLIC_PRIVACY_EMAIL || 'privacidade@hubobra.com.br',
    address:
      process.env.NEXT_PUBLIC_STORE_ADDRESS ||
      'Atendimento e Despacho Regional para Sua Obra',
    workingHours:
      process.env.NEXT_PUBLIC_STORE_HOURS ||
      'Segunda a Sexta: 07:30 às 18:00 | Sábado: 08:00 às 13:00',
  },

  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://instagram.com/hubobra',
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://facebook.com/hubobra',
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || 'https://youtube.com/@hubobra',
  },

  payments: {
    pixKey: process.env.NEXT_PUBLIC_PIX_KEY || '85999999999',
    pixMerchantName: process.env.NEXT_PUBLIC_PIX_MERCHANT_NAME || 'HUBOBRA MATERIAIS',
    pixMerchantCity: process.env.NEXT_PUBLIC_PIX_MERCHANT_CITY || 'FORTALEZA',
  },
};

/**
 * Gera link direto para o WhatsApp do atendimento oficial
 */
export function getWhatsAppLink(customMessage?: string, customPhone?: string): string {
  const phone = (customPhone || STORE_CONFIG.contact.whatsapp).replace(/\D/g, '');
  const message = customMessage || `Olá, gostaria de falar com a equipe da ${STORE_CONFIG.name}.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Gera link do WhatsApp para cotação em lote ou orçamento de obra
 */
export function getWhatsAppWholesaleLink(): string {
  return getWhatsAppLink(
    `Olá! Tenho uma lista de materiais de construção e gostaria de cotar em lote para a minha obra na ${STORE_CONFIG.name}.`
  );
}

/**
 * Gera link do WhatsApp para cotação de um produto específico
 */
export function getWhatsAppProductQuoteLink(productName: string, quantity = 1): string {
  return getWhatsAppLink(
    `Olá! Gostaria de cotar o produto "${productName}" (Quantidade: ${quantity}) para entrega em obra na ${STORE_CONFIG.name}.`
  );
}

/**
 * Gera link do WhatsApp para cadastro ou parceria com lojistas
 */
export function getWhatsAppPartnerLink(): string {
  return getWhatsAppLink(
    `Olá! Tenho uma loja/distribuidora de materiais de construção e gostaria de ser um parceiro vendedor na ${STORE_CONFIG.name}.`
  );
}

/**
 * Formata um telefone para exibição
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    const ddd = cleaned.slice(2, 4);
    const num = cleaned.slice(4);
    return `+55 (${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
  }
  return phone;
}
