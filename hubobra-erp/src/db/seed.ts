import { db, LocalProduct, LocalCustomer, LocalOrder, CashRegister, DEFAULT_SELLERS } from './db';
import officialCatalog from './officialProducts.json';

export async function seedLocalDatabase() {
  const currentProductCount = await db.products.count();

  // Sincroniza e atualiza catálogo com os produtos oficiais
  await db.products.bulkPut(officialCatalog as LocalProduct[]);

  // Clientes profissionais
  const customerCount = await db.customers.count();
  if (customerCount === 0) {
    const initialCustomers: LocalCustomer[] = [
      {
        id: 'c-001',
        code: 'CLI-001',
        name: 'Construtora e Engenharia Silva Ltda',
        cpfCnpj: '12.345.678/0001-90',
        phone: '(85) 98877-6655',
        email: 'compras@silvaconstrucoes.com.br',
        creditLimit: 25000.00,
        creditUsed: 3450.00,
        storeCredit: 450.00, // R$ 450 de haver de devolução de sacos de cimento de obra anterior
        pendingInvoices: [
          { number: 'DUP-9021', dueDate: '15/10/2026', amount: 1850.00, status: 'OPEN' },
          { number: 'DUP-9022', dueDate: '30/10/2026', amount: 1600.00, status: 'OPEN' },
        ],
        notes: 'Cliente VIP - Possui R$ 450,00 de haver de sobra de materiais da Obra Alpha 04.',
        createdAt: new Date().toISOString(),
        synced: true,
      },
      {
        id: 'c-002',
        code: 'CLI-002',
        name: 'Mestre Raimundo Alves (Empreiteiro)',
        cpfCnpj: '456.789.012-34',
        phone: '(85) 99123-4567',
        email: 'mestre.raimundo@gmail.com',
        creditLimit: 5000.00,
        creditUsed: 0.00,
        storeCredit: 120.00, // R$ 120 de crédito
        notes: 'Desconto de 3% autorizado em compras acima de R$ 1.000.',
        createdAt: new Date().toISOString(),
        synced: true,
      },
      {
        id: 'c-003',
        code: 'CLI-999',
        name: 'Consumidor Balcão / Não Identificado',
        creditLimit: 0,
        creditUsed: 0,
        storeCredit: 0,
        createdAt: new Date().toISOString(),
        synced: true,
      }
    ];
    await db.customers.bulkAdd(initialCustomers);
  } else {
    // Garantir que c-001 tenha storeCredit inicializado
    const c1 = await db.customers.get('c-001');
    if (c1 && c1.storeCredit === undefined) {
      await db.customers.update('c-001', { storeCredit: 450.00 });
    }
    const c2 = await db.customers.get('c-002');
    if (c2 && c2.storeCredit === undefined) {
      await db.customers.update('c-002', { storeCredit: 120.00 });
    }
  }

  // Pedidos de teste demonstrando todos os fluxos da loja:
  // 1. Pedido Balcão (Aguardando Caixa)
  // 2. Pedido IA Lia (WhatsApp)
  // 3. Pedido Pagar na Entrega (Em Rota com Maquininha - Aguardando Acerto/Prestação de Contas)
  const ordersCount = await db.orders.count();
  if (ordersCount === 0 || !(await db.orders.get('ord-104'))) {
    const initialOrders: LocalOrder[] = [
      {
        id: 'ord-101',
        orderNumber: 'PED-4091',
        type: 'PEDIDO_VENDA',
        createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
        sellerId: 'v-1',
        sellerName: 'Carlos Eduardo (Balcão 1)',
        origin: 'BALCAO',
        customerId: 'c-001',
        customerName: 'Construtora e Engenharia Silva Ltda',
        customerPhone: '(85) 98877-6655',
        items: [
          {
            productId: 'p-001',
            name: 'Cimento Poty Todas as Obras 50kg CP II-F',
            sku: '001100',
            unit: 'SACO',
            unitPrice: 53.90,
            cost: 39.50,
            quantity: 40,
            discount: 0,
            total: 2156.00,
            location: 'Galpão 01 - Baia A',
          },
          {
            productId: 'p-008',
            name: 'Argamassa AC-III Cinza 20kg Quartzolit',
            sku: 'ARG001',
            unit: 'SACO',
            unitPrice: 36.90,
            cost: 24.50,
            quantity: 10,
            discount: 0,
            total: 369.00,
            location: 'Galpão 01 - Baia B',
          }
        ],
        subtotal: 2525.00,
        discount: 25.00,
        shipping: 50.00,
        total: 2550.00,
        paymentCondition: 'Boleto 30 Dias / Faturado',
        status: 'AGUARDANDO_PAGAMENTO',
        fiscalStatus: 'NOT_EMITTED',
        notes: 'Entregar com caminhão toco - rua estreita.',
        syncedToCloud: true,
        syncedToGestaoClick: false,
      },
      {
        id: 'ord-103',
        orderNumber: 'PED-IA9045',
        type: 'PEDIDO_VENDA',
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
        sellerId: 'v-lia-ai',
        sellerName: 'Lia (Consultora Virtual IA 🤖)',
        origin: 'LIA_AI',
        isAiGenerated: true,
        customerId: 'c-001',
        customerName: 'Engenheiro Marcelo Rocha (WhatsApp)',
        customerPhone: '(85) 99888-3322',
        items: [
          {
            productId: 'p-004',
            name: 'Tinta Acrílica Standard Fosco Rende Muito Branco Neve 20L - Coral',
            sku: 'TIN001',
            unit: 'LITRO',
            unitPrice: 299.90,
            cost: 210.00,
            quantity: 2,
            discount: 0,
            total: 599.80,
            location: 'Showroom - Gôndola Tintas 01',
          },
          {
            productId: 'p-005',
            name: 'Porcelanato Polido Delta 84x84cm Retificado (Caixa 2,12m²)',
            sku: 'PISO001',
            unit: 'M2',
            unitPrice: 64.90,
            cost: 44.00,
            quantity: 25,
            discount: 0,
            total: 1622.50,
            location: 'Galpão 02 - Prateleira Pisos C',
          }
        ],
        subtotal: 2222.30,
        discount: 22.30,
        shipping: 0,
        total: 2200.00,
        paymentCondition: 'PIX WhatsApp / Caixa',
        status: 'AGUARDANDO_PAGAMENTO',
        fiscalStatus: 'NOT_EMITTED',
        notes: '✨ Venda fechada automaticamente pela Lia no WhatsApp. Cliente vai retirar com furgão.',
        syncedToCloud: true,
        syncedToGestaoClick: true,
      },
      {
        id: 'ord-104',
        orderNumber: 'PED-ENT4098',
        type: 'PEDIDO_VENDA',
        createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
        sellerId: 'v-5',
        sellerName: 'Fernando Costa (Obras)',
        origin: 'MOBILE',
        customerId: 'c-002',
        customerName: 'Mestre Raimundo Alves (Obra Eusébio)',
        customerPhone: '(85) 99123-4567',
        deliveryDriver: 'Motorista João (Caminhão Basculante 02)',
        items: [
          {
            productId: 'p-006',
            name: 'Vergalhão CA-50 3/8" (10mm) Barra 12m Gerdau',
            sku: 'FER001',
            unit: 'BARRA',
            unitPrice: 54.50,
            cost: 38.00,
            quantity: 20,
            discount: 0,
            total: 1090.00,
            location: 'Barracão de Aço - Feixe 02',
          },
          {
            productId: 'p-001',
            name: 'Cimento Poty Todas as Obras 50kg CP II-F',
            sku: '001100',
            unit: 'SACO',
            unitPrice: 53.90,
            cost: 39.50,
            quantity: 15,
            discount: 0,
            total: 808.50,
            location: 'Galpão 01 - Baia A',
          }
        ],
        subtotal: 1898.50,
        discount: 48.50,
        shipping: 50.00,
        total: 1900.00,
        paymentCondition: 'Pagar na Entrega (Maquininha de Cartão)',
        status: 'EM_ROTA_ENTREGA',
        fiscalStatus: 'NOT_EMITTED',
        notes: '🚚 Em rota de entrega. Motorista João levou a maquininha Stone para cobrar no ato da descarga da obra.',
        syncedToCloud: true,
        syncedToGestaoClick: true,
      },
      {
        id: 'ord-saldo-8820',
        orderNumber: 'PED-SLD8820',
        type: 'PEDIDO_VENDA',
        createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
        sellerId: 'v-1',
        sellerName: 'Carlos Eduardo (Balcão 1)',
        origin: 'BALCAO',
        customerId: 'c-001',
        customerName: 'Engenheiro Roberto Albuquerque (Residencial Jardins)',
        customerPhone: '(85) 98765-4321',
        deliveryMode: 'FUTURE_PICKUP',
        isFutureDelivery: true,
        items: [
          {
            productId: 'p-001',
            name: 'Cimento Poty Todas as Obras 50kg CP II-F',
            sku: '001100',
            unit: 'SACO',
            unitPrice: 53.90,
            cost: 39.50,
            quantity: 200,
            discount: 0,
            total: 10780.00,
            location: 'Galpão 01 - Baia A (Estoque Retido)',
          },
          {
            productId: 'p-007',
            name: 'Tijolo Cerâmico 8 Furos 9x19x19cm (Lote 10 Milheiro)',
            sku: 'TIJ001',
            unit: 'MILHEIRO',
            unitPrice: 890.00,
            cost: 650.00,
            quantity: 10,
            discount: 0,
            total: 8900.00,
            location: 'Pátio Aberto - Bloco 04',
          }
        ],
        subtotal: 19680.00,
        discount: 180.00,
        shipping: 0.00,
        total: 19500.00,
        paymentCondition: 'À Vista no Caixa (PIX / TED)',
        status: 'AGUARDANDO_PAGAMENTO',
        fiscalStatus: 'NOT_EMITTED',
        notes: '📦 SALDO DE MATERIAIS: Cliente comprou 200 sacos de cimento e 10 milheiros de tijolo para travar o preço. Material FICA na loja e será retirado aos poucos.',
        syncedToCloud: true,
        syncedToGestaoClick: false,
      }
    ];

    for (const ord of initialOrders) {
      await db.orders.put(ord);
    }
  }

  // Garantir que a ordem de saldo de materiais esteja sempre disponível para demonstração
  if (!(await db.orders.get('ord-saldo-8820'))) {
    await db.orders.put({
      id: 'ord-saldo-8820',
      orderNumber: 'PED-SLD8820',
      type: 'PEDIDO_VENDA',
      createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
      sellerId: 'v-1',
      sellerName: 'Carlos Eduardo (Balcão 1)',
      origin: 'BALCAO',
      customerId: 'c-001',
      customerName: 'Engenheiro Roberto Albuquerque (Residencial Jardins)',
      customerPhone: '(85) 98765-4321',
      deliveryMode: 'FUTURE_PICKUP',
      isFutureDelivery: true,
      items: [
        {
          productId: 'p-001',
          name: 'Cimento Poty Todas as Obras 50kg CP II-F',
          sku: '001100',
          unit: 'SACO',
          unitPrice: 53.90,
          cost: 39.50,
          quantity: 200,
          discount: 0,
          total: 10780.00,
          location: 'Galpão 01 - Baia A (Estoque Retido)',
        },
        {
          productId: 'p-007',
          name: 'Tijolo Cerâmico 8 Furos 9x19x19cm (Lote 10 Milheiro)',
          sku: 'TIJ001',
          unit: 'MILHEIRO',
          unitPrice: 890.00,
          cost: 650.00,
          quantity: 10,
          discount: 0,
          total: 8900.00,
          location: 'Pátio Aberto - Bloco 04',
        }
      ],
      subtotal: 19680.00,
      discount: 180.00,
      shipping: 0.00,
      total: 19500.00,
      paymentCondition: 'À Vista no Caixa (PIX / TED)',
      status: 'AGUARDANDO_PAGAMENTO',
      fiscalStatus: 'NOT_EMITTED',
      notes: '📦 SALDO DE MATERIAIS: Cliente comprou 200 sacos de cimento e 10 milheiros de tijolo para travar o preço. Material FICA na loja e será retirado aos poucos.',
      syncedToCloud: true,
      syncedToGestaoClick: false,
    });
  }

  // Fornecedores Oficiais da Construção Civil
  const suppliersCount = await db.suppliers.count();
  if (suppliersCount === 0) {
    const initialSuppliers = [
      {
        id: 'for-001',
        code: 'FOR-001',
        tradeName: 'Votorantim Cimentos',
        corporateName: 'Votorantim Cimentos N/NE S.A.',
        cnpj: '01.637.895/0001-32',
        representativeName: 'Marcos Aurélio (Representante Ceará)',
        phone: '(85) 3456-7890',
        whatsapp: '(85) 99876-5432',
        email: 'marcos.aurelio@votorantim.com',
        category: 'Cimentos & Argamassas',
        leadTimeDays: 2,
        minOrderValue: 5000.0,
        standardPaymentTerms: 'Boleto 28/56 dias faturado',
        rating: 4.9,
        suppliedProductsCount: 18,
        notes: 'Fornecedor de cimento a granel e ensacado. Entrega em carretas fechadas (600 sacos) ou truck (300 sacos).',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'for-002',
        code: 'FOR-002',
        tradeName: 'Gerdau Aços',
        corporateName: 'Gerdau Aços Longos S.A.',
        cnpj: '33.611.500/0001-19',
        representativeName: 'Renato Silveira (Divisão Comercial)',
        phone: '(85) 3211-9000',
        whatsapp: '(85) 99122-3344',
        email: 'renato.silveira@gerdau.com.br',
        category: 'Aços, Vergalhões & Telas',
        leadTimeDays: 3,
        minOrderValue: 8000.0,
        standardPaymentTerms: 'Boleto 30/60/90 dias',
        rating: 4.8,
        suppliedProductsCount: 24,
        notes: 'Vergalhões CA-50/60, arames recozidos e telas soldadas com certificado de conformidade ABNT.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'for-003',
        code: 'FOR-003',
        tradeName: 'Krona Tubos e Conexões',
        corporateName: 'Krona Tubos e Conexões S.A.',
        cnpj: '00.123.456/0001-78',
        representativeName: 'Felipe Barreto (Gerente Nordeste)',
        phone: '(85) 3499-1200',
        whatsapp: '(85) 98844-5566',
        email: 'felipe.barreto@krona.com.br',
        category: 'Tubos e Conexões PVC',
        leadTimeDays: 2,
        minOrderValue: 2500.0,
        standardPaymentTerms: 'Boleto 28/42 dias',
        rating: 4.9,
        suppliedProductsCount: 42,
        notes: 'Linha completa de PVC água fria soldável, esgoto série normal e reforçada.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'for-004',
        code: 'FOR-004',
        tradeName: 'Quartzolit Saint-Gobain',
        corporateName: 'Saint-Gobain do Brasil Produtos Industriais',
        cnpj: '61.064.838/0001-90',
        representativeName: 'Débora Vasconcelos (Comercial)',
        phone: '(85) 3388-7700',
        whatsapp: '(85) 99777-8899',
        email: 'debora.vasconcelos@saint-gobain.com',
        category: 'Argamassas & Rejuntes',
        leadTimeDays: 2,
        minOrderValue: 3000.0,
        standardPaymentTerms: 'Boleto 28 dias',
        rating: 4.9,
        suppliedProductsCount: 22,
        notes: 'Argamassas AC-I, AC-II, AC-III Especiais, impermeabilizantes e rejuntes acrílicos.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'for-005',
        code: 'FOR-005',
        tradeName: 'Tekbond Adesivos',
        corporateName: 'Saint-Gobain Tekbond Adesivos Ltda',
        cnpj: '04.567.890/0001-12',
        representativeName: 'Juliana Castro (Distribuição Ceará)',
        phone: '(85) 3277-6600',
        whatsapp: '(85) 99655-4433',
        email: 'juliana.castro@tekbond.com.br',
        category: 'Massas, Seladores e Solventes',
        leadTimeDays: 3,
        minOrderValue: 1500.0,
        standardPaymentTerms: 'Boleto 30 dias',
        rating: 4.7,
        suppliedProductsCount: 15,
        notes: 'Adesivos instantâneos 793, silicone acético e neutro, PU 40 para calhas e juntas.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'for-006',
        code: 'FOR-006',
        tradeName: 'Cerâmica Delta Porcelanatos',
        corporateName: 'Delta Cerâmica e Porcelanato S.A.',
        cnpj: '55.443.322/0001-01',
        representativeName: 'Rodrigo Pires (Showroom Nordeste)',
        phone: '(85) 3500-8800',
        whatsapp: '(85) 99233-1122',
        email: 'rodrigo.pires@deltaceramica.com.br',
        category: 'Pisos e Revestimentos',
        leadTimeDays: 5,
        minOrderValue: 6000.0,
        standardPaymentTerms: 'Boleto 30/60 dias faturado',
        rating: 4.8,
        suppliedProductsCount: 28,
        notes: 'Porcelanatos polidos 84x84, acetinados retificados e revestimentos HD.',
        createdAt: new Date().toISOString(),
      },
    ];
    await db.suppliers.bulkPut(initialSuppliers);
  }

  // Cotações Iniciais Demonstrativas
  const quotCount = await db.quotations.count();
  if (quotCount === 0) {
    const sampleQuotation = {
      id: 'cot-001',
      quotationNumber: 'COT-2026-081',
      title: 'Cotação Semanal de Reposição - Cimentos & Argamassas',
      createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      buyerName: 'Juliana Mendes (Compras)',
      status: 'EM_ANALISE' as const,
      items: [
        {
          productId: 'p-001',
          productName: 'Cimento Poty Todas as Obras 50kg CP II-F',
          sku: '001100',
          quantity: 300,
          unit: 'SACO',
          currentCost: 39.5,
          lastPurchasePrice: 39.5,
          targetPrice: 37.5,
        },
        {
          productId: 'p-008',
          productName: 'Argamassa AC-III Cinza 20kg Quartzolit',
          sku: 'ARG001',
          quantity: 100,
          unit: 'SACO',
          currentCost: 24.5,
          lastPurchasePrice: 24.5,
          targetPrice: 22.0,
        },
      ],
      suppliersQuoted: [
        {
          supplierId: 'for-001',
          supplierName: 'Votorantim Cimentos',
          representative: 'Marcos Aurélio',
          whatsapp: '(85) 99876-5432',
          quotedPrices: {
            '001100': 37.9,
            ARG001: 22.5,
          },
          freight: 0,
          paymentTerms: 'Boleto 28/56 dias',
          deliveryDays: 2,
          totalQuotation: 300 * 37.9 + 100 * 22.5, // 11370 + 2250 = 13620
          isWinner: true,
        },
        {
          supplierId: 'for-004',
          supplierName: 'Distribuidora Cearense de Cimentos',
          representative: 'Carlos Eduardo',
          whatsapp: '(85) 99111-2233',
          quotedPrices: {
            '001100': 38.8,
            ARG001: 23.9,
          },
          freight: 150,
          paymentTerms: 'Boleto 30 dias',
          deliveryDays: 3,
          totalQuotation: 300 * 38.8 + 100 * 23.9 + 150, // 11640 + 2390 + 150 = 14180
          isWinner: false,
        },
      ],
      winningSupplierId: 'for-001',
      savingsAmount: 560.0,
      savingsPercent: 3.95,
      notes: 'Melhor proposta com Votorantim: R$ 560,00 de economia e frete grátis incluso no pedido de 300 sacos.',
    };
    await db.quotations.add(sampleQuotation);
  }

  console.log(`[HubObra ERP] Banco v2 inicializado com ${officialCatalog.length} produtos oficiais, fornecedores e cotações.`);
}

