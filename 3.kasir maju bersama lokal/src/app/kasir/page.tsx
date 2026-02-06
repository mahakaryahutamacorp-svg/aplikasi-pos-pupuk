'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Header } from '@/components/layout';
import { Card, Button, Input, Modal, useToast } from '@/components/ui';
import ProductList from '@/components/products/ProductList';
import { getProducts, searchProducts, getCustomers, saveTransaction, saveDebt } from '@/lib/storage';
import { Product, Customer, CartItem, TransactionItem } from '@/lib/types';
import Badge from '@/components/ui/Badge';

export default function KasirPage() {
    const { showToast } = useToast();
    const barcodeBufferRef = useRef('');
    const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);

    // Payment state
    const [paymentType, setPaymentType] = useState<'cash' | 'debt'>('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');

    // Checkout modal
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Load products and customers
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [allProducts, allCustomers] = await Promise.all([
                    getProducts(),
                    getCustomers()
                ]);
                setProducts(allProducts);
                setFilteredProducts(allProducts);
                setCustomers(allCustomers);
            } catch (error) {
                console.error('Failed to load initial data:', error);
                showToast('Gagal memuat data awal', 'error');
            }
        };
        loadInitialData();
    }, [showToast]);

    // Search products
    useEffect(() => {
        const performSearch = async () => {
            if (searchQuery.trim()) {
                try {
                    const results = await searchProducts(searchQuery);
                    setFilteredProducts(results);
                } catch (error) {
                    console.error('Search failed:', error);
                }
            } else {
                setFilteredProducts(products);
            }
        };
        performSearch();
    }, [searchQuery, products]);

    // Add product to cart
    const addToCart = useCallback((product: Product) => {
        if (product.stock <= 0) {
            showToast('Stok habis!', 'error');
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    showToast('Stok tidak mencukupi', 'warning');
                    return prev;
                }
                return prev.map(item =>
                    item.productId === product.id
                        ? {
                            ...item,
                            quantity: item.quantity + 1,
                            subtotal: (item.quantity + 1) * item.unitPrice
                        }
                        : item
                );
            }

            const priceType = 'retail';
            const unitPrice = product.prices.retail;
            return [...prev, {
                productId: product.id,
                product,
                quantity: 1,
                priceType,
                unitPrice,
                subtotal: unitPrice
            }];
        });
    }, [showToast]);

    // Barcode scanner listener (keyboard mode)
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Ignore if focused on input
            if (document.activeElement?.tagName === 'INPUT') return;

            if (barcodeTimeoutRef.current) {
                clearTimeout(barcodeTimeoutRef.current);
            }

            if (e.key === 'Enter' && barcodeBufferRef.current.length > 5) {
                // Barcode complete
                const barcode = barcodeBufferRef.current;
                barcodeBufferRef.current = '';

                const product = products.find(p => p.barcode === barcode);
                if (product) {
                    addToCart(product);
                    showToast(`${product.name} ditambahkan`, 'success');
                } else {
                    showToast(`Produk dengan barcode ${barcode} tidak ditemukan`, 'error');
                }
            } else if (e.key.length === 1) {
                barcodeBufferRef.current += e.key;

                barcodeTimeoutRef.current = setTimeout(() => {
                    barcodeBufferRef.current = '';
                }, 100);
            }
        };

        window.addEventListener('keypress', handleKeyPress);
        return () => {
            window.removeEventListener('keypress', handleKeyPress);
            if (barcodeTimeoutRef.current) {
                clearTimeout(barcodeTimeoutRef.current);
            }
        };
    }, [products, showToast, addToCart]);

    // Update cart item quantity
    const updateQuantity = (productId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        const item = cart.find(i => i.productId === productId);
        if (item && newQuantity > item.product.stock) {
            showToast('Stok tidak mencukupi', 'warning');
            return;
        }

        setCart(prev => prev.map(item =>
            item.productId === productId
                ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unitPrice }
                : item
        ));
    };

    // Toggle price type (retail/wholesale)
    const togglePriceType = (productId: string) => {
        setCart(prev => prev.map(item => {
            if (item.productId !== productId) return item;

            const newPriceType = item.priceType === 'retail' ? 'wholesale' : 'retail';
            const newUnitPrice = newPriceType === 'retail'
                ? item.product.prices.retail
                : item.product.prices.wholesale;

            return {
                ...item,
                priceType: newPriceType,
                unitPrice: newUnitPrice,
                subtotal: item.quantity * newUnitPrice
            };
        }));
    };

    // Remove from cart
    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    // Clear cart
    const clearCart = () => {
        setCart([]);
        setAmountPaid('');
        setSelectedCustomer(null);
        setPaymentType('cash');
    };

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = 0; // Can be implemented later
    const total = subtotal - discount;
    const change = paymentType === 'cash' ? Math.max(0, (parseFloat(amountPaid) || 0) - total) : 0;

    // Process checkout
    const handleCheckout = async () => {
        if (cart.length === 0) {
            showToast('Keranjang kosong!', 'error');
            return;
        }

        if (paymentType === 'debt' && !selectedCustomer) {
            showToast('Pilih pelanggan untuk pembayaran hutang', 'error');
            return;
        }

        if (paymentType === 'debt' && selectedCustomer) {
            const newTotalDebt = selectedCustomer.currentDebt + total;
            if (newTotalDebt > selectedCustomer.debtLimit) {
                showToast(`Melebihi limit hutang! Limit: Rp ${selectedCustomer.debtLimit.toLocaleString('id-ID')}`, 'error');
                return;
            }
        }

        if (paymentType === 'cash' && (parseFloat(amountPaid) || 0) < total) {
            showToast('Jumlah pembayaran kurang!', 'error');
            return;
        }

        setIsProcessing(true);

        try {
            const transactionItems: TransactionItem[] = cart.map(item => ({
                productId: item.productId,
                productName: item.product.name,
                quantity: item.quantity,
                unit: item.product.unit,
                priceType: item.priceType,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal
            }));

            const transaction = await saveTransaction({
                customerId: selectedCustomer?.id,
                customerName: selectedCustomer?.name,
                items: transactionItems,
                subtotal,
                discount,
                total,
                paymentType,
                amountPaid: paymentType === 'cash' ? parseFloat(amountPaid) : 0,
                change: paymentType === 'cash' ? change : 0,
                dueDate: paymentType === 'debt' && selectedCustomer?.harvestDate ? selectedCustomer.harvestDate : undefined
            });

            // Create debt record if payment is debt
            if (paymentType === 'debt' && selectedCustomer) {
                await saveDebt({
                    transactionId: transaction.id,
                    customerId: selectedCustomer.id,
                    customerName: selectedCustomer.name,
                    village: selectedCustomer.village,
                    amount: total,
                    dueDate: selectedCustomer.harvestDate
                });
            }

            showToast('Transaksi berhasil disimpan!', 'success');
            clearCart();
            setShowCheckoutModal(false);

            // Refresh products to update stock
            const updatedProducts = await getProducts();
            setProducts(updatedProducts);
            setFilteredProducts(updatedProducts);

            // Print receipt (open print dialog)
            // printReceipt(transaction);

        } catch (error) {
            console.error('Checkout failed:', error);
            showToast('Gagal menyimpan transaksi', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredCustomers = customerSearch
        ? customers.filter(c =>
            c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
            c.village.toLowerCase().includes(customerSearch.toLowerCase())
        )
        : customers;

    return (
        <div className="min-h-screen flex flex-col">
            <Header title="Kasir" subtitle="Point of Sale" />

            <div className="flex-1 flex">
                {/* Left Side - Product List */}
                <div className="flex-1 flex flex-col border-r border-slate-200">
                    {/* Search Bar */}
                    <div className="p-4 border-b border-slate-100 bg-white">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari produk, bahan aktif, atau hama sasaran..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full"
                                    title="Hapus pencarian"
                                    aria-label="Hapus pencarian"
                                >
                                    <svg className="w-4 h-4 text-slate-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            💡 Scan barcode untuk menambahkan produk langsung
                        </p>
                    </div>

                    {/* Product List */}
                    <div className="flex-1 overflow-y-auto bg-white">
                        <ProductList
                            products={filteredProducts}
                            onAddToCart={addToCart}
                        />
                    </div>
                </div>

                {/* Right Side - Cart */}
                <div className="w-96 flex flex-col bg-white">
                    {/* Cart Header */}
                    <div className="p-4 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-800">
                                🛒 Keranjang
                                {cart.length > 0 && (
                                    <span className="ml-2 px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">
                                        {cart.reduce((sum, item) => sum + item.quantity, 0)} item
                                    </span>
                                )}
                            </h2>
                            {cart.length > 0 && (
                                <button
                                    onClick={clearCart}
                                    className="text-sm text-red-500 hover:text-red-600"
                                >
                                    Kosongkan
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {cart.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">🛒</div>
                                <p className="text-slate-500">Keranjang kosong</p>
                                <p className="text-sm text-slate-400 mt-1">Tambahkan produk untuk memulai</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cart.map((item) => (
                                    <div key={item.productId} className="p-3 bg-slate-50 rounded-lg animate-fadeIn">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-slate-800 text-sm">{item.product.name}</h4>
                                                <p className="text-xs text-slate-500">{item.product.unit}</p>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.productId)}
                                                className="p-1 hover:bg-red-100 rounded text-red-500"
                                                title="Hapus dari keranjang"
                                                aria-label="Hapus dari keranjang"
                                            >
                                                <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            {/* Price Type Toggle */}
                                            <button
                                                onClick={() => togglePriceType(item.productId)}
                                                className="text-xs"
                                            >
                                                <Badge variant={item.priceType === 'wholesale' ? 'success' : 'info'}>
                                                    {item.priceType === 'retail' ? 'Ecer' : 'Grosir'}
                                                </Badge>
                                            </button>

                                            {/* Quantity */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                    className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                    className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Subtotal */}
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-emerald-700">
                                                    Rp {item.subtotal.toLocaleString('id-ID')}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    @{item.unitPrice.toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cart Footer - Summary & Checkout */}
                    {cart.length > 0 && (
                        <div className="border-t border-slate-200 p-4 bg-slate-50">
                            {/* Summary */}
                            <div className="space-y-1 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Subtotal</span>
                                    <span className="text-slate-800">Rp {subtotal.toLocaleString('id-ID')}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Diskon</span>
                                        <span className="text-red-500">-Rp {discount.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                                    <span className="text-slate-800">Total</span>
                                    <span className="text-emerald-600">Rp {total.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            {/* Payment Type Selection */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <button
                                    onClick={() => setPaymentType('cash')}
                                    className={`py-2 px-4 rounded-lg font-medium transition-all ${paymentType === 'cash'
                                        ? 'bg-emerald-deep text-white'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    💵 Tunai
                                </button>
                                <button
                                    onClick={() => {
                                        setPaymentType('debt');
                                        if (!selectedCustomer) {
                                            setShowCustomerModal(true);
                                        }
                                    }}
                                    className={`py-2 px-4 rounded-lg font-medium transition-all ${paymentType === 'debt'
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    📝 Hutang
                                </button>
                            </div>

                            {/* Selected Customer (for debt) */}
                            {paymentType === 'debt' && (
                                <div className="mb-4">
                                    {selectedCustomer ? (
                                        <div className="p-3 bg-white rounded-lg border border-orange-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-slate-800">{selectedCustomer.name}</p>
                                                    <p className="text-xs text-slate-500">{selectedCustomer.village}</p>
                                                    <p className="text-xs text-orange-600">
                                                        Limit: Rp {selectedCustomer.debtLimit.toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setShowCustomerModal(true)}
                                                    className="text-sm text-emerald-600 hover:text-emerald-700"
                                                >
                                                    Ganti
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowCustomerModal(true)}
                                            className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                                        >
                                            + Pilih Pelanggan
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Cash Input */}
                            {paymentType === 'cash' && (
                                <div className="mb-4">
                                    <Input
                                        label="Jumlah Bayar"
                                        type="number"
                                        value={amountPaid}
                                        onChange={(e) => setAmountPaid(e.target.value)}
                                        placeholder="0"
                                    />
                                    {parseFloat(amountPaid) >= total && (
                                        <div className="mt-2 p-2 bg-green-50 rounded-lg">
                                            <p className="text-sm text-green-700">
                                                Kembalian: <span className="font-bold">Rp {change.toLocaleString('id-ID')}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Quick Amount Buttons */}
                            {paymentType === 'cash' && (
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                    {[10000, 20000, 50000, 100000].map((amount) => (
                                        <button
                                            key={amount}
                                            onClick={() => setAmountPaid(String(parseFloat(amountPaid || '0') + amount))}
                                            className="py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                                        >
                                            +{amount / 1000}K
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Checkout Button */}
                            <Button
                                onClick={() => setShowCheckoutModal(true)}
                                className="w-full py-3 text-lg"
                                disabled={cart.length === 0 || (paymentType === 'debt' && !selectedCustomer)}
                            >
                                Bayar Rp {total.toLocaleString('id-ID')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Customer Selection Modal */}
            <Modal
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                title="Pilih Pelanggan"
                size="md"
            >
                <div className="space-y-4">
                    <Input
                        placeholder="Cari nama atau desa..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                    />

                    <div className="max-h-64 overflow-y-auto space-y-2">
                        {filteredCustomers.length === 0 ? (
                            <p className="text-center text-slate-500 py-4">Tidak ada pelanggan ditemukan</p>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <button
                                    key={customer.id}
                                    onClick={() => {
                                        setSelectedCustomer(customer);
                                        setShowCustomerModal(false);
                                        setCustomerSearch('');
                                    }}
                                    className="w-full p-3 text-left bg-slate-50 rounded-lg hover:bg-emerald-50 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-slate-800">{customer.name}</p>
                                            <p className="text-sm text-slate-500">{customer.village}</p>
                                            {customer.farmerGroup && (
                                                <p className="text-xs text-slate-400">{customer.farmerGroup}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">Limit</p>
                                            <p className="text-sm font-medium text-slate-700">
                                                Rp {customer.debtLimit.toLocaleString('id-ID')}
                                            </p>
                                            {customer.currentDebt > 0 && (
                                                <p className="text-xs text-red-500">
                                                    Hutang: Rp {customer.currentDebt.toLocaleString('id-ID')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </Modal>

            {/* Checkout Confirmation Modal */}
            <Modal
                isOpen={showCheckoutModal}
                onClose={() => setShowCheckoutModal(false)}
                title="Konfirmasi Pembayaran"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowCheckoutModal(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleCheckout} loading={isProcessing}>
                            Konfirmasi
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex justify-between mb-2">
                            <span className="text-slate-600">Total Items</span>
                            <span className="font-medium">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-slate-600">Pembayaran</span>
                            <Badge variant={paymentType === 'cash' ? 'success' : 'warning'}>
                                {paymentType === 'cash' ? 'Tunai' : 'Hutang'}
                            </Badge>
                        </div>
                        {selectedCustomer && (
                            <div className="flex justify-between mb-2">
                                <span className="text-slate-600">Pelanggan</span>
                                <span className="font-medium">{selectedCustomer.name}</span>
                            </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-slate-200">
                            <span className="font-medium">Total Bayar</span>
                            <span className="text-lg font-bold text-emerald-600">
                                Rp {total.toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>

                    {paymentType === 'cash' && (
                        <div className="text-center text-green-600 font-medium">
                            Kembalian: Rp {change.toLocaleString('id-ID')}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
