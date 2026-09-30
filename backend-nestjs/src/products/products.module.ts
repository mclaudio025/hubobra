import { Module } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ImportService } from "./import.service";
import { ImageSearchService } from "./image-search.service";
import { ProductsController } from "./products.controller";
import { CacheModule } from "../cache/cache.module";
import { UploadModule } from "../upload/upload.module";

import { SpecsEnrichmentService } from "./specs-enrichment.service";
import { ExtractorService } from "./extractor.service";
import { CategoriesModule } from "../categories/categories.module";

@Module({
  imports: [CacheModule, UploadModule, CategoriesModule],
  providers: [
    ProductsService,
    ImportService,
    ImageSearchService,
    SpecsEnrichmentService,
    ExtractorService,
  ],
  controllers: [ProductsController],
  exports: [
    ProductsService,
    ImportService,
    ImageSearchService,
    SpecsEnrichmentService,
    ExtractorService,
  ],
})
export class ProductsModule {}

