import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateDonationDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1000, { message: 'Donation amount must be at least 1,000 VND' })
  amount!: number;

  @IsOptional()
  @IsString()
  donorName?: string;

  @IsOptional()
  @IsEmail()
  donorEmail?: string;

  @IsOptional()
  @IsString()
  donorPhone?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @IsUrl({}, { message: 'returnUrl must be a valid URL' })
  returnUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'cancelUrl must be a valid URL' })
  cancelUrl?: string;
}
