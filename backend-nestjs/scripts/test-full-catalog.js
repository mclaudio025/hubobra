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

    const phrases = [];
    const termTokens = new Set();

    phrases.push(normName);
    const catTokens = tokenizeAndLemmatize(cat.name);
    catTokens.lemmas.forEach(l => termTokens.add(l));

    if (cat.description) {
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
    // Hidráulica
    { name: "União Soldável 60 Mm Krona", brand: "Krona", expected: "Tubos e Conexões de Água (PVC)" },
    { name: "Tubo Esgoto Krona 200 Mm X 6 Metros", brand: "Krona", expected: "Tubos e Conexões de Esgoto e Águas Pluviais" },
    { name: "Joelho 90 PVC 50Mm Tigre", brand: "Tigre", expected: "Tubos e Conexões de Água (PVC)" },
    { name: "Joelho 90 Pvce 75Mm Tigre", brand: "Tigre", expected: "Tubos e Conexões de Esgoto e Águas Pluviais" },
    { name: "Joelho 45° para Esgoto 100mm Tigre", brand: "Tigre", expected: "Tubos e Conexões de Esgoto e Águas Pluviais" },
    { name: "Joelho 90 Esgoto Série Normal PVC Fortlev", brand: "Fortlev", expected: "Tubos e Conexões de Esgoto e Águas Pluviais" },
    { name: "Luva Soldável com Rosca 25mm x 3/4 Tigre", brand: "Tigre", expected: "Tubos e Conexões de Água (PVC)" },
    { name: "Adaptador Curto Soldável 50mm x 1.1/2 Krona", brand: "Krona", expected: "Tubos e Conexões de Água (PVC)" },
    { name: "Caixa Sifonada 100x100x50 com Grelha Branca", brand: "Tigre", expected: "Tubos e Conexões de Esgoto e Águas Pluviais" },
    { name: "Ralo Seco Quadrado 10x10 Branco Tigre", brand: "Tigre", expected: "Tubos e Conexões de Esgoto e Águas Pluviais" },
    { name: "Tubo PPR 25mm 3 Metros Amanco Água Quente", brand: "Amanco", expected: "Água Quente (PPR / CPVC)" },
    { name: "Fita Veda Rosca 18mm x 50m", brand: "Tigre", expected: "Consumíveis e Vedação" },
    { name: "Adesivo Plástico para Tubos de PVC 175g", brand: "Amanco", expected: "Consumíveis e Vedação" },
    { name: "Registro de Gaveta 3/4 Base Deca Docol", brand: "Docol", expected: "Registros e Válvulas de Chão/Parede" },
    { name: "Caixa d'Água 500 Litros Polietileno", brand: "Fortlev", expected: "Caixas d'Água e Acessórios" },
    { name: "Sifão Sanfonado Universal Branco", brand: "Blukit", expected: "Mecanismos e Reparos de Banheiro/Cozinha" },
    
    // Elétrica
    { name: "Cabo Flexível 2,5mm 100 Metros Azul", brand: "Sil", expected: "Fios e Cabos Elétricos" },
    { name: "Disjuntor Unipolar 20A DIN Schneider", brand: "Schneider", expected: "Quadros de Distribuição e Disjuntores (Proteção)" },
    { name: "Eletroduto Corrugado Amarelo 3/4 50 Metros", brand: "Tigre", expected: "Eletrodutos e Conduítes (Passagem de Fios)" },
    { name: "Caixa de Luz 4x2 Amarela Embutir Tigre", brand: "Tigre", expected: "Caixas de Luz e Passagem" },
    { name: "Fita Isolante 3M Imperial 19mm x 20m", brand: "3M", expected: "Conexões, Emendas e Isolação" },

    // Pintura
    { name: "Disco de Lixa 125mm Grão 80", brand: "Norton", expected: "Ferramentas de Aplicação (Acessórios de Pintura)" },
    { name: "Rolo de Lã para Pintura 23cm Atlas", brand: "Atlas", expected: "Ferramentas de Aplicação (Acessórios de Pintura)" },
    { name: "Trincha Média 2.1/2 Cerdas Gris Tigre", brand: "Tigre", expected: "Ferramentas de Aplicação (Acessórios de Pintura)" },
    { name: "Tinta Spray Preto Fosco 400ml Tekbond", brand: "Tekbond", expected: "Tintas em Spray" },
    { name: "Tinta Acrílica Fosco Rende Muito 18L Branco Neve", brand: "Coral", expected: "Tintas Imobiliárias (Paredes e Tetos)" },
    { name: "Esmalte Sintético Brilhante Branco 3,6L", brand: "Suvinil", expected: "Tintas para Madeiras e Metais" },
    { name: "Massa Corrida PVA 25kg Suvinil", brand: "Suvinil", expected: "Preparação de Superfície e Tratamento" },
    { name: "Fita Crepe 18mm x 50m para Pintura", brand: "Adelbras", expected: "Proteção e Organização da Pintura" },

    // Básico
    { name: "Cimento CP-II 50kg Votoran", brand: "Votoran", expected: "Cimentos, Cales e Gesso" },
    { name: "Argamassa AC-III Porcelanato Cinza 20kg", brand: "Quartzolit", expected: "Argamassas e Rejuntes" },
    { name: "Tijolo Baiano 8 Furos 9x19x19", brand: "", expected: "Tijolos, Blocos e Canaletas" },
    { name: "Telha de Fibrocimento Ondulada 2,44 x 1,10", brand: "Brasilit", expected: "Telhas e Coberturas" },
    { name: "Impermeabilizante Vedacit 18 Litros", brand: "Vedacit", expected: "Impermeabilizantes e Aditivos" },

    // Ferragens / Fixação
    { name: "Parafuso Chipboard Phillips 4,0 x 40mm Caixa 500 un", brand: "Ciser", expected: "Parafusos" },
    { name: "Prego com Cabeça 18 x 27 Gerdau 1kg", brand: "Gerdau", expected: "Pregos" },
    { name: "Fechadura Externa Stam 803/01 Cromada", brand: "Stam", expected: "Segurança e Acessos" },
    { name: "Cadeado Latão 30mm Pado", brand: "Pado", expected: "Segurança e Acessos" },
    { name: "Bucha de Nylon 8mm com Anel Pacote 100un", brand: "Fischer", expected: "Buchas e Fixações Gerais" }
  ];

  let passed = 0;

  for (const p of testProducts) {
    const { rawWords, lemmas, rawText } = tokenizeAndLemmatize(`${p.name} ${p.brand || ""}`);

    const scoredCats = [];

    for (const cat of knowledgeBase) {
      let score = cat.isLeaf ? 15 : 0;
      const matched = [];

      for (const phrase of cat.phrases) {
        if (phrase.length >= 4 && rawText.includes(phrase)) {
          score += phrase.length * 3;
          matched.push(`frase: "${phrase}"`);
        }
      }

      for (const t of cat.terms) {
        if (lemmas.includes(t)) {
          score += 10;
          matched.push(`termo: "${t}"`);
        }
      }

      // Regras Contextuais Especializadas
      const isEsgotoProduct = rawText.includes("esgoto") || rawText.includes("pvce") || rawText.includes("pluvial") || rawText.includes("serie normal") || rawText.includes("sifonad") || rawText.includes("ralo") || rawText.includes("grelha");
      const isConsumivel = rawText.includes("cola") || rawText.includes("adesivo") || rawText.includes("veda rosca") || rawText.includes("lubrificante") || rawText.includes("teflon") || rawText.includes("solucao limpadora");
      const isAguaFriaProduct = (rawText.includes("soldavel") || rawText.includes("agua fria") || rawText.includes("marrom") || rawText.includes("roscavel") || rawText.includes("joelho") || rawText.includes("cotovelo") || rawText.includes("uniao") || rawText.includes("te ") || rawText.includes("bucha de reducao") || rawText.includes("adaptador curto") || rawText.includes("curva 90") || rawText.includes("curva 45")) && !isEsgotoProduct && !isConsumivel;

      // Hidráulica
      if (cat.normName.includes("esgoto") || cat.normName.includes("pluvia")) {
        if (isEsgotoProduct && !isConsumivel) score += 100;
        if (!isEsgotoProduct) score -= 80;
      }

      if (cat.normName.includes("tubos e conexoes de agua") || cat.normName.includes("agua fria")) {
        if (isAguaFriaProduct && !rawText.includes("quente") && !rawText.includes("ppr") && !rawText.includes("cpvc")) {
          score += 100;
        }
        if (isEsgotoProduct || isConsumivel) score -= 100;
      }

      if (cat.normName.includes("consumiveis e vedacao")) {
        if (isConsumivel) score += 120;
        if (rawText.includes("tubo") || rawText.includes("joelho") || rawText.includes("cotovelo") || rawText.includes("uniao") || rawText.includes("curva") || rawText.includes("cabo")) {
          if (!isConsumivel) score -= 150;
        }
      }

      if (cat.normName.includes("agua quente") || cat.normName.includes("ppr") || cat.normName.includes("cpvc")) {
        if (rawText.includes("quente") || rawText.includes("ppr") || rawText.includes("cpvc") || rawText.includes("termofusao") || rawText.includes("aquatherm")) {
          score += 120;
        } else {
          score -= 50;
        }
      }

      if (cat.normName.includes("registros e valvulas")) {
        if (rawText.includes("registro") || rawText.includes("valvula")) score += 100;
      }

      if (cat.normName.includes("caixas d agua") || cat.normName.includes("reservatorio")) {
        if (rawText.includes("caixa d agua") || rawText.includes("caixa dagua") || rawText.includes("reservatorio") || rawText.includes("boia")) score += 100;
      }

      if (cat.normName.includes("mecanismos e reparos")) {
        if (rawText.includes("sifao") || rawText.includes("engate flexivel") || rawText.includes("mecanismo descarga") || rawText.includes("salva registro")) score += 100;
      }

      // Elétrica
      if (cat.normName.includes("fios e cabos")) {
        if (rawText.includes("cabo flexivel") || rawText.includes("cabo pp") || rawText.includes("fio paralelo") || (rawText.includes("cabo") && (rawText.includes("mm") || rawText.includes("azul") || rawText.includes("preto") || rawText.includes("verde") || rawText.includes("vermelho")))) score += 100;
      }

      if (cat.normName.includes("quadros de distribuicao e disjuntores")) {
        if (rawText.includes("disjuntor") || rawText.includes("quadro de distribuicao") || rawText.includes("dr") || rawText.includes("dps") || rawText.includes("barramento")) score += 100;
      }

      if (cat.normName.includes("eletrodutos e conduites")) {
        if (rawText.includes("conduite") || rawText.includes("corrugado") || rawText.includes("eletroduto")) score += 100;
      }

      if (cat.normName.includes("caixas de luz")) {
        if (rawText.includes("4x2") || rawText.includes("4x4") || rawText.includes("caixa octogonal") || (rawText.includes("caixa") && rawText.includes("luz"))) score += 100;
      }

      if (cat.normName.includes("conexoes emendas e isolacao")) {
        if (rawText.includes("fita isolante") || rawText.includes("conector wago") || rawText.includes("conector torcao") || rawText.includes("conector porcelana")) score += 100;
      }

      // Pintura
      if (cat.normName.includes("ferramentas de aplicacao") || cat.normName.includes("acessorios de pintura")) {
        if (rawText.includes("lixa") || rawText.includes("disco de lixa") || rawText.includes("rolo") || rawText.includes("trincha") || rawText.includes("pincel") || rawText.includes("bandeja")) score += 100;
      }

      if (cat.normName.includes("tintas em spray")) {
        if (rawText.includes("spray") || rawText.includes("aerossol")) score += 120;
      }

      if (cat.normName.includes("tintas imobiliarias")) {
        if ((rawText.includes("tinta acrilica") || rawText.includes("tinta latex") || rawText.includes("tinta pva") || rawText.includes("rende muito") || rawText.includes("lavavel")) && !rawText.includes("spray")) score += 100;
      }

      if (cat.normName.includes("tintas para madeiras e metais")) {
        if (rawText.includes("esmalte sintetico") || rawText.includes("verniz") || rawText.includes("stain")) score += 100;
      }

      if (cat.normName.includes("preparacao de superficie")) {
        if (rawText.includes("massa corrida") || rawText.includes("massa acrilica") || rawText.includes("selador") || rawText.includes("fundo preparador")) score += 100;
      }

      if (cat.normName.includes("protecao e organizacao da pintura")) {
        if (rawText.includes("fita crepe") || rawText.includes("lona plastica") || rawText.includes("salva piso")) score += 100;
      }

      // Básico
      if (cat.normName.includes("cimentos cales e gesso")) {
        if (rawText.includes("cimento") || rawText.includes("cal ") || rawText.includes("gesso")) score += 100;
        else score -= 80;
      }

      if (cat.normName.includes("argamassas e rejuntes")) {
        if (rawText.includes("argamassa") || rawText.includes("ac-i") || rawText.includes("ac-ii") || rawText.includes("ac-iii") || rawText.includes("ac1") || rawText.includes("ac2") || rawText.includes("ac3") || rawText.includes("rejunte")) score += 100;
      }

      if (cat.normName.includes("tijolos blocos e canaletas")) {
        if (rawText.includes("tijolo") || rawText.includes("bloco") || rawText.includes("canaleta") || rawText.includes("cobogo")) score += 100;
      }

      if (cat.normName.includes("telhas e coberturas")) {
        if (rawText.includes("telha") || rawText.includes("cumeeira") || rawText.includes("fibrocimento")) score += 100;
      }

      if (cat.normName.includes("impermeabilizantes")) {
        if (rawText.includes("impermeabilizante") || rawText.includes("vedacit") || rawText.includes("manta asfaltica") || rawText.includes("manta liquida")) score += 100;
      }

      // Ferragens & Fixação
      if (cat.normName.includes("parafusos")) {
        if (rawText.includes("parafuso") || rawText.includes("chipboard") || rawText.includes("autobrocante")) score += 100;
      }

      if (cat.normName.includes("pregos")) {
        if (rawText.includes("prego")) score += 100;
      }

      if (cat.normName.includes("seguranca e acessos")) {
        if (rawText.includes("fechadura") || rawText.includes("cadeado") || rawText.includes("trinco") || rawText.includes("ferrolho")) score += 100;
        else score -= 80;
      }

      if (cat.normName.includes("buchas e fixacoes")) {
        if (rawText.includes("bucha de nylon") || rawText.includes("bucha nylon") || rawText.includes("bucha fixacao") || (rawText.includes("bucha") && !rawText.includes("reducao"))) score += 100;
      }

      if (score > 0) {
        scoredCats.push({
          name: cat.name,
          parent: cat.parentName,
          score,
          matched
        });
      }
    }

    scoredCats.sort((a, b) => b.score - a.score);
    const winner = scoredCats[0];
    const isOk = winner && (winner.name.toLowerCase().includes(p.expected.toLowerCase()) || p.expected.toLowerCase().includes(winner.name.toLowerCase()));
    
    if (isOk) {
      passed++;
      console.log(`✅ [OK] "${p.name}" ➔ ${winner.name}`);
    } else {
      console.log(`❌ [FAIL] "${p.name}"`);
      console.log(`   Esperado: "${p.expected}"`);
      console.log(`   Obtido:   "${winner?.name}" (${winner?.score} pts)`);
    }
  }

  console.log(`\n========================================`);
  console.log(`RESULTADO DO TESTE: ${passed} / ${testProducts.length} (${Math.round((passed/testProducts.length)*100)}%)`);
  console.log(`========================================`);
}

run().finally(() => prisma.$disconnect());
