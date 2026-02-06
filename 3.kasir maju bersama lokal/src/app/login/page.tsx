"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Clear session on mount
        localStorage.removeItem('mb_logged_in');
    }, []);

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (pin.length !== 4) return;

        setIsLoading(true);
        setError(false);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });

            if (res.ok) {
                localStorage.setItem('mb_logged_in', 'true');
                router.push('/');
            } else {
                setError(true);
                setPin('');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 border border-white/10 shadow-2xl text-center">
                <div className="w-20 h-20 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 overflow-hidden relative">
                    <Image
                        src="/logo.webp"
                        alt="Logo"
                        fill
                        className="object-cover"
                        onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.parentElement!.innerHTML = '<span class="text-3xl font-bold text-slate-900">MB</span>';
                        }}
                    />
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">CV. Maju Bersama</h1>
                <p className="text-slate-400 mb-8">Sistem Kasir POS - Silakan masukkan PIN</p>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="relative">
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                setPin(val);
                                if (val.length === 4 && !isLoading) {
                                    // Auto-submit when 4 digits reached
                                }
                            }}
                            maxLength={4}
                            autoFocus
                            placeholder="••••"
                            className={`w-full bg-slate-900 border-2 ${error ? 'border-red-500' : 'border-slate-700'} focus:border-emerald-500 rounded-2xl py-4 text-center text-3xl tracking-[1em] text-white outline-none transition-all placeholder:text-slate-700`}
                        />
                        {error && (
                            <p className="text-red-500 text-sm mt-2 animate-bounce">❌ PIN yang Anda masukkan salah!</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={pin.length !== 4 || isLoading}
                        className={`w-full py-4 rounded-2xl text-lg font-bold transition-all ${pin.length === 4 && !isLoading
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 hover:scale-[1.02] active:scale-95'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        {isLoading ? 'Memverifikasi...' : '🔓 Masuk ke Sistem'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Default PIN: 2103</p>
                </div>
            </div>
        </div>
    );
}
