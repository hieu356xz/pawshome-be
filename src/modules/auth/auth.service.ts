import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { UserService } from '@modules/user/user.service';
import { User } from '@modules/user/entities/user.entity';
import { UserStatus } from '@modules/user/enums/user-status.enum';
import { PasswordResetService } from '@modules/password-reset/password-reset.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { TokenPayload } from './interfaces/user-payload.interface';
import { AuthResponseDto } from './dto/token-response.dto';
import { GoogleUser } from './interfaces/google-user.interface';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const memberRole = await this.userService.findRoleByName('member');
    const user = await this.userService.create({
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
      status: UserStatus.ACTIVE,
      roles: memberRole ? [memberRole] : [],
    });

    const tokens = await this.generateTokenPair(user);

    return {
      user: this.mapUserToResponse(user),
      tokens: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
      },
    };
  }

  async login(dto: LoginDto, response: Response): Promise<AuthResponseDto> {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Please login with Google');
    }

    const isPasswordValid = await this.userService.validatePassword(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException('Account is banned');
    }

    const tokens = await this.generateTokenPair(user);

    this.setRefreshTokenCookie(response, tokens.refreshToken);

    return {
      user: this.mapUserToResponse(user),
      tokens: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
      },
    };
  }

  async googleAuth(
    googleUser: GoogleUser,
    response: Response,
  ): Promise<AuthResponseDto> {
    let user = await this.userService.findByEmail(googleUser.email);

    if (!user) {
      const memberRole = await this.userService.findRoleByName('member');
      // Create new user from Google
      user = await this.userService.create({
        email: googleUser.email,
        fullName: googleUser.fullName,
        avatarUrl: googleUser.avatarUrl || undefined,
        googleId: googleUser.googleId,
        status: UserStatus.ACTIVE,
        roles: memberRole ? [memberRole] : [],
      });
    } else {
      // Update existing user with Google info if not set
      if (!user.googleId) {
        await this.userService.update(user.id, {
          googleId: googleUser.googleId,
          avatarUrl: user.avatarUrl || googleUser.avatarUrl || undefined,
        });
      }
    }

    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException('Account is banned');
    }

    const tokens = await this.generateTokenPair(user);

    this.setRefreshTokenCookie(response, tokens.refreshToken);

    return {
      user: this.mapUserToResponse(user),
      tokens: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
      },
    };
  }

  async refreshTokens(
    refreshToken: string | undefined,
    response: Response,
  ): Promise<AuthResponseDto> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }

    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        },
      );

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.userService.findOne(payload.sub);

      if (user.status === UserStatus.BANNED) {
        throw new ForbiddenException('Account is banned');
      }

      // Generate new token pair (rotation)
      const tokens = await this.generateTokenPair(user);

      // Set new refresh token in cookie
      this.setRefreshTokenCookie(response, tokens.refreshToken);

      return {
        user: this.mapUserToResponse(user),
        tokens: {
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
          tokenType: 'Bearer',
        },
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  logout(response: Response): void {
    this.clearRefreshTokenCookie(response);
  }

  async getCurrentUser(userId: string): Promise<User> {
    return this.userService.findOne(userId);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      return { message: 'If the email exists, a reset link will be sent' };
    }

    if (user.googleId) {
      return { message: 'If the email exists, a reset link will be sent' };
    }

    const { token } = await this.passwordResetService.createOrUpdate(user.id);

    await this.passwordResetService.sendPasswordResetEmail(
      user.email,
      token,
      dto.language,
    );

    return { message: 'If the email exists, a reset link will be sent' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const record = await this.passwordResetService.verify(dto.token);

    if (!record) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    await this.userService.update(record.userId, {
      password: dto.newPassword,
    });

    await this.passwordResetService.markUsed(record.id);

    return { message: 'Password reset successfully' };
  }

  private async generateTokenPair(user: User): Promise<TokenPair> {
    const accessTokenExpiresIn = parseInt(
      this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN'),
      10,
    );
    const refreshTokenExpiresIn = parseInt(
      this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
      10,
    );

    const roles = user.roles?.map((role) => role.name) || [];

    const accessTokenPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
      status: user.status,
      type: 'access',
    };

    const refreshTokenPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
      status: user.status,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        expiresIn: accessTokenExpiresIn,
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        expiresIn: refreshTokenExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpiresIn,
    };
  }

  private setRefreshTokenCookie(response: Response, token: string): void {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    response.cookie('refresh_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge:
        parseInt(
          this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
          10,
        ) * 1000,
      path: '/',
    });
  }

  private clearRefreshTokenCookie(response: Response): void {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
    });
  }

  private mapUserToResponse(user: User): AuthResponseDto['user'] {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      roles: user.roles?.map((role) => role.name) || [],
    };
  }
}
