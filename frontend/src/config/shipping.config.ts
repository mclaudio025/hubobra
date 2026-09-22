/**
 * Motor de Regras e Cálculo de Frete Regional
 * HubConstruções - Fortaleza e Região Metropolitana (CE)
 */

export interface ShippingRateResult {
  isFree: boolean;
  fee: number;
  feeFormatted: string;
  zone: 'FREE_FORTALEZA' | 'PAID_FORTALEZA' | 'RMF' | 'INTERIOR_CE' | 'OUT_OF_STATE';
  zoneName: string;
  estimatedDays: string;
  description: string;
  pickupAvailable: boolean;
  pickupAddress: string;
  pickupInstructions: string;
  requiresQuote?: boolean;
}

export interface ShippingCalculationParams {
  cep?: string;
  city?: string;
  neighborhood?: string;
  state?: string;
  subtotal?: number;
}

// Bairros de Fortaleza configurados com Frete Grátis (nomes normalizados)
export const DEFAULT_FREE_NEIGHBORHOODS = [
  'aldeota',
  'meireles',
  'papicu',
  'coco',
  'cocó',
  'centro',
  'fatima',
  'fátima',
  'bairro de fatima',
  'bairro de fátima',
  'benfica',
  'montese',
  'parquelandia',
  'parquelândia',
  'sao gerardo',
  'são gerardo',
  'dionisio torres',
  'dionísio torres',
  'joaquim tavora',
  'joaquim távora',
  'varjota',
  'praia de iracema',
  'mucuripe',
  'guararapes',
  'engenheiro luciano cavalcante',
  'luciano cavalcante',
  'messejana',
  'cidade dos funcionarios',
  'cidade dos funcionários',
  'cambeba',
  'parque manibura',
  'passare',
  'passaré',
  'parreao',
  'parreão',
  'damas',
  'bom futuro',
  'vila uniao',
  'vila união',
  'aeroporto',
  'jose bonifacio',
  'josé bonifácio',
  'patriotolino',
  'edson queiroz',
  'maraponga',
  'parangaba',
  'itaperi',
  'serrinha',
  'jacarecanga',
  'carlito pamplona',
  'monte castelo',
  'farias brito',
  'amadeu furtado',
  'rodrolfo teofilo',
  'rodolfo teófilo',
  'bela vista',
  'pan americano',
  'couto fernandes',
  'democrito rocha',
  'demócrito rocha',
  'itaoca',
  'parque araxá',
  'parque araxa'
];

// Cidades da Região Metropolitana de Fortaleza (RMF)
export const RMF_CITIES = [
  'caucaia',
  'maracanau',
  'maracanaú',
  'eusebio',
  'eusébio',
  'aquiraz',
  'maranguape',
  'pacatuba',
  'horizonte',
  'pacajus',
  'itaitinga',
  'sao goncalo do amarante',
  'são gonçalo do amarante',
  'guaiuba',
  'guaiúba',
  'pindoretama',
  'cascavel',
  'paracuru',
  'trairi'
];

// Configuração padrão de frete
export const SHIPPING_CONFIG = {
  storeState: 'CE',
  storeCity: 'Fortaleza',
  
  rates: {
    standardDeliveryFee: Number(process.env.NEXT_PUBLIC_SHIPPING_STANDARD_FEE || 25), // Demais bairros de Fortaleza
    rmfDeliveryFee: Number(process.env.NEXT_PUBLIC_SHIPPING_RMF_FEE || 45), // Região Metropolitana
    interiorDeliveryFee: Number(process.env.NEXT_PUBLIC_SHIPPING_INTERIOR_FEE || 75), // Interior do Ceará
  },

  pickup: {
    enabled: true,
    name: 'Centro de Distribuição Parceiro - Fortaleza',
    address: 'Ponto de Coleta Central - Fortaleza, CE',
    instructions:
      'Após a confirmação do pedido, nossa equipe entrará em contato via WhatsApp com a localização exata do galpão de retirada e o código de autorização.',
    estimatedTime: 'Disponível em até 24h úteis após confirmação',
  }
};

/**
 * Normaliza strings para comparação (remove acentos e converte para minúsculas)
 */
function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Motor de Cálculo de Frete
 */
export function calculateShippingRates(params: ShippingCalculationParams): ShippingRateResult {
  const { cep, city, neighborhood, state } = params;
  const cleanCep = (cep || '').replace(/\D/g, '');
  const normCity = normalizeText(city || '');
  const normNeigh = normalizeText(neighborhood || '');
  const normState = (state || 'CE').toUpperCase().trim();

  const pickupInfo = {
    pickupAvailable: SHIPPING_CONFIG.pickup.enabled,
    pickupAddress: SHIPPING_CONFIG.pickup.address,
    pickupInstructions: SHIPPING_CONFIG.pickup.instructions,
  };

  // 1. Verificação de Estado fora do Ceará
  if (normState && normState !== 'CE') {
    return {
      isFree: false,
      fee: 0,
      feeFormatted: 'Sob Consulta',
      zone: 'OUT_OF_STATE',
      zoneName: 'Fora do Estado do Ceará',
      estimatedDays: 'A combinar',
      description:
        'Para entregas fora do Ceará, fale diretamente com nossa central via WhatsApp para cotação de transportadora.',
      requiresQuote: true,
      ...pickupInfo,
    };
  }

  // 2. Identificação de Fortaleza por Nome ou por Faixa de CEP (60000-000 a 60999-999)
  const isFortalezaCep = cleanCep.length >= 2 && cleanCep.startsWith('60');
  const isFortalezaCity = normCity.includes('fortaleza') || isFortalezaCep;

  if (isFortalezaCity) {
    // Verificar se o bairro está na lista de bairros com frete grátis
    const isFreeNeighborhood = DEFAULT_FREE_NEIGHBORHOODS.some(
      (freeBairro) =>
        normNeigh.includes(normalizeText(freeBairro)) ||
        normalizeText(freeBairro).includes(normNeigh)
    );

    // CEPs centrais de Fortaleza também qualificam
    const isCentralCep =
      cleanCep.length >= 5 &&
      parseInt(cleanCep.slice(0, 5), 10) >= 60000 &&
      parseInt(cleanCep.slice(0, 5), 10) <= 60599;

    if (isFreeNeighborhood || isCentralCep) {
      return {
        isFree: true,
        fee: 0,
        feeFormatted: 'GRÁTIS',
        zone: 'FREE_FORTALEZA',
        zoneName: 'Área de Frete Grátis (Fortaleza)',
        estimatedDays: '1 a 2 dias úteis',
        description: 'Parabéns! Sua localização está dentro da área de entrega gratuita da HubConstruções.',
        ...pickupInfo,
      };
    }

    // Demais bairros de Fortaleza
    const standardFee = SHIPPING_CONFIG.rates.standardDeliveryFee;
    return {
      isFree: false,
      fee: standardFee,
      feeFormatted: `R$ ${standardFee.toFixed(2).replace('.', ',')}`,
      zone: 'PAID_FORTALEZA',
      zoneName: 'Entrega Fortaleza',
      estimatedDays: '1 a 2 dias úteis',
      description: 'Taxa fixa de entrega expressa para seu bairro em Fortaleza.',
      ...pickupInfo,
    };
  }

  // 3. Região Metropolitana de Fortaleza (RMF)
  const isRmfCity = RMF_CITIES.some(
    (rmf) => normCity.includes(normalizeText(rmf)) || normalizeText(rmf).includes(normCity)
  );
  const isRmfCep = cleanCep.length >= 3 && cleanCep.startsWith('61');

  if (isRmfCity || isRmfCep) {
    const rmfFee = SHIPPING_CONFIG.rates.rmfDeliveryFee;
    return {
      isFree: false,
      fee: rmfFee,
      feeFormatted: `R$ ${rmfFee.toFixed(2).replace('.', ',')}`,
      zone: 'RMF',
      zoneName: 'Região Metropolitana de Fortaleza',
      estimatedDays: '2 a 3 dias úteis',
      description: 'Entrega via frota parceira para a Região Metropolitana de Fortaleza.',
      ...pickupInfo,
    };
  }

  // 4. Interior do Ceará
  const interiorFee = SHIPPING_CONFIG.rates.interiorDeliveryFee;
  return {
    isFree: false,
    fee: interiorFee,
    feeFormatted: `R$ ${interiorFee.toFixed(2).replace('.', ',')}`,
    zone: 'INTERIOR_CE',
    zoneName: 'Interior do Ceará',
    estimatedDays: '3 a 5 dias úteis',
    description: 'Despacho rodoviário para o interior do estado do Ceará.',
    ...pickupInfo,
  };
}
