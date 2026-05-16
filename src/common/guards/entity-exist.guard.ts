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
import { DataSource, ObjectType, FindOptionsWhere, In } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

/** Single-value source (URL parameters) */
type SingleSource = 'params';

/** Multi-value sources (Request body or query strings) */
type CollectionSource = 'body' | 'query';

/**
 * Defines field mapping between DTO and Entity
 * If dbField is omitted, sourceField must exist in both types.
 */
type EntityExistGuardFields<E, D> =
  | {
      sourceField: keyof D & keyof E;
      dbField?: never;
    }
  | {
      sourceField: keyof D;
      dbField: keyof E;
    };

interface BaseGuardOptions<D> {
  dto: ClassConstructor<D>;
  key?: string;
}

/** Options for single resource validation */
interface SingleSourceOptions<D> extends BaseGuardOptions<D> {
  source: SingleSource;
  allowMultiple?: never;
  /** Message handler for a single ID */
  notFoundMessage?: (resourceName: string, id: string) => string;
}

/** Options for multiple resources validation */
interface CollectionSourceOptions<D> extends BaseGuardOptions<D> {
  source: CollectionSource;
  /** Supports array of IDs if true */
  allowMultiple: boolean;
  /** Message handler for an array of IDs */
  notFoundMessage?: (resourceName: string, ids: string[]) => string;
}

/**
 * Options for validating entity existence from different request sources.
 * @template E Database Entity
 * @template D Input DTO
 */
export type EntityExistGuardOptions<E, D> =
  | (SingleSourceOptions<D> & EntityExistGuardFields<E, D>)
  | (CollectionSourceOptions<D> & EntityExistGuardFields<E, D>);

/**
 * Options for validating entity existence from different request sources.
 * @template E Database Entity
 * @template D Input DTO
 */
export function EntityExistGuard<E extends object, D extends object>(
  entity: ObjectType<E>,
  options: EntityExistGuardOptions<E, D>,
): Type<CanActivate> {
  @Injectable()
  class EntityExistGuardImpl implements CanActivate {
    constructor(@InjectDataSource() private dataSource: DataSource) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request>();
      const sourceData = request[options.source] as D;
      const rawValue = sourceData?.[options.sourceField];

      const dbtInstance = plainToInstance(options.dto, {
        [options.sourceField]: rawValue,
      });

      const errors = await validate(dbtInstance);
      const fieldErrors = errors.filter(
        (error) => error.property === options.sourceField,
      );

      if (fieldErrors.length > 0) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: fieldErrors.map((e) => ({
            field: e.property,
            message: Object.values(e.constraints ?? {}),
          })),
        });
      }

      const repo = this.dataSource.getRepository(entity);
      const dbField = (options.dbField ?? options.sourceField) as keyof E;

      if (options.allowMultiple) {
        // should has been validated by class-validator at this point
        const ids = rawValue as unknown[];
        const where = {
          [dbField]: In(ids),
        } as FindOptionsWhere<E>;
        const resources = await repo.find({ where });

        if (resources.length < ids.length) {
          const foundIds = resources.map((r) => String(r[dbField]));
          const missingIds = ids
            .map((id) => String(id))
            .filter((id) => !foundIds.includes(id));

          const notFoundMsg = (
            options as {
              notFoundMessage?: (resourceName: string, ids: string[]) => string;
            }
          ).notFoundMessage;
          if (notFoundMsg) {
            throw new NotFoundException(notFoundMsg(entity.name, missingIds));
          }
          throw new NotFoundException(
            `${entity.name}(s) #${missingIds.join(', ')} do not exist`,
          );
        }

        const entityKey = options.key || entity.name.toLowerCase();
        request.resources = {
          ...(request.resources as Record<string, Record<string, unknown>>),
          [entityKey]: resources,
        } as Record<string, Record<string, unknown>>;

        return true;
      }

      if (!rawValue) {
        return true;
      }

      const where = { [dbField]: rawValue } as FindOptionsWhere<E>;
      const resources = await repo.find({ where });

      if (resources.length === 0) {
        const notFoundMsg = (
          options as {
            notFoundMessage?: (resourceName: string, id: string) => string;
          }
        ).notFoundMessage;
        if (notFoundMsg) {
          throw new NotFoundException(
            notFoundMsg(entity.name, String(rawValue)),
          );
        }
        throw new NotFoundException(
          `${entity.name} #${String(rawValue)} does not exist`,
        );
      }

      const entityKey = options.key || entity.name.toLowerCase();
      request.resources = {
        ...(request.resources as Record<string, Record<string, unknown>>),
        [entityKey]: resources[0],
      } as Record<string, Record<string, unknown>>;

      return true;
    }
  }

  return EntityExistGuardImpl;
}
