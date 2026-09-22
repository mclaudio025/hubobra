import { Module } from "@nestjs/common";
import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { join } from "path";

import { MailService } from "./mail.service";
import { MailController } from "./mail.controller";
import { NewsletterService } from "./newsletter.service";
import { NotificationService } from "./notification.service";
import { PrismaModule } from "../prisma/prisma.module";
import { LoggingModule } from "../logging/logging.module";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    LoggingModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get("SMTP_HOST", "smtp.gmail.com"),
          port: configService.get("SMTP_PORT", 587),
          secure: false, // true for 465, false for other ports
          auth: {
            user: configService.get("SMTP_USER"),
            pass: configService.get("SMTP_PASS"),
          },
        },
        defaults: {
          from: `"${configService.get("MAIL_FROM_NAME", "Loja Moderna")}" <${configService.get("MAIL_FROM_ADDRESS", "noreply@lojamoderna.com")}>`,
        },
        template: {
          dir: join(__dirname, "templates"),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MailController],
  providers: [MailService, NewsletterService, NotificationService],
  exports: [MailService, NewsletterService, NotificationService],
})
export class MailModule {}
