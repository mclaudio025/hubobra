import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";
import * as sharp from "sharp";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { SupabaseStorageService, SupabaseUploadResult } from "./supabase-storage.service";

export interface UploadResult {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  cardUrl?: string;
  mediumUrl?: string;
  zoomUrl?: string;
  width?: number;
  height?: number;
  storageProvider: 'supabase' | 'local';
}

export interface ImageVariant {
  name: string;
  width: number;
  height?: number;
  quality?: number;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadPath: string;
  private readonly baseUrl: string;

  // Variantes de imagem para diferentes usos
  private readonly imageVariants: ImageVariant[] = [
    { name: "thumbnail", width: 150, height: 150, quality: 80 },
    { name: "card", width: 450, height: 450, quality: 82 },
    { name: "small", width: 300, quality: 85 },
    { name: "medium", width: 600, quality: 88 },
    { name: "large", width: 1200, quality: 90 },
  ];

  constructor(
    private configService: ConfigService,
    private supabaseStorageService: SupabaseStorageService,
  ) {
    this.uploadPath = this.configService.get("UPLOAD_PATH", "./uploads");
    const port = this.configService.get("PORT") || "8081";
    this.baseUrl = (this.configService.get("BASE_URL") || `http://localhost:${port}`).replace(/\/$/, "");

    // Criar diretórios se não existirem
    this.ensureDirectoriesExist();
  }

  async uploadImage(
    file: Express.Multer.File,
    variants: string[] = ["thumbnail", "card", "medium"],
  ): Promise<UploadResult> {
    this.validateImageFile(file);
    return this.uploadImageFromBuffer(
      file.buffer,
      file.originalname,
      file.mimetype,
      variants,
    );
  }

  async uploadImageFromUrl(
    imageUrl: string,
    originalName?: string,
    variants: string[] = ["thumbnail", "card", "medium"],
  ): Promise<UploadResult> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 15000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
      });

      const contentType = response.headers["content-type"] || "image/jpeg";
      const buffer = Buffer.from(response.data);

      let filename = originalName;
      if (!filename) {
        try {
          const parsedUrl = new URL(imageUrl);
          filename = path.basename(parsedUrl.pathname) || "product-image.jpg";
        } catch {
          filename = "product-image.jpg";
        }
      }

      return this.uploadImageFromBuffer(buffer, filename, contentType, variants);
    } catch (error: any) {
      this.logger.error(
        `Erro ao baixar imagem da URL ${imageUrl}: ${error.message}`,
      );
      throw new BadRequestException(
        `Não foi possível baixar a imagem da URL informada: ${error.message}`,
      );
    }
  }

  async uploadImageFromBuffer(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    variants: string[] = ["thumbnail", "card", "medium"],
  ): Promise<UploadResult> {
    const fileId = uuidv4();
    // 1. Otimização e compressão obrigatória com Sharp antes de qualquer envio
    let optimizedBuffer = buffer;
    let finalMimeType = mimeType;
    let finalExtension = path.extname(originalName).toLowerCase() || ".webp";
    let width: number | undefined;
    let height: number | undefined;

    try {
      // Redimensiona para no máximo 1080x1080 e converte para WebP (qualidade 82)
      // Reduz arquivos de 5MB/2MB para ~30KB-60KB sem perda perceptível de qualidade
      const processed = await sharp(buffer)
        .resize(1080, 1080, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82, effort: 4 })
        .toBuffer({ resolveWithObject: true });

      optimizedBuffer = processed.data;
      finalMimeType = "image/webp";
      finalExtension = ".webp";
      width = processed.info.width;
      height = processed.info.height;
    } catch (err: any) {
      this.logger.warn(`Erro ao otimizar com Sharp, mantendo buffer original: ${err?.message}`);
      try {
        const meta = await sharp(buffer).metadata();
        width = meta.width;
        height = meta.height;
      } catch {}
    }

    const storagePath = `products/${fileId}${finalExtension}`;

    // 2. Se o Supabase Storage estiver configurado, envia o arquivo já comprimido em WebP
    if (this.supabaseStorageService.isConfigured()) {
      try {
        const uploadResult = await this.supabaseStorageService.uploadFile(
          optimizedBuffer,
          storagePath,
          finalMimeType,
        );

        return {
          id: fileId,
          filename: `${fileId}${finalExtension}`,
          originalName,
          size: optimizedBuffer.length,
          mimeType: finalMimeType,
          url: uploadResult.publicUrl,
          thumbnailUrl: uploadResult.cdnUrls.thumbnail,
          cardUrl: uploadResult.cdnUrls.card,
          mediumUrl: uploadResult.cdnUrls.medium,
          zoomUrl: uploadResult.cdnUrls.zoom,
          width,
          height,
          storageProvider: "supabase",
        };
      } catch (err: any) {
        this.logger.error(
          `Erro ao enviar para o Supabase Storage: ${err?.message}. Usando fallback local...`,
        );
      }
    }

    // 2. Fallback: Processamento local com conversão obrigatória para WebP
    const webpFilename = `${fileId}.webp`;
    try {
      const webpBuffer = await sharp(buffer)
        .webp({ quality: 90 })
        .toBuffer();

      const originalPath = path.join(this.uploadPath, "original", webpFilename);
      await fs.promises.writeFile(originalPath, webpBuffer);

      const metadata = await sharp(webpBuffer).metadata();

      // Gerar variantes WebP
      const generatedVariants = await this.generateImageVariants(
        webpBuffer,
        fileId,
        ".webp",
        variants,
      );

      const result: UploadResult = {
        id: fileId,
        filename: webpFilename,
        originalName,
        size: webpBuffer.length,
        mimeType: "image/webp",
        url: `${this.baseUrl}/uploads/original/${webpFilename}`,
        thumbnailUrl: generatedVariants.thumbnail,
        cardUrl: generatedVariants.card,
        mediumUrl: generatedVariants.medium,
        zoomUrl: `${this.baseUrl}/uploads/original/${webpFilename}`,
        width: metadata.width,
        height: metadata.height,
        storageProvider: "local",
      };

      return result;
    } catch (error: any) {
      throw new BadRequestException(
        `Erro ao processar imagem: ${error.message}`,
      );
    }
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      const result = await this.uploadImage(file);
      results.push(result);
    }

    return results;
  }

  async deleteImage(filename: string): Promise<void> {
    try {
      // Se for Supabase Storage
      if (this.supabaseStorageService.isConfigured()) {
        const remotePath = filename.startsWith('products/') ? filename : `products/${filename}`;
        await this.supabaseStorageService.deleteFile(remotePath);
      }

      // Remover arquivo original local se existir
      const originalPath = path.join(this.uploadPath, "original", filename);
      if (fs.existsSync(originalPath)) {
        await fs.promises.unlink(originalPath);
      }

      // Remover variantes
      const fileId = path.parse(filename).name;
      for (const variant of this.imageVariants) {
        const variantPath = path.join(this.uploadPath, variant.name, filename);
        if (fs.existsSync(variantPath)) {
          await fs.promises.unlink(variantPath);
        }
      }
    } catch (error) {
      console.error(`Erro ao deletar imagem ${filename}:`, error);
    }
  }

  async getImageVariants(
    fileId: string,
    extension: string,
  ): Promise<Record<string, string>> {
    const variants: Record<string, string> = {};
    const filename = `${fileId}${extension}`;

    // URL original
    variants.original = `${this.baseUrl}/uploads/original/${filename}`;

    // URLs das variantes
    for (const variant of this.imageVariants) {
      const variantPath = path.join(this.uploadPath, variant.name, filename);
      if (fs.existsSync(variantPath)) {
        variants[variant.name] =
          `${this.baseUrl}/uploads/${variant.name}/${filename}`;
      }
    }

    return variants;
  }

  async optimizeExistingImage(filename: string): Promise<void> {
    const originalPath = path.join(this.uploadPath, "original", filename);

    if (!fs.existsSync(originalPath)) {
      throw new BadRequestException("Imagem não encontrada");
    }

    const buffer = await fs.promises.readFile(originalPath);
    const fileId = path.parse(filename).name;
    const extension = path.extname(filename);

    await this.generateImageVariants(
      buffer,
      fileId,
      extension,
      this.imageVariants.map((v) => v.name),
    );
  }

  private validateImageFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de arquivo não suportado. Tipos permitidos: ${allowedMimeTypes.join(", ")}`,
      );
    }

    // Limite de 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(
        "Arquivo muito grande. Tamanho máximo: 10MB",
      );
    }
  }

  private async generateImageVariants(
    buffer: Buffer,
    fileId: string,
    extension: string,
    variantNames: string[],
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    const filename = `${fileId}${extension}`;

    for (const variantName of variantNames) {
      const variant = this.imageVariants.find((v) => v.name === variantName);
      if (!variant) continue;

      try {
        let sharpInstance = sharp(buffer);

        // Redimensionar
        if (variant.height) {
          sharpInstance = sharpInstance.resize(variant.width, variant.height, {
            fit: "cover",
            position: "center",
          });
        } else {
          sharpInstance = sharpInstance.resize(variant.width, null, {
            withoutEnlargement: true,
          });
        }

        // Aplicar qualidade se especificada
        if (variant.quality) {
          if (extension === ".jpg" || extension === ".jpeg") {
            sharpInstance = sharpInstance.jpeg({ quality: variant.quality });
          } else if (extension === ".png") {
            sharpInstance = sharpInstance.png({ quality: variant.quality });
          } else if (extension === ".webp") {
            sharpInstance = sharpInstance.webp({ quality: variant.quality });
          }
        }

        const processedBuffer = await sharpInstance.toBuffer();
        const variantPath = path.join(this.uploadPath, variant.name, filename);

        await fs.promises.writeFile(variantPath, processedBuffer);
        results[variant.name] =
          `${this.baseUrl}/uploads/${variant.name}/${filename}`;
      } catch (error) {
        console.error(`Erro ao gerar variante ${variant.name}:`, error);
      }
    }

    return results;
  }

  private ensureDirectoriesExist(): void {
    const directories = [
      this.uploadPath,
      path.join(this.uploadPath, "original"),
      ...this.imageVariants.map((v) => path.join(this.uploadPath, v.name)),
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  // Método para servir arquivos estáticos (se não usar nginx/apache)
  getFilePath(variant: string, filename: string): string {
    return path.join(this.uploadPath, variant, filename);
  }

  // Estatísticas de upload
  async getUploadStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    byType: Record<string, number>;
  }> {
    const originalDir = path.join(this.uploadPath, "original");

    if (!fs.existsSync(originalDir)) {
      return { totalFiles: 0, totalSize: 0, byType: {} };
    }

    const files = await fs.promises.readdir(originalDir);
    let totalSize = 0;
    const byType: Record<string, number> = {};

    for (const file of files) {
      const filePath = path.join(originalDir, file);
      const stats = await fs.promises.stat(filePath);
      const extension = path.extname(file).toLowerCase();

      totalSize += stats.size;
      byType[extension] = (byType[extension] || 0) + 1;
    }

    return {
      totalFiles: files.length,
      totalSize,
      byType,
    };
  }
}
