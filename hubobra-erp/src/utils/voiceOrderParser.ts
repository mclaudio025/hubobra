import { LocalProduct, SaleItem } from '../db/db';

// Mapeamento de números por extenso em português para dígitos
const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  três: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  meia: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  quatorze: 14,
  catorze: 14,
  quinze: 15,
  dezesseis: 16,
  dezessete: 17,
  dezoito: 18,
  dezenove: 19,
  vinte: 20,
  trinta: 30,
  quarenta: 40,
  cinquenta: 50,
  sessenta: 60,
  setenta: 70,
  oitenta: 80,
  noventa: 90,
  cem: 100,
  cento: 100,
  duzentos: 200,
  duzentas: 200,
  trezentos: 300,
  quatrocentos: 400,
  quinhentos: 500,
  seiscentos: 600,
  setecentos: 700,
  oitocentos: 800,
  novecentos: 900,
  mil: 1000,
};

export interface ParsedVoiceItem {
  rawText: string;
  quantity: number;
  productQuery: string;
  matchedProduct?: LocalProduct;
  unitPrice: number;
  total: number;
}

export function parseNumberFromWords(text: string): { value: number; remainingText: string } | null {
  const clean = text.trim().toLowerCase();
  const words = clean.split(/\s+/);

  // Verifica se a primeira palavra é um número direto (ex: "40", "15.5")
  const firstNum = parseFloat(words[0]);
  if (!isNaN(firstNum)) {
    return {
      value: firstNum,
      remainingText: words.slice(1).join(' '),
    };
  }

  // Verifica se a primeira palavra é número por extenso (ex: "quarenta", "vinte", "duas")
  if (NUMBER_WORDS[words[0]] !== undefined) {
    let currentVal = NUMBER_WORDS[words[0]];
    let idx = 1;

    // Se tiver "e" seguido de unidade (ex: "quarenta e cinco", "vinte e duas")
    if (words[1] === 'e' && words[2] && NUMBER_WORDS[words[2]] !== undefined) {
      currentVal += NUMBER_WORDS[words[2]];
      idx = 3;
    }

    return {
      value: currentVal,
      remainingText: words.slice(idx).join(' '),
    };
  }

  return null;
}

/**
 * Analisa uma frase falada pelo vendedor no fone de ouvido/microfone
 * Exemplo de frases:
 * - "Coloca 40 sacos de cimento poty e 10 argamassa ac3"
 * - "Adiciona 20 barras de ferro 3/8 mais 15 buchas de reducao"
 * - "5 latas de brita 01 e 2 bianco"
 * - "50 cimento poty"
 */
export function parseVoiceOrder(spokenText: string, availableProducts: LocalProduct[]): ParsedVoiceItem[] {
  let text = spokenText
    .toLowerCase()
    .replace(/[,\.;\?!]/g, ' ')
    .replace(/\b(quero|coloca|coloque|adiciona|adicione|bota|bote|me vê|me passa|manda|preciso de|lança|lance|por favor)\b/gi, '')
    .trim();

  // Divide por conectivos de múltiplos itens (" e ", " mais ", " com ", " além de ")
  const chunks = text
    .split(/\s+(?:e\s+(?=\d|[a-z]+)|mais\s+|além\s+de\s+|\+)\s*/i)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const results: ParsedVoiceItem[] = [];

  for (const chunk of chunks) {
    // Remove palavras de unidade ou preposições comuns antes do nome do material
    let cleanChunk = chunk;
    let quantity = 1;

    const numParsed = parseNumberFromWords(cleanChunk);
    if (numParsed) {
      quantity = numParsed.value;
      cleanChunk = numParsed.remainingText;
    }

    // Remove termos de embalagem / preposições (ex: "sacos de", "barras de", "caixas de", "latas de", "metros de", "de", "do", "da")
    let prodQuery = cleanChunk
      .replace(/^\b(sacos?|scs?|barras?|caixas?|cxs?|latas?|peças?|pcs?|metros?|mts?|tubos?|unidades?|uns?|quilos?|kgs?)\s*(de|do|da)?\s*/i, '')
      .replace(/^\b(de|do|da|com)\s+/i, '')
      .trim();

    if (!prodQuery) continue;

    // Busca o produto mais compatível no catálogo
    const matched = findBestProductMatch(prodQuery, availableProducts);

    const unitPrice = matched ? matched.price : 50.0;
    const total = unitPrice * quantity;

    results.push({
      rawText: chunk,
      quantity,
      productQuery: prodQuery,
      matchedProduct: matched,
      unitPrice,
      total,
    });
  }

  return results;
}

export function findBestProductMatch(query: string, products: LocalProduct[]): LocalProduct | undefined {
  const q = query.toLowerCase().trim();

  // 1. Match exato por SKU ou Código
  const skuMatch = products.find((p) => p.sku.toLowerCase() === q || p.barcode === q);
  if (skuMatch) return skuMatch;

  // 2. Match por inclusão direta de nome
  const directNameMatch = products.find(
    (p) => p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase())
  );
  if (directNameMatch) return directNameMatch;

  // 3. Match por palavras-chave com pontuação
  const queryTokens = q.split(/\s+/).filter((t) => t.length > 1);
  let bestScore = 0;
  let bestProduct: LocalProduct | undefined = undefined;

  for (const prod of products) {
    const prodName = prod.name.toLowerCase();
    const prodCat = prod.category.toLowerCase();
    let score = 0;

    for (const token of queryTokens) {
      if (prodName.includes(token)) score += 3;
      if (prodCat.includes(token)) score += 1;
      if (prod.reference && prod.reference.toLowerCase().includes(token)) score += 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestProduct = prod;
    }
  }

  return bestScore >= 2 ? bestProduct : undefined;
}

/**
 * Transforma os itens reconhecidos por voz em SaleItem para a grade de pedidos
 */
export function voiceItemsToSaleItems(voiceItems: ParsedVoiceItem[]): SaleItem[] {
  return voiceItems.map((item) => {
    if (item.matchedProduct) {
      return {
        productId: item.matchedProduct.id,
        name: item.matchedProduct.name,
        sku: item.matchedProduct.sku,
        reference: item.matchedProduct.reference,
        unit: item.matchedProduct.unit,
        unitPrice: item.matchedProduct.price,
        cost: item.matchedProduct.cost,
        quantity: item.quantity,
        discount: 0,
        total: item.matchedProduct.price * item.quantity,
        location: item.matchedProduct.location || 'Pátio Central',
        packaging: item.matchedProduct.packaging,
        observations: '🎙️ Inserido por Comando de Voz',
      };
    }

    // Fallback se não encontrar o produto exato
    const capitalQuery = item.productQuery
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return {
      productId: `prod-voice-${Date.now()}-${Math.random()}`,
      name: capitalQuery,
      sku: 'VOZ-' + Math.floor(1000 + Math.random() * 9000),
      unit: 'UN',
      unitPrice: 53.9,
      cost: 38.0,
      quantity: item.quantity,
      discount: 0,
      total: 53.9 * item.quantity,
      location: 'Galpão 01 - Baia A',
      observations: '🎙️ Inserido por Comando de Voz',
    };
  });
}
