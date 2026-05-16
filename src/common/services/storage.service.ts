import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  S3ClientConfig,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  IStorageService,
  STORAGE_SERVICE,
  UploadOptions,
} from '@common/interfaces/storage-service.interface';

@Injectable()
export class StorageService implements IStorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('AWS_ENDPOINT');

    const clientConfig: S3ClientConfig = {
      region: this.configService.getOrThrow<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    };

    if (endpoint) {
      clientConfig.endpoint = endpoint;
      clientConfig.forcePathStyle = true;
    }

    this.s3Client = new S3Client(clientConfig);
    this.bucketName = this.configService.getOrThrow<string>('AWS_BUCKET_NAME');
    this.publicUrl = this.configService.getOrThrow<string>(
      'AWS_BUCKET_PUBLIC_URL',
    );
  }

  async uploadFile(
    buffer: Buffer,
    mimeType: string,
    options: UploadOptions,
  ): Promise<{ url: string; key: string }> {
    const ext = this.getExtension(mimeType);
    const fileName = options.fileName
      ? `${options.fileName}.${ext}`
      : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${ext}`;

    const key = `${options.folder}/${fileName}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    const url = `${this.publicUrl.replace(/\/$/, '')}/${key}`;
    this.logger.log(`Uploaded file: ${url}`);
    return { url, key };
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
    this.logger.log(`Deleted file: ${key}`);
  }

  async deleteFileWithUrl(url: string): Promise<void> {
    const key = this.extractKey(url);
    if (!key) {
      this.logger.warn(`Could not extract key from URL: ${url}`);
      return;
    }
    await this.deleteFile(key);
  }

  private getExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpeg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    return map[mimeType] || 'bin';
  }

  private extractKey(url: string): string | null {
    try {
      const key = url.replace(this.publicUrl, '').replace(/^\//, '');
      return key || null;
    } catch {
      return null;
    }
  }
}

export { STORAGE_SERVICE };
