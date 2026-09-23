/**
 * Utilitário de normalização de textos para o ecossistema HubObra / Loja Moderna.
 * Padroniza títulos em Title Case Inteligente, descrições em Sentence Case e marcas.
 */

const PREPOSITIONS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'com', 'sem', 'por', 
  'a', 'o', 'as', 'os', 'um', 'uma', 'na', 'no', 'nas', 'nos', 'sob', 'sobre', 
  'ao', 'aos', 'à', 'às', 'c/', 's/', 'p/'
]);

const ACRONYMS = new Set([
  'PVC', 'PPR', 'CPVC', 'EPI', 'LED', 'HDTV', 'UHF', 'VHF', 'TPI', 'HP', 
  'CV', 'BTU', 'BTUS', 'BIVOLT', 'NBR', 'ABNT', 'EAN', 'SKU', 'MDF', 'MDP', 
  'PU', 'MS', 'UV', 'EPDM', 'ABS', 'SDR', 'DN', 'PN', 'SCH', 'DWT', '3M', 
  'CSN', 'RGB', 'AC', 'DC', 'USB', 'IP65', 'IP66', 'IP67', 'IP68', 'GLP', 'GN'
]);

const KNOWN_BRANDS: Record<string, string> = {
  'starrett': 'Starrett',
  'votoran': 'Votoran',
  'tigre': 'Tigre',
  'amanco': 'Amanco',
  'krona': 'Krona',
  'tramontina': 'Tramontina',
  'vonder': 'Vonder',
  'dewalt': 'DeWalt',
  'bosch': 'Bosch',
  'makita': 'Makita',
  'stanley': 'Stanley',
  'irwin': 'Irwin',
  'gedore': 'Gedore',
  'coral': 'Coral',
  'suvinil': 'Suvinil',
  'quartzolit': 'Quartzolit',
  'fortlev': 'Fortlev',
  'deca': 'Deca',
  'docol': 'Docol',
  'lorenzetti': 'Lorenzetti',
  'guerda': 'Gerdau',
  'gerdau': 'Gerdau',
  'belgo': 'Belgo',
  '3m': '3M',
  '3 m': '3M',
};

/**
 * Normaliza o nome do produto para Title Case inteligente:
 * Ex: "LAMINA DE SERRA STARRETT 24 DENTES BI-METAL 12 POL" -> "Lâmina de Serra Starrett 24 Dentes Bi-Metal 12 Pol"
 * Ex: "tubo pvc soldavel 25mm tigre" -> "Tubo PVC Soldável 25mm Tigre"
 */
export function normalizeProductName(name?: string | null): string {
  if (!name || typeof name !== 'string') return '';
  
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  const words = trimmed.split(' ');
  const normalizedWords = words.map((rawWord, index) => {
    // Tratar pontuações adjacentes
    const match = rawWord.match(/^([^a-zA-Z0-9À-ÿ]*)([a-zA-Z0-9À-ÿ/".-]+)([^a-zA-Z0-9À-ÿ]*)$/);
    if (!match) return rawWord;

    const prefix = match[1];
    const word = match[2];
    const suffix = match[3];
    const wordUpper = word.toUpperCase();
    const wordLower = word.toLowerCase();

    // 1. Siglas conhecidas (PVC, LED, EPI, etc.)
    if (ACRONYMS.has(wordUpper)) {
      return prefix + wordUpper + suffix;
    }

    // 2. Marcas conhecidas
    if (KNOWN_BRANDS[wordLower]) {
      return prefix + KNOWN_BRANDS[wordLower] + suffix;
    }

    // 3. Padrão de medidas / unidades (Ex: 50kg, 25mm, 220v, 1/2", 3/4", 100w, 10a, 18l)
    if (/^\d+(?:[.,]\d+)?(?:kg|g|mg|l|ml|m|cm|mm|m2|m3|pol|"|v|w|a|kva|kwh|cv|hp|un|pcs|pc)$/i.test(word)) {
      // Ajustar voltagem e potência para maiúsculo no final (220V, 100W, 10A)
      return prefix + word.replace(/(v|w|a|kva|kwh|cv|hp)$/i, (m) => m.toUpperCase()) + suffix;
    }

    // 4. Frações de polegada (1/2, 3/4, 1.1/2)
    if (/^\d*(?:\.\d+)?\/\d+(?:"|pol)?$/i.test(word)) {
      return prefix + word + suffix;
    }

    // 5. Palavras com hífen (Ex: Bi-Metal, Anti-Ferrugem)
    if (word.includes('-')) {
      const parts = word.split('-');
      const formattedParts = parts.map((part) => {
        const pLower = part.toLowerCase();
        const pUpper = part.toUpperCase();
        if (ACRONYMS.has(pUpper)) return pUpper;
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      });
      return prefix + formattedParts.join('-') + suffix;
    }

    // 6. Preposições (de, da, do, com, para) -> minúsculas a menos que seja a 1ª palavra
    if (index > 0 && PREPOSITIONS.has(wordLower)) {
      return prefix + wordLower + suffix;
    }

    // 7. Palavra regular -> 1ª letra maiúscula, restante minúscula
    return prefix + word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() + suffix;
  });

  return normalizedWords.join(' ');
}

/**
 * Normaliza a descrição do produto para Sentence Case elegante:
 * Ex: "INDICADO PARA CORTES EM METAIS. ALTA DURABILIDADE." -> "Indicado para cortes em metais. Alta durabilidade."
 */
export function normalizeDescription(description?: string | null): string {
  if (!description || typeof description !== 'string') return '';

  const trimmed = description.trim();
  if (!trimmed) return '';

  // Se não for totalmente em caixa alta nem totalmente em minúsculas (já foi formatado), mantém estrutura
  const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
  const isAllLower = trimmed === trimmed.toLowerCase() && /[a-z]/.test(trimmed);

  if (!isAllCaps && !isAllLower) {
    return trimmed;
  }

  // Divide por quebras de linha e pontuações de término de frase (. ! ?)
  const lines = trimmed.split('\n');
  const normalizedLines = lines.map((line) => {
    const lineTrimmed = line.trim();
    if (!lineTrimmed) return '';

    // Regex para capitalizar o início de cada frase
    let formatted = lineTrimmed.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-zà-ÿ])/g, (_, sep, char) => {
      return sep + char.toUpperCase();
    });

    // Restaurar siglas conhecidas na descrição
    ACRONYMS.forEach((acronym) => {
      const regex = new RegExp(`\\b${acronym}\\b`, 'gi');
      formatted = formatted.replace(regex, acronym);
    });

    // Restaurar marcas conhecidas
    Object.entries(KNOWN_BRANDS).forEach(([key, proper]) => {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      formatted = formatted.replace(regex, proper);
    });

    return formatted;
  });

  return normalizedLines.join('\n');
}

/**
 * Normaliza o nome da Marca / Fabricante
 */
export function normalizeBrand(brand?: string | null): string {
  if (!brand || typeof brand !== 'string') return '';
  const trimmed = brand.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  if (KNOWN_BRANDS[lower]) {
    return KNOWN_BRANDS[lower];
  }

  if (ACRONYMS.has(trimmed.toUpperCase())) {
    return trimmed.toUpperCase();
  }

  return normalizeProductName(trimmed);
}
