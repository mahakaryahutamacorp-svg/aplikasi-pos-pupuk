'use client';

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout";

export default function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";

    return (
        <div className="flex min-h-screen bg-slate-50">
            {!isLoginPage && <Sidebar />}
            <main className={`flex-1 transition-all duration-300 ${!isLoginPage ? 'ml-64' : ''}`}>
                <div className={!isLoginPage ? "p-8 max-w-[1600px] mx-auto" : ""}>
                    {children}
                </div>
            </main>
        </div>
    );
}
