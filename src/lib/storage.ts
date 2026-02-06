import { Product, Customer, Transaction, DebtRecord, DashboardStats } from './types';

// Storage Keys
const STORAGE_KEYS = {
    PRODUCTS: 'pos_products',
    CUSTOMERS: 'pos_customers',
    TRANSACTIONS: 'pos_transactions',
    DEBTS: 'pos_debts',
    SETTINGS: 'pos_settings'
} as const;

// Generate UUID
export function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Generic Storage Functions
function getFromStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
}

function saveToStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error saving to storage:', error);
    }
}

// ==================== PRODUCTS ====================

export function getProducts(): Product[] {
    return getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
}

export function getProductById(id: string): Product | undefined {
    const products = getProducts();
    return products.find(p => p.id === id);
}

export function getProductByBarcode(barcode: string): Product | undefined {
    const products = getProducts();
    return products.find(p => p.barcode === barcode);
}

export function saveProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const products = getProducts();
    const now = new Date().toISOString();
    const newProduct: Product = {
        ...product,
        id: generateId(),
        createdAt: now,
        updatedAt: now
    };
    products.push(newProduct);
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    return newProduct;
}

export function updateProduct(id: string, updates: Partial<Product>): Product | null {
    const products = getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    products[index] = {
        ...products[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    return products[index];
}

export function deleteProduct(id: string): boolean {
    const products = getProducts();
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length === products.length) return false;
    saveToStorage(STORAGE_KEYS.PRODUCTS, filtered);
    return true;
}

export function updateStock(id: string, quantityChange: number): Product | null {
    const products = getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    products[index].stock += quantityChange;
    products[index].updatedAt = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    return products[index];
}

export function searchProducts(query: string): Product[] {
    const products = getProducts();
    const lowerQuery = query.toLowerCase();

    return products.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.activeIngredient.toLowerCase().includes(lowerQuery) ||
        p.targetPests?.some(pest => pest.toLowerCase().includes(lowerQuery)) ||
        p.barcode?.includes(query)
    );
}

export function getLowStockProducts(): Product[] {
    const products = getProducts();
    return products.filter(p => p.stock <= p.minStock);
}

// ==================== CUSTOMERS ====================

export function getCustomers(): Customer[] {
    return getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
}

export function getCustomerById(id: string): Customer | undefined {
    const customers = getCustomers();
    return customers.find(c => c.id === id);
}

export function saveCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'currentDebt'>): Customer {
    const customers = getCustomers();
    const now = new Date().toISOString();
    const newCustomer: Customer = {
        ...customer,
        id: generateId(),
        currentDebt: 0,
        createdAt: now,
        updatedAt: now
    };
    customers.push(newCustomer);
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    return newCustomer;
}

export function updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const customers = getCustomers();
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) return null;

    customers[index] = {
        ...customers[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    return customers[index];
}

export function deleteCustomer(id: string): boolean {
    const customers = getCustomers();
    const filtered = customers.filter(c => c.id !== id);
    if (filtered.length === customers.length) return false;
    saveToStorage(STORAGE_KEYS.CUSTOMERS, filtered);
    return true;
}

export function searchCustomers(query: string): Customer[] {
    const customers = getCustomers();
    const lowerQuery = query.toLowerCase();

    return customers.filter(c =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.village.toLowerCase().includes(lowerQuery) ||
        c.farmerGroup?.toLowerCase().includes(lowerQuery) ||
        c.phone?.includes(query)
    );
}

export function getCustomersByVillage(village: string): Customer[] {
    const customers = getCustomers();
    return customers.filter(c => c.village.toLowerCase() === village.toLowerCase());
}

// ==================== TRANSACTIONS ====================

export function getTransactions(): Transaction[] {
    return getFromStorage<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
}

export function getTransactionById(id: string): Transaction | undefined {
    const transactions = getTransactions();
    return transactions.find(t => t.id === id);
}

export function saveTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const transactions = getTransactions();
    const now = new Date().toISOString();
    const newTransaction: Transaction = {
        ...transaction,
        id: generateId(),
        createdAt: now
    };
    transactions.push(newTransaction);
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);

    // Update product stock
    transaction.items.forEach(item => {
        updateStock(item.productId, -item.quantity);
    });

    return newTransaction;
}

export function getTodayTransactions(): Transaction[] {
    const transactions = getTransactions();
    const today = new Date().toDateString();

    return transactions.filter(t =>
        new Date(t.createdAt).toDateString() === today
    );
}

export function getTransactionsByDateRange(startDate: Date, endDate: Date): Transaction[] {
    const transactions = getTransactions();

    return transactions.filter(t => {
        const txDate = new Date(t.createdAt);
        return txDate >= startDate && txDate <= endDate;
    });
}

// ==================== DEBTS ====================

export function getDebts(): DebtRecord[] {
    return getFromStorage<DebtRecord[]>(STORAGE_KEYS.DEBTS, []);
}

export function getDebtById(id: string): DebtRecord | undefined {
    const debts = getDebts();
    return debts.find(d => d.id === id);
}

export function saveDebt(debt: Omit<DebtRecord, 'id' | 'createdAt' | 'updatedAt' | 'payments' | 'paidAmount' | 'remainingAmount' | 'status'>): DebtRecord {
    const debts = getDebts();
    const now = new Date().toISOString();
    const newDebt: DebtRecord = {
        ...debt,
        id: generateId(),
        paidAmount: 0,
        remainingAmount: debt.amount,
        status: 'pending',
        payments: [],
        createdAt: now,
        updatedAt: now
    };
    debts.push(newDebt);
    saveToStorage(STORAGE_KEYS.DEBTS, debts);

    // Update customer debt
    const customer = getCustomerById(debt.customerId);
    if (customer) {
        updateCustomer(customer.id, {
            currentDebt: customer.currentDebt + debt.amount
        });
    }

    return newDebt;
}

export function addDebtPayment(debtId: string, amount: number, notes?: string): DebtRecord | null {
    const debts = getDebts();
    const index = debts.findIndex(d => d.id === debtId);
    if (index === -1) return null;

    const debt = debts[index];
    const payment = {
        id: generateId(),
        amount,
        paidAt: new Date().toISOString(),
        notes
    };

    debt.payments.push(payment);
    debt.paidAmount += amount;
    debt.remainingAmount = debt.amount - debt.paidAmount;
    debt.status = debt.remainingAmount <= 0 ? 'paid' : debt.paidAmount > 0 ? 'partial' : 'pending';
    debt.updatedAt = new Date().toISOString();

    saveToStorage(STORAGE_KEYS.DEBTS, debts);

    // Update customer debt
    const customer = getCustomerById(debt.customerId);
    if (customer) {
        updateCustomer(customer.id, {
            currentDebt: Math.max(0, customer.currentDebt - amount)
        });
    }

    return debt;
}

export function getCustomerDebts(customerId: string): DebtRecord[] {
    const debts = getDebts();
    return debts.filter(d => d.customerId === customerId);
}

export function getOverdueDebts(): DebtRecord[] {
    const debts = getDebts();
    const today = new Date();

    return debts.filter(d =>
        d.status !== 'paid' &&
        d.dueDate &&
        new Date(d.dueDate) < today
    );
}

export function getDebtsByVillage(village: string): DebtRecord[] {
    const debts = getDebts();
    return debts.filter(d => d.village.toLowerCase() === village.toLowerCase());
}

// ==================== DASHBOARD STATS ====================

export function getDashboardStats(): DashboardStats {
    const products = getProducts();
    const todayTx = getTodayTransactions();
    const debts = getDebts();
    const overdueDebts = getOverdueDebts();

    return {
        totalProducts: products.length,
        lowStockProducts: products.filter(p => p.stock <= p.minStock).length,
        todayTransactions: todayTx.length,
        todayRevenue: todayTx.reduce((sum, tx) => sum + tx.total, 0),
        totalDebt: debts.filter(d => d.status !== 'paid').reduce((sum, d) => sum + d.remainingAmount, 0),
        overdueDebts: overdueDebts.length
    };
}

// ==================== SAMPLE DATA ====================

export function initSampleData(): void {
    const products = getProducts();
    if (products.length > 0) return; // Don't overwrite existing data

    const sampleProducts: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
            name: 'Prevathon 50SC',
            barcode: '8991234567001',
            type: 'insektisida',
            activeIngredient: 'Klorantraniliprol',
            targetPests: ['Ulat', 'Penggerek', 'Sundep'],
            unit: 'Botol',
            stock: 25,
            minStock: 5,
            prices: { cost: 85000, retail: 105000, wholesale: 95000, wholesaleMinQty: 6 }
        },
        {
            name: 'Score 250EC',
            barcode: '8991234567002',
            type: 'fungisida',
            activeIngredient: 'Difenokonazol',
            targetPests: ['Blas', 'Busuk Batang', 'Hawar Daun'],
            unit: 'Botol',
            stock: 18,
            minStock: 5,
            prices: { cost: 120000, retail: 150000, wholesale: 135000, wholesaleMinQty: 6 }
        },
        {
            name: 'Gramoxone 276SL',
            barcode: '8991234567003',
            type: 'herbisida',
            activeIngredient: 'Parakuat Diklorida',
            targetPests: ['Gulma'],
            unit: 'Liter',
            stock: 30,
            minStock: 10,
            prices: { cost: 65000, retail: 85000, wholesale: 75000, wholesaleMinQty: 12 }
        },
        {
            name: 'Regent 50SC',
            barcode: '8991234567004',
            type: 'insektisida',
            activeIngredient: 'Fipronil',
            targetPests: ['Wereng', 'Walang Sangit', 'Kepik'],
            unit: 'Botol',
            stock: 3,
            minStock: 5,
            prices: { cost: 95000, retail: 120000, wholesale: 110000, wholesaleMinQty: 6 }
        },
        {
            name: 'Urea Subsidi',
            barcode: '8991234567005',
            type: 'pupuk_anorganik',
            activeIngredient: 'Nitrogen 46%',
            unit: 'Karung',
            stock: 150,
            minStock: 50,
            prices: { cost: 95000, retail: 112000, wholesale: 105000, wholesaleMinQty: 10 }
        },
        {
            name: 'NPK Phonska',
            barcode: '8991234567006',
            type: 'pupuk_anorganik',
            activeIngredient: 'NPK 15-15-15',
            unit: 'Karung',
            stock: 80,
            minStock: 30,
            prices: { cost: 115000, retail: 140000, wholesale: 130000, wholesaleMinQty: 10 }
        },
        {
            name: 'Virtako 300SC',
            barcode: '8991234567007',
            type: 'insektisida',
            activeIngredient: 'Klorantraniliprol + Tiametoksam',
            targetPests: ['Wereng', 'Penggerek Batang', 'Ulat'],
            unit: 'Botol',
            stock: 12,
            minStock: 5,
            prices: { cost: 180000, retail: 220000, wholesale: 200000, wholesaleMinQty: 6 }
        },
        {
            name: 'Antracol 70WP',
            barcode: '8991234567008',
            type: 'fungisida',
            activeIngredient: 'Propineb',
            targetPests: ['Blas', 'Busuk Buah', 'Bercak Daun'],
            unit: 'Kilogram',
            stock: 20,
            minStock: 8,
            prices: { cost: 75000, retail: 95000, wholesale: 85000, wholesaleMinQty: 6 }
        }
    ];

    sampleProducts.forEach(product => saveProduct(product));

    const sampleCustomers: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'currentDebt'>[] = [
        { name: 'Pak Slamet', phone: '081234567890', village: 'Desa Sukamaju', farmerGroup: 'Tani Makmur', debtLimit: 5000000, harvestDate: '2026-04-15' },
        { name: 'Bu Sumiati', phone: '081234567891', village: 'Desa Sukamaju', farmerGroup: 'Tani Makmur', debtLimit: 3000000, harvestDate: '2026-04-20' },
        { name: 'Pak Joko', phone: '081234567892', village: 'Desa Harapan', farmerGroup: 'Harapan Jaya', debtLimit: 4000000, harvestDate: '2026-05-01' },
    ];

    sampleCustomers.forEach(customer => saveCustomer(customer));
}
