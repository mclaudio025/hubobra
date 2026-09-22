import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'origin' | 'webp' | 'avif';
  resize?: 'cover' | 'contain' | 'fill';
}

export interface SupabaseUploadResult {
  path: string;
  publicUrl: string;
  cdnUrls: {
    thumbnail: string;
    card: string;
    medium: string;
    zoom: string;
    original: string;
  };
}

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private supabase: SupabaseClient | null = null;
  private readonly bucketName: string;
  private readonly supabaseUrl: string;
  private readonly isEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const rawUrl = this.configService.get<string>('SUPABASE_URL', '');
    this.supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

    const serviceRoleKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.configService.get<string>('SUPABASE_ANON_KEY', '');
    this.bucketName = this.configService.get<string>(
      'SUPABASE_BUCKET_NAME',
      'products',
    );

    if (this.supabaseUrl && serviceRoleKey) {
      this.supabase = createClient(this.supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        realtime: {
          transport: class FakeSocket {
            constructor() {}
            close() {}
          } as any,
        },
      });
      this.isEnabled = true;
      this.logger.log(`✅ Supabase Storage initialized for bucket: ${this.bucketName} (${this.supabaseUrl})`);
    } else {
      this.isEnabled = false;
      this.logger.warn(
        '⚠️ Supabase Storage keys not provided. Falling back to local storage.',
      );
    }
  }

  isConfigured(): boolean {
    return this.isEnabled && this.supabase !== null;
  }

  async uploadFile(
    buffer: Buffer,
    filePath: string,
    mimeType: string,
  ): Promise<SupabaseUploadResult> {
    if (!this.supabase) {
      throw new Error('Supabase client is not configured');
    }

    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Failed to upload file to Supabase: ${error.message}`);
      throw error;
    }

    const { data: publicData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    const publicUrl = publicData.publicUrl;

    return {
      path: filePath,
      publicUrl,
      cdnUrls: {
        thumbnail: this.getTransformedUrl(filePath, {
          width: 150,
          height: 150,
          quality: 80,
          format: 'webp',
          resize: 'cover',
        }),
        card: this.getTransformedUrl(filePath, {
          width: 450,
          height: 450,
          quality: 82,
          format: 'webp',
          resize: 'cover',
        }),
        medium: this.getTransformedUrl(filePath, {
          width: 800,
          quality: 85,
          format: 'webp',
        }),
        zoom: this.getTransformedUrl(filePath, {
          width: 1400,
          quality: 88,
          format: 'webp',
        }),
        original: publicUrl,
      },
    };
  }

  getTransformedUrl(
    filePath: string,
    options: ImageTransformOptions = {},
  ): string {
    if (!this.supabaseUrl) {
      return '';
    }

    const cleanBaseUrl = this.supabaseUrl.replace(/\/$/, '');
    const cleanPath = filePath.replace(/^\//, '');

    // Supabase Storage Image Transformation URL format:
    // /storage/v1/render/image/public/[bucket]/[path]?[params]
    const renderUrl = `${cleanBaseUrl}/storage/v1/render/image/public/${this.bucketName}/${cleanPath}`;

    const params = new URLSearchParams();

    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.quality) params.append('quality', options.quality.toString());
    if (options.format) params.append('format', options.format);
    if (options.resize) params.append('resize', options.resize);

    const queryString = params.toString();
    return queryString ? `${renderUrl}?${queryString}` : renderUrl;
  }

  async deleteFile(filePath: string): Promise<void> {
    if (!this.supabase) return;

    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        this.logger.warn(`Could not delete file ${filePath} from Supabase: ${error.message}`);
      }
    } catch (err: any) {
      this.logger.error(`Error deleting file from Supabase: ${err?.message}`);
    }
  }
}
