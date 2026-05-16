import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';
import { UserStatus } from '../enums/user-status.enum';
import { SortOrder } from '@common/enums/sort-order.enum';
import { ToLowerCase } from '@/common/decorators/to-lowercase.decorator';

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
  @ToLowerCase()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
