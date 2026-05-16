import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiResponse,
  ValidationErrorResponse,
} from '../interfaces/response.interface';

/**
 * Global exception filter to catch all unhandled exceptions and return a consistent error response format.
 * It logs the exception details and returns a JSON response with the following structure:
 * {
 *   success: false,
 *   statusCode: number,
 *   message: string
 * }
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const isStringResponse = typeof exceptionResponse === 'string';

    const message = isStringResponse
      ? exceptionResponse
      : ((exceptionResponse as ValidationErrorResponse).message ??
        'Internal server error');

    const errors = !isStringResponse
      ? (exceptionResponse as ValidationErrorResponse).errors
      : undefined;

    const responseBody: ApiResponse<undefined> = {
      success: false,
      statusCode: status,
      message,
      errors,
    };

    this.logger.error(
      `Exception: ${JSON.stringify(exceptionResponse)}`,
      (exception as Error).stack,
    );

    response.status(status).json(responseBody);
  }
}
