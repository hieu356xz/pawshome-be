import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { UserPayload } from './interfaces/user-payload.interface';
import { ConfigService } from '@nestjs/config';
import { GoogleUser } from './interfaces/google-user.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return result;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(dto, response);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: Request, @Res() response: Response) {
    // user return from google
    const googleUser = req.user as unknown as GoogleUser;

    try {
      const result = await this.authService.googleAuth(googleUser, response);

      // Redirect to frontend with tokens
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:5173/auth/callback';
      const redirectUrl = new URL(frontendUrl);
      redirectUrl.searchParams.set('access_token', result.tokens.accessToken);
      redirectUrl.searchParams.set(
        'expires_in',
        result.tokens.expiresIn.toString(),
      );

      return response.redirect(redirectUrl.toString());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid credentials';
      const frontendLoginUrl =
        this.configService.get<string>('FRONTEND_LOGIN_URL') ||
        'http://localhost:3000/login';
      const redirectUrl = new URL(frontendLoginUrl);
      redirectUrl.searchParams.set('error', message);

      return response.redirect(redirectUrl.toString());
    }
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refresh_token as string | undefined;
    return this.authService.refreshTokens(refreshToken, response);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refresh_token as string | undefined;
    if (refreshToken) {
      this.authService.logout(response);
    }
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@CurrentUser() user: UserPayload) {
    return this.authService.getCurrentUser(user.userId);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: UserPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.userId, dto);
  }
}

