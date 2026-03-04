import { Module } from '@nestjs/common';
import { NoAuthController } from './no-auth.controller';
import { NoAuthService } from './no-auth.service';
import { MailService } from 'src/infrastructure/mail/mail.service';
import { BcryptStrategy } from '../auth/strategies/bcrypt.strategy';

@Module({
  controllers: [NoAuthController],
  providers: [NoAuthService, MailService, BcryptStrategy],
})
export class NoAuthModule {}
