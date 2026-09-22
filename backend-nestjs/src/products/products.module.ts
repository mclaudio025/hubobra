import { Module } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ImportService } from "./import.service";
import { ImageSearchService } from "./image-search.service";
import { ProductsController } from "./products.controller";
import { CacheModule } from "../cache/cache.module";
import { UploadModule } from "../upload/upload.module";

import { SpecsEnrichmentService } from "./specs-enrichment.service";

@Module({
  imports: [CacheModule, UploadModule],
  providers: [ProductsService, ImportService, ImageSearchService, SpecsEnrichmentService],
  controllers: [ProductsController],
  exports: [ProductsService, ImportService, ImageSearchService, SpecsEnrichmentService],
})
export class ProductsModule {}

