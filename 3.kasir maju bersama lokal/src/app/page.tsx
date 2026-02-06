'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardTitle } from '@/components/ui';
import { getDashboardStats, getLowStockProducts, initSampleData } from '@/lib/storage';
import { DashboardStats, Product } from '@/lib/types';
import { StockBadge } from '@/components/ui/Badge';

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Initialize sample data on first load (if needed)
                await initSampleData();

                // Load stats and low stock products
                const [dashboardStats, lowStock] = await Promise.all([
                    getDashboardStats(),
                    getLowStockProducts()
                ]);

                setStats(dashboardStats);
                setLowStockProducts(lowStock);
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Header title="Dashboard" subtitle="Selamat datang di CV. Maju Bersama - Toko Pupuk & Pestisida" />

            <div className="p-6">
                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Link href="/kasir">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-emerald-500">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                    <svg className="w-7 h-7 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">Buka Kasir</h3>
                                    <p className="text-sm text-slate-500">Mulai transaksi penjualan baru</p>
                                </div>
                                <svg className="w-5 h-5 text-slate-400 ml-auto" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Card>
                    </Link>

                    <Link href="/produk">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-emerald-500">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                    <svg className="w-7 h-7 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">Kelola Produk</h3>
                                    <p className="text-sm text-slate-500">Tambah, edit, atau hapus produk</p>
                                </div>
                                <svg className="w-5 h-5 text-slate-400 ml-auto" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Card>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-emerald-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800">{stats?.totalProducts || 0}</p>
                                <p className="text-xs text-slate-500">Total Produk</p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-amber-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-amber-600">{stats?.lowStockProducts || 0}</p>
                                <p className="text-xs text-slate-500">Stok Menipis</p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800">{stats?.todayTransactions || 0}</p>
                                <p className="text-xs text-slate-500">Transaksi Hari Ini</p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-600">Rp {(stats?.todayRevenue || 0).toLocaleString('id-ID')}</p>
                                <p className="text-xs text-slate-500">Pendapatan Hari Ini</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Low Stock Alert */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>⚠️ Stok Menipis</CardTitle>
                                <Link href="/produk" className="text-sm text-emerald-600 hover:text-emerald-700">
                                    Lihat Semua →
                                </Link>
                            </div>
                        </CardHeader>

                        {lowStockProducts.length === 0 ? (
                            <div className="text-center py-6">
                                <div className="text-4xl mb-2">✅</div>
                                <p className="text-slate-500">Semua stok aman</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {lowStockProducts.slice(0, 5).map((product) => (
                                    <div key={product.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                        <div>
                                            <p className="font-medium text-slate-700">{product.name}</p>
                                            <p className="text-xs text-slate-500">{product.unit}</p>
                                        </div>
                                        <StockBadge stock={product.stock} minStock={product.minStock} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Debt Summary */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>💰 Piutang</CardTitle>
                                <Link href="/pelanggan" className="text-sm text-emerald-600 hover:text-emerald-700">
                                    Kelola →
                                </Link>
                            </div>
                        </CardHeader>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                <div>
                                    <p className="text-sm text-slate-600">Total Piutang</p>
                                    <p className="text-xl font-bold text-red-600">Rp {(stats?.totalDebt || 0).toLocaleString('id-ID')}</p>
                                </div>
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>

                            {stats?.overdueDebts ? (
                                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-amber-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <p className="text-sm font-medium text-amber-700">{stats.overdueDebts} piutang jatuh tempo</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <p className="text-sm text-green-700">✅ Tidak ada piutang jatuh tempo</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
