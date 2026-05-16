import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface SendTemplateMailOptions {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, unknown>;
}

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private templateDir: string;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('MAIL_HOST'),
      port: this.configService.getOrThrow<number>('MAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.getOrThrow<string>('MAIL_USER'),
        pass: this.configService.getOrThrow<string>('MAIL_PASSWORD'),
      },
    });

    this.templateDir = path.join(__dirname, 'templates');
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    const from = this.configService.getOrThrow<string>('MAIL_FROM');

    await this.transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }

  async sendTemplateMail(options: SendTemplateMailOptions): Promise<void> {
    const html = this.renderTemplate(options.template, options.variables);

    await this.sendMail({
      to: options.to,
      subject: options.subject,
      html,
    });
  }

  private renderTemplate(
    templateName: string,
    variables: Record<string, unknown>,
  ): string {
    const templatePath = path.join(this.templateDir, `${templateName}.html`);

    const template = fs.readFileSync(templatePath, 'utf-8');
    const compiled = Handlebars.compile(template);

    return compiled(variables);
  }
}
