import { PaginatedResponse } from './response.interface';

export const SERVICE_SUFFIX = 'SERVICE';

export interface BaseService<T = unknown> {
  findOne(id: any, ...args: any[]): Promise<T | null>;
  findAll(...args: any[]): Promise<T[] | PaginatedResponse<T>>;
  create(data: Partial<T>, ...args: any[]): Promise<T>;
  update(id: any, data: Partial<T>, ...args: any[]): Promise<T | null>;
  remove(id: any, ...args: any[]): Promise<boolean>;
}
