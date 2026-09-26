import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "HubObra - Central de Expedição & Despacho",
  description: "Módulo mobile de liberação e expedição de pedidos para operadores de depósito.",
  manifest: "/manifest-expedicao.json",
  appleWebApp: {
    capable: true,
    title: "Expedição",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ea580c",
};

export default function ExpedicaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans flex flex-col selection:bg-orange-500 selection:text-white">
      {children}
    </div>
  );
}
