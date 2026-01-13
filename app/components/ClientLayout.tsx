"use client";

import Navbar from "./Navbar";
import { usePathname } from "next/navigation";
import { ToastProvider } from "./ToastProvider";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    // Ensure strict matching for login, partial for admin
    const isLoginPage = pathname === "/";
    const isAdminPage = pathname?.startsWith("/admin");

    return (
        <ToastProvider>
            {!isLoginPage && !isAdminPage && <Navbar />}
            <main className={!isLoginPage && !isAdminPage ? "pt-24" : ""}>
                {children}
            </main>
        </ToastProvider>
    );
}
