const { PrismaClient } = require('../backend-nestjs/node_modules/@prisma/client');

const prisma = new PrismaClient();

const CONSTRUCTION_TERMS_SEED = [
  // --- HIDRÁULICA ---
  {
    slang_term: "rabicho",
    official_term: "Engate Flexível Trançado para Água (Pia / Vaso)",
    category: "Hidráulica",
    explanation: "Tubo flexível de malha de aço ou PVC que liga o ponto d'água da parede à torneira ou caixa acoplada.",
    target_sku: "HID-ENGATE-40"
  },
  {
    slang_term: "rabicho de pia",
    official_term: "Engate Flexível Inox 40cm para Lavatório/Pia",
    category: "Hidráulica",
    explanation: "Engate flexível trançado para alimentação de pia ou lavatório.",
    target_sku: "HID-ENGATE-40"
  },
  {
    slang_term: "cotovelo de 25",
    official_term: "Joelho 90° Soldável 25mm em PVC",
    category: "Hidráulica",
    explanation: "Conexão de PVC para mudança de direção em 90 graus na bitola de 25mm (3/4).",
    target_sku: "HID-JOELHO-25"
  },
  {
    slang_term: "cotovelo de 20",
    official_term: "Joelho 90° Soldável 20mm em PVC (1/2)",
    category: "Hidráulica",
    explanation: "Conexão de 20mm para encanamento de 1/2 polegada.",
    target_sku: "HID-JOELHO-20"
  },
  {
    slang_term: "cotovelo com rosca",
    official_term: "Joelho 90° com Rosca de Latão / PVC",
    category: "Hidráulica",
    explanation: "Usado na ponta de saída de torneiras e chuveiros para evitar desgaste de rosca.",
    target_sku: "HID-JOELHO-LR"
  },
  {
    slang_term: "cola de cano",
    official_term: "Adesivo Plástico para Tubos e Conexões de PVC",
    category: "Hidráulica",
    explanation: "Adesivo líquido ou bisnaga para soldagem de tubos de PVC (marcas Tigre, Amanco, Polytubes).",
    target_sku: "HID-COLA-75G"
  },
  {
    slang_term: "fita veda rosca",
    official_term: "Fita Veda Rosca em PTFE 18mm x 25m",
    category: "Hidráulica",
    explanation: "Fita de Teflon para vedação de roscas hidráulicas em torneiras, registros e conexões.",
    target_sku: "HID-VEDA-25M"
  },
  {
    slang_term: "luva de correr",
    official_term: "Luva de Correr para Esgoto / Água",
    category: "Hidráulica",
    explanation: "Conexão móvel com anéis de borracha usada para conserto rápido de tubulações furadas sem quebrar muita parede.",
    target_sku: "HID-LUV-CORRER"
  },
  {
    slang_term: "te de 25",
    official_term: "Tê 90° Soldável 25mm",
    category: "Hidráulica",
    explanation: "Conexão em formato de T para ramificar linha de água de 25mm.",
    target_sku: "HID-TE-25"
  },
  {
    slang_term: "registro geral",
    official_term: "Registro de Gaveta 3/4 ou 1 polegada",
    category: "Hidráulica",
    explanation: "Registro bruto de controle geral da água da casa/banheiro.",
    target_sku: "HID-REG-GAVETA"
  },
  {
    slang_term: "registro de chuveiro",
    official_term: "Registro de Pressão 3/4 com Acabamento",
    category: "Hidráulica",
    explanation: "Registro fino para abrir e fechar a água do chuveiro.",
    target_sku: "HID-REG-PRESSAO"
  },
  {
    slang_term: "cano de esgoto de 100",
    official_term: "Tubo de PVC Esgoto Série Normal 100mm (4 polegadas) Barra 6m",
    category: "Hidráulica",
    explanation: "Tubo principal de saída de bacia sanitária e ramais de esgoto.",
    target_sku: "HID-TUBO-100"
  },
  {
    slang_term: "cano de 50",
    official_term: "Tubo de PVC Esgoto Série Normal 50mm (2 polegadas)",
    category: "Hidráulica",
    explanation: "Tubo de esgoto para pias de cozinha e áreas de serviço.",
    target_sku: "HID-TUBO-50"
  },
  {
    slang_term: "cano de 25",
    official_term: "Tubo Soldável PVC Marrom 25mm (3/4) Barra 6m",
    category: "Hidráulica",
    explanation: "Tubo de água fria mais utilizado em instalações residenciais internas.",
    target_sku: "HID-TUBO-25"
  },
  {
    slang_term: "sifão de pia",
    official_term: "Sifão Universal Sanfonado Extensível com Adaptador",
    category: "Hidráulica",
    explanation: "Tubo sanfonado flexível para ralo de pia ou lavatório.",
    target_sku: "HID-SIFAO-UNIV"
  },
  {
    slang_term: "caixa de gordura",
    official_term: "Caixa Sifonada de Gordura em PVC com Cesto",
    category: "Hidráulica",
    explanation: "Caixa coletora para reter resíduos gordurosos da pia da cozinha.",
    target_sku: "HID-CX-GORDURA"
  },

  // --- ELÉTRICA ---
  {
    slang_term: "mangueira amarela",
    official_term: "Eletroduto Corrugado Flexível em PVC 3/4 Amarelo Rolo 50m",
    category: "Elétrica",
    explanation: "Conduíte flexível antichama de cor amarela para embutir na parede para passagem de fios.",
    target_sku: "ELE-CONDUITE-34"
  },
  {
    slang_term: "mangueira laranja",
    official_term: "Eletroduto Corrugado Reforçado Laranja 3/4 para Laje",
    category: "Elétrica",
    explanation: "Conduíte reforçado com maior resistência mecânica para ser concretado na laje.",
    target_sku: "ELE-CONDUITE-LARANJA"
  },
  {
    slang_term: "fio 2 e meio",
    official_term: "Cabo Flexível 2,5mm² 750V (Rolo 100m)",
    category: "Elétrica",
    explanation: "Cabo de cobre padrão para tomadas residenciais (10A) e pontos gerais de energia.",
    target_sku: "ELE-CABO-25"
  },
  {
    slang_term: "fio de 4mm",
    official_term: "Cabo Flexível 4,0mm² 750V (Rolo 100m)",
    category: "Elétrica",
    explanation: "Cabo para chuveiros de 5500W ou circuitos de ar condicionado e tomadas especiais.",
    target_sku: "ELE-CABO-40"
  },
  {
    slang_term: "fio de 6mm",
    official_term: "Cabo Flexível 6,0mm² 750V (Rolo 100m)",
    category: "Elétrica",
    explanation: "Cabo para chuveiros potentes (7500W) e entrada de circuitos de distribuição.",
    target_sku: "ELE-CABO-60"
  },
  {
    slang_term: "fio de 1 e meio",
    official_term: "Cabo Flexível 1,5mm² 750V (Rolo 100m)",
    category: "Elétrica",
    explanation: "Cabo padrão para circuitos de iluminação e lâmpadas.",
    target_sku: "ELE-CABO-15"
  },
  {
    slang_term: "caixinha 4x2",
    official_term: "Caixa de Luz Embutir 4x2 Amarela em PVC para Parede",
    category: "Elétrica",
    explanation: "Caixa embutida na alvenaria para fixação de interruptores e tomadas simples.",
    target_sku: "ELE-CX-4X2"
  },
  {
    slang_term: "caixinha de teto",
    official_term: "Caixa Octogonal Fundo Móvel 4x4 para Laje/Teto",
    category: "Elétrica",
    explanation: "Caixa redonda/octogonal instalada no teto para pendurar lustres e plafons.",
    target_sku: "ELE-CX-OCTOGONAL"
  },
  {
    slang_term: "disjuntor de 20",
    official_term: "Disjuntor Unipolar Curva C 20A DIN",
    category: "Elétrica",
    explanation: "Dispositivo de proteção para circuitos de tomadas de 2,5mm².",
    target_sku: "ELE-DISJ-20A"
  },
  {
    slang_term: "disjuntor de 32",
    official_term: "Disjuntor Unipolar Curva C 32A DIN",
    category: "Elétrica",
    explanation: "Disjuntor padrão para chuveiro elétrico comum em 220V com fio 4mm/6mm.",
    target_sku: "ELE-DISJ-32A"
  },
  {
    slang_term: "fita isolante boa",
    official_term: "Fita Isolante Antichama 19mm x 20m 3M Imperial / Scotch",
    category: "Elétrica",
    explanation: "Fita isolante profissional de alta aderência e elasticidade.",
    target_sku: "ELE-FITA-3M"
  },

  // --- FERRAGENS & ESTRUTURA ---
  {
    slang_term: "vara de ferro 3/8",
    official_term: "Barra de Aço Nervurado CA-50 10.0mm (3/8) Barra 12m",
    category: "Ferragens",
    explanation: "Vergalhão de 10mm usado em vigas, colunas, baldrames e sapatas estruturais.",
    target_sku: "FER-ACO-10MM"
  },
  {
    slang_term: "ferro de 10",
    official_term: "Barra de Aço Nervurado CA-50 10.0mm (3/8) Barra 12m",
    category: "Ferragens",
    explanation: "Mesmo que ferro 3/8 pol.",
    target_sku: "FER-ACO-10MM"
  },
  {
    slang_term: "vara de ferro 5/16",
    official_term: "Barra de Aço Nervurado CA-50 8.0mm (5/16) Barra 12m",
    category: "Ferragens",
    explanation: "Vergalhão de 8mm muito utilizado na armação de pilares residenciais e lajes.",
    target_sku: "FER-ACO-8MM"
  },
  {
    slang_term: "ferro de 8",
    official_term: "Barra de Aço Nervurado CA-50 8.0mm (5/16) Barra 12m",
    category: "Ferragens",
    explanation: "Mesmo que ferro 5/16 pol.",
    target_sku: "FER-ACO-8MM"
  },
  {
    slang_term: "ferro de 1/4",
    official_term: "Barra de Aço Nervurado CA-50 6.3mm (1/4) Barra 12m",
    category: "Ferragens",
    explanation: "Vergalhão de 6.3mm para cintas, vergas e armaduras leves.",
    target_sku: "FER-ACO-63MM"
  },
  {
    slang_term: "ferro para estribo",
    official_term: "Barra de Aço Nervurado CA-60 4.2mm ou 5.0mm (3/16)",
    category: "Ferragens",
    explanation: "Aço mais fino para dobrar estribos que amarram as colunas e vigas.",
    target_sku: "FER-ACO-42MM"
  },
  {
    slang_term: "arame recozido",
    official_term: "Arame Recozido Torcido BWG 18 (Kg)",
    category: "Ferragens",
    explanation: "Arame flexível para amarrar os cruzamentos de ferro e estribos na caixaria.",
    target_sku: "FER-ARAME-REC"
  },
  {
    slang_term: "prego 18x27",
    official_term: "Prego de Aço Polido com Cabeça 18x27 (2.1/2 x 10) - 1kg",
    category: "Ferragens",
    explanation: "Prego mais vendido da obra para travar tábuas de caixaria e fôrmas de madeira.",
    target_sku: "FER-PREGO-18X27"
  },
  {
    slang_term: "prego para telha",
    official_term: "Prego Galvanizado Espiralado com Arruela de Vedação para Telha",
    category: "Ferragens",
    explanation: "Prego com cabeça de borracha para fixar telhas de fibrocimento ou ecológicas.",
    target_sku: "FER-PREGO-TELHA"
  },

  // --- ALVENARIA & BÁSICOS ---
  {
    slang_term: "milheiro de tijolo",
    official_term: "Tijolo Cerâmico 8 Furos 9x19x19cm (Lote 1.000 Unidades)",
    category: "Alvenaria",
    explanation: "Tijolo furado para elevação de paredes de alvenaria convencional.",
    target_sku: "ALV-TIJOLO-MILH"
  },
  {
    slang_term: "tijolo de 8 furos",
    official_term: "Tijolo Cerâmico 8 Furos 9x19x19cm Unitário",
    category: "Alvenaria",
    explanation: "Unidade do bloco cerâmico de 8 furos.",
    target_sku: "ALV-TIJOLO-UNID"
  },
  {
    slang_term: "saco de cimento",
    official_term: "Cimento CP-II / CP-IV 50kg (Poty / Apodi / Mizu)",
    category: "Alvenaria",
    explanation: "Saco de 50kg para massas de assentamento, concreto e reboco.",
    target_sku: "ALV-CIMENTO-50KG"
  },
  {
    slang_term: "argamassa ac3",
    official_term: "Argamassa Colante AC-III Branca / Cinza 20kg",
    category: "Alvenaria",
    explanation: "Argamassa de alta aderência para porcelanatos grandes, fachadas e áreas externas.",
    target_sku: "ALV-ARGAMASSA-AC3"
  },
  {
    slang_term: "argamassa ac1",
    official_term: "Argamassa Colante AC-I Uso Interno 20kg",
    category: "Alvenaria",
    explanation: "Argamassa econômica para pisos cerâmicos comuns em piso e parede interna.",
    target_sku: "ALV-ARGAMASSA-AC1"
  },
  {
    slang_term: "cal de pintar",
    official_term: "Cal Hidratada para Pintura 8kg / 10kg",
    category: "Pintura",
    explanation: "Cal branca para caiação de muros e paredes.",
    target_sku: "PIN-CAL-PINT"
  },
  {
    slang_term: "cal de massa",
    official_term: "Cal Hidratada CH-I / Aditivo Plastificante para Argamassa",
    category: "Alvenaria",
    explanation: "Usado para dar liga e maciez à massa de reboco de parede.",
    target_sku: "ALV-CAL-MASSA"
  },
  {
    slang_term: "impermeabilizante de laje",
    official_term: "Manta Líquida Impermeabilizante Acrílica Branca 18kg (Vedapren / Quartzolit)",
    category: "Impermeabilização",
    explanation: "Membrana elástica para evitar vazamentos e infiltrações em lajes expostas.",
    target_sku: "IMP-MANTA-LIQ-18K"
  },
  {
    slang_term: "vedacit",
    official_term: "Aditivo Impermeabilizante para Concreto e Argamassa (Balde 18L)",
    category: "Impermeabilização",
    explanation: "Líquido hidrófugo adicionado na água da massa de reboco e fundação.",
    target_sku: "IMP-VEDACIT-18L"
  },
  {
    slang_term: "espacador de piso",
    official_term: "Cruzeta Espaçadora Niveladora para Revestimento (Pacote 100un)",
    category: "Acabamento",
    explanation: "Cruzetas plásticas de 1.5mm, 2mm ou 3mm para alinhamento uniforme do rejunte.",
    target_sku: "ACA-ESPACADOR-100"
  },
  {
    slang_term: "talisca",
    official_term: "Pedaço cerâmico ou régua guia para mestra de reboco e contrapiso",
    category: "Alvenaria",
    explanation: "Guia de nivelamento para puxar o reboco no prumo.",
    target_sku: "ALV-GUIA-REBOCO"
  },

  // --- PINTURA & ACABAMENTO ---
  {
    slang_term: "massa corrida",
    official_term: "Massa Corrida PVA para Interiores Lata 18L / 25kg",
    category: "Pintura",
    explanation: "Massa de nivelamento para paredes internas secas antes da pintura.",
    target_sku: "PIN-MASSA-CORR-18L"
  },
  {
    slang_term: "massa acrilica",
    official_term: "Massa Acrílica para Exteriores e Interiores Resistente à Água 18L / 28kg",
    category: "Pintura",
    explanation: "Massa resistente a sol e chuva para fachadas e banheiros.",
    target_sku: "PIN-MASSA-ACR-18L"
  },
  {
    slang_term: "rolo de la",
    official_term: "Rolo de Lã de Carneiro Antigota 23cm para Pintura com Garfo",
    category: "Pintura",
    explanation: "Rolo macio que espalha tinta lisa sem respingar.",
    target_sku: "PIN-ROLO-23CM"
  },
  {
    slang_term: "trincha",
    official_term: "Pincel Trincha Cerdas Gris 2 ou 2.1/2 Polegadas",
    category: "Pintura",
    explanation: "Pincel chato para recortes de cantos, rodapés e esquadrias.",
    target_sku: "PIN-TRINCHA-2"
  },
  {
    slang_term: "lixa de parede",
    official_term: "Lixa Massa para Parede Grão 150 / 180 / 220",
    category: "Pintura",
    explanation: "Folha de lixa para lixar massa corrida e deixar a parede lisa.",
    target_sku: "PIN-LIXA-150"
  },
  {
    slang_term: "fita crepe larga",
    official_term: "Fita Crepe Automotiva / Pintura 48mm x 50m",
    category: "Pintura",
    explanation: "Fita de papel adesiva para proteção de portas, tomadas e vidros durante a pintura.",
    target_sku: "PIN-FITA-CREPE"
  },

  // --- FERRAMENTAS & CONSUMÍVEIS ---
  {
    slang_term: "disco de corte fininho",
    official_term: "Disco de Corte Diamantado / Abrasivo Fino Inox 115mm (4.1/2) x 1.0mm",
    category: "Ferramentas",
    explanation: "Disco para esmerilhadeira para cortar ferro e aço inox sem rebarba.",
    target_sku: "FER-DISCO-FINO"
  },
  {
    slang_term: "disco de serra marmore",
    official_term: "Disco de Corte Diamantado Turbo / Contínuo 110mm para Makita",
    category: "Ferramentas",
    explanation: "Disco para corte de pisos, concreto, mármores e telhas na serra mármore.",
    target_sku: "FER-DISCO-MAKITA"
  },
  {
    slang_term: "lamina starrett",
    official_term: "Lâmina de Serra Manual de Aço Bi-metal Starrett 12 polegadas (24 Dentes)",
    category: "Ferramentas",
    explanation: "Lâmina de serra manual para arco de serra, para corte de tubos de PVC e barras de ferro.",
    target_sku: "FER-LAMINA-STARRETT"
  },
  {
    slang_term: "colher de pedreiro",
    official_term: "Colher de Pedreiro Oval / Reta Nº 8 ou Nº 9 Aço Forjado (Pacetta / Tramontina)",
    category: "Ferramentas",
    explanation: "Ferramenta fundamental para aplicar e assentar massa de cimento e tijolos.",
    target_sku: "FER-COLHER-PEDR"
  },
  {
    slang_term: "linha de pedreiro",
    official_term: "Linha de Polietileno Trançada para Pedreiro 100m (Cor Amarela/Laranja)",
    category: "Ferramentas",
    explanation: "Linha de alta resistência para alinhamento e nivelamento de fiadas de tijolos.",
    target_sku: "FER-LINHA-100M"
  },
  {
    slang_term: "mangueira de nivel",
    official_term: "Mangueira de Silicone Cristal Transparente 5/16 (Metro)",
    category: "Ferramentas",
    explanation: "Mangueira transparente de água para passar nível de parede e piso na obra.",
    target_sku: "FER-MANG-NIVEL"
  },
  {
    slang_term: "desempenadeira dentada",
    official_term: "Desempenadeira de Aço Dentada 10mm ou 8mm com Cabo Emborrachado",
    category: "Ferramentas",
    explanation: "Ferramenta para espalhar argamassa e fazer os cordões para assentamento de piso.",
    target_sku: "FER-DESEMP-DENT"
  },
  {
    slang_term: "parabolt",
    official_term: "Chumbador Mecânico Parabolt com Parafuso e Porca 3/8 x 3 pol",
    category: "Ferragens",
    explanation: "Fixador de expansão pesada para prender portões, colunas e estruturas em concreto maciço.",
    target_sku: "FER-PARABOLT-38"
  },
  {
    slang_term: "bucha 8 com parafuso",
    official_term: "Bucha de Fixação Nylon S8 com Parafuso Cabeça Chata Phillips 4.5x50mm",
    category: "Ferragens",
    explanation: "Kit de bucha e parafuso para prateleiras, armários e acessórios em parede de tijolo.",
    target_sku: "FER-BUCHA-S8"
  }
];

const REGIONAL_EXPRESSIONS_SEED = [
  {
    expression: "Cuida!",
    usage_context: "Abertura / Agilidade",
    tone_impact: "Expressão clássica do Ceará que denota proatividade, rapidez e atenção imediata.",
    example_phrase: "Cuida, meu amigo! Já tô verificando o estoque pra você agora mesmo."
  },
  {
    expression: "Tá no grau!",
    usage_context: "Confirmação de Qualidade",
    tone_impact: "Demonstra que o material ou o cálculo está perfeito, excelente e aprovado.",
    example_phrase: "Pronto! O orçamento tá no grau, tudo certinho com entrega rápida."
  },
  {
    expression: "Pode deixar comigo, chefe!",
    usage_context: "Segurança e Confiança",
    tone_impact: "Passa total segurança ao cliente de que o pedido dele é prioridade máxima.",
    example_phrase: "Pode deixar comigo, chefe! Vou separar o milheiro de tijolo e os 10 sacos de cimento."
  },
  {
    expression: "Só o filé!",
    usage_context: "Elogio ao Produto",
    tone_impact: "Garante ao cliente que o material é de primeira linha e marca de confiança.",
    example_phrase: "Essa tinta Coral Rende Muito é só o filé, cobre na primeira demão com rendimento top."
  },
  {
    expression: "Na medida!",
    usage_context: "Cálculo Técnico do Zé",
    tone_impact: "Validação técnica de engenharia e mestre de obras sem enrolação.",
    example_phrase: "Fiz as contas aqui: pra essa sua laje de 40m², 18 sacos de cimento é a conta na medida."
  },
  {
    expression: "Arrocha!",
    usage_context: "Incentivo e Fechamento",
    tone_impact: "Estimula o cliente a finalizar a compra com energia positiva.",
    example_phrase: "Arrocha! Quer que eu já gere o link ou a chave PIX pra garantir o caminhão hoje?"
  },
  {
    expression: "Em riba da bucha!",
    usage_context: "Agilidade de Entrega",
    tone_impact: "Mostra entrega pontual e rápida na obra.",
    example_phrase: "Se fechar agora de manhã, o caminhão descarrega aí na sua obra em riba da bucha à tarde!"
  },
  {
    expression: "Pronto, meu patrão!",
    usage_context: "Atendimento Acolhedor",
    tone_impact: "Tratamento respeitoso e caloroso de balcão tradicional.",
    example_phrase: "Pronto, meu patrão! Aqui está a cotação completa da hidráulica que você pediu."
  },
  {
    expression: "Mão na massa!",
    usage_context: "Parceria de Obra",
    tone_impact: "Conexão de quem entende o dia a dia duro do canteiro de obras.",
    example_phrase: "Bora botar a mão na massa! Precisando de qualquer complemento de ferragem, tô por aqui."
  }
];

const SALES_LEARNINGS_SEED = [
  {
    topic: "Proporção de Tijolo e Cimento",
    rule_content: "Para cada milheiro (1.000 unidades) de tijolo furado 8 furos em alvenaria padrão com espessura de junta de 1,5cm, consome-se em média de 6 a 8 sacos de cimento de 50kg e cerca de 1m³ de areia média.",
    source: "balcao_mestre_obra"
  },
  {
    topic: "Rendimento de Telha Fibrocimento / Ondulada",
    rule_content: "Para telha de fibrocimento 2,44m x 1,10m (6mm), calcular com sobreposição útil de 20cm no comprimento e 1 onda lateral. 1 telha cobre aproximadamente 2,0m² úteis de telhado.",
    source: "balcao_mestre_obra"
  },
  {
    topic: "Engate de Pia e Vaso Sanitário",
    rule_content: "Sempre que o cliente pedir rabicho ou engate, confirmar o comprimento: o padrão de vaso sanitário é 40cm ou 50cm; para lavatório de cuba suspensa ou pia profunda, sugerir 50cm ou 60cm para não ficar esticado.",
    source: "balcao_vendedor_senior"
  },
  {
    topic: "Consumo de Argamassa por Metro Quadrado",
    rule_content: "Argamassa AC-I consome em média 4 a 5kg por m² em colagem simples; para porcelanatos grandes acima de 60x60cm usando dupla colagem com AC-III, o consumo sobe para 8 a 9kg por m² (aprox. 1 saco de 20kg a cada 2,5m²).",
    source: "balcao_mestre_obra"
  },
  {
    topic: "Fiação para Chuveiro 220V em Fortaleza",
    rule_content: "Em Fortaleza (tensão fase-neutro 220V), chuveiros de 5500W utilizam cabo flexível de 4,0mm² com disjuntor de 25A ou 32A. Chuveiros turbo acima de 6800W exigem cabo flexível de 6,0mm² com disjuntor de 32A ou 40A.",
    source: "balcao_eletricista"
  }
];

async function setup() {
  console.log('🚀 [1/4] Conectando ao Supabase PostgreSQL via Prisma...');

  // 1. Criar tabela ai_construction_terms
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.ai_construction_terms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slang_term VARCHAR(255) NOT NULL UNIQUE,
      official_term VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      explanation TEXT,
      target_sku VARCHAR(100),
      usage_count INTEGER DEFAULT 0,
      confidence_weight FLOAT DEFAULT 1.0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('✅ Tabela ai_construction_terms verificada/criada!');

  // 2. Criar tabela ai_regional_expressions
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.ai_regional_expressions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      expression VARCHAR(255) NOT NULL UNIQUE,
      usage_context VARCHAR(100) NOT NULL,
      tone_impact TEXT NOT NULL,
      example_phrase TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('✅ Tabela ai_regional_expressions verificada/criada!');

  // 3. Criar tabela ai_sales_learnings
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.ai_sales_learnings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      topic VARCHAR(255) NOT NULL,
      rule_content TEXT NOT NULL,
      source VARCHAR(100) DEFAULT 'balcao_expert',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('✅ Tabela ai_sales_learnings verificada/criada!');

  // Habilitar RLS e criar políticas permissivas
  for (const table of ['ai_construction_terms', 'ai_regional_expressions', 'ai_sales_learnings']) {
    await prisma.$executeRawUnsafe(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = '${table}' AND policyname = 'allow_all_${table}'
        ) THEN
          CREATE POLICY allow_all_${table} ON public.${table} FOR ALL USING (true) WITH CHECK (true);
        END IF;
      END
      $$;
    `);
  }
  console.log('✅ Políticas de segurança RLS configuradas para todas as tabelas!');

  // 4. Inserir sementes de gírias e termos técnicos
  console.log(`📦 [2/4] Populando ${CONSTRUCTION_TERMS_SEED.length} gírias e apelidos de obra...`);
  let termsInserted = 0;
  for (const item of CONSTRUCTION_TERMS_SEED) {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO public.ai_construction_terms (slang_term, official_term, category, explanation, target_sku, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (slang_term) DO UPDATE SET
          official_term = EXCLUDED.official_term,
          category = EXCLUDED.category,
          explanation = EXCLUDED.explanation,
          target_sku = EXCLUDED.target_sku,
          updated_at = NOW();
      `, item.slang_term, item.official_term, item.category, item.explanation, item.target_sku);
      termsInserted++;
    } catch (e) {
      console.warn(`Aviso ao inserir termo ${item.slang_term}:`, e.message);
    }
  }
  console.log(`✅ ${termsInserted} termos e gírias carregados com sucesso!`);

  // 5. Inserir sementes de expressões cearenses
  console.log(`🌵 [3/4] Populando ${REGIONAL_EXPRESSIONS_SEED.length} expressões de Cearês comercial...`);
  let expressionsInserted = 0;
  for (const item of REGIONAL_EXPRESSIONS_SEED) {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO public.ai_regional_expressions (expression, usage_context, tone_impact, example_phrase, is_active, updated_at)
        VALUES ($1, $2, $3, $4, true, NOW())
        ON CONFLICT (expression) DO UPDATE SET
          usage_context = EXCLUDED.usage_context,
          tone_impact = EXCLUDED.tone_impact,
          example_phrase = EXCLUDED.example_phrase,
          updated_at = NOW();
      `, item.expression, item.usage_context, item.tone_impact, item.example_phrase);
      expressionsInserted++;
    } catch (e) {
      console.warn(`Aviso ao inserir expressão ${item.expression}:`, e.message);
    }
  }
  console.log(`✅ ${expressionsInserted} expressões regionais carregadas com sucesso!`);

  // 6. Inserir sabedoria de balcão
  console.log(`🧠 [4/4] Populando ${SALES_LEARNINGS_SEED.length} regras de sabedoria de balcão...`);
  for (const item of SALES_LEARNINGS_SEED) {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO public.ai_sales_learnings (topic, rule_content, source, is_active, updated_at)
        VALUES ($1, $2, $3, true, NOW());
      `, item.topic, item.rule_content, item.source);
    } catch (e) {
      console.warn(`Aviso ao inserir aprendizado ${item.topic}:`, e.message);
    }
  }
  console.log('✅ Sabedoria de balcão registrada!');

  // Resumo final
  const countTerms = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM public.ai_construction_terms;`);
  const countExp = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM public.ai_regional_expressions;`);
  const countLearnings = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM public.ai_sales_learnings;`);

  console.log('\n======================================================');
  console.log('🎉 BANCO DE CONHECIMENTO SUPABASE PRONTO E ATIVO!');
  console.log(`📊 Gírias e Apelidos Cadastrados: ${countTerms[0].count}`);
  console.log(`🌵 Expressões Regionais Cearenses: ${countExp[0].count}`);
  console.log(`🧠 Regras Técnicas de Balcão: ${countLearnings[0].count}`);
  console.log('======================================================\n');

  await prisma.$disconnect();
}

setup().catch(err => {
  console.error('❌ Erro fatal:', err);
  prisma.$disconnect();
  process.exit(1);
});
