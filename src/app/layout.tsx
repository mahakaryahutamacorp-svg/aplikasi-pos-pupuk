import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { Sidebar } from "@/components/layout";

export const metadata: Metadata = {
    title: "CV. Maju Bersama - Sistem Kasir",
    description: "Aplikasi Point of Sale untuk CV. Maju Bersama - Toko Pupuk dan Pestisida",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id">
            <body className="antialiased">
                <ToastProvider>
                    <div className="flex min-h-screen bg-slate-50">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                            {children}
                        </main>
                    </div>
                </ToastProvider>
            </body>
        </html>
    );
}
