import { PolicyOperator } from '../enums/policy-operator.enum';

export interface PolicyConditions {
  operator: 'AND' | 'OR';
  rules: PolicyRule[];
}

export interface PolicyRule {
  field: string;
  operator: PolicyOperator;
  value: any;
}

export interface PolicyEvaluationContext {
  user: {
    id: string;
    roles?: string[];
    [key: string]: unknown;
  };
  resource: {
    [key: string]: unknown;
  };
  env: {
    time: Date;
    ip?: string;
    [key: string]: unknown;
  };
}
