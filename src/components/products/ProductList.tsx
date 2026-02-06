'use client';

import React from 'react';
import { Product, PRODUCT_TYPE_LABELS, PRODUCT_TYPE_COLORS } from '@/lib/types';
import Badge, { StockBadge } from '@/components/ui/Badge';

interface ProductListProps {
    products: Product[];
    onProductClick?: (product: Product) => void;
    onAddToCart?: (product: Product) => void;
    showCost?: boolean; // Only for admin
}

export default function ProductList({ products, onProductClick, onAddToCart, showCost = false }: ProductListProps) {
    if (products.length === 0) {
        return (
            <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-slate-500">Tidak ada produk ditemukan</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-slate-100">
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wider">
                <div className="col-span-4">Produk</div>
                <div className="col-span-2">Jenis</div>
                <div className="col-span-2">Bahan Aktif</div>
                <div className="col-span-1 text-center">Stok</div>
                <div className="col-span-2 text-right">Harga</div>
                <div className="col-span-1"></div>
            </div>

            {/* Items */}
            {products.map((product) => (
                <div
                    key={product.id}
                    className="grid grid-cols-12 gap-2 px-3 py-3 hover:bg-emerald-50/50 transition-colors cursor-pointer items-center"
                    onClick={() => onProductClick?.(product)}
                >
                    {/* Product Name & Unit */}
                    <div className="col-span-12 md:col-span-4">
                        <div className="font-medium text-slate-800">{product.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                            {product.barcode && <span className="mr-2">#{product.barcode}</span>}
                            <span className="text-slate-400">• {product.unit}</span>
                        </div>
                    </div>

                    {/* Type Badge */}
                    <div className="col-span-4 md:col-span-2">
                        <Badge variant="custom" className={PRODUCT_TYPE_COLORS[product.type]}>
                            {PRODUCT_TYPE_LABELS[product.type]}
                        </Badge>
                    </div>

                    {/* Active Ingredient */}
                    <div className="col-span-4 md:col-span-2 text-sm text-slate-600 truncate" title={product.activeIngredient}>
                        {product.activeIngredient}
                    </div>

                    {/* Stock */}
                    <div className="col-span-2 md:col-span-1 text-center">
                        <StockBadge stock={product.stock} minStock={product.minStock} />
                    </div>

                    {/* Prices */}
                    <div className="col-span-6 md:col-span-2 text-right">
                        <div className="text-sm font-semibold text-emerald-700">
                            Rp {product.prices.retail.toLocaleString('id-ID')}
                        </div>
                        <div className="text-xs text-slate-500">
                            Grosir: Rp {product.prices.wholesale.toLocaleString('id-ID')}
                        </div>
                        {showCost && (
                            <div className="text-xs text-red-500">
                                Modal: Rp {product.prices.cost.toLocaleString('id-ID')}
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="col-span-6 md:col-span-1 text-right" onClick={(e) => e.stopPropagation()}>
                        {onAddToCart && (
                            <button
                                onClick={() => onAddToCart(product)}
                                disabled={product.stock <= 0}
                                className="p-2 rounded-lg bg-emerald-deep text-white hover:bg-emerald-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Tambah ke keranjang"
                            >
                                <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
