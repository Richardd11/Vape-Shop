import type { Metadata, Viewport } from "next";
import { Assistant, Inter } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const assistant = Assistant({
  subsets: ["latin"],
  variable: "--font-assistant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VapeShop POS",
  description: "Point of Sale and Inventory Management System for Vape Shops",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VapeShop POS",
  },
};

export const viewport: Viewport = {
  themeColor: "#070b15",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${assistant.variable} antialiased`}>
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
