import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { AdoptionRequestStatus } from '../enums/adoption-request-status.enum';

export class ReviewAdoptionRequestDto {
  @IsEnum(AdoptionRequestStatus)
  status!: AdoptionRequestStatus;

  @IsString()
  @IsNotEmpty()
  rejectionReason!: string;
}
