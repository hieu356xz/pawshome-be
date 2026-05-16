import { Expose } from 'class-transformer';

export class TokenResponseDto {
  @Expose()
  accessToken!: string;

  @Expose()
  expiresIn!: number;

  @Expose()
  tokenType = 'Bearer';
}

export class AuthResponseDto {
  @Expose()
  user!: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    roles: string[];
  };

  @Expose()
  tokens!: TokenResponseDto;
}
