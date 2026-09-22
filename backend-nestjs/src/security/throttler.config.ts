import { ThrottlerModuleOptions } from "@nestjs/throttler";

export interface ThrottlerConfig {
  development: ThrottlerModuleOptions;
  production: ThrottlerModuleOptions;
  test: ThrottlerModuleOptions;
}

export const throttlerConfig: ThrottlerConfig = {
  development: [
    {
      name: "short",
      ttl: 1000, // 1 segundo
      limit: 10, // 10 requests por segundo
    },
    {
      name: "medium",
      ttl: 60000, // 1 minuto
      limit: 100, // 100 requests por minuto
    },
    {
      name: "long",
      ttl: 3600000, // 1 hora
      limit: 1000, // 1000 requests por hora
    },
  ],

  production: [
    {
      name: "short",
      ttl: 1000, // 1 segundo
      limit: 5, // 5 requests por segundo (mais restritivo)
    },
    {
      name: "medium",
      ttl: 60000, // 1 minuto
      limit: 60, // 60 requests por minuto
    },
    {
      name: "long",
      ttl: 3600000, // 1 hora
      limit: 500, // 500 requests por hora
    },
  ],

  test: [
    {
      name: "short",
      ttl: 1000,
      limit: 1000, // Muito permissivo para testes
    },
  ],
};

export function getThrottlerConfig(): ThrottlerModuleOptions {
  const env = process.env.NODE_ENV || "development";

  console.log(`⚡ Throttler configured for environment: ${env}`);

  switch (env) {
    case "production":
      return throttlerConfig.production;
    case "test":
      return throttlerConfig.test;
    default:
      return throttlerConfig.development;
  }
}
