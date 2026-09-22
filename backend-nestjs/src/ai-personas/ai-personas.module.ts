import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AIPersonasService } from "./ai-personas.service";
import { AIPersonasController } from "./ai-personas.controller";

@Module({
  imports: [HttpModule],
  controllers: [AIPersonasController],
  providers: [AIPersonasService],
  exports: [AIPersonasService],
})
export class AIPersonasModule {}
