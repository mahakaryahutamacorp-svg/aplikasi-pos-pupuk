const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'pos_data.db');
let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Initialize tables
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'pupuk',
      activeIngredient TEXT DEFAULT '',
      stock REAL DEFAULT 0,
      minStock REAL DEFAULT 0,
      unit TEXT DEFAULT 'kg',
      priceModal REAL DEFAULT 0,
      priceEcer REAL DEFAULT 0,
      priceGrosir REAL DEFAULT 0,
      wholesaleMinQty REAL DEFAULT 0,
      targetPests TEXT DEFAULT '[]',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      village TEXT DEFAULT '',
      farmerGroup TEXT DEFAULT '',
      address TEXT,
      debt REAL DEFAULT 0,
      debtLimit REAL DEFAULT 0,
      harvestDate TEXT DEFAULT '',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      debt REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      customerName TEXT,
      payType TEXT DEFAULT 'cash',
      items TEXT,
      total REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      supplierId INTEGER,
      supplierName TEXT,
      total REAL DEFAULT 0,
      payMethod TEXT DEFAULT 'cash',
      dueDate DATETIME,
      paid REAL DEFAULT 0,
      status TEXT DEFAULT 'belum'
    );

    CREATE TABLE IF NOT EXISTS ledger_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      type TEXT,
      entityType TEXT,
      entityId INTEGER,
      entityName TEXT,
      amount REAL DEFAULT 0,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Insert default PIN if not exists
  const pinResult = db.exec("SELECT * FROM settings WHERE key = 'pin'");
  if (pinResult.length === 0) {
    db.run("INSERT INTO settings (key, value) VALUES ('pin', '2103')");
  }

  // Insert sample products if empty
  const productResult = db.exec("SELECT COUNT(*) as count FROM products");
  if (productResult.length === 0 || productResult[0].values[0][0] === 0) {
    db.run(`INSERT INTO products (name, type, stock, unit, priceModal, priceEcer, priceGrosir) VALUES ('Pupuk NPK 16-16-16', 'pupuk', 100, 'kg', 10000, 15000, 13000)`);
    db.run(`INSERT INTO products (name, type, stock, unit, priceModal, priceEcer, priceGrosir) VALUES ('Pupuk Urea', 'pupuk', 150, 'kg', 8000, 12000, 10000)`);
    db.run(`INSERT INTO products (name, type, stock, unit, priceModal, priceEcer, priceGrosir) VALUES ('Herbisida Roundup', 'pestisida', 20, 'liter', 70000, 85000, 78000)`);
  }

  saveDatabase();
  console.log('📦 Database initialized');
  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

function getDatabase() {
  return db;
}

// Helper to convert result to array of objects
function resultToObjects(result) {
  if (!result || result.length === 0) return [];
  const columns = result[0].columns;
  const values = result[0].values;
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => obj[col] = row[i]);
    return obj;
  });
}

// Helper to get single value
function getOne(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

// Helper to get all rows
function getAll(sql, params = []) {
  const result = db.exec(sql);
  return resultToObjects(result);
}

// Helper to run SQL
function run(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
  return db.getRowsModified();
}

// Get last insert ID
function lastInsertId() {
  const result = db.exec("SELECT last_insert_rowid() as id");
  return resultToObjects(result)[0]?.id;
}

module.exports = {
  initDatabase,
  getDatabase,
  saveDatabase,
  getOne,
  getAll,
  run,
  lastInsertId,
  resultToObjects
};
