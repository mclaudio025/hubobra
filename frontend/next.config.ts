import type { NextConfig } from "next";
// @ts-expect-error - next-pwa does not have types available easily
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },

  // Otimizações para produção
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // Configurações de build
  experimental: {
    // optimizeCss: true, // Disable to debug 500 error in dev
  },

  // Nota: rewrites e headers não funcionam com output: export
  // Eles devem ser configurados no servidor (Nginx/Apache) ou removidos se não usados no build
};

export default withPWA(nextConfig);
