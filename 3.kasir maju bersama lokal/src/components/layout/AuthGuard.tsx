'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const loggedIn = localStorage.getItem('mb_logged_in');

        if (!loggedIn && pathname !== '/login') {
            setIsAuthenticated(false);
            router.push('/login');
        } else {
            setIsAuthenticated(true);
        }
    }, [pathname, router]);

    // Show nothing while checking (or a spinner)
    if (isAuthenticated === null) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
        </div>;
    }

    // If on login page or authenticated, show children
    if (pathname === '/login' || isAuthenticated) {
        return <>{children}</>;
    }

    return null;
}
