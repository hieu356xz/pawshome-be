import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  NotFoundException,
  Type,
} from '@nestjs/common';
import { Request } from 'express';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DataSource, ObjectType, FindOptionsWhere } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

export interface EntityExistGuardOptions<T> {
  param: string;
  dto: ClassConstructor<T>;
  notFoundMessage?: (resourceName: string, param: string) => string;
}

export function EntityExistGuard<T extends object, D extends Partial<T>>(
  entity: ObjectType<T>,
  options: EntityExistGuardOptions<D>,
): Type<CanActivate> {
  @Injectable()
  class EntityExistGuardImpl implements CanActivate {
    constructor(@InjectDataSource() private dataSource: DataSource) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request>();
      const rawParam = request.params[options.param];
      const paramKey = Array.isArray(rawParam) ? rawParam[0] : rawParam;

      if (!paramKey) {
        throw new BadRequestException(
          `Parameter '${options.param}' is required`,
        );
      }

      const dbtInstance = plainToInstance(options.dto, {
        [options.param]: paramKey,
      });

      const errors = await validate(dbtInstance);
      if (errors.length > 0) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: errors.map((e) => ({
            field: e.property,
            message: Object.values(e.constraints ?? {}),
          })),
        });
      }

      const query = {
        [options.param]: paramKey,
      } as FindOptionsWhere<T>;

      const repo = this.dataSource.getRepository(entity);
      const resource = await repo.exists({
        where: query,
      });

      if (!resource) {
        if (options.notFoundMessage) {
          throw new NotFoundException(
            options.notFoundMessage(entity.name, paramKey),
          );
        }
        throw new NotFoundException(
          `${entity.name} #${paramKey} does not exist`,
        );
      }

      const entityKey = entity.name.toLowerCase();
      request.resources = {
        ...(request.resources as Record<string, Record<string, unknown>>),
        [entityKey]: resource,
      } as Record<string, Record<string, unknown>>;

      return true;
    }
  }

  return EntityExistGuardImpl;
}
