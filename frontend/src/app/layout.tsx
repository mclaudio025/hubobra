import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "./components/ConditionalLayout";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { Toaster } from "./components/ui/Toaster";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import HydrationHandler from "./components/HydrationHandler";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hubconstrucoes.com.br';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "HubConstruções - Marketplace da Construção Civil",
    template: "%s | HubConstruções",
  },
  description: "Conectando o estoque de lojas parceiras da região direto para a sua obra com agilidade e os melhores preços.",
  keywords: ["materiais de construção", "lojas de construção", "cimento", "tijolos", "areia", "brita", "obra", "reforma", "ferramentas", "tintas", "hidráulica", "elétrica"],
  authors: [{ name: "HubConstruções", url: siteUrl }],
  creator: "HubConstruções",
  publisher: "HubConstruções",
  applicationName: "HubConstruções",
  category: "ecommerce",
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "HubConstruções",
    title: "HubConstruções - Marketplace da Construção Civil",
    description: "Conectando o estoque de lojas parceiras da região direto para a sua obra com agilidade e os melhores preços.",
  },
  twitter: {
    card: "summary_large_image",
    title: "HubConstruções - Marketplace da Construção Civil",
    description: "Conectando o estoque de lojas parceiras da região direto para a sua obra com agilidade e os melhores preços.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: "HubConstruções",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F172A",
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      "name": "HubConstruções",
      "url": siteUrl,
      "logo": {
        "@type": "ImageObject",
        "@id": `${siteUrl}/#logo`,
        "url": `${siteUrl}/icons/icon-512x512.png`,
        "caption": "HubConstruções Logo"
      },
      "description": "Marketplace especializado em materiais de construção conectando lojas locais e obras com entrega rápida.",
      "sameAs": []
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      "url": siteUrl,
      "name": "HubConstruções",
      "publisher": {
        "@id": `${siteUrl}/#organization`
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${siteUrl}/busca?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var origError = console.error;
                  console.error = function() {
                    var args = Array.prototype.slice.call(arguments);
                    var msg = args.map(function(a) {
                      return (typeof a === 'string' ? a : (a && a.message ? a.message : ''));
                    }).join(' ');
                    if (
                      msg.indexOf('bis_skin_checked') !== -1 ||
                      msg.indexOf('cz-shortcut-listen') !== -1 ||
                      msg.indexOf('A tree hydrated but some attributes') !== -1 ||
                      msg.indexOf('hydration-mismatch') !== -1 ||
                      msg.indexOf('did not match the client properties') !== -1
                    ) {
                      return;
                    }
                    origError.apply(console, arguments);
                  };
                } catch(e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <HydrationHandler />
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <FavoritesProvider>
                <ConditionalLayout>
                  {children}
                </ConditionalLayout>
                <Toaster />
              </FavoritesProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
