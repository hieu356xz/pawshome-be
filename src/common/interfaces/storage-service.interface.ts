export const STORAGE_SERVICE = 'STORAGE_SERVICE';

export interface UploadOptions {
  folder: string;
  fileName?: string;
  mimeType: string;
}

export interface IStorageService {
  uploadFile(
    buffer: Buffer,
    mimeType: string,
    options: UploadOptions,
  ): Promise<string>;
  deleteFile(url: string): Promise<void>;
}
