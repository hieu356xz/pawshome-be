import { UserStatus } from '@modules/user/enums/user-status.enum';

export interface UserPayload {
  userId: string;
  email: string;
  fullName: string | null;
  roles: string[];
  status: UserStatus;
}

export interface TokenPayload {
  sub: string;
  email: string;
  fullName: string | null;
  roles: string[];
  status: UserStatus;
  type: 'access' | 'refresh';
}
