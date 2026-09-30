const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalizeText(text) {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function lemmatize(word) {
  const w = normalizeText(word);
  if (!w || w.length <= 3) return w;
  
  // Plurais e variações comuns em português
  if (w.endsWith("oes") || w.endsWith("ões")) return w.replace(/(oes|ões)$/, "ao");
  if (w.endsWith("ais")) return w.replace(/ais$/, "al");
  if (w.endsWith("eis")) return w.replace(/eis$/, "el");
  if (w.endsWith("ois")) return w.replace(/ois$/, "ol");
  if (w.endsWith("les")) return w.replace(/les$/, "l");
  if (w.endsWith("res")) return w.replace(/res$/, "r");
  if (w.endsWith("zes")) return w.replace(/zes$/, "z");
  if (w.endsWith("ns")) return w.replace(/ns$/, "m");
  if (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("is") && !w.endsWith("us") && !["gas", "gesso", "tres"].includes(w)) {
    return w.slice(0, -1);
  }
  return w;
}

// Tokeniza e lematiza uma string para conjunto de termos
function tokenizeAndLemmatize(text) {
  const norm = normalizeText(text);
  const rawWords = norm.split(" ").filter(w => w.length > 1);
  const lemmas = rawWords.map(w => lemmatize(w));
  return { rawWords, lemmas, rawText: norm };
}

async function run() {
  const categories = await prisma.category.findMany({
    where: { active: true },
    include: { parent: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  const knowledgeBase = categories.map((cat) => {
    const normName = normalizeText(cat.name);
    const parentNorm = cat.parent ? normalizeText(cat.parent.name) : "";
    const isLeaf = Boolean(cat.parentId);

    // Extrair frases e termos limpos da descrição
    const phrases = [];
    const termTokens = new Set();

    // Adicionar nome da categoria
    phrases.push(normName);
    const catTokens = tokenizeAndLemmatize(cat.name);
    catTokens.lemmas.forEach(l => termTokens.add(l));

    if (cat.description) {
      // Separar por linhas, marcadores •, parênteses, barras, vírgulas
      const rawPhrases = cat.description.split(/[\n\r•\*\-;,/()]+/);
      for (const p of rawPhrases) {
        const cleanP = normalizeText(p);
        if (cleanP.length >= 3) {
          phrases.push(cleanP);
          const pTokens = tokenizeAndLemmatize(cleanP);
          pTokens.lemmas.forEach(l => {
            if (l.length > 2 && !["com", "sem", "para", "que", "dos", "das", "por", "sobre", "tipo", "item", "itens", "uso", "geral"].includes(l)) {
              termTokens.add(l);
            }
          });
        }
      }
    }

    return {
      id: cat.id,
      name: cat.name,
      normName,
      parentName: cat.parent?.name,
      parentNorm,
      isLeaf,
      phrases: Array.from(new Set(phrases)),
      terms: Array.from(termTokens),
      rawDescription: cat.description || ""
    };
  });

  const testProducts = [
    { name: "União Soldável 60 Mm Krona", brand: "Krona" },
    { name: "Tubo Esgoto Krona 200 Mm X 6 Metros", brand: "Krona" },
    { name: "Joelho 90 PVC 50Mm Tigre", brand: "Tigre" },
    { name: "Joelho 90 Pvce 75Mm Tigre", brand: "Tigre" },
    { name: "Joelho 45° para Esgoto 100mm Tigre", brand: "Tigre" },
    { name: "Joelho 90 Esgoto Série Normal PVC Fortlev", brand: "Fortlev" },
    { name: "Disco de Lixa 125mm Grão 80", brand: "Norton" },
    { name: "Cola para Tubo PVC 175g", brand: "Amanco" },
    { name: "Fita Veda Rosca 18mm x 50m", brand: "Tigre" }
  ];

  for (const p of testProducts) {
    const { rawWords, lemmas, rawText } = tokenizeAndLemmatize(`${p.name} ${p.brand || ""}`);

    const scoredCats = [];

    for (const cat of knowledgeBase) {
      // Prioridade forte para subcategorias folhas
      let score = cat.isLeaf ? 15 : 0;
      const matched = [];

      // 1. Frases exatas da categoria (ex: "agua fria", "serie normal", "tubos marrons", "discos de lixa")
      for (const phrase of cat.phrases) {
        if (phrase.length >= 4 && rawText.includes(phrase)) {
          score += phrase.length * 3;
          matched.push(`frase: "${phrase}"`);
        }
      }

      // 2. Termos e Lematização
      let termHits = 0;
      for (const t of cat.terms) {
        if (lemmas.includes(t)) {
          termHits++;
          score += 10;
          matched.push(`termo: "${t}"`);
        }
      }

      // 3. Regras de Domínio Especializadas e Anti-Falsos Positivos:
      
      // Regra A: Hidráulica Esgoto vs Água Fria vs Consumíveis
      const isEsgotoProduct = rawText.includes("esgoto") || rawText.includes("pvce") || rawText.includes("pluvial") || rawText.includes("serie normal") || rawText.includes("sifonad");
      const isAguaFriaProduct = rawText.includes("soldavel") || rawText.includes("soldavel") || rawText.includes("agua fria") || rawText.includes("marrom") || rawText.includes("roscavel") || (rawText.includes("joelho") && !isEsgotoProduct) || (rawText.includes("cotovelo") && !isEsgotoProduct) || (rawText.includes("uniao") && !isEsgotoProduct) || (rawText.includes("te ") && !isEsgotoProduct) || (rawText.includes("bucha de reducao") && !isEsgotoProduct);
      const isConsumivel = rawText.includes("cola") || rawText.includes("adesivo") || rawText.includes("veda rosca") || rawText.includes("lubrificante") || rawText.includes("teflon");

      if (cat.normName.includes("esgoto") || cat.normName.includes("pluvia")) {
        if (isEsgotoProduct && !isConsumivel) score += 100;
        if (!isEsgotoProduct) score -= 80;
      }

      if (cat.normName.includes("tubos e conexoes de agua") || cat.normName.includes("agua fria")) {
        if (isAguaFriaProduct && !isEsgotoProduct && !isConsumivel && !rawText.includes("quente") && !rawText.includes("ppr") && !rawText.includes("cpvc")) {
          score += 100;
        }
        if (isEsgotoProduct || isConsumivel) score -= 100;
      }

      if (cat.normName.includes("consumiveis e vedacao")) {
        if (isConsumivel) score += 120;
        // Penalizar se for tubo ou conexão de encanamento puro
        if (rawText.includes("tubo") || rawText.includes("joelho") || rawText.includes("cotovelo") || rawText.includes("uniao") || rawText.includes("curva")) {
          if (!isConsumivel) score -= 150;
        }
      }

      if (cat.normName.includes("agua quente") || cat.normName.includes("ppr") || cat.normName.includes("cpvc")) {
        if (rawText.includes("quente") || rawText.includes("ppr") || rawText.includes("cpvc") || rawText.includes("termofusao")) {
          score += 120;
        } else {
          score -= 50; // Evitar pegar conexões comuns de PVC
        }
      }

      // Regra B: Lixas / Pintura
      if (cat.normName.includes("acessorios de pintura") || cat.normName.includes("lixa") || cat.normName.includes("preparacao de superficie")) {
        if (rawText.includes("lixa") || rawText.includes("disco de lixa") || rawText.includes("trincha") || rawText.includes("rolo")) {
          score += 100;
        }
      }

      // Regra C: Cimentos / Cal / Argamassa
      if (cat.normName.includes("cimentos") || cat.normName.includes("cal") || cat.normName.includes("gesso")) {
        if (!rawText.includes("cimento") && !rawText.includes("cal") && !rawText.includes("gesso")) {
          score -= 60;
        }
      }

      // Regra D: Ferragens / Segurança / Fixação
      if (cat.normName.includes("seguranca e acessos")) {
        if (!rawText.includes("fechadura") && !rawText.includes("cadeado") && !rawText.includes("trinco") && !rawText.includes("trava")) {
          score -= 60;
        }
      }

      if (score > 0) {
        scoredCats.push({
          name: cat.name,
          parent: cat.parentName,
          score,
          matched: matched.slice(0, 4)
        });
      }
    }

    scoredCats.sort((a, b) => b.score - a.score);

    console.log(`\n==============================================`);
    console.log(`PRODUTO: "${p.name}"`);
    console.log(`VENCEDOR ➔ ${scoredCats[0]?.name} (${scoredCats[0]?.score} pts) [Sub de: ${scoredCats[0]?.parent}]`);
    console.log(`Motivo: ${scoredCats[0]?.matched.join(", ")}`);
  }
}

run().finally(() => prisma.$disconnect());
