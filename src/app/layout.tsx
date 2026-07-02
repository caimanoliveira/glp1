import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { BottomNav } from "@/components/BottomNav";
import { RegisterSW } from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: "Acompanhamento Tirzepatida",
  description: "App pessoal para acompanhar ciclo de tirzepatida.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Tirze" },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh">
        <StoreProvider>
          <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
            <main className="flex-1 px-4 pb-24 pt-5">{children}</main>
            <BottomNav />
          </div>
          <RegisterSW />
        </StoreProvider>
      </body>
    </html>
  );
}
