import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

@Injectable()
export class MailService {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const user = this.config.get<string>('EMAIL_FROM');
    const pass = this.config.get<string>('GOOGLE_PASS');

    if (!user || !pass) {
      throw new Error('Missing email credentials');
    }

    this.from = user;

    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST') ?? 'smtp.gmail.com',
      port: Number(this.config.get<number>('SMTP_PORT') ?? 587),
      secure: false,
      auth: { user, pass },
    });
  }

  private compileTemplate(
    templateName: string,
    context: Record<string, any>,
  ): string {
    const isDev = process.env.NODE_ENV !== 'production';

    const basePath = isDev
      ? path.join(process.cwd(), 'src')
      : path.join(process.cwd(), 'dist');

    const templatePath = path.join(
      basePath,
      'infrastructure',
      'mail',
      'templates',
      `${templateName}.hbs`,
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template ${templateName} not found at ${templatePath}`);
    }

    const source = fs.readFileSync(templatePath, 'utf8');
    return handlebars.compile(source)(context);
  }

  async sendMail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>,
  ): Promise<void> {
    try {
      const html = this.compileTemplate(template, context);

      await this.transporter.sendMail({
        from: `"OrderFlow" <${this.from}>`,
        to,
        subject,
        html,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error sending email:', error.message);
        throw new InternalServerErrorException('Erro ao enviar e-mail');
      }

      throw new InternalServerErrorException(
        'Erro desconhecido ao enviar e-mail',
      );
    }
  }

  async sendWelcomeEmail(email: string, name: string) {
    console.log(
      `Enviando e-mail de boas-vindas para ${email} com nome ${name}`,
    );
    await this.sendMail(email, 'Bem-vindo ao OrderFlow', 'welcome', {
      name,
      year: new Date().getFullYear(),
      confirmationUrl: `${this.config.get(
        'FRONTEND_URL',
      )}/confirm-email?email=${email}`,
    });
  }
}
