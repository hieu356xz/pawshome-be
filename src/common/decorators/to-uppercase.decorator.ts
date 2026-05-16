import { Transform } from 'class-transformer';

export const ToUpperCase = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  );
