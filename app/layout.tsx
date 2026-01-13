import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./components/ClientLayout";

export const metadata: Metadata = {
  title: "FoundIt!",
  description: "Campus Lost & Found System",
  icons: {
    icon: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased suppress-hydration-warning">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
