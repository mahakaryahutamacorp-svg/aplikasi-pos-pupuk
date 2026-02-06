'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardTitle, Button, Input, Modal, useToast, Badge } from '@/components/ui';
import ProductList from '@/components/products/ProductList';
import { getProducts, saveProduct, updateProduct, deleteProduct } from '@/lib/storage';
import { Product, ProductType, PRODUCT_TYPE_LABELS, UNITS } from '@/lib/types';

interface ProductFormData {
    name: string;
    barcode: string;
    type: ProductType;
    activeIngredient: string;
    targetPests: string;
    unit: string;
    stock: number;
    minStock: number;
    costPrice: number;
    retailPrice: number;
    wholesalePrice: number;
    wholesaleMinQty: number;
}

const initialFormData: ProductFormData = {
    name: '',
    barcode: '',
    type: 'insektisida',
    activeIngredient: '',
    targetPests: '',
    unit: 'Botol',
    stock: 0,
    minStock: 5,
    costPrice: 0,
    retailPrice: 0,
    wholesalePrice: 0,
    wholesaleMinQty: 6
};

export default function ProdukPage() {
    const { showToast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<ProductType | 'all'>('all');

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<ProductFormData>(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load products
    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = () => {
        const allProducts = getProducts();
        setProducts(allProducts);
        setFilteredProducts(allProducts);
    };

    // Filter products
    useEffect(() => {
        let filtered = products;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.activeIngredient.toLowerCase().includes(query) ||
                p.barcode?.includes(query)
            );
        }

        if (typeFilter !== 'all') {
            filtered = filtered.filter(p => p.type === typeFilter);
        }

        setFilteredProducts(filtered);
    }, [searchQuery, typeFilter, products]);

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    // Open add modal
    const openAddModal = () => {
        setFormData(initialFormData);
        setShowAddModal(true);
    };

    // Open edit modal
    const openEditModal = (product: Product) => {
        setSelectedProduct(product);
        setFormData({
            name: product.name,
            barcode: product.barcode || '',
            type: product.type,
            activeIngredient: product.activeIngredient,
            targetPests: product.targetPests?.join(', ') || '',
            unit: product.unit,
            stock: product.stock,
            minStock: product.minStock,
            costPrice: product.prices.cost,
            retailPrice: product.prices.retail,
            wholesalePrice: product.prices.wholesale,
            wholesaleMinQty: product.prices.wholesaleMinQty
        });
        setShowEditModal(true);
    };

    // Open delete modal
    const openDeleteModal = (product: Product) => {
        setSelectedProduct(product);
        setShowDeleteModal(true);
    };

    // Handle add product
    const handleAddProduct = async () => {
        if (!formData.name.trim()) {
            showToast('Nama produk harus diisi', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            saveProduct({
                name: formData.name,
                barcode: formData.barcode || undefined,
                type: formData.type,
                activeIngredient: formData.activeIngredient,
                targetPests: formData.targetPests ? formData.targetPests.split(',').map(s => s.trim()) : undefined,
                unit: formData.unit,
                stock: formData.stock,
                minStock: formData.minStock,
                prices: {
                    cost: formData.costPrice,
                    retail: formData.retailPrice,
                    wholesale: formData.wholesalePrice,
                    wholesaleMinQty: formData.wholesaleMinQty
                }
            });

            showToast('Produk berhasil ditambahkan', 'success');
            setShowAddModal(false);
            loadProducts();
        } catch {
            showToast('Gagal menambahkan produk', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle edit product
    const handleEditProduct = async () => {
        if (!selectedProduct || !formData.name.trim()) {
            showToast('Nama produk harus diisi', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            updateProduct(selectedProduct.id, {
                name: formData.name,
                barcode: formData.barcode || undefined,
                type: formData.type,
                activeIngredient: formData.activeIngredient,
                targetPests: formData.targetPests ? formData.targetPests.split(',').map(s => s.trim()) : undefined,
                unit: formData.unit,
                stock: formData.stock,
                minStock: formData.minStock,
                prices: {
                    cost: formData.costPrice,
                    retail: formData.retailPrice,
                    wholesale: formData.wholesalePrice,
                    wholesaleMinQty: formData.wholesaleMinQty
                }
            });

            showToast('Produk berhasil diperbarui', 'success');
            setShowEditModal(false);
            loadProducts();
        } catch {
            showToast('Gagal memperbarui produk', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle delete product
    const handleDeleteProduct = async () => {
        if (!selectedProduct) return;

        setIsSubmitting(true);
        try {
            deleteProduct(selectedProduct.id);
            showToast('Produk berhasil dihapus', 'success');
            setShowDeleteModal(false);
            loadProducts();
        } catch {
            showToast('Gagal menghapus produk', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Product Form Component
    const ProductForm = () => (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Nama Produk"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Contoh: Prevathon 50SC"
                />
                <Input
                    label="Barcode"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    placeholder="Scan atau ketik barcode"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Jenis</label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        title="Jenis produk"
                        aria-label="Jenis produk"
                    >
                        {Object.entries(PRODUCT_TYPE_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Satuan</label>
                    <select
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        title="Satuan produk"
                        aria-label="Satuan produk"
                    >
                        {UNITS.map((unit) => (
                            <option key={unit} value={unit}>{unit}</option>
                        ))}
                    </select>
                </div>
            </div>

            <Input
                label="Bahan Aktif"
                name="activeIngredient"
                value={formData.activeIngredient}
                onChange={handleInputChange}
                placeholder="Contoh: Klorantraniliprol"
            />

            <Input
                label="Hama Sasaran (pisahkan dengan koma)"
                name="targetPests"
                value={formData.targetPests}
                onChange={handleInputChange}
                placeholder="Contoh: Wereng, Ulat, Penggerek"
            />

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Stok"
                    name="stock"
                    type="number"
                    value={formData.stock}
                    onChange={handleInputChange}
                />
                <Input
                    label="Minimum Stok"
                    name="minStock"
                    type="number"
                    value={formData.minStock}
                    onChange={handleInputChange}
                />
            </div>

            <div className="border-t border-slate-200 pt-4 mt-4">
                <h4 className="font-medium text-slate-700 mb-3">💰 Harga</h4>
                <div className="grid grid-cols-3 gap-4">
                    <Input
                        label="Modal"
                        name="costPrice"
                        type="number"
                        value={formData.costPrice}
                        onChange={handleInputChange}
                    />
                    <Input
                        label="Ecer"
                        name="retailPrice"
                        type="number"
                        value={formData.retailPrice}
                        onChange={handleInputChange}
                    />
                    <Input
                        label="Grosir"
                        name="wholesalePrice"
                        type="number"
                        value={formData.wholesalePrice}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="mt-3">
                    <Input
                        label="Min. Qty untuk Harga Grosir"
                        name="wholesaleMinQty"
                        type="number"
                        value={formData.wholesaleMinQty}
                        onChange={handleInputChange}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen">
            <Header title="Manajemen Produk" subtitle="Kelola daftar produk pupuk dan pestisida" />

            <div className="p-6">
                {/* Actions Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Cari produk..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    {/* Type Filter */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as ProductType | 'all')}
                        className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        title="Filter jenis produk"
                        aria-label="Filter jenis produk"
                    >
                        <option value="all">Semua Jenis</option>
                        {Object.entries(PRODUCT_TYPE_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>

                    {/* Add Button */}
                    <Button onClick={openAddModal}>
                        <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Produk
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card padding="sm">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-slate-800">{products.length}</p>
                            <p className="text-xs text-slate-500">Total Produk</p>
                        </div>
                    </Card>
                    <Card padding="sm">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-amber-600">{products.filter(p => p.stock <= p.minStock && p.stock > 0).length}</p>
                            <p className="text-xs text-slate-500">Stok Menipis</p>
                        </div>
                    </Card>
                    <Card padding="sm">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">{products.filter(p => p.stock <= 0).length}</p>
                            <p className="text-xs text-slate-500">Stok Habis</p>
                        </div>
                    </Card>
                </div>

                {/* Product List */}
                <Card padding="none">
                    <ProductList
                        products={filteredProducts}
                        showCost={true}
                        onProductClick={openEditModal}
                    />
                </Card>
            </div>

            {/* Add Product Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Tambah Produk Baru"
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleAddProduct} loading={isSubmitting}>
                            Simpan
                        </Button>
                    </>
                }
            >
                <ProductForm />
            </Modal>

            {/* Edit Product Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Produk"
                size="lg"
                footer={
                    <>
                        <Button variant="danger" onClick={() => {
                            setShowEditModal(false);
                            openDeleteModal(selectedProduct!);
                        }}>
                            Hapus
                        </Button>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleEditProduct} loading={isSubmitting}>
                            Simpan
                        </Button>
                    </>
                }
            >
                <ProductForm />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Hapus Produk"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                            Batal
                        </Button>
                        <Button variant="danger" onClick={handleDeleteProduct} loading={isSubmitting}>
                            Hapus
                        </Button>
                    </>
                }
            >
                <div className="text-center py-4">
                    <div className="text-5xl mb-4">⚠️</div>
                    <p className="text-slate-600">
                        Yakin ingin menghapus produk <strong>{selectedProduct?.name}</strong>?
                    </p>
                    <p className="text-sm text-slate-500 mt-2">Tindakan ini tidak dapat dibatalkan.</p>
                </div>
            </Modal>
        </div>
    );
}
