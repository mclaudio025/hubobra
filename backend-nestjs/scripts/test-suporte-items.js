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
  const cats = await prisma.category.findMany({
    where: { active: true },
    include: { parent: true },
  });

  const testItems = [
    "Suporte Universal para Televisao Tv Lcd e LED",
    "Suporte para Tv Universal 10-90\\",
    "Disco de Corte Diamantado Turbo Porcelanato 110mm - Cortag",
    "Joelho 90° Soldável com Bucha de Latão",
    "Tubo PVC Soldavel 25mm 6m Krona",
    "Cap Soldavel 25MM Krona"
  ];

  for (const item of testItems) {
    const norm = normalizeText(item);
    console.log(`\nItem: "${item}" (norm: "${norm}")`);
    
    // Regras de suporte
    if (norm.includes("suporte") && (norm.includes("tv") || norm.includes("televisao") || norm.includes("lcd") || norm.includes("led") || norm.includes("mao francesa") || norm.includes("prateleira"))) {
      const cat = cats.find(c => normalizeText(c.name).includes("dobradicas e suportes") || normalizeText(c.name).includes("suporte"));
      console.log(`➔ CATEGORIA: ${cat?.name} (Sub de: ${cat?.parent?.name})`);
    } else if (norm.includes("disco de corte") || norm.includes("diamantado") || norm.includes("disco flap") || norm.includes("disco desbaste") || norm.includes("abrasivo")) {
      const cat = cats.find(c => normalizeText(c.name).includes("abrasivos e consumiveis") || normalizeText(c.name).includes("corte"));
      console.log(`➔ CATEGORIA: ${cat?.name} (Sub de: ${cat?.parent?.name})`);
    } else if (norm.includes("soldavel") || norm.includes("soldavel") || norm.includes("cap") || norm.includes("joelho") || norm.includes("tubo pvc")) {
      const cat = cats.find(c => normalizeText(c.name).includes("tubos e conexoes de agua"));
      console.log(`➔ CATEGORIA: ${cat?.name} (Sub de: ${cat?.parent?.name})`);
    }
  }
}

run().finally(() => prisma.$disconnect());
