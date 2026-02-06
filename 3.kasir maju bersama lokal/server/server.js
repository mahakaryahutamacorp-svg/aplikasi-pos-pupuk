const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase, getAll, getOne, run, lastInsertId, saveDatabase, getDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

const dev = process.env.NODE_ENV !== 'production';
const next = require('next');
const nextApp = next({ dev, dir: path.join(__dirname, '..') });
const handle = nextApp.getRequestHandler();

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        console.log(`📡 API Request: ${req.method} ${req.path}`);
        if (req.method === 'POST' || req.method === 'PUT') {
            console.log('📦 Body:', JSON.stringify(req.body));
        }
    }
    next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// ==================== AUTH ====================
app.post('/api/auth/login', (req, res) => {
    const { pin } = req.body;
    const db = getDatabase();
    const result = db.exec("SELECT value FROM settings WHERE key = 'pin'");
    const storedPin = result[0]?.values[0]?.[0] || '2103';

    console.log(`🔐 Login attempt: received="${pin}" (type: ${typeof pin}), stored="${storedPin}" (type: ${typeof storedPin})`);

    if (String(storedPin) === String(pin)) {
        console.log('✅ Login successful');
        res.json({ success: true });
    } else {
        console.log('❌ Login failed');
        res.status(401).json({ success: false, error: 'PIN salah' });
    }
});

app.post('/api/auth/change-pin', (req, res) => {
    const { newPin } = req.body;
    if (!newPin || newPin.length !== 4) {
        return res.status(400).json({ error: 'PIN harus 4 digit' });
    }
    run("UPDATE settings SET value = ? WHERE key = 'pin'", [newPin]);
    res.json({ success: true });
});

// ==================== PRODUCTS ====================
app.get('/api/products', (req, res) => {
    const products = getAll('SELECT * FROM products ORDER BY id DESC');
    const formatted = products.map(p => ({
        ...p,
        targetPests: JSON.parse(p.targetPests || '[]'),
        prices: {
            cost: p.priceModal || 0,
            retail: p.priceEcer || 0,
            wholesale: p.priceGrosir || 0,
            wholesaleMinQty: p.wholesaleMinQty || 0
        }
    }));
    res.json(formatted);
});

app.post('/api/products', (req, res) => {
    const { barcode, name, type, activeIngredient, targetPests, stock, minStock, unit, prices } = req.body;
    run(`INSERT INTO products (barcode, name, type, activeIngredient, targetPests, stock, minStock, unit, priceModal, priceEcer, priceGrosir, wholesaleMinQty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [barcode || '', name, type || 'pupuk', activeIngredient || '', JSON.stringify(targetPests || []), stock || 0, minStock || 0, unit || 'kg', prices?.cost || 0, prices?.retail || 0, prices?.wholesale || 0, prices?.wholesaleMinQty || 0]);
    const id = lastInsertId();
    res.json({ id, ...req.body });
});

app.put('/api/products/:id', (req, res) => {
    const { barcode, name, type, activeIngredient, targetPests, stock, minStock, unit, prices } = req.body;
    run(`UPDATE products SET barcode=?, name=?, type=?, activeIngredient=?, targetPests=?, stock=?, minStock=?, unit=?, priceModal=?, priceEcer=?, priceGrosir=?, wholesaleMinQty=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
        [barcode, name, type, activeIngredient, JSON.stringify(targetPests || []), stock, minStock, unit, prices?.cost, prices?.retail, prices?.wholesale, prices?.wholesaleMinQty, req.params.id]);
    res.status(200).json({ success: true });
});

app.delete('/api/products/:id', (req, res) => {
    run('DELETE FROM products WHERE id=?', [req.params.id]);
    res.json({ success: true });
});

app.patch('/api/products/:id/stock', (req, res) => {
    const { stock } = req.body;
    run('UPDATE products SET stock=? WHERE id=?', [stock, req.params.id]);
    res.json({ success: true });
});

// ==================== CUSTOMERS ====================
app.get('/api/customers', (req, res) => {
    const customers = getAll('SELECT * FROM customers ORDER BY id DESC');
    res.json(customers);
});

app.post('/api/customers', (req, res) => {
    const { name, phone, village, farmerGroup, address, debt, debtLimit, harvestDate } = req.body;
    run(`INSERT INTO customers (name, phone, village, farmerGroup, address, debt, debtLimit, harvestDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, phone || '', village || '', farmerGroup || '', address || '', debt || 0, debtLimit || 0, harvestDate || '']);
    const id = lastInsertId();
    res.json({ id, ...req.body });
});

app.put('/api/customers/:id', (req, res) => {
    const { name, phone, village, farmerGroup, address, debt, debtLimit, harvestDate } = req.body;
    run(`UPDATE customers SET name=?, phone=?, village=?, farmerGroup=?, address=?, debt=?, debtLimit=?, harvestDate=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
        [name, phone, village, farmerGroup, address, debt, debtLimit, harvestDate, req.params.id]);
    res.json({ success: true });
});

app.delete('/api/customers/:id', (req, res) => {
    run('DELETE FROM customers WHERE id=?', [req.params.id]);
    res.json({ success: true });
});

// ==================== SUPPLIERS ====================
app.get('/api/suppliers', (req, res) => {
    const suppliers = getAll('SELECT * FROM suppliers ORDER BY id DESC');
    res.json(suppliers);
});

app.post('/api/suppliers', (req, res) => {
    const { name, phone, address, debt } = req.body;
    run(`INSERT INTO suppliers (name, phone, address, debt) VALUES (?, ?, ?, ?)`,
        [name, phone || '', address || '', debt || 0]);
    const id = lastInsertId();
    res.json({ id, ...req.body });
});

app.put('/api/suppliers/:id', (req, res) => {
    const { name, phone, address, debt } = req.body;
    run(`UPDATE suppliers SET name=?, phone=?, address=?, debt=? WHERE id=?`,
        [name, phone, address, debt, req.params.id]);
    res.json({ success: true });
});

app.delete('/api/suppliers/:id', (req, res) => {
    run('DELETE FROM suppliers WHERE id=?', [req.params.id]);
    res.json({ success: true });
});

// ==================== TRANSACTIONS ====================
app.get('/api/transactions', (req, res) => {
    const transactions = getAll('SELECT * FROM transactions ORDER BY id DESC');
    const parsed = transactions.map(t => ({
        ...t,
        items: JSON.parse(t.items || '[]')
    }));
    res.json(parsed);
});

app.post('/api/transactions', (req, res) => {
    const { customerId, customerName, items, subtotal, discount, total, paymentType, amountPaid, change, dueDate, notes } = req.body;
    run(`INSERT INTO transactions (customerId, customerName, items, subtotal, discount, total, paymentType, amountPaid, "change", dueDate, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [customerId, customerName || '', JSON.stringify(items || []), subtotal || 0, discount || 0, total || 0, paymentType || 'cash', amountPaid || 0, change || 0, dueDate, notes || '']);
    const id = lastInsertId();
    res.json({ id, ...req.body });
});

// ==================== PURCHASES ====================
app.get('/api/purchases', (req, res) => {
    const purchases = getAll('SELECT * FROM purchases ORDER BY id DESC');
    const parsed = purchases.map(p => ({
        ...p,
        items: JSON.parse(p.items || '[]')
    }));
    res.json(parsed);
});

app.post('/api/purchases', (req, res) => {
    const { supplierId, supplierName, items, total, amountPaid, paymentType, status, notes, dueDate } = req.body;
    run(`INSERT INTO purchases (supplierId, supplierName, items, total, amountPaid, paymentType, status, notes, dueDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [supplierId, supplierName || '', JSON.stringify(items || []), total || 0, amountPaid || 0, paymentType || 'cash', status || 'pending', notes || '', dueDate]);
    const id = lastInsertId();
    res.json({ id, ...req.body });
});

app.put('/api/purchases/:id', (req, res) => {
    const { amountPaid, status, notes } = req.body;
    run('UPDATE purchases SET amountPaid=?, status=?, notes=? WHERE id=?', [amountPaid, status, notes, req.params.id]);
    res.json({ success: true });
});

app.delete('/api/purchases/:id', (req, res) => {
    run('DELETE FROM purchases WHERE id=?', [req.params.id]);
    res.json({ success: true });
});

// ==================== LEDGER ====================
app.get('/api/ledger', (req, res) => {
    const entries = getAll('SELECT * FROM ledger_entries ORDER BY id DESC');
    res.json(entries);
});

app.post('/api/ledger', (req, res) => {
    const { date, type, entityType, entityId, entityName, amount, note } = req.body;
    run(`INSERT INTO ledger_entries (date, type, entityType, entityId, entityName, amount, note) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [date || new Date().toISOString(), type, entityType, entityId, entityName, amount || 0, note || '']);
    const id = lastInsertId();
    res.json({ id, ...req.body });
});

app.put('/api/ledger/:id', (req, res) => {
    const { date, type, entityType, entityId, entityName, amount, note } = req.body;
    run(`UPDATE ledger_entries SET date=?, type=?, entityType=?, entityId=?, entityName=?, amount=?, note=? WHERE id=?`,
        [date, type, entityType, entityId, entityName, amount, note, req.params.id]);
    res.json({ success: true });
});

app.delete('/api/ledger/:id', (req, res) => {
    run('DELETE FROM ledger_entries WHERE id=?', [req.params.id]);
    res.json({ success: true });
});

// ==================== BACKUP & RESTORE ====================
app.get('/api/backup', (req, res) => {
    const db = getDatabase();
    const pin = db.exec("SELECT value FROM settings WHERE key='pin'")[0]?.values[0]?.[0] || '2103';
    const data = {
        products: getAll('SELECT * FROM products'),
        customers: getAll('SELECT * FROM customers'),
        suppliers: getAll('SELECT * FROM suppliers'),
        transactions: getAll('SELECT * FROM transactions').map(t => ({ ...t, items: JSON.parse(t.items || '[]') })),
        purchases: getAll('SELECT * FROM purchases'),
        ledgerEntries: getAll('SELECT * FROM ledger_entries'),
        pin
    };
    res.json(data);
});

app.post('/api/restore', (req, res) => {
    const { products, customers, suppliers, transactions, purchases, ledgerEntries, pin } = req.body;

    try {
        run('DELETE FROM products');
        run('DELETE FROM customers');
        run('DELETE FROM suppliers');
        run('DELETE FROM transactions');
        run('DELETE FROM purchases');
        run('DELETE FROM ledger_entries');

        (products || []).forEach(p => run('INSERT INTO products (id, name, type, stock, unit, priceModal, priceEcer, priceGrosir) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [p.id, p.name, p.type, p.stock, p.unit, p.priceModal, p.priceEcer, p.priceGrosir]));

        (customers || []).forEach(c => run('INSERT INTO customers (id, name, phone, address, debt) VALUES (?, ?, ?, ?, ?)',
            [c.id, c.name, c.phone, c.address, c.debt]));

        (suppliers || []).forEach(s => run('INSERT INTO suppliers (id, name, phone, address, debt) VALUES (?, ?, ?, ?, ?)',
            [s.id, s.name, s.phone, s.address, s.debt]));

        (transactions || []).forEach(t => run('INSERT INTO transactions (id, date, customerName, payType, items, total) VALUES (?, ?, ?, ?, ?, ?)',
            [t.id, t.date, t.customerName, t.payType, JSON.stringify(t.items), t.total]));

        (purchases || []).forEach(p => run('INSERT INTO purchases (id, date, supplierId, supplierName, total, payMethod, dueDate, paid, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [p.id, p.date, p.supplierId, p.supplierName, p.total, p.payMethod, p.dueDate, p.paid, p.status]));

        (ledgerEntries || []).forEach(l => run('INSERT INTO ledger_entries (id, date, type, entityType, entityId, entityName, amount, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [l.id, l.date, l.type, l.entityType, l.entityId, l.entityName, l.amount, l.note]));

        if (pin) run("UPDATE settings SET value=? WHERE key='pin'", [pin]);

        saveDatabase();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== SERVE FRONTEND ====================
// Handle all other routes with Next.js
app.all('*', (req, res) => {
    return handle(req, res);
});

// Start server  
async function start() {
    await initDatabase();
    await nextApp.prepare();
    app.listen(PORT, () => {
        console.log(`🚀 CV. Maju Bersama POS Server running on http://localhost:${PORT}`);
    });
}

start().catch(console.error);
