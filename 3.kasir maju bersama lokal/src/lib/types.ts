// Product Types
export type ProductType =
    | 'insektisida'
    | 'fungisida'
    | 'herbisida'
    | 'rodentisida'
    | 'pupuk_organik'
    | 'pupuk_anorganik'
    | 'pupuk_cair'
    | 'zpt'  // Zat Pengatur Tumbuh
    | 'adjuvan'
    | 'benih'
    | 'lainnya';

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
    insektisida: 'Insektisida',
    fungisida: 'Fungisida',
    herbisida: 'Herbisida',
    rodentisida: 'Rodentisida',
    pupuk_organik: 'Pupuk Organik',
    pupuk_anorganik: 'Pupuk Anorganik',
    pupuk_cair: 'Pupuk Cair',
    zpt: 'ZPT',
    adjuvan: 'Adjuvan',
    benih: 'Benih',
    lainnya: 'Lainnya'
};

export const PRODUCT_TYPE_COLORS: Record<ProductType, string> = {
    insektisida: 'bg-red-100 text-red-700',
    fungisida: 'bg-blue-100 text-blue-700',
    herbisida: 'bg-orange-100 text-orange-700',
    rodentisida: 'bg-purple-100 text-purple-700',
    pupuk_organik: 'bg-green-100 text-green-700',
    pupuk_anorganik: 'bg-teal-100 text-teal-700',
    pupuk_cair: 'bg-cyan-100 text-cyan-700',
    zpt: 'bg-pink-100 text-pink-700',
    adjuvan: 'bg-gray-100 text-gray-700',
    benih: 'bg-amber-100 text-amber-700',
    lainnya: 'bg-slate-100 text-slate-700'
};

// Product Interface
export interface Product {
    id: string;
    barcode?: string;
    name: string;
    type: ProductType;
    activeIngredient: string;
    targetPests?: string[];
    unit: string;
    stock: number;
    minStock: number;
    prices: {
        cost: number;
        retail: number;
        wholesale: number;
        wholesaleMinQty: number;
    };
    createdAt: string;
    updatedAt: string;
}

// Customer Interface
export interface Customer {
    id: string;
    name: string;
    phone?: string;
    village: string;
    farmerGroup?: string;
    debtLimit: number;
    currentDebt: number;
    harvestDate?: string;
    createdAt: string;
    updatedAt: string;
}

// Cart Item
export interface CartItem {
    productId: string;
    product: Product;
    quantity: number;
    priceType: 'retail' | 'wholesale';
    unitPrice: number;
    subtotal: number;
}

// Transaction
export interface Transaction {
    id: string;
    customerId?: string;
    customerName?: string;
    items: TransactionItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentType: 'cash' | 'debt';
    amountPaid: number;
    change: number;
    dueDate?: string;
    notes?: string;
    createdAt: string;
}

export interface TransactionItem {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    priceType: 'retail' | 'wholesale';
    unitPrice: number;
    subtotal: number;
}

// Debt/Piutang Record
export interface DebtRecord {
    id: string;
    transactionId: string;
    customerId: string;
    customerName: string;
    village: string;
    amount: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate?: string;
    status: 'pending' | 'partial' | 'paid';
    payments: DebtPayment[];
    createdAt: string;
    updatedAt: string;
}

export interface DebtPayment {
    id: string;
    amount: number;
    paidAt: string;
    notes?: string;
}

// Dashboard Stats
export interface DashboardStats {
    totalProducts: number;
    lowStockProducts: number;
    todayTransactions: number;
    todayRevenue: number;
    totalDebt: number;
    overdueDebts: number;
}

// Units
export const UNITS = [
    'Liter',
    'Kilogram',
    'Gram',
    'Sachet',
    'Botol',
    'Karung',
    'Pack',
    'Tablet',
    'Ekor',
    'Batang',
    'Bungkus'
] as const;

export type Unit = typeof UNITS[number];
