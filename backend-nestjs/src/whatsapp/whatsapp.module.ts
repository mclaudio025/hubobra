import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { WhatsAppController } from "./whatsapp.controller";
import { WhatsAppService } from "./whatsapp.service";
import { WhatsAppAIService } from "./whatsapp-ai.service";
import { AIPersonasModule } from "../ai-personas/ai-personas.module";

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule,
    AIPersonasModule,
  ],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, WhatsAppAIService],
  exports: [WhatsAppService, WhatsAppAIService],
})
export class WhatsAppModule {}
