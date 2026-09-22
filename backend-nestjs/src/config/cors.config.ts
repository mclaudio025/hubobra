import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

export function getCorsConfig(): CorsOptions {
  const isProd = process.env.NODE_ENV === "production";
  
  // Lista base de origens permitidas
  const defaultOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://localhost:8080",
    "http://localhost:8081",
  ];

  // Adicionar FRONTEND_URL se configurada
  if (process.env.FRONTEND_URL) {
    defaultOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ""));
  }

  // Adicionar origens de ALLOWED_ORIGINS (separadas por vírgula)
  if (process.env.ALLOWED_ORIGINS) {
    const envOrigins = process.env.ALLOWED_ORIGINS.split(",")
      .map((o) => o.trim().replace(/\/$/, ""))
      .filter(Boolean);
    defaultOrigins.push(...envOrigins);
  }

  // Remover duplicatas
  const allowedOrigins = Array.from(new Set(defaultOrigins));

  console.log(`🔒 CORS configurado [${isProd ? "PRODUÇÃO" : "DESENVOLVIMENTO"}]. Origens permitidas:`, allowedOrigins);

  return {
    origin: (origin, callback) => {
      // Permitir requisições sem origin (como mobile apps, Server-Side Render do Next.js, n8n, webhooks, cURL e Postman)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, "");

      // Verifica se a origem está na lista explícita
      const isAllowed = allowedOrigins.includes(normalizedOrigin);

      if (isAllowed) {
        return callback(null, true);
      }

      // Em desenvolvimento ou staging, permitir domínios de preview da Vercel / Cloudflare
      if (
        normalizedOrigin.endsWith(".vercel.app") ||
        normalizedOrigin.endsWith(".pages.dev") ||
        normalizedOrigin.includes("localhost") ||
        normalizedOrigin.includes("127.0.0.1")
      ) {
        return callback(null, true);
      }

      console.warn(`🚫 CORS bloqueou a origem: ${origin}`);
      return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Cache-Control",
      "X-File-Name",
      "X-Total-Count",
      "X-Forwarded-For",
      "X-Forwarded-Proto",
    ],
    exposedHeaders: [
      "X-Total-Count",
      "X-Page-Count",
      "X-Current-Page",
      "X-Per-Page",
      "Content-Disposition",
    ],
    maxAge: 86400, // 24 horas de cache para preflight OPTIONS
    optionsSuccessStatus: 204,
  };
}
