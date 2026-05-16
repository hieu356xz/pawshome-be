import { IsEmail, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsOptional()
  @IsIn(['en', 'vi'])
  language?: 'en' | 'vi';
}
