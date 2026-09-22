import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as express from "express";
import * as path from "path";
import { AppModule } from "./app.module";
import { getCorsConfig } from "./config/cors.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar trust proxy para ambientes atrás de Nginx/Cloudflare/cPanel/Vercel
  const expressApp = app.getHttpAdapter().getInstance();
  if (expressApp && typeof expressApp.set === "function") {
    expressApp.set("trust proxy", 1);
  }

  // Configuração de limites de payload (deve vir antes dos pipes)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Configuração global de validação
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuração CORS restritiva
  app.enableCors(getCorsConfig());

  // Servir arquivos estáticos
  const uploadsPath = path.join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsPath));
  console.log(`📁 Serving static files from: ${uploadsPath}`);

  // Configuração Swagger
  const config = new DocumentBuilder()
    .setTitle("E-commerce API")
    .setDescription(
      "API para plataforma de e-commerce de materiais de construção",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("auth", "Autenticação e autorização")
    .addTag("users", "Gestão de usuários")
    .addTag("products", "Gestão de produtos")
    .addTag("categories", "Gestão de categorias")
    .addTag("orders", "Gestão de pedidos")
    .addTag("cart", "Carrinho de compras")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 8081;
  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
