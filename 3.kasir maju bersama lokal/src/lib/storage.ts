import { Product, Customer, Transaction, DebtRecord, DashboardStats } from './types';

const API_BASE_URL = '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Terjadi kesalahan pada server' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}

// Generate UUID (Fallback for client-side if needed)
export function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ==================== PRODUCTS ====================

export async function getProducts(): Promise<Product[]> {
    return fetchApi<Product[]>('/products');
}

export async function getProductById(id: string): Promise<Product | undefined> {
    const products = await getProducts();
    return products.find(p => p.id === id);
}

export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const products = await getProducts();
    return products.find(p => p.barcode === barcode);
}

export async function saveProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return fetchApi<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(product),
    });
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    await fetchApi<{ success: boolean }>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
    // For consistency with original API, return the updated product
    const products = await getProducts();
    return products.find(p => p.id === id) || null;
}

export async function deleteProduct(id: string): Promise<boolean> {
    const result = await fetchApi<{ success: boolean }>(`/products/${id}`, {
        method: 'DELETE',
    });
    return result.success;
}

export async function updateStock(id: string, quantityChange: number): Promise<Product | null> {
    // Note: Original code calculated new stock on client. 
    // New Express API has PATCH /api/products/:id/stock but it expects absolute stock.
    // We'll fetch, update, and patch for now to match expected behavior or fix API later.
    const products = await getProducts();
    const product = products.find(p => p.id === id);
    if (!product) return null;

    const newStock = product.stock + quantityChange;
    await fetchApi<{ success: boolean }>(`/products/${id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stock: newStock }),
    });

    return { ...product, stock: newStock };
}

export async function searchProducts(query: string): Promise<Product[]> {
    const products = await getProducts();
    const lowerQuery = query.toLowerCase();

    return products.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.activeIngredient.toLowerCase().includes(lowerQuery) ||
        (p.targetPests && p.targetPests.some(pest => pest.toLowerCase().includes(lowerQuery))) ||
        (p.barcode && p.barcode.includes(query))
    );
}

export async function getLowStockProducts(): Promise<Product[]> {
    const products = await getProducts();
    return products.filter(p => p.stock <= p.minStock);
}

// ==================== CUSTOMERS ====================

export async function getCustomers(): Promise<Customer[]> {
    return fetchApi<Customer[]>('/customers');
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
    const customers = await getCustomers();
    return customers.find(c => c.id === id);
}

export async function saveCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'currentDebt'>): Promise<Customer> {
    return fetchApi<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify(customer),
    });
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    await fetchApi<{ success: boolean }>(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
    const customers = await getCustomers();
    return customers.find(c => c.id === id) || null;
}

export async function deleteCustomer(id: string): Promise<boolean> {
    const result = await fetchApi<{ success: boolean }>(`/customers/${id}`, {
        method: 'DELETE',
    });
    return result.success;
}

// ==================== TRANSACTIONS ====================

export async function getTransactions(): Promise<Transaction[]> {
    return fetchApi<Transaction[]>('/transactions');
}

export async function saveTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    // Correct mapping for the new Express API
    const apiData = {
        customerId: transaction.customerId,
        customerName: transaction.customerName,
        items: transaction.items,
        subtotal: transaction.subtotal,
        discount: transaction.discount,
        total: transaction.total,
        paymentType: transaction.paymentType,
        amountPaid: transaction.amountPaid,
        change: transaction.change,
        dueDate: transaction.dueDate,
        notes: transaction.notes
    };

    return fetchApi<Transaction>('/transactions', {
        method: 'POST',
        body: JSON.stringify(apiData),
    });
}

export async function getTodayTransactions(): Promise<Transaction[]> {
    const transactions = await getTransactions();
    const today = new Date().toDateString();

    return transactions.filter(t =>
        new Date(t.createdAt).toDateString() === today
    );
}

// ==================== DEBTS ====================

// ==================== DEBTS ====================

export async function getDebts(): Promise<DebtRecord[]> {
    const [ledger, customers] = await Promise.all([
        fetchApi<any[]>('/ledger'),
        getCustomers()
    ]);

    return ledger.map(l => {
        const customer = customers.find(c => String(c.id) === String(l.entityId));
        return {
            id: String(l.id),
            transactionId: String(l.transactionId || ''),
            customerId: String(l.entityId),
            customerName: l.entityName,
            village: customer?.village || '',
            amount: l.amount,
            paidAmount: 0, // Simplified for now
            remainingAmount: l.amount,
            status: l.type === 'piutang' ? 'pending' : 'paid',
            payments: [],
            createdAt: l.date,
            updatedAt: l.date
        } as unknown as DebtRecord;
    });
}

export async function getCustomerDebts(customerId: string): Promise<DebtRecord[]> {
    const debts = await getDebts();
    return debts.filter(d => d.customerId === customerId);
}

export async function saveDebt(debt: { transactionId: string; customerId: string; customerName: string; village: string; amount: number; dueDate?: string }): Promise<any> {
    const apiData = {
        type: 'piutang',
        entityType: 'customer',
        entityId: parseInt(debt.customerId),
        entityName: debt.customerName,
        amount: debt.amount,
        note: `Hutang transaksi ${debt.transactionId}`,
        date: new Date().toISOString()
    };
    return fetchApi('/ledger', {
        method: 'POST',
        body: JSON.stringify(apiData),
    });
}

export async function addDebtPayment(debtId: string, amount: number, notes?: string): Promise<any> {
    const debts = await fetchApi<any[]>('/ledger');
    const debt = debts.find(d => String(d.id) === debtId);
    if (!debt) throw new Error('Debt entry not found');

    const apiData = {
        type: 'bayar_piutang',
        entityType: 'customer',
        entityId: debt.entityId,
        entityName: debt.entityName,
        amount: amount,
        note: notes || `Pembayaran hutang entry ${debtId}`,
        date: new Date().toISOString()
    };
    return fetchApi('/ledger', {
        method: 'POST',
        body: JSON.stringify(apiData),
    });
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const products = await getProducts();
    const transactions = await getTransactions();
    const ledger = await fetchApi<any[]>('/ledger');

    const today = new Date().toDateString();
    const todayTx = transactions.filter(t => new Date(t.createdAt).toDateString() === today);

    const totalDebt = ledger
        .filter(l => l.type === 'piutang')
        .reduce((sum, l) => sum + l.amount, 0);

    const totalPayment = ledger
        .filter(l => l.type === 'bayar_piutang')
        .reduce((sum, l) => sum + l.amount, 0);

    return {
        totalProducts: products.length,
        lowStockProducts: products.filter(p => p.stock <= p.minStock).length,
        todayTransactions: todayTx.length,
        todayRevenue: todayTx.reduce((sum, tx) => sum + tx.total, 0),
        totalDebt: Math.max(0, totalDebt - totalPayment),
        overdueDebts: 0
    };
}

export async function initSampleData(): Promise<void> {
    // This could trigger a restore or just check if data exists
    const products = await getProducts();
    if (products.length > 0) return;

    // In a real API-backed app, seeding usually happens on backend
    console.log('API is empty. Seeding should be handled by backend or restore feature.');
}
