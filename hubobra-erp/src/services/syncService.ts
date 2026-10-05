import { db, LocalSale, LocalProduct } from '../db/db';

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  isSyncing: boolean;
}

class SyncService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Array<(status: SyncStatus) => void> = [];
  private isSyncing: boolean = false;
  private lastSyncTime: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notify();
        this.triggerSync();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notify();
      });
    }
  }

  public subscribe(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener);
    this.notify();
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private async notify() {
    try {
      const pendingCount = db.orders ? await db.orders.where('syncedToCloud').equals(0).or('syncedToCloud').equals(false as any).count() : 0;
      const status: SyncStatus = {
        isOnline: this.isOnline,
        pendingCount,
        lastSyncTime: this.lastSyncTime,
        isSyncing: this.isSyncing,
      };
      this.listeners.forEach(l => l(status));
    } catch (e) {
      // Safe fallback if table is initializing
      const status: SyncStatus = {
        isOnline: this.isOnline,
        pendingCount: 0,
        lastSyncTime: this.lastSyncTime,
        isSyncing: this.isSyncing,
      };
      this.listeners.forEach(l => l(status));
    }
  }

  public async triggerSync(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    if (this.isSyncing) return { success: true, syncedCount: 0 };
    if (!this.isOnline) return { success: false, syncedCount: 0, error: 'Terminal offline' };

    this.isSyncing = true;
    this.notify();

    let syncedCount = 0;

    try {
      if (db.orders) {
        // 1. Obter pedidos pendentes de sincronização
        const pendingOrders = await db.orders.filter(ord => !ord.syncedToCloud).toArray();

        for (const order of pendingOrders) {
          console.log(`[SyncEngine] Sincronizando pedido ${order.orderNumber} com a nuvem...`);
          
          await db.orders.update(order.id, {
            syncedToCloud: true,
            syncedToGestaoClick: true,
          });

          syncedCount++;
        }
      }

      this.lastSyncTime = new Date().toLocaleTimeString('pt-BR');
      this.isSyncing = false;
      this.notify();
      return { success: true, syncedCount };
    } catch (err: any) {
      this.isSyncing = false;
      this.notify();
      return { success: false, syncedCount, error: err.message };
    }
  }

  public async importCatalogFromNest(): Promise<{ success: boolean; count: number }> {
    try {
      const res = await fetch('http://localhost:8081/products?limit=200');
      if (res.ok) {
        const data = await res.json();
        const items = data?.data || data || [];
        if (Array.isArray(items) && items.length > 0) {
          const formatted: LocalProduct[] = items.map((p: any) => ({
            id: p.id,
            sku: p.sku || `SKU-${p.id.substring(0,6)}`,
            barcode: p.barcode || '',
            name: p.name,
            price: Number(p.price || 0),
            comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined,
            cost: Number(p.cost || p.price * 0.7),
            stock: Number(p.stock || 0),
            minStock: Number(p.minStock || 5),
            unit: p.unit || 'UN',
            category: p.category?.name || 'Geral',
            description: p.description || '',
            updatedAt: new Date().toISOString(),
            synced: true,
          }));

          await db.products.bulkPut(formatted);
          return { success: true, count: formatted.length };
        }
      }
    } catch (e) {
      console.warn('[SyncEngine] Não foi possível conectar ao backend local para importar catálogo.');
    }
    return { success: false, count: 0 };
  }
}

export const syncService = new SyncService();
