const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'banco_loja.db');
const db = new sqlite3.Database(DB_PATH);

// Habilita WAL mode para alta concorrência de leitura e escrita simultânea
db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL;');
  db.run('PRAGMA synchronous = NORMAL;');

  // 1. Tabela de Pedidos / Orçamentos / Pré-Vendas
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE,
      type TEXT DEFAULT 'PEDIDO_VENDA',
      origin TEXT DEFAULT 'BALCAO', -- BALCAO, LIA_AI, MOBILE, ECOMMERCE
      seller_id TEXT,
      seller_name TEXT,
      customer_id TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      customer_cpf_cnpj TEXT,
      items_json TEXT, -- Array serializado de produtos
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      shipping REAL DEFAULT 0,
      total REAL DEFAULT 0,
      payment_condition TEXT,
      payments_json TEXT, -- Array serializado de formas de pagamento
      status TEXT DEFAULT 'AGUARDANDO_PAGAMENTO', -- AGUARDANDO_PAGAMENTO, PAGO, EM_SEPARACAO, ENTREGUE, CANCELADO
      delivery_mode TEXT DEFAULT 'IMMEDIATE', -- IMMEDIATE, FUTURE_PICKUP, SCHEDULED_DELIVERY
      notes TEXT,
      cashier_name TEXT,
      paid_at TEXT,
      created_at TEXT,
      updated_at TEXT,
      synced_cloud INTEGER DEFAULT 0
    )
  `);

  // 2. Tabela de Produtos / Catálogo Centralizado
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE,
      barcode TEXT,
      name TEXT NOT NULL,
      brand TEXT,
      category TEXT,
      unit TEXT DEFAULT 'UN',
      price REAL DEFAULT 0,
      cost REAL DEFAULT 0,
      stock REAL DEFAULT 0,
      reserved_stock REAL DEFAULT 0,
      location TEXT,
      image TEXT,
      updated_at TEXT
    )
  `);

  // 3. Tabela de Clientes da Loja
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cpf_cnpj TEXT UNIQUE,
      phone TEXT,
      email TEXT,
      credit_limit REAL DEFAULT 0,
      credit_used REAL DEFAULT 0,
      store_credit REAL DEFAULT 0, -- Saldo de haver/devolução
      notes TEXT,
      created_at TEXT
    )
  `);

  // 4. Tabela de Fechamento e Sangrias do Caixa Central
  db.run(`
    CREATE TABLE IF NOT EXISTS cash_register (
      id TEXT PRIMARY KEY,
      operator TEXT NOT NULL,
      opened_at TEXT NOT NULL,
      closed_at TEXT,
      initial_cash REAL DEFAULT 0,
      current_cash REAL DEFAULT 0,
      movements_json TEXT,
      status TEXT DEFAULT 'OPEN'
    )
  `);

  // 5. Histórico e Fila de Impressão Local
  db.run(`
    CREATE TABLE IF NOT EXISTS print_jobs (
      id TEXT PRIMARY KEY,
      printer_name TEXT,
      printer_type TEXT, -- THERMAL_80MM, DOT_MATRIX_LX300, TONER_A4
      content TEXT,
      status TEXT DEFAULT 'PENDING',
      created_at TEXT
    )
  `);

  // Índices para buscas ultrarrápidas
  db.run('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);');
  db.run('CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);');
  db.run('CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);');
  db.run('CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);');
});

// Funções de Acesso a Dados com Promises
const DB = {
  // --- PEDIDOS ---
  getAllOrders: (statusFilter) => {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM orders';
      const params = [];
      if (statusFilter) {
        query += ' WHERE status = ?';
        params.push(statusFilter);
      }
      query += ' ORDER BY created_at DESC LIMIT 150';
      db.all(query, params, (err, rows) => {
        if (err) return reject(err);
        const parsed = rows.map(r => ({
          ...r,
          items: r.items_json ? JSON.parse(r.items_json) : [],
          payments: r.payments_json ? JSON.parse(r.payments_json) : []
        }));
        resolve(parsed);
      });
    });
  },

  getOrderById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM orders WHERE id = ? OR order_number = ?', [id, id], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve({
          ...row,
          items: row.items_json ? JSON.parse(row.items_json) : [],
          payments: row.payments_json ? JSON.parse(row.payments_json) : []
        });
      });
    });
  },

  getNextOrderNumber: () => {
    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM orders', [], (err, row) => {
        if (err) return reject(err);
        const nextNum = (row.count + 1001).toString();
        resolve(nextNum);
      });
    });
  },

  createOrder: async (data) => {
    const id = data.id || 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const orderNumber = data.orderNumber || await DB.getNextOrderNumber();
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO orders (
          id, order_number, type, origin, seller_id, seller_name,
          customer_id, customer_name, customer_phone, customer_cpf_cnpj,
          items_json, subtotal, discount, shipping, total,
          payment_condition, status, delivery_mode, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        id,
        orderNumber,
        data.type || 'PEDIDO_VENDA',
        data.origin || 'BALCAO',
        data.sellerId || 'seller_default',
        data.sellerName || 'Vendedor Balcão',
        data.customerId || null,
        data.customerName || 'Cliente Balcão',
        data.customerPhone || null,
        data.customerCpfCnpj || null,
        JSON.stringify(data.items || []),
        data.subtotal || 0,
        data.discount || 0,
        data.shipping || 0,
        data.total || 0,
        data.paymentCondition || 'A Vista',
        data.status || 'AGUARDANDO_PAGAMENTO',
        data.deliveryMode || 'IMMEDIATE',
        data.notes || '',
        now,
        now
      ];

      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ id, orderNumber, ...data, created_at: now, updated_at: now });
      });
    });
  },

  payOrder: (id, paymentData) => {
    const now = new Date().toISOString();
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE orders SET
          status = 'PAGO',
          cashier_name = ?,
          payments_json = ?,
          paid_at = ?,
          updated_at = ?
        WHERE id = ? OR order_number = ?
      `;
      const params = [
        paymentData.cashierName || 'Caixa Central',
        JSON.stringify(paymentData.payments || []),
        now,
        now,
        id,
        id
      ];

      db.run(sql, params, function (err) {
        if (err) return reject(err);
        DB.getOrderById(id).then(resolve).catch(reject);
      });
    });
  },

  updateOrderStatus: (id, status, notes) => {
    const now = new Date().toISOString();
    return new Promise((resolve, reject) => {
      let sql = 'UPDATE orders SET status = ?, updated_at = ?';
      const params = [status, now];
      if (notes) {
        sql += ', notes = ?';
        params.push(notes);
      }
      sql += ' WHERE id = ? OR order_number = ?';
      params.push(id, id);

      db.run(sql, params, function (err) {
        if (err) return reject(err);
        DB.getOrderById(id).then(resolve).catch(reject);
      });
    });
  },

  // --- PRODUTOS ---
  getAllProducts: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM products ORDER BY name ASC', [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  saveProduct: (prod) => {
    const now = new Date().toISOString();
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO products (
          id, sku, barcode, name, brand, category, unit, price, cost, stock, reserved_stock, location, image, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          sku = excluded.sku,
          barcode = excluded.barcode,
          name = excluded.name,
          brand = excluded.brand,
          category = excluded.category,
          unit = excluded.unit,
          price = excluded.price,
          cost = excluded.cost,
          stock = excluded.stock,
          location = excluded.location,
          image = excluded.image,
          updated_at = excluded.updated_at
      `;
      const params = [
        prod.id, prod.sku, prod.barcode || '', prod.name, prod.brand || '',
        prod.category || '', prod.unit || 'UN', prod.price || 0, prod.cost || 0,
        prod.stock || 0, prod.reservedStock || 0, prod.location || '', prod.image || '', now
      ];
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve(prod);
      });
    });
  },

  // --- CLIENTES ---
  getAllCustomers: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM customers ORDER BY name ASC', [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  saveCustomer: (cust) => {
    const now = new Date().toISOString();
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO customers (
          id, name, cpf_cnpj, phone, email, credit_limit, credit_used, store_credit, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          phone = excluded.phone,
          email = excluded.email,
          credit_limit = excluded.credit_limit,
          credit_used = excluded.credit_used,
          store_credit = excluded.store_credit,
          notes = excluded.notes
      `;
      const params = [
        cust.id, cust.name, cust.cpfCnpj || null, cust.phone || '', cust.email || '',
        cust.creditLimit || 0, cust.creditUsed || 0, cust.storeCredit || 0, cust.notes || '', now
      ];
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve(cust);
      });
    });
  }
};

module.exports = { db, DB };
