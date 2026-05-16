import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class SearchImagesByTextDto {
  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}

export class SearchImagesByImageAndTextDto {
  @IsString()
  @IsOptional()
  text?: string;
}
