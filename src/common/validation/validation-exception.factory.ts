import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

/**
 * Factory to create a BadRequestException from class-validator's ValidationError array.
 * It transforms the ValidationError objects into a more readable format for the client.
 * The error message will have the following structure:
 * {
 *   message: 'Validation failed',
 *   errors: [
 *     {
 *       field: 'fieldName',
 *      message: ['error message 1', 'error message 2']
 *     }
 *  ]
 * The final response will be handled by GlobalExceptionFilter and sent to the client with status code 400.
 */

export class ValidationExceptionFactory {
  static create(errors: ValidationError[]): BadRequestException {
    return new BadRequestException({
      message: 'Validation failed',
      errors: errors.map((e) => ({
        field: e.property,
        message: Object.values(e.constraints ?? {}),
      })),
    });
  }
}
