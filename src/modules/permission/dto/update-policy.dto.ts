import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, ValidateNested } from 'class-validator';
import { Min } from 'class-validator';
import { PolicyEffect } from '../enums/policy-effect.enum';
import { PolicyConditionsDto } from './policy-conditions.dto';

export class UpdatePolicyDto {
  @IsOptional()
  @IsEnum(PolicyEffect)
  effect?: PolicyEffect;

  @IsOptional()
  @ValidateNested()
  @Type(() => PolicyConditionsDto)
  conditions?: PolicyConditionsDto | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  priority?: number;
}
