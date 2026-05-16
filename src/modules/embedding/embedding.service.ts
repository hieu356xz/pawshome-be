import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmbeddingResponse {
  embedding: {
    values: number[];
  };
}

export interface Base64Image {
  mimeType: string;
  data: string;
}

async function fetchImageAsBase64(imageUrl: string): Promise<Base64Image> {
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const contentType = response.headers.get('content-type') ?? 'image/jpeg';
  const mimeTypeMap: Record<string, string> = {
    'image/jpeg': 'image/jpeg',
    'image/jpg': 'image/jpeg',
    'image/png': 'image/png',
    'image/webp': 'image/webp',
  };
  const mimeType = mimeTypeMap[contentType] ?? 'image/jpeg';

  return {
    mimeType,
    data: buffer.toString('base64'),
  };
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly apiKey: string;
  private readonly model = 'models/gemini-embedding-2';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') ?? '';
  }

  async embedImageFromBase64(image: Base64Image): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const startTime = Date.now();
    this.logger.log(
      `Calling Gemini Embedding API with base64 image (${image.mimeType})`,
    );

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${this.model}:embedContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          content: {
            role: 'user',
            parts: [
              {
                inline_data: {
                  mime_type: image.mimeType,
                  data: image.data,
                },
              },
            ],
          },
          output_dimensionality: 1536,
        }),
      },
    );

    const responseData = (await response.json()) as EmbeddingResponse;
    const duration = Date.now() - startTime;
    this.logger.log(
      `Gemini Embedding API response: ${duration}ms, vector length: ${responseData.embedding.values.length}`,
    );

    return responseData.embedding.values;
  }

  async embedImageFromUrl(imageUrl: string): Promise<number[]> {
    this.logger.log(`Fetching image from URL: ${imageUrl}`);

    const startTime = Date.now();
    const image = await fetchImageAsBase64(imageUrl);
    const embedding = await this.embedImageFromBase64(image);
    this.logger.log(`Image fetched and embedded: ${Date.now() - startTime}ms`);

    return embedding;
  }

  async embedText(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const startTime = Date.now();
    this.logger.log(
      `Calling Gemini Embedding API with text: "${text.substring(0, 50)}..."`,
    );

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${this.model}:embedContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          content: {
            role: 'user',
            parts: [{ text }],
          },
        }),
      },
    );

    const responseData = (await response.json()) as EmbeddingResponse;
    const duration = Date.now() - startTime;
    this.logger.log(
      `Gemini Embedding API response: ${duration}ms, vector length: ${responseData.embedding.values.length}`,
    );

    return responseData.embedding.values;
  }
}
