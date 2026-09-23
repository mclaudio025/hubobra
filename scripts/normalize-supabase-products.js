const https = require('https');

const supabaseUrl = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

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

const KNOWN_BRANDS = {
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

function normalizeProductName(name) {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  const words = trimmed.split(' ');
  const normalizedWords = words.map((rawWord, index) => {
    const match = rawWord.match(/^([^a-zA-Z0-9À-ÿ]*)([a-zA-Z0-9À-ÿ/".-]+)([^a-zA-Z0-9À-ÿ]*)$/);
    if (!match) return rawWord;

    const prefix = match[1];
    const word = match[2];
    const suffix = match[3];
    const wordUpper = word.toUpperCase();
    const wordLower = word.toLowerCase();

    if (ACRONYMS.has(wordUpper)) {
      return prefix + wordUpper + suffix;
    }

    if (KNOWN_BRANDS[wordLower]) {
      return prefix + KNOWN_BRANDS[wordLower] + suffix;
    }

    if (/^\d+(?:[.,]\d+)?(?:kg|g|mg|l|ml|m|cm|mm|m2|m3|pol|"|v|w|a|kva|kwh|cv|hp|un|pcs|pc)$/i.test(word)) {
      return prefix + word.replace(/(v|w|a|kva|kwh|cv|hp)$/i, (m) => m.toUpperCase()) + suffix;
    }

    if (/^\d*(?:\.\d+)?\/\d+(?:"|pol)?$/i.test(word)) {
      return prefix + word + suffix;
    }

    if (word.includes('-')) {
      const parts = word.split('-');
      const formattedParts = parts.map((part) => {
        const pUpper = part.toUpperCase();
        if (ACRONYMS.has(pUpper)) return pUpper;
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      });
      return prefix + formattedParts.join('-') + suffix;
    }

    if (index > 0 && PREPOSITIONS.has(wordLower)) {
      return prefix + wordLower + suffix;
    }

    return prefix + word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() + suffix;
  });

  return normalizedWords.join(' ');
}

function normalizeDescription(description) {
  if (!description || typeof description !== 'string') return '';
  const trimmed = description.trim();
  if (!trimmed) return '';

  const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
  const isAllLower = trimmed === trimmed.toLowerCase() && /[a-z]/.test(trimmed);

  if (!isAllCaps && !isAllLower) {
    return trimmed;
  }

  const lines = trimmed.split('\n');
  const normalizedLines = lines.map((line) => {
    const lineTrimmed = line.trim();
    if (!lineTrimmed) return '';

    let formatted = lineTrimmed.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-zà-ÿ])/g, (_, sep, char) => {
      return sep + char.toUpperCase();
    });

    ACRONYMS.forEach((acronym) => {
      const regex = new RegExp(`\\b${acronym}\\b`, 'gi');
      formatted = formatted.replace(regex, acronym);
    });

    Object.entries(KNOWN_BRANDS).forEach(([key, proper]) => {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      formatted = formatted.replace(regex, proper);
    });

    return formatted;
  });

  return normalizedLines.join('\n');
}

function normalizeBrand(brand) {
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

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(supabaseUrl + path);
    const options = {
      method: method,
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      headers: {
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', (c) => d += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(d));
        } catch (e) {
          resolve({ raw: d });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('🔄 Buscando produtos no Supabase...');
  const products = await request('GET', '/rest/v1/products?select=*');

  if (!Array.isArray(products)) {
    console.error('❌ Erro ao buscar produtos:', products);
    return;
  }

  console.log(`📦 Encontrados ${products.length} produtos.`);
  let updatedCount = 0;

  for (const p of products) {
    const originalName = p.name || '';
    const originalDesc = p.description || '';
    const originalBrand = p.brand || '';

    const newName = normalizeProductName(originalName);
    const newDesc = originalDesc ? normalizeDescription(originalDesc) : originalDesc;
    const newBrand = originalBrand ? normalizeBrand(originalBrand) : originalBrand;

    const hasChanges = (newName !== originalName) || 
                        (newDesc !== originalDesc) || 
                        (newBrand !== originalBrand);

    if (hasChanges) {
      console.log(`\n✏️  Atualizando Produto ID ${p.id}:`);
      if (newName !== originalName) {
        console.log(`   Nome: "${originalName}" -> "${newName}"`);
      }
      if (newBrand !== originalBrand) {
        console.log(`   Marca: "${originalBrand}" -> "${newBrand}"`);
      }
      if (newDesc !== originalDesc) {
        console.log(`   Desc:  "${originalDesc.slice(0, 40)}..." -> "${newDesc.slice(0, 40)}..."`);
      }

      const patchData = {
        name: newName,
        description: newDesc,
        brand: newBrand
      };

      await request('PATCH', `/rest/v1/products?id=eq.${p.id}`, patchData);
      updatedCount++;
    }
  }

  console.log(`\n🎉 Concluído com sucesso! ${updatedCount} de ${products.length} produtos foram normalizados.`);
}

run();
