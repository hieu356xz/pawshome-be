import { UserPayload } from '@/modules/auth/interfaces/user-payload.interface';

declare module 'express' {
  interface Request {
    user?: UserPayload;
    resources?: Record<
      string,
      Record<string, unknown> | Record<string, unknown>[]
    >;
  }
}
