import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmbeddingResponse {
  embedding: {
    values: number[];
  };
}
export interface EmbedOptions {
  imageBase64?: string;
  imageMimeType?: string;
  text?: string;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly apiKey: string;
  private readonly model = 'models/gemini-embedding-2';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') ?? '';
  }

  async embed(options: EmbedOptions): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const { imageBase64, imageMimeType, text } = options;
    const hasImage = !!imageBase64 && !!imageMimeType;
    const hasText = !!text;

    const parts: object[] = [];

    if (hasImage) {
      parts.push({
        inline_data: {
          mime_type: imageMimeType,
          data: imageBase64,
        },
      });
    }

    if (hasText) {
      parts.push({ text });
    }

    const startTime = Date.now();
    this.logger.log(
      `Calling Gemini Embedding API - image: ${hasImage}, text: ${hasText}`,
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
            parts,
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
}
