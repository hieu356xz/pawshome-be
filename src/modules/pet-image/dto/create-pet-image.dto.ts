import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePetImageDto {
  @IsString()
  @IsNotEmpty()
  imageBase64!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;
}

export class CreatePetImageFromUrlDto {
  @IsString()
  @IsNotEmpty()
  imageUrl!: string;
}
