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

async function run() {
  const categories = await prisma.category.findMany({
    where: { active: true },
    include: { parent: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  const knowledgeBase = categories.map((cat) => {
    const normalizedName = normalizeText(cat.name);
    const exactPhrases = [normalizedName];
    const keywordsSet = new Set();

    normalizedName.split(" ").forEach((word) => {
      if (word.length > 2 && !["com", "sem", "para", "que", "dos", "das", "por", "sobre"].includes(word)) {
        keywordsSet.add(word);
      }
    });

    if (cat.description) {
      const lines = cat.description.split(/[\n\r•\*\-;,]+/);
      for (const line of lines) {
        const cleanedLine = normalizeText(line);
        if (cleanedLine.length >= 3) {
          exactPhrases.push(cleanedLine);
          cleanedLine.split(" ").forEach((w) => {
            if (w.length > 2 && !["com", "sem", "para", "que", "dos", "das", "por", "tipo", "item", "itens"].includes(w)) {
              keywordsSet.add(w);
            }
          });
        }
      }
    }

    if (cat.parent?.name) {
      const normParent = normalizeText(cat.parent.name);
      exactPhrases.push(normParent);
    }

    return {
      id: cat.id,
      name: cat.name,
      normalizedName,
      description: cat.description || "",
      parentName: cat.parent?.name,
      keywords: Array.from(keywordsSet),
      exactPhrases: Array.from(new Set(exactPhrases)),
    };
  });

  const testProducts = [
    { name: "União Soldável 60 Mm Krona", brand: "Krona" },
    { name: "Tubo Esgoto Krona 200 Mm X 6 Metros", brand: "Krona" },
    { name: "Joelho 90 PVC 50Mm Tigre", brand: "Tigre" },
    { name: "Joelho 90 Pvce 75Mm Tigre", brand: "Tigre" },
    { name: "Joelho 45° para Esgoto 100mm Tigre", brand: "Tigre" },
    { name: "Joelho 90 Esgoto Série Normal PVC Fortlev", brand: "Fortlev" }
  ];

  for (const p of testProducts) {
    const normName = normalizeText(p.name);
    const normBrand = normalizeText(p.brand || "");
    const fullProductText = `${normName} ${normBrand}`.trim();
    const productWords = fullProductText.split(" ");

    const catScores = [];

    for (const cat of knowledgeBase) {
      let score = 0;
      const matchedPhrases = [];
      const matchedKeywords = [];

      for (const phrase of cat.exactPhrases) {
        if (phrase.length >= 4 && fullProductText.includes(phrase)) {
          score += phrase.length * 4;
          matchedPhrases.push(phrase);
        }
      }

      for (const kw of cat.keywords) {
        if (productWords.includes(kw)) {
          score += 6;
          matchedKeywords.push(kw);
        } else if (kw.length >= 5 && fullProductText.includes(kw)) {
          score += 3;
          matchedKeywords.push(kw);
        }
      }

      // specific rules
      if (cat.normalizedName.includes("esgoto") || cat.description.toLowerCase().includes("esgoto")) {
        if (fullProductText.includes("esgoto") || fullProductText.includes("pluvial") || fullProductText.includes("ralo") || fullProductText.includes("sifonada")) {
          score += 40;
        }
      }

      if (cat.normalizedName.includes("agua") || cat.normalizedName.includes("pvc") || cat.description.toLowerCase().includes("agua fria")) {
        if (fullProductText.includes("soldavel") || fullProductText.includes("agua fria") || fullProductText.includes("marrom") || fullProductText.includes("rosavel")) {
          score += 40;
        }
        if (fullProductText.includes("esgoto")) {
          score -= 50;
        }
      }

      if (score > 0) {
        catScores.push({
          name: cat.name,
          parent: cat.parentName,
          score,
          matchedPhrases,
          matchedKeywords: matchedKeywords.slice(0, 5)
        });
      }
    }

    catScores.sort((a, b) => b.score - a.score);

    console.log(`\n==============================================`);
    console.log(`PRODUTO: "${p.name}"`);
    console.log(`TOP 3 MATCHES:`);
    catScores.slice(0, 3).forEach((s, idx) => {
      console.log(`  ${idx+1}. [${s.score} pts] ${s.name} (Sub de: ${s.parent})`);
      console.log(`     Frases: ${JSON.stringify(s.matchedPhrases)}`);
      console.log(`     Keywords: ${JSON.stringify(s.matchedKeywords)}`);
    });
  }
}

run().finally(() => prisma.$disconnect());
