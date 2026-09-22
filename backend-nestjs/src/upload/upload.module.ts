import { Module } from "@nestjs/common";
import { UploadService } from "./upload.service";
import { UploadController } from "./upload.controller";
import { SupabaseStorageService } from "./supabase-storage.service";

@Module({
  providers: [UploadService, SupabaseStorageService],
  controllers: [UploadController],
  exports: [UploadService, SupabaseStorageService],
})
export class UploadModule {}
