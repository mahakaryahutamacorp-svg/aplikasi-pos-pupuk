'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { getTransactions, getDebts, getProducts } from '@/lib/storage';
import { Transaction, DebtRecord, Product } from '@/lib/types';

type ReportType = 'sales' | 'debts' | 'products';

export default function LaporanPage() {
    const [activeReport, setActiveReport] = useState<ReportType>('sales');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [debts, setDebts] = useState<DebtRecord[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of month
        end: new Date().toISOString().split('T')[0] // Today
    });

    useEffect(() => {
        setTransactions(getTransactions());
        setDebts(getDebts());
        setProducts(getProducts());
    }, []);

    // Filter transactions by date range
    const filteredTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.createdAt).toISOString().split('T')[0];
        return txDate >= dateRange.start && txDate <= dateRange.end;
    });

    // Calculate stats
    const totalSales = filteredTransactions.reduce((sum, tx) => sum + tx.total, 0);
    const cashSales = filteredTransactions.filter(tx => tx.paymentType === 'cash').reduce((sum, tx) => sum + tx.total, 0);
    const debtSales = filteredTransactions.filter(tx => tx.paymentType === 'debt').reduce((sum, tx) => sum + tx.total, 0);
    const totalTransactions = filteredTransactions.length;

    const pendingDebts = debts.filter(d => d.status !== 'paid');
    const overdueDebts = pendingDebts.filter(d => d.dueDate && new Date(d.dueDate) < new Date());
    const totalDebtAmount = pendingDebts.reduce((sum, d) => sum + d.remainingAmount, 0);

    // Group debts by village
    const debtsByVillage = pendingDebts.reduce((acc, debt) => {
        if (!acc[debt.village]) {
            acc[debt.village] = { count: 0, amount: 0 };
        }
        acc[debt.village].count += 1;
        acc[debt.village].amount += debt.remainingAmount;
        return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    // Top selling products
    const productSales = filteredTransactions.reduce((acc, tx) => {
        tx.items.forEach(item => {
            if (!acc[item.productId]) {
                acc[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
            }
            acc[item.productId].quantity += item.quantity;
            acc[item.productId].revenue += item.subtotal;
        });
        return acc;
    }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

    const topProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 10);

    return (
        <div className="min-h-screen">
            <Header title="Laporan" subtitle="Laporan penjualan, piutang, dan statistik" />

            <div className="p-6">
                {/* Report Type Tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { id: 'sales' as ReportType, label: '📊 Penjualan', icon: '📊' },
                        { id: 'debts' as ReportType, label: '💰 Piutang', icon: '💰' },
                        { id: 'products' as ReportType, label: '📦 Produk', icon: '📦' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveReport(tab.id)}
                            className={`px-4 py-2.5 rounded-lg font-medium transition-all ${activeReport === tab.id
                                ? 'bg-emerald-deep text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Date Range Filter */}
                {activeReport === 'sales' && (
                    <Card className="mb-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-slate-600">Dari:</label>
                                <input
                                    type="date"
                                    id="date-start"
                                    title="Tanggal mulai"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-slate-600">Sampai:</label>
                                <input
                                    type="date"
                                    id="date-end"
                                    title="Tanggal akhir"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        const today = new Date();
                                        setDateRange({
                                            start: today.toISOString().split('T')[0],
                                            end: today.toISOString().split('T')[0]
                                        });
                                    }}
                                    className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg"
                                >
                                    Hari Ini
                                </button>
                                <button
                                    onClick={() => {
                                        const today = new Date();
                                        const weekAgo = new Date(today.setDate(today.getDate() - 7));
                                        setDateRange({
                                            start: weekAgo.toISOString().split('T')[0],
                                            end: new Date().toISOString().split('T')[0]
                                        });
                                    }}
                                    className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg"
                                >
                                    7 Hari
                                </button>
                                <button
                                    onClick={() => {
                                        const today = new Date();
                                        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                                        setDateRange({
                                            start: firstDay.toISOString().split('T')[0],
                                            end: new Date().toISOString().split('T')[0]
                                        });
                                    }}
                                    className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg"
                                >
                                    Bulan Ini
                                </button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Sales Report */}
                {activeReport === 'sales' && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-4 gap-4">
                            <Card>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-emerald-600">
                                        Rp {totalSales.toLocaleString('id-ID')}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">Total Penjualan</p>
                                </div>
                            </Card>
                            <Card>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-green-600">
                                        Rp {cashSales.toLocaleString('id-ID')}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">Penjualan Tunai</p>
                                </div>
                            </Card>
                            <Card>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-orange-600">
                                        Rp {debtSales.toLocaleString('id-ID')}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">Penjualan Hutang</p>
                                </div>
                            </Card>
                            <Card>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-slate-800">
                                        {totalTransactions}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">Total Transaksi</p>
                                </div>
                            </Card>
                        </div>

                        {/* Transaction List */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Riwayat Transaksi</CardTitle>
                            </CardHeader>

                            {filteredTransactions.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">📋</div>
                                    <p className="text-slate-500">Tidak ada transaksi dalam periode ini</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-200">
                                                <th className="text-left py-3 px-2 text-xs font-medium text-slate-500">Tanggal</th>
                                                <th className="text-left py-3 px-2 text-xs font-medium text-slate-500">ID</th>
                                                <th className="text-left py-3 px-2 text-xs font-medium text-slate-500">Pelanggan</th>
                                                <th className="text-left py-3 px-2 text-xs font-medium text-slate-500">Items</th>
                                                <th className="text-left py-3 px-2 text-xs font-medium text-slate-500">Pembayaran</th>
                                                <th className="text-right py-3 px-2 text-xs font-medium text-slate-500">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTransactions.slice().reverse().map((tx) => (
                                                <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                    <td className="py-3 px-2 text-sm text-slate-600">
                                                        {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="py-3 px-2 text-sm font-mono text-slate-500">
                                                        {tx.id.slice(0, 8)}
                                                    </td>
                                                    <td className="py-3 px-2 text-sm text-slate-700">
                                                        {tx.customerName || 'Umum'}
                                                    </td>
                                                    <td className="py-3 px-2 text-sm text-slate-600">
                                                        {tx.items.reduce((sum, item) => sum + item.quantity, 0)} item
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <Badge variant={tx.paymentType === 'cash' ? 'success' : 'warning'}>
                                                            {tx.paymentType === 'cash' ? 'Tunai' : 'Hutang'}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-2 text-sm font-medium text-slate-800 text-right">
                                                        Rp {tx.total.toLocaleString('id-ID')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* Debts Report */}
                {activeReport === 'debts' && (
                    <div className="space-y-6">
                        {/* Summary */}
                        <div className="grid grid-cols-3 gap-4">
                            <Card>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-red-600">
                                        Rp {totalDebtAmount.toLocaleString('id-ID')}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">Total Piutang</p>
                                </div>
                            </Card>
                            <Card>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-slate-800">
                                        {pendingDebts.length}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">Piutang Aktif</p>
                                </div>
                            </Card>
                            <Card>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-amber-600">
                                        {overdueDebts.length}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">Jatuh Tempo</p>
                                </div>
                            </Card>
                        </div>

                        {/* Debts by Village */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Piutang per Desa</CardTitle>
                            </CardHeader>

                            {Object.keys(debtsByVillage).length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">✅</div>
                                    <p className="text-slate-500">Tidak ada piutang</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {Object.entries(debtsByVillage)
                                        .sort(([, a], [, b]) => b.amount - a.amount)
                                        .map(([village, data]) => (
                                            <div key={village} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-slate-800">{village}</p>
                                                    <p className="text-sm text-slate-500">{data.count} pelanggan</p>
                                                </div>
                                                <p className="font-bold text-red-600">
                                                    Rp {data.amount.toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </Card>

                        {/* Overdue Debts */}
                        {overdueDebts.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>⚠️ Piutang Jatuh Tempo</CardTitle>
                                </CardHeader>

                                <div className="space-y-2">
                                    {overdueDebts.map((debt) => (
                                        <div key={debt.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                                            <div>
                                                <p className="font-medium text-slate-800">{debt.customerName}</p>
                                                <p className="text-sm text-slate-500">{debt.village}</p>
                                                <p className="text-xs text-red-600">
                                                    Jatuh tempo: {new Date(debt.dueDate!).toLocaleDateString('id-ID')}
                                                </p>
                                            </div>
                                            <p className="font-bold text-red-600">
                                                Rp {debt.remainingAmount.toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {/* Products Report */}
                {activeReport === 'products' && (
                    <div className="space-y-6">
                        {/* Summary */}
                        <div className="grid grid-cols-4 gap-4">
                            <Card>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-slate-800">{products.length}</p>
                                    <p className="text-sm text-slate-500 mt-1">Total Produk</p>
                                </div>
                            </Card>
                            <Card>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-emerald-600">
                                        {products.filter(p => p.stock > p.minStock).length}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">Stok Aman</p>
                                </div>
                            </Card>
                            <Card>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-amber-600">
                                        {products.filter(p => p.stock <= p.minStock && p.stock > 0).length}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">Stok Menipis</p>
                                </div>
                            </Card>
                            <Card>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-red-600">
                                        {products.filter(p => p.stock <= 0).length}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">Stok Habis</p>
                                </div>
                            </Card>
                        </div>

                        {/* Top Products */}
                        <Card>
                            <CardHeader>
                                <CardTitle>🏆 Produk Terlaris</CardTitle>
                            </CardHeader>

                            {topProducts.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">📊</div>
                                    <p className="text-slate-500">Belum ada data penjualan</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {topProducts.map(([productId, data], index) => (
                                        <div key={productId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-8 flex items-center justify-center bg-emerald-100 text-emerald-700 rounded-full font-bold text-sm">
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-slate-800">{data.name}</p>
                                                    <p className="text-sm text-slate-500">{data.quantity} terjual</p>
                                                </div>
                                            </div>
                                            <p className="font-bold text-emerald-600">
                                                Rp {data.revenue.toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
