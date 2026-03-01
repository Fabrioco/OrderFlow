import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { BcryptStrategy } from './strategies/bcrypt.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, BcryptStrategy, JwtStrategy],
  imports: [PrismaModule],
})
export class AuthModule {}
