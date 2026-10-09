/**
 * Serviço de Conexão com o Servidor Local Central HubObra ERP
 * Responsável por:
 * 1. WebSockets de Baixíssima Latência (< 30ms) entre Vendedor, Caixa e Expedição.
 * 2. Envio de pré-vendas e pedidos para a fila do Caixa.
 * 3. Baixa de pagamento e notificação da Expedição.
 * 4. Disparo de impressão de rede (Elgin i7/i9 e Epson LX-300).
 */

export interface WebSocketEvent<T = any> {
  type: string;
  data: T;
  timestamp: string;
}

type EventCallback = (data: any) => void;

class LocalServerService {
  private ws: WebSocket | null = null;
  private serverUrl: string = '';
  private isConnected: boolean = false;
  private reconnectInterval: any = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private currentRole: string = 'VENDEDOR';
  private terminalName: string = 'Terminal';

  constructor() {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;

      this.serverUrl = `${protocol}//${host}`;
      const savedRole = localStorage.getItem('hubobra_terminal_role') || 'VENDEDOR';
      const savedName = localStorage.getItem('hubobra_terminal_name') || 'Terminal Balcão';

      this.initWebSocket(`${wsProtocol}//${host}/ws`, savedRole, savedName);
    }
  }

  public initWebSocket(wsUrl: string, role: string, terminalName: string) {
    this.currentRole = role;
    this.terminalName = terminalName;

    try {
      if (this.ws) {
        this.ws.close();
      }

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('📡 [LocalServer] Conectado ao Servidor Central via WebSocket!');
        
        // Identifica o terminal e setor
        this.ws?.send(JSON.stringify({
          type: 'REGISTER',
          role: this.currentRole,
          name: this.terminalName
        }));

        this.emit('connection_change', { connected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          const payload: WebSocketEvent = JSON.parse(event.data);
          this.emit(payload.type, payload.data);
        } catch (err) {
          console.error('❌ [LocalServer] Erro ao parsear mensagem do WebSocket:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        console.log('🔌 [LocalServer] Desconectado do servidor. Tentando reconectar em 3s...');
        this.emit('connection_change', { connected: false });
        this.scheduleReconnect(wsUrl);
      };

      this.ws.onerror = (err) => {
        console.warn('⚠️ [LocalServer] Erro no WebSocket:', err);
      };
    } catch (e) {
      this.scheduleReconnect(wsUrl);
    }
  }

  private scheduleReconnect(wsUrl: string) {
    if (this.reconnectInterval) return;
    this.reconnectInterval = setTimeout(() => {
      this.reconnectInterval = null;
      this.initWebSocket(wsUrl, this.currentRole, this.terminalName);
    }, 3000);
  }

  public subscribe(eventType: string, callback: EventCallback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  private emit(eventType: string, data: any) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Erro no listener de ${eventType}:`, err);
        }
      });
    }
  }

  // --- MÉTODOS DE API REST ---

  public async checkServerStatus() {
    try {
      const res = await fetch(`${this.serverUrl}/api/status`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  public async fetchOrders(status?: string) {
    try {
      const url = status ? `${this.serverUrl}/api/orders?status=${status}` : `${this.serverUrl}/api/orders`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha ao listar pedidos');
      return await res.json();
    } catch (err) {
      console.warn('⚠️ [LocalServer] Não foi possível buscar pedidos do servidor central:', err);
      return [];
    }
  }

  public async createOrder(orderData: any) {
    try {
      const res = await fetch(`${this.serverUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (!res.ok) throw new Error('Erro ao salvar pedido no servidor');
      return await res.json();
    } catch (err) {
      console.error('❌ [LocalServer] Erro ao criar pedido:', err);
      throw err;
    }
  }

  public async payOrder(orderId: string, paymentData: any) {
    try {
      const res = await fetch(`${this.serverUrl}/api/orders/${orderId}/pay`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      if (!res.ok) throw new Error('Erro ao registrar pagamento no servidor');
      return await res.json();
    } catch (err) {
      console.error('❌ [LocalServer] Erro ao dar baixa no pedido:', err);
      throw err;
    }
  }

  public async printReceipt(order: any, printerType: 'THERMAL_80MM' | 'DOT_MATRIX_LX300', printerIp?: string, storeName?: string) {
    try {
      const res = await fetch(`${this.serverUrl}/api/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order,
          printerType,
          printerIp,
          storeName: storeName || 'HUBOBRA MATERIAIS DE CONSTRUCAO'
        })
      });
      return await res.json();
    } catch (err) {
      console.error('❌ [LocalServer] Erro ao disparar impressão:', err);
      throw err;
    }
  }

  public getIsConnected() {
    return this.isConnected;
  }
}

export const localServer = new LocalServerService();
