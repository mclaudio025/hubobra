import { Injectable, Logger } from "@nestjs/common";

export interface GestaoClickSyncResult {
  success: boolean;
  gestaoClickVendaId?: string;
  gestaoClickVendaCodigo?: string;
  clienteId?: string;
  error?: string;
}

@Injectable()
export class GestaoclickService {
  private readonly logger = new Logger(GestaoclickService.name);

  private readonly apiUrl = process.env.GESTAOCLICK_API_URL || "https://api.gestaoclick.com";
  private readonly accessToken = process.env.GESTAOCLICK_ACCESS_TOKEN || "";
  private readonly secretAccessToken = process.env.GESTAOCLICK_SECRET_ACCESS_TOKEN || "";
  private readonly isEnabled = process.env.GESTAOCLICK_ENABLED === "true";

  // Cache em memória para evitar consultas repetitivas de IDs de produtos
  private productCache = new Map<string, string>(); // SKU -> GestãoClick ID
  private customerCache = new Map<string, string>(); // Email -> GestãoClick ID

  constructor() {
    if (this.isEnabled && this.accessToken && this.secretAccessToken) {
      this.logger.log("✅ Integração GestãoClick ERP HABILITADA e configurada com sucesso.");
    } else {
      this.logger.warn("⚠️ Integração GestãoClick ERP desativada ou credenciais pendentes.");
    }
  }

  /**
   * Verifica se a integração está habilitada e configurada
   */
  public isConfigured(): boolean {
    return Boolean(this.isEnabled && this.accessToken && this.secretAccessToken);
  }

  /**
   * Cabeçalhos de autenticação para a API do GestãoClick
   */
  private getHeaders() {
    return {
      "Content-Type": "application/json",
      "access-token": this.accessToken,
      "secret-access-token": this.secretAccessToken,
    };
  }

  /**
   * Testa a conectividade com o ERP GestãoClick
   */
  async checkHealth(): Promise<{ connected: boolean; message: string; totalProdutos?: number }> {
    if (!this.isConfigured()) {
      return { connected: false, message: "GestãoClick não está habilitado ou credenciais incompletas." };
    }

    try {
      const response = await fetch(`${this.apiUrl}/produtos?limite=1`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return { connected: false, message: `Erro HTTP GestãoClick: ${response.status}` };
      }

      const data = await response.json();
      const total = data?.meta?.total_registros || 0;
      return { connected: true, message: "Conectado com sucesso ao GestãoClick!", totalProdutos: total };
    } catch (err: any) {
      return { connected: false, message: `Falha na conexão: ${err.message}` };
    }
  }

  /**
   * Localiza ou cadastra o cliente no GestãoClick
   */
  async findOrCreateCustomer(userData?: any, shippingAddress?: any): Promise<string | null> {
    if (!this.isConfigured()) return null;

    const email = userData?.email || "cliente-loja@hubobra.com.br";
    const nome = userData?.name || "Cliente Loja Virtual";

    // Verificar cache em memória
    if (this.customerCache.has(email)) {
      return this.customerCache.get(email)!;
    }

    try {
      // 1. Tentar buscar cliente existente pelo email ou nome
      const searchRes = await fetch(`${this.apiUrl}/clientes?busca=${encodeURIComponent(email)}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData?.data && searchData.data.length > 0) {
          const clienteExistente = searchData.data[0];
          const clienteId = String(clienteExistente.id);
          this.customerCache.set(email, clienteId);
          return clienteId;
        }
      }

      // 2. Se não encontrou, cadastrar novo cliente
      const novoClientePayload = {
        tipo_pessoa: "PF",
        nome: nome,
        email: email,
        celular: userData?.phone || "(85) 99999-9999",
        enderecos: [
          {
            endereco: {
              logradouro: shippingAddress?.street || "Endereço Loja",
              numero: shippingAddress?.number || "S/N",
              complemento: shippingAddress?.complement || "",
              bairro: shippingAddress?.district || "Centro",
              nome_cidade: shippingAddress?.city || "Fortaleza",
              estado: shippingAddress?.state || "CE",
              cep: shippingAddress?.zipCode || "60000-000",
            },
          },
        ],
      };

      const createRes = await fetch(`${this.apiUrl}/clientes`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(novoClientePayload),
      });

      const createData = await createRes.json();
      if (createRes.ok && createData?.data?.id) {
        const novoId = String(createData.data.id);
        this.customerCache.set(email, novoId);
        this.logger.log(`[GestãoClick] Novo cliente cadastrado com ID: ${novoId} (${nome})`);
        return novoId;
      }
    } catch (err: any) {
      this.logger.error(`[GestãoClick] Erro ao localizar/cadastrar cliente: ${err.message}`);
    }

    return null;
  }

  /**
   * Localiza o ID de um produto no GestãoClick a partir do SKU ou nome
   */
  async findGestaoClickProductId(sku?: string, name?: string): Promise<string | null> {
    if (!sku && !name) return null;

    const cacheKey = sku || name!;
    if (this.productCache.has(cacheKey)) {
      return this.productCache.get(cacheKey)!;
    }

    try {
      const termoBusca = sku || name;
      const res = await fetch(`${this.apiUrl}/produtos?busca=${encodeURIComponent(termoBusca!)}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.data && data.data.length > 0) {
          const produto = data.data[0];
          const produtoId = String(produto.id);
          this.productCache.set(cacheKey, produtoId);
          return produtoId;
        }
      }
    } catch (err: any) {
      this.logger.warn(`[GestãoClick] Não foi possível buscar produto no ERP: ${err.message}`);
    }

    return null;
  }

  /**
   * Sincroniza um Pedido da Loja Virtual como uma Venda no GestãoClick
   */
  async syncOrderToGestaoClick(order: any): Promise<GestaoClickSyncResult> {
    if (!this.isConfigured()) {
      return { success: false, error: "GestãoClick desabilitado" };
    }

    this.logger.log(`[GestãoClick] Iniciando sincronização do pedido #${order.orderNumber || order.id}...`);

    try {
      // 1. Identificar ou cadastrar o cliente
      const clienteId = await this.findOrCreateCustomer(order.user, order.shippingAddress);
      if (!clienteId) {
        this.logger.error(`[GestãoClick] Não foi possível obter o cliente para o pedido #${order.orderNumber}`);
        return { success: false, error: "Cliente não localizado no GestãoClick" };
      }

      // 2. Montar os produtos para o payload de Venda
      const produtosVenda: any[] = [];

      for (const item of order.items || []) {
        const sku = item.product?.sku || item.sku;
        const name = item.product?.name || item.name;
        const preco = Number(item.price || item.unitPrice || 0).toFixed(2);
        const qtd = Number(item.quantity || 1).toFixed(2);

        // Buscar ID do produto no GestãoClick
        const gestaoClickProdId = await this.findGestaoClickProductId(sku, name);

        if (gestaoClickProdId) {
          produtosVenda.push({
            produto: {
              produto_id: gestaoClickProdId,
              quantidade: qtd,
              valor_venda: preco,
            },
          });
        }
      }

      // Se por algum motivo nenhum ID de produto foi mapeado, aborta com log
      if (produtosVenda.length === 0) {
        this.logger.warn(`[GestãoClick] Nenhum item do pedido #${order.orderNumber} mapeado no catálogo do ERP.`);
      }

      // 3. Montar a forma de pagamento e valor
      const metodoPagamento = String(order.payment?.method || "PIX").toUpperCase();
      const valorTotal = Number(order.total || 0).toFixed(2);
      const valorFrete = Number(order.shipping || 0).toFixed(2);
      const dataHoje = new Date().toISOString().split("T")[0];

      const payloadVenda = {
        cliente_id: clienteId,
        data: dataHoje,
        valor_frete: valorFrete,
        observacoes: `Pedido #${order.orderNumber || order.id} originado da Loja Virtual HubObra (${metodoPagamento})`,
        produtos: produtosVenda,
        pagamentos: [
          {
            pagamento: {
              data_vencimento: dataHoje,
              valor: valorTotal,
              nome_forma_pagamento: metodoPagamento.includes("PIX") ? "PIX" : "Dinheiro à Vista",
            },
          },
        ],
      };

      // 4. Enviar a Venda para o GestãoClick
      const response = await fetch(`${this.apiUrl}/vendas`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payloadVenda),
      });

      const resData = await response.json();

      if (response.ok && (resData?.code === 200 || resData?.status === "success")) {
        const vendaId = String(resData.data?.id);
        const codigoVenda = String(resData.data?.codigo || "");
        this.logger.log(`🎉 [GestãoClick] Pedido #${order.orderNumber} sincronizado como Venda ID ${vendaId} (Código: ${codigoVenda})`);
        return {
          success: true,
          gestaoClickVendaId: vendaId,
          gestaoClickVendaCodigo: codigoVenda,
          clienteId,
        };
      } else {
        const msg = resData?.message || resData?.error || JSON.stringify(resData);
        this.logger.error(`❌ [GestãoClick] Falha ao registrar venda: ${msg}`);
        return { success: false, error: msg };
      }
    } catch (err: any) {
      this.logger.error(`💥 [GestãoClick] Exceção ao sincronizar pedido #${order.orderNumber}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
