import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { NavbarWrapper } from "@/components/layout/NavbarWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FoodHub — BD2",
  description: "Sistema de gestion de ordenes de restaurantes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans bg-gray-50 text-gray-900 antialiased min-h-screen">
        <AuthProvider>
          <ToastProvider>
            <div className="min-h-screen flex flex-col pt-24 bg-background">
              <NavbarWrapper />
              <main className="flex-1 pb-16">{children}</main>
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
