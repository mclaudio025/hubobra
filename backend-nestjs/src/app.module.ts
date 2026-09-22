import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_INTERCEPTOR } from "@nestjs/core";

import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ProductsModule } from "./products/products.module";
import { CategoriesModule } from "./categories/categories.module";
import { OrdersModule } from "./orders/orders.module";
import { CartModule } from "./cart/cart.module";
import { UploadModule } from "./upload/upload.module";
import { BannersModule } from "./banners/banners.module";
import { ComponentsModule } from "./components/components.module";
import { SettingsModule } from "./settings/settings.module";
import { CacheModule } from "./cache/cache.module";
import { SecurityModule } from "./security/security.module";
import { HealthModule } from "./health/health.module";
import { WhatsAppModule } from "./whatsapp/whatsapp.module";
import { AIPersonasModule } from "./ai-personas/ai-personas.module";
import { PromptsModule } from "./prompts/prompts.module";
import { PriceManagementModule } from "./price-management/price-management.module";
import { LoggingModule } from "./logging/logging.module";
import { MetricsModule } from "./metrics/metrics.module";
import { DatabaseModule } from "./database/database.module";
import { PaymentsModule } from "./payments/payments.module";
import { MailModule } from "./mail/mail.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { getThrottlerConfig } from "./security/throttler.config";
import { LoggingInterceptor } from "./logging/logging.interceptor";
import { MetricsInterceptor } from "./metrics/metrics.interceptor";

@Module({
  imports: [
    // Configuração de ambiente
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Rate limiting configurável por ambiente
    ThrottlerModule.forRoot(getThrottlerConfig()),

    // Agendamento de tarefas
    ScheduleModule.forRoot(),

    // Módulos da aplicação
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    CartModule,
    UploadModule,
    BannersModule,
    ComponentsModule,
    SettingsModule,
    CacheModule,
    SecurityModule,
    HealthModule,
    WhatsAppModule,
    AIPersonasModule,
    PromptsModule,
    PriceManagementModule,
    LoggingModule,
    MetricsModule,
    DatabaseModule,
    PaymentsModule,
    MailModule,
    ReviewsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule {}
