import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Response } from 'express';
import {
  ApiResponse,
  ControllerResponse,
} from '../interfaces/response.interface';

/**
 * Global response interceptor to standardize API responses.
 * It transforms the response into a consistent format:
 * {
 *   success: boolean,
 *   message: string,
 *   statusCode: number,
 *   data: T,
 *   meta?: ResponseMeta
 * }
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  ControllerResponse<T>,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<ControllerResponse<T>>,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        const isPagination =
          data &&
          typeof data === 'object' &&
          'results' in data &&
          'meta' in data;

        if (isPagination) {
          return {
            success: true,
            statusCode: response.statusCode ?? 200,
            message: 'Success',
            data: data.results,
            meta: data.meta,
          };
        }
        return {
          success: true,
          statusCode: response.statusCode ?? 200,
          message: 'Success',
          data,
        };
      }),
    );
  }
}
