import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';
import { UserStatus } from '@modules/user/enums/user-status.enum';
import type { UserPayload } from '../interfaces/user-payload.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    try {
      const result = await super.canActivate(context);
      if (typeof result === 'boolean') return result;
      return true;
    } catch (err) {
      if (isPublic) {
        return true;
      }
      throw err;
    }
  }

  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _info: Error | undefined,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }

    const payload = user as unknown as UserPayload;

    if (payload.status === UserStatus.BANNED) {
      throw new ForbiddenException('Account is banned');
    }

    return user;
  }
}
