import { IsArray, IsEnum, IsString, ValidateNested } from 'class-validator';
import { PolicyOperator } from '../enums/policy-operator.enum';
import { Type } from 'class-transformer';

export class PolicyRuleDto {
  @IsString()
  field!: string;

  @IsEnum(PolicyOperator)
  operator!: PolicyOperator;

  value!: unknown;
}

export class PolicyConditionsDto {
  @IsEnum(['AND', 'OR'] as const)
  operator!: 'AND' | 'OR';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PolicyRuleDto)
  rules!: PolicyRuleDto[];
}
