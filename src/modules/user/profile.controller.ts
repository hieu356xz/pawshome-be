import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { UserPayload } from '@modules/auth/interfaces/user-payload.interface';
import { StorageService } from '@common/services/storage.service';
import { FILE_INTERCEPTOR_OPTIONS } from '@/common/constants/file.constants';

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly userService: UserService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  async getProfile(@CurrentUser() user: UserPayload) {
    return this.userService.findOne(user.userId);
  }

  @Patch()
  async updateProfile(
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(user.userId, dto);
  }

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar', FILE_INTERCEPTOR_OPTIONS))
  async uploadAvatar(
    @CurrentUser() user: UserPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // 1. Fetch current user to check if there is an existing avatar to delete
    const currentUser = await this.userService.findOne(user.userId);

    // 2. Upload new file to S3
    const { url } = await this.storageService.uploadFile(
      file.buffer,
      file.mimetype,
      { folder: 'avatars' },
    );

    // 3. Delete old file if it exists and was stored in our S3 bucket
    if (currentUser.avatarUrl) {
      try {
        await this.storageService.deleteFileWithUrl(currentUser.avatarUrl);
      } catch (error) {
        // Log error but don't fail profile update if delete fails
        console.error('Failed to delete old avatar:', error);
      }
    }

    // 4. Save new URL to database
    await this.userService.update(user.userId, { avatarUrl: url });

    return { avatarUrl: url };
  }
}
