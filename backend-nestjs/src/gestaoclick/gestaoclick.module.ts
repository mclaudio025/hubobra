import { Module } from "@nestjs/common";
import { GestaoclickService } from "./gestaoclick.service";
import { GestaoclickController } from "./gestaoclick.controller";

@Module({
  controllers: [GestaoclickController],
  providers: [GestaoclickService],
  exports: [GestaoclickService],
})
export class GestaoclickModule {}
