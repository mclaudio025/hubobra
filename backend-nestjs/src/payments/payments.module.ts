import { Module } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { PixService } from "./pix.service";
import { PaymentLinkService } from "./payment-link.service";
import { PrismaModule } from "../prisma/prisma.module";
import { LoggingModule } from "../logging/logging.module";

@Module({
  imports: [PrismaModule, LoggingModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PixService, PaymentLinkService],
  exports: [PaymentsService, PixService, PaymentLinkService],
})
export class PaymentsModule {}
