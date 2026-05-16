import { BadRequestException } from '@nestjs/common';

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export const FILE_INTERCEPTOR_OPTIONS = {
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (
    _req: unknown,
    file: { mimetype: string },
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (
      IMAGE_MIME_TYPES.includes(
        file.mimetype as (typeof IMAGE_MIME_TYPES)[number],
      )
    ) {
      callback(null, true);
    } else {
      callback(new BadRequestException('Only image files are allowed'), false);
    }
  },
};
