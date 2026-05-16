import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordReset } from './entities/password-reset.entity';
import { randomUUID } from 'crypto';
import { MailService } from '@modules/mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async createOrUpdate(
    userId: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const existing = await this.passwordResetRepository.findOne({
      where: { userId },
    });

    if (existing) {
      await this.passwordResetRepository.update(existing.id, {
        token,
        expiresAt,
        usedAt: null,
      });
    } else {
      await this.passwordResetRepository.insert({
        userId,
        token,
        expiresAt,
      });
    }

    return { token, expiresAt };
  }

  async verify(token: string): Promise<PasswordReset | null> {
    const record = await this.passwordResetRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!record) {
      return null;
    }

    if (record.usedAt) {
      return null;
    }

    if (record.expiresAt < new Date()) {
      return null;
    }

    return record;
  }

  async markUsed(id: string): Promise<void> {
    await this.passwordResetRepository.update(id, {
      usedAt: new Date(),
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.passwordResetRepository.delete({ userId });
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    language: string = 'en',
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const templates: Record<
      string,
      { template: string; subject: string; expiry: string }
    > = {
      en: {
        template: 'password-reset',
        subject: 'Reset Your Password - Pawshome',
        expiry: '15 minutes',
      },
      vi: {
        template: 'password-reset-vi',
        subject: 'Đặt lại mật khẩu - Pawshome',
        expiry: '15 phút',
      },
    };

    const { subject, expiry, template } = templates[language] || templates.vi;

    await this.mailService.sendTemplateMail({
      to: email,
      subject,
      template,
      variables: {
        resetUrl,
        expiryTime: expiry,
      },
    });
  }
}
