import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { WhatsAppController } from "./whatsapp.controller";
import { WhatsAppService } from "./whatsapp.service";
import { WhatsAppAIService } from "./whatsapp-ai.service";
import { AIPersonasService } from "../ai-personas/ai-personas.service";

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, WhatsAppAIService, AIPersonasService],
  exports: [WhatsAppService, WhatsAppAIService, AIPersonasService],
})
export class WhatsAppModule {}
