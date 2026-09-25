import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AIPersonasService } from "./ai-personas.service";
import { AIPersonasController } from "./ai-personas.controller";
import { ProductsModule } from "../products/products.module";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [HttpModule, ProductsModule, PrismaModule],
  controllers: [AIPersonasController],
  providers: [AIPersonasService],
  exports: [AIPersonasService],
})
export class AIPersonasModule {}

