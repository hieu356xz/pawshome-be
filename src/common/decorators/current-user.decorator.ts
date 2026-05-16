import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPayload } from '@modules/auth/interfaces/user-payload.interface';

interface RequestWithUser {
  user?: UserPayload;
}

/**
 * Extracts the current authenticated user from the request
 * @usage @CurrentUser() user: UserPayload
 */
export const CurrentUser = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
