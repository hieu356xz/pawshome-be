  import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsOptional()
  @IsString()
  oldPassword?: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  newPassword!: string;
}
