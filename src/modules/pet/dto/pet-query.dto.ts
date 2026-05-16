import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';
import { SortOrder } from '@common/enums/sort-order.enum';
import { ToLowerCase } from '@/common/decorators/to-lowercase.decorator';
import { PetGender } from '../enums/pet-gender.enum';
import { PetAgeGroup } from '../enums/pet-age-group.enum';
import { AdoptionStatus } from '../enums/adoption-status.enum';

export class PetQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  petCode?: string;

  @IsOptional()
  @IsNumber()
  speciesId?: number;

  @IsOptional()
  @IsNumber()
  breedId?: number;

  @IsOptional()
  @ToLowerCase()
  @IsEnum(PetGender)
  gender?: PetGender;

  @IsOptional()
  @ToLowerCase()
  @IsEnum(PetAgeGroup)
  ageGroup?: PetAgeGroup;

  @IsOptional()
  @ToLowerCase()
  @IsEnum(AdoptionStatus)
  adoptionStatus?: AdoptionStatus;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @ToLowerCase()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
