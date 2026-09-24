import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      this.logger.error("❌ DATABASE_URL environment variable is not defined!");
    } else {
      const sanitizedUrl = dbUrl.replace(/:([^:@]+)@/, ":****@");
      this.logger.log(`🔗 Connecting to database: ${sanitizedUrl}`);
    }

    try {
      await this.$connect();
      this.logger.log("🗄️ Database connected successfully");
    } catch (error: any) {
      this.logger.error(`❌ Failed to connect to database on startup: ${error?.message || error}`);
      // Retry in background after 5s
      setTimeout(async () => {
        try {
          await this.$connect();
          this.logger.log("🗄️ Database connected successfully on retry");
        } catch (retryErr: any) {
          this.logger.error(`❌ Database retry connection failed: ${retryErr?.message || retryErr}`);
        }
      }, 5000);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === "production") return;

    const models = Reflect.ownKeys(this).filter((key) => key[0] !== "_");

    return Promise.all(models.map((modelKey) => this[modelKey].deleteMany()));
  }
}
