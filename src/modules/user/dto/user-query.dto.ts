import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';
import { UserStatus } from '../enums/user-status.enum';
import { SortOrder } from '@common/enums/sort-order.enum';
import { ToUpperCase } from '@/common/decorators/to-uppercase.decorator';

export class UserQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @ToUpperCase()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
