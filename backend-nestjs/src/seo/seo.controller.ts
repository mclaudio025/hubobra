import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { SeoService } from "./seo.service";

@ApiTags("seo")
@Controller("seo")
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get("meta/:path")
  @ApiOperation({ summary: "Get meta tags for path" })
  async getMetaTags(@Param("path") path: string) {
    return this.seoService.generateMetaTags(path);
  }
}
