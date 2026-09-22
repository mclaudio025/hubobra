import { Module } from "@nestjs/common";
import { PriceManagementService } from "./price-management.service";
import { PriceManagementController } from "./price-management.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [PriceManagementController],
  providers: [PriceManagementService],
  exports: [PriceManagementService],
})
export class PriceManagementModule {}
