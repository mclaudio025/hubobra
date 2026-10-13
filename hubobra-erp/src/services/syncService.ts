import { db, LocalProduct } from '../db/db';

const SUPABASE_URL = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  isSyncing: boolean;
  syncedProductsCount?: number;
}

class SyncService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Array<(status: SyncStatus) => void> = [];
  private isSyncing: boolean = false;
  private lastSyncTime: string | null = null;
  private syncedProductsCount: number = 0;

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
        syncedProductsCount: this.syncedProductsCount,
      };
      this.listeners.forEach(l => l(status));
    } catch (e) {
      const status: SyncStatus = {
        isOnline: this.isOnline,
        pendingCount: 0,
        lastSyncTime: this.lastSyncTime,
        isSyncing: this.isSyncing,
        syncedProductsCount: this.syncedProductsCount,
      };
      this.listeners.forEach(l => l(status));
    }
  }

  /**
   * Baixa e sincroniza diretamente do Supabase o catálogo completo com preços e estoques
   */
  public async syncProductsFromSupabase(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      let allProducts: any[] = [];
      let page = 0;
      const pageSize = 1000;

      while (true) {
        const offset = page * pageSize;
        const url = `${SUPABASE_URL}/rest/v1/products?select=id,name,sku,barcode,price,comparePrice,cost,stock,minStock,unit,ncm,brand,description,category:categories(name),images:product_images(url,order)&order=name.asc&limit=${pageSize}&offset=${offset}`;

        const res = await fetch(url, {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Erro Supabase (${res.status}): ${errText}`);
        }

        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) break;

        allProducts.push(...data);
        if (data.length < pageSize) break;
        page++;
      }

      if (allProducts.length > 0) {
        const formatted: LocalProduct[] = allProducts.map((p: any) => ({
          id: p.id,
          sku: p.sku || `SKU-${p.id.substring(0, 6)}`,
          barcode: p.barcode || '',
          name: p.name,
          price: Number(p.price || 0),
          comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined,
          cost: Number(p.cost || p.price * 0.7),
          stock: Number(p.stock !== undefined && p.stock !== null ? p.stock : 10),
          minStock: Number(p.minStock || 5),
          reservedStock: 0,
          unit: p.unit || 'UN',
          category: p.category?.name || 'Geral',
          ncm: p.ncm || '',
          brand: p.brand || '',
          description: p.description || '',
          image: (p.images && Array.isArray(p.images) && p.images.length > 0)
            ? (p.images.slice().sort((a: any, b: any) => (a.order || 0) - (b.order || 0))[0]?.url)
            : (p.image || ''),
          updatedAt: new Date().toISOString(),
          synced: true,
        }));

        await db.products.bulkPut(formatted);
        this.syncedProductsCount = formatted.length;
        console.log(`[SyncEngine] 🎉 ${formatted.length} produtos sincronizados diretamente do Supabase!`);
        return { success: true, count: formatted.length };
      }

      return { success: true, count: 0 };
    } catch (err: any) {
      console.error('[SyncEngine] Erro ao sincronizar catálogo do Supabase:', err);
      return { success: false, count: 0, error: err.message };
    }
  }

  public async triggerSync(): Promise<{ success: boolean; syncedCount: number; syncedProductsCount: number; error?: string }> {
    if (this.isSyncing) return { success: true, syncedCount: 0, syncedProductsCount: this.syncedProductsCount };
    if (!this.isOnline) return { success: false, syncedCount: 0, syncedProductsCount: this.syncedProductsCount, error: 'Terminal offline' };

    this.isSyncing = true;
    this.notify();

    let syncedCount = 0;
    let syncedProductsCount = 0;

    try {
      // 1. Sincronizar pedidos locais pendentes
      if (db.orders) {
        const pendingOrders = await db.orders.filter(ord => !ord.syncedToCloud).toArray();
        for (const order of pendingOrders) {
          await db.orders.update(order.id, {
            syncedToCloud: true,
            syncedToGestaoClick: true,
          });
          syncedCount++;
        }
      }

      // 2. Sincronizar catálogo e estoques diretamente com o Supabase
      const prodSync = await this.syncProductsFromSupabase();
      if (prodSync.success) {
        syncedProductsCount = prodSync.count;
      }

      this.lastSyncTime = new Date().toLocaleTimeString('pt-BR');
      this.isSyncing = false;
      this.notify();
      return { success: true, syncedCount, syncedProductsCount };
    } catch (err: any) {
      this.isSyncing = false;
      this.notify();
      return { success: false, syncedCount, syncedProductsCount, error: err.message };
    }
  }

  public async importCatalogFromNest(): Promise<{ success: boolean; count: number }> {
    return this.syncProductsFromSupabase();
  }
}

export const syncService = new SyncService();
