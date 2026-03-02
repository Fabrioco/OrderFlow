import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'E-mail do usuário',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  @IsString({ message: 'O e-mail deve ser uma string' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Senha do usuário',
    required: true,
  })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @IsString({ message: 'A senha deve ser uma string' })
  password: string;
}
