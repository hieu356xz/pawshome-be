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

  async classifySpecies(
    imageBase64: string,
    imageMimeType: string,
    speciesList: string[],
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const speciesOptions = speciesList.map((s) => `- ${s}`).join('\n');
    const prompt = `Identify the animal species in the image. Choose ONLY one of the following options:
${speciesOptions}

If the image is not an animal or you cannot identify it, reply with "Unknown".
Your response must contain ONLY the selected option name or "Unknown" and nothing else. No markdown formatting, no bold text, no punctuation, just the raw name.`;

    const startTime = Date.now();
    this.logger.log(`Calling Gemini Vision API for classification`);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inline_data: {
                    mime_type: imageMimeType,
                    data: imageBase64,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Gemini Classification API error: ${errorText}`);
      throw new Error(`Failed to classify image: ${response.statusText}`);
    }

    const responseData = await response.json();
    const duration = Date.now() - startTime;
    const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    this.logger.log(
      `Gemini Classification API response: ${duration}ms, result: "${text}"`,
    );

    return text;
  }
}

