import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MailService } from 'src/infrastructure/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BcryptStrategy } from '../auth/strategies/bcrypt.strategy';

@Injectable()
export class NoAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly bcrypt: BcryptStrategy,
  ) {}

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.status === 'PENDING') {
      throw new ConflictException('Usuário ainda não foi ativado');
    }

    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const resetToken = Array(6)
      .fill(0)
      .map(() =>
        characters.charAt(Math.floor(Math.random() * characters.length)),
      )
      .join('');
    const expiresAt = new Date(Date.now() + 3600000);

    await this.prisma.user.update({
      where: { email },
      data: { resetToken, expiresAt },
    });

    await this.mail.sendPasswordResetEmail(email, user.name, resetToken);
  }

  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.resetToken !== token) {
      throw new ConflictException('Token inválido');
    }

    if (user.expiresAt! < new Date()) {
      throw new ConflictException('Token expirado');
    }

    const hashedPassword = await this.bcrypt.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetToken: null,
        expiresAt: null,
      },
    });
  }
}
