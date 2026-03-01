import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { BcryptStrategy } from './strategies/bcrypt.strategy';
import { MailModule } from '../../infrastructure/mail/mail.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, BcryptStrategy, JwtStrategy],
  imports: [PrismaModule, MailModule],
})
export class AuthModule {}
