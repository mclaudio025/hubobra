import { Module, Global } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PrismaModule } from "../prisma/prisma.module";
import { DatabaseService } from "./database.service";
import { DatabaseHealthService } from "./database-health.service";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (config) => {
        // Validações obrigatórias
        if (!config.DATABASE_URL) {
          throw new Error("DATABASE_URL is required");
        }

        // Validar formato da URL do banco de dados
        if (
          !config.DATABASE_URL.startsWith("postgresql://") &&
          !config.DATABASE_URL.startsWith("file:")
        ) {
          throw new Error(
            "DATABASE_URL must be a valid database connection string",
          );
        }

        return config;
      },
    }),
    PrismaModule,
  ],
  providers: [DatabaseService, DatabaseHealthService],
  exports: [DatabaseService, DatabaseHealthService],
})
export class DatabaseModule {}
