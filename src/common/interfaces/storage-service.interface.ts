export const STORAGE_SERVICE = 'STORAGE_SERVICE';

export interface UploadOptions {
  folder: string;
  fileName?: string;
}

export interface UploadResult {
  url: string;
  key: string;
}

export interface IStorageService {
  uploadFile(
    buffer: Buffer,
    mimeType: string,
    options: UploadOptions,
  ): Promise<UploadResult>;
  deleteFile(key: string): Promise<void>;
  deleteFileWithUrl(url: string): Promise<void>;
}
