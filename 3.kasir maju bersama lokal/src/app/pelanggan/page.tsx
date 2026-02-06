'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardTitle, Button, Input, Modal, useToast, Badge } from '@/components/ui';
import { getCustomers, saveCustomer, updateCustomer, deleteCustomer, getCustomerDebts, addDebtPayment } from '@/lib/storage';
import { Customer, DebtRecord } from '@/lib/types';

interface CustomerFormData {
    name: string;
    phone: string;
    village: string;
    farmerGroup: string;
    debtLimit: number;
    harvestDate: string;
}

const initialFormData: CustomerFormData = {
    name: '',
    phone: '',
    village: '',
    farmerGroup: '',
    debtLimit: 1000000,
    harvestDate: ''
};

export default function PelangganPage() {
    const { showToast } = useToast();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [villageFilter, setVillageFilter] = useState('all');

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDebtModal, setShowDebtModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerDebts, setCustomerDebts] = useState<DebtRecord[]>([]);
    const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [selectedDebt, setSelectedDebt] = useState<DebtRecord | null>(null);

    // Load customers
    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            const allCustomers = await getCustomers();
            setCustomers(allCustomers);
            setFilteredCustomers(allCustomers);
        } catch (error) {
            console.error('Failed to load customers:', error);
            showToast('Gagal memuat data pelanggan', 'error');
        }
    };

    // Get unique villages
    const villages = Array.from(new Set(customers.map(c => c.village)));

    // Filter customers
    useEffect(() => {
        let filtered = customers;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(query) ||
                c.phone?.includes(query) ||
                c.village.toLowerCase().includes(query) ||
                c.farmerGroup?.toLowerCase().includes(query)
            );
        }

        if (villageFilter !== 'all') {
            filtered = filtered.filter(c => c.village === villageFilter);
        }

        setFilteredCustomers(filtered);
    }, [searchQuery, villageFilter, customers]);

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
    const openEditModal = (customer: Customer) => {
        setSelectedCustomer(customer);
        setFormData({
            name: customer.name,
            phone: customer.phone || '',
            village: customer.village,
            farmerGroup: customer.farmerGroup || '',
            debtLimit: customer.debtLimit,
            harvestDate: customer.harvestDate || ''
        });
        setShowEditModal(true);
    };

    // Open delete modal
    const openDeleteModal = (customer: Customer) => {
        setSelectedCustomer(customer);
        setShowDeleteModal(true);
    };

    // Open debt modal
    const openDebtModal = async (customer: Customer) => {
        setSelectedCustomer(customer);
        try {
            const debts = await getCustomerDebts(customer.id);
            setCustomerDebts(debts);
            setShowDebtModal(true);
        } catch (error) {
            showToast('Gagal memuat data hutang', 'error');
        }
    };

    // Handle add customer
    const handleAddCustomer = async () => {
        if (!formData.name.trim() || !formData.village.trim()) {
            showToast('Nama dan Desa harus diisi', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await saveCustomer({
                name: formData.name,
                phone: formData.phone || undefined,
                village: formData.village,
                farmerGroup: formData.farmerGroup || undefined,
                debtLimit: formData.debtLimit,
                harvestDate: formData.harvestDate || undefined
            });

            showToast('Pelanggan berhasil ditambahkan', 'success');
            setShowAddModal(false);
            await loadCustomers();
        } catch {
            showToast('Gagal menambahkan pelanggan', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle edit customer
    const handleEditCustomer = async () => {
        if (!selectedCustomer || !formData.name.trim() || !formData.village.trim()) {
            showToast('Nama dan Desa harus diisi', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await updateCustomer(selectedCustomer.id, {
                name: formData.name,
                phone: formData.phone || undefined,
                village: formData.village,
                farmerGroup: formData.farmerGroup || undefined,
                debtLimit: formData.debtLimit,
                harvestDate: formData.harvestDate || undefined
            });

            showToast('Pelanggan berhasil diperbarui', 'success');
            setShowEditModal(false);
            await loadCustomers();
        } catch {
            showToast('Gagal memperbarui pelanggan', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle delete customer
    const handleDeleteCustomer = async () => {
        if (!selectedCustomer) return;

        setIsSubmitting(true);
        try {
            await deleteCustomer(selectedCustomer.id);
            showToast('Pelanggan berhasil dihapus', 'success');
            setShowDeleteModal(false);
            await loadCustomers();
        } catch {
            showToast('Gagal menghapus pelanggan', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle debt payment
    const handlePayment = async (debt: DebtRecord) => {
        const amount = parseFloat(paymentAmount);
        if (!amount || amount <= 0) {
            showToast('Masukkan jumlah pembayaran yang valid', 'error');
            return;
        }

        if (amount > debt.remainingAmount) {
            showToast('Jumlah pembayaran melebihi sisa hutang', 'error');
            return;
        }

        try {
            await addDebtPayment(debt.id, amount);
            showToast('Pembayaran berhasil dicatat', 'success');

            // Refresh debts
            const debts = await getCustomerDebts(selectedCustomer!.id);
            setCustomerDebts(debts);
            await loadCustomers();
            setPaymentAmount('');
            setSelectedDebt(null);
        } catch {
            showToast('Gagal mencatat pembayaran', 'error');
        }
    };

    // Customer Form
    const CustomerForm = () => (
        <div className="space-y-4">
            <Input
                label="Nama Lengkap"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Contoh: Pak Slamet"
            />
            <Input
                label="No. Telepon"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="08xxxxxxxxxx"
            />
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Desa"
                    name="village"
                    value={formData.village}
                    onChange={handleInputChange}
                    placeholder="Contoh: Desa Sukamaju"
                />
                <Input
                    label="Kelompok Tani"
                    name="farmerGroup"
                    value={formData.farmerGroup}
                    onChange={handleInputChange}
                    placeholder="Contoh: Tani Makmur"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Limit Hutang (Rp)"
                    name="debtLimit"
                    type="number"
                    value={formData.debtLimit}
                    onChange={handleInputChange}
                />
                <Input
                    label="Perkiraan Panen"
                    name="harvestDate"
                    type="date"
                    value={formData.harvestDate}
                    onChange={handleInputChange}
                />
            </div>
        </div>
    );

    const totalDebt = customers.reduce((sum, c) => sum + c.currentDebt, 0);

    return (
        <div className="min-h-screen">
            <Header title="Database Pelanggan" subtitle="Kelola data pelanggan dan piutang" />

            <div className="p-6">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <Card padding="sm">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-slate-800">{customers.length}</p>
                            <p className="text-xs text-slate-500">Total Pelanggan</p>
                        </div>
                    </Card>
                    <Card padding="sm">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{villages.length}</p>
                            <p className="text-xs text-slate-500">Desa</p>
                        </div>
                    </Card>
                    <Card padding="sm">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">Rp {totalDebt.toLocaleString('id-ID')}</p>
                            <p className="text-xs text-slate-500">Total Piutang</p>
                        </div>
                    </Card>
                    <Card padding="sm">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-amber-600">{customers.filter(c => c.currentDebt > 0).length}</p>
                            <p className="text-xs text-slate-500">Punya Hutang</p>
                        </div>
                    </Card>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Cari pelanggan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <select
                        value={villageFilter}
                        onChange={(e) => setVillageFilter(e.target.value)}
                        className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        title="Filter berdasarkan desa"
                        aria-label="Filter berdasarkan desa"
                    >
                        <option value="all">Semua Desa</option>
                        {villages.map((village) => (
                            <option key={village} value={village}>{village}</option>
                        ))}
                    </select>

                    <Button onClick={openAddModal}>
                        <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Pelanggan
                    </Button>
                </div>

                {/* Customer List */}
                <Card padding="none">
                    {filteredCustomers.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">👥</div>
                            <p className="text-slate-500">Tidak ada pelanggan ditemukan</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {/* Header */}
                            <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                <div className="col-span-3">Nama</div>
                                <div className="col-span-2">Desa</div>
                                <div className="col-span-2">Kelompok Tani</div>
                                <div className="col-span-2 text-right">Limit</div>
                                <div className="col-span-2 text-right">Hutang</div>
                                <div className="col-span-1"></div>
                            </div>

                            {/* Rows */}
                            {filteredCustomers.map((customer) => (
                                <div
                                    key={customer.id}
                                    className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-slate-50 transition-colors items-center"
                                >
                                    <div className="col-span-12 md:col-span-3">
                                        <p className="font-medium text-slate-800">{customer.name}</p>
                                        {customer.phone && (
                                            <p className="text-xs text-slate-500">{customer.phone}</p>
                                        )}
                                    </div>
                                    <div className="col-span-6 md:col-span-2">
                                        <Badge variant="default">{customer.village}</Badge>
                                    </div>
                                    <div className="col-span-6 md:col-span-2 text-sm text-slate-600">
                                        {customer.farmerGroup || '-'}
                                    </div>
                                    <div className="col-span-4 md:col-span-2 text-right text-sm text-slate-600">
                                        Rp {customer.debtLimit.toLocaleString('id-ID')}
                                    </div>
                                    <div className="col-span-4 md:col-span-2 text-right">
                                        {customer.currentDebt > 0 ? (
                                            <span className="font-medium text-red-600">
                                                Rp {customer.currentDebt.toLocaleString('id-ID')}
                                            </span>
                                        ) : (
                                            <Badge variant="success">Lunas</Badge>
                                        )}
                                    </div>
                                    <div className="col-span-4 md:col-span-1 flex justify-end gap-1">
                                        {customer.currentDebt > 0 && (
                                            <button
                                                onClick={() => openDebtModal(customer)}
                                                className="p-2 hover:bg-amber-100 rounded-lg text-amber-600"
                                                title="Kelola Hutang"
                                            >
                                                💰
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openEditModal(customer)}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                                            title="Edit"
                                        >
                                            ✏️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Add Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Tambah Pelanggan Baru"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>Batal</Button>
                        <Button onClick={handleAddCustomer} loading={isSubmitting}>Simpan</Button>
                    </>
                }
            >
                <CustomerForm />
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Pelanggan"
                size="md"
                footer={
                    <>
                        <Button variant="danger" onClick={() => {
                            setShowEditModal(false);
                            openDeleteModal(selectedCustomer!);
                        }}>Hapus</Button>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>Batal</Button>
                        <Button onClick={handleEditCustomer} loading={isSubmitting}>Simpan</Button>
                    </>
                }
            >
                <CustomerForm />
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Hapus Pelanggan"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Batal</Button>
                        <Button variant="danger" onClick={handleDeleteCustomer} loading={isSubmitting}>Hapus</Button>
                    </>
                }
            >
                <div className="text-center py-4">
                    <div className="text-5xl mb-4">⚠️</div>
                    <p className="text-slate-600">
                        Yakin ingin menghapus <strong>{selectedCustomer?.name}</strong>?
                    </p>
                </div>
            </Modal>

            {/* Debt Modal */}
            <Modal
                isOpen={showDebtModal}
                onClose={() => {
                    setShowDebtModal(false);
                    setSelectedDebt(null);
                    setPaymentAmount('');
                }}
                title={`Piutang - ${selectedCustomer?.name}`}
                size="lg"
            >
                <div className="space-y-4">
                    {/* Summary */}
                    <div className="p-4 bg-red-50 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Total Piutang</span>
                            <span className="text-xl font-bold text-red-600">
                                Rp {selectedCustomer?.currentDebt.toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>

                    {/* Debt List */}
                    <div className="max-h-64 overflow-y-auto space-y-2">
                        {customerDebts.filter(d => d.status !== 'paid').map((debt) => (
                            <div key={debt.id} className="p-3 border border-slate-200 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-sm text-slate-500">
                                            {new Date(debt.createdAt).toLocaleDateString('id-ID')}
                                        </p>
                                        {debt.dueDate && (
                                            <p className="text-xs text-amber-600">
                                                Jatuh tempo: {new Date(debt.dueDate).toLocaleDateString('id-ID')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-slate-800">
                                            Rp {debt.amount.toLocaleString('id-ID')}
                                        </p>
                                        <p className="text-sm text-red-600">
                                            Sisa: Rp {debt.remainingAmount.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                </div>

                                {selectedDebt?.id === debt.id ? (
                                    <div className="flex gap-2 mt-2">
                                        <Input
                                            type="number"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            placeholder="Jumlah bayar"
                                        />
                                        <Button size="sm" onClick={() => handlePayment(debt)}>
                                            Bayar
                                        </Button>
                                        <Button size="sm" variant="secondary" onClick={() => setSelectedDebt(null)}>
                                            Batal
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setSelectedDebt(debt)}
                                        className="w-full mt-2"
                                    >
                                        Bayar Hutang Ini
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
