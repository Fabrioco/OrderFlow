import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { NoAuthService } from './no-auth.service';

@ApiTags('Sem Autenticação')
@Controller('no-auth')
export class NoAuthController {
  constructor(private readonly service: NoAuthService) {}

  @Post('forgot-password')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
      },
    },
  })
  async forgotPassword(@Body('email') email: string): Promise<void> {
    await this.service.forgotPassword(email);
  }

  @Post('reset-password')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        token: { type: 'string', example: '123456' },
        newPassword: { type: 'string', example: '123456' },
        confirmNewPassword: { type: 'string', example: '123456' },
      },
    },
  })
  async resetPassword(
    @Body('email') email: string,
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
    @Body('confirmNewPassword') confirmNewPassword: string,
  ): Promise<void> {
    if (newPassword !== confirmNewPassword) {
      throw new UnauthorizedException('As senhas devem ser iguais');
    }
    await this.service.resetPassword(email, token, newPassword);
  }
}
