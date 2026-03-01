import { Body, Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Post } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RegisterDto } from './dtos/register-request.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  @ApiBody({ type: RegisterDto })
  @ApiConflictResponse({ description: 'Usuário com este e-mail já existe' })
  @ApiOkResponse({ description: 'Usuário registrado com sucesso' })
  async register(@Body() dto: RegisterDto) {
    return this.service.register(dto);
  }
}
