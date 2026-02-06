import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { Sidebar, AuthGuard, LayoutContent } from "@/components/layout";

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
            <body className="antialiased font-inter">
                <ToastProvider>
                    <AuthGuard>
                        <LayoutContent>
                            {children}
                        </LayoutContent>
                    </AuthGuard>
                </ToastProvider>
            </body>
        </html>
    );
}
