"use client";

import "./globals.css";
import Navbar from "./components/Navbar";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/";
  const isAdminPage = pathname?.startsWith("/admin");

  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased suppress-hydration-warning">
        {!isLoginPage && !isAdminPage && <Navbar />}
        <main className={!isLoginPage && !isAdminPage ? "pt-24" : ""}>
          {children}
        </main>
      </body>
    </html>
  );
}
