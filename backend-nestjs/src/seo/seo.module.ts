import { Module } from "@nestjs/common";
import { SeoService } from "./seo.service";
import { SeoController } from "./seo.controller";
import { SitemapService } from "./sitemap.service";
import { MetaTagsService } from "./meta-tags.service";
import { AnalyticsService } from "./analytics.service";
import { PrismaModule } from "../prisma/prisma.module";
import { LoggingModule } from "../logging/logging.module";

@Module({
  imports: [PrismaModule, LoggingModule],
  controllers: [SeoController],
  providers: [SeoService, SitemapService, MetaTagsService, AnalyticsService],
  exports: [SeoService, SitemapService, MetaTagsService, AnalyticsService],
})
export class SeoModule {}
