import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Res,
  Body,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { Response } from "express";
import { UserRole } from "../common/enums";

import { UploadService } from "./upload.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("upload")
@Controller("upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("image")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
          "image/gif",
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error("Apenas imagens são permitidas"), false);
        }
      },
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload de uma imagem" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "Arquivo de imagem (JPG, PNG, WebP, GIF)",
        },
        variants: {
          type: "string",
          description:
            "Variantes a gerar (separadas por vírgula): thumbnail,small,medium,large",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Imagem enviada com sucesso",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        filename: { type: "string" },
        originalName: { type: "string" },
        size: { type: "number" },
        mimeType: { type: "string" },
        url: { type: "string" },
        thumbnailUrl: { type: "string" },
        width: { type: "number" },
        height: { type: "number" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Arquivo inválido" })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body("variants") variants?: string,
  ) {
    const variantList = variants
      ? variants.split(",").map((v) => v.trim())
      : ["thumbnail", "medium"];
    return this.uploadService.uploadImage(file, variantList);
  }

  @Post("images/multiple")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @UseInterceptors(
    FilesInterceptor("files", 10, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB por arquivo
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
          "image/gif",
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error("Apenas imagens são permitidas"), false);
        }
      },
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload de múltiplas imagens" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: {
            type: "string",
            format: "binary",
          },
          description: "Arquivos de imagem (máximo 10)",
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: "Imagens enviadas com sucesso" })
  async uploadMultipleImages(@UploadedFiles() files: Express.Multer.File[]) {
    return this.uploadService.uploadMultipleImages(files);
  }

  @Get("image/:id/variants")
  @ApiOperation({ summary: "Obter variantes de uma imagem" })
  @ApiParam({ name: "id", description: "ID da imagem" })
  @ApiQuery({
    name: "extension",
    description: "Extensão do arquivo",
    example: ".jpg",
  })
  @ApiResponse({ status: 200, description: "URLs das variantes da imagem" })
  async getImageVariants(
    @Param("id") id: string,
    @Query("extension") extension: string,
  ) {
    return this.uploadService.getImageVariants(id, extension);
  }

  @Post("image/:filename/optimize")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Otimizar imagem existente" })
  @ApiParam({ name: "filename", description: "Nome do arquivo" })
  @ApiResponse({ status: 200, description: "Imagem otimizada com sucesso" })
  async optimizeImage(@Param("filename") filename: string) {
    await this.uploadService.optimizeExistingImage(filename);
    return { message: "Imagem otimizada com sucesso" };
  }

  @Delete("image/:filename")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Deletar imagem" })
  @ApiParam({ name: "filename", description: "Nome do arquivo" })
  @ApiResponse({ status: 200, description: "Imagem deletada com sucesso" })
  async deleteImage(@Param("filename") filename: string) {
    await this.uploadService.deleteImage(filename);
    return { message: "Imagem deletada com sucesso" };
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Estatísticas de upload" })
  @ApiResponse({
    status: 200,
    description: "Estatísticas dos uploads",
    schema: {
      type: "object",
      properties: {
        totalFiles: { type: "number" },
        totalSize: { type: "number" },
        byType: { type: "object" },
      },
    },
  })
  async getUploadStats() {
    return this.uploadService.getUploadStats();
  }

  // Endpoint para servir arquivos (se não usar nginx/apache)
  @Get("files/:variant/:filename")
  @ApiOperation({ summary: "Servir arquivo de imagem" })
  @ApiParam({
    name: "variant",
    description: "Variante da imagem",
    example: "thumbnail",
  })
  @ApiParam({ name: "filename", description: "Nome do arquivo" })
  async serveFile(
    @Param("variant") variant: string,
    @Param("filename") filename: string,
    @Res() res: Response,
  ) {
    const filePath = this.uploadService.getFilePath(variant, filename);
    return res.sendFile(filePath, { root: "." });
  }
}
