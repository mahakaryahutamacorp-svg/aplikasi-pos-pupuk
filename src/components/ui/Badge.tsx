import React, { ReactNode } from 'react';

interface BadgeProps {
    children: ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'custom';
    className?: string;
    size?: 'sm' | 'md';
}

export default function Badge({ children, variant = 'default', className = '', size = 'sm' }: BadgeProps) {
    const variants = {
        default: 'bg-slate-100 text-slate-700',
        success: 'bg-emerald-100 text-emerald-700',
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-red-100 text-red-700',
        info: 'bg-blue-100 text-blue-700',
        custom: ''
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm'
    };

    return (
        <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
            {children}
        </span>
    );
}

// Stock level badge helper
export function StockBadge({ stock, minStock }: { stock: number; minStock: number }) {
    if (stock <= 0) {
        return <Badge variant="danger">Habis</Badge>;
    }
    if (stock <= minStock) {
        return <Badge variant="warning">{stock}</Badge>;
    }
    return <Badge variant="success">{stock}</Badge>;
}
