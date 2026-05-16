import { IsEnum, IsOptional, ValidateIf, IsIn } from 'class-validator';
import { AdoptionRequestStatus } from '../enums/adoption-request-status.enum';
import { RejectionReason } from '../enums/rejection-reason.enum';

export class ReviewAdoptionRequestDto {
  @IsEnum(AdoptionRequestStatus)
  status!: AdoptionRequestStatus;

  @ValidateIf(
    (o: ReviewAdoptionRequestDto) =>
      o.status === AdoptionRequestStatus.REJECTED,
  )
  @IsEnum(RejectionReason)
  rejectionReason?: RejectionReason;

  @ValidateIf(
    (o: ReviewAdoptionRequestDto) =>
      o.status === AdoptionRequestStatus.REJECTED,
  )
  @IsOptional()
  rejectionNote?: string;

  @ValidateIf(
    (o: ReviewAdoptionRequestDto) =>
      o.status === AdoptionRequestStatus.APPROVED,
  )
  @IsOptional()
  approvalMessage?: string;

  @IsOptional()
  @IsIn(['en', 'vi'])
  language?: 'en' | 'vi';
}
