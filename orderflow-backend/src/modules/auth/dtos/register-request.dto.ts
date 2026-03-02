import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserRole } from 'generated/prisma/enums';

export class RegisterDto {
  @ApiProperty({
    example: 'Usuario Exemplo',
    description: 'Nome do usuário',
    required: true,
  })
  @IsString({ message: 'O nome deve ser uma string' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  name: string;

  @ApiProperty({
    example: 'Hs6Yk@example.com',
    description: 'Email do usuário',
    required: true,
  })
  @IsEmail(
    { allow_display_name: false },
    { message: 'O email deve ser um endereço de email válido' },
  )
  @IsNotEmpty({ message: 'O email é obrigatório' })
  email: string;

  @ApiProperty({
    example: '11987654321',
    description: 'Telefone do usuário',
    required: false,
  })
  @IsString({ message: 'O telefone deve ser uma string' })
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: '12345678000195',
    description: 'CNPJ do usuário',
    required: false,
  })
  @IsString({ message: 'O CNPJ deve ser uma string' })
  @IsOptional()
  cnpj?: string;

  @ApiProperty({
    example: '12345678901',
    description: 'CNH do usuário',
  })
  @IsString({ message: 'O CNH deve ser uma string' })
  @IsOptional()
  cnh?: string;

  @ApiProperty({
    example: '12345678910',
    description: 'CPF do usuário',
    required: false,
  })
  @IsString({ message: 'O CPF deve ser uma string' })
  @IsOptional()
  cpf?: string;

  @ApiProperty({
    example: '123456',
    description: 'Senha do usuário',
    required: true,
  })
  @IsString({ message: 'A senha deve ser uma string' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  password: string;

  @ApiProperty({
    example: 'CUSTOMER',
    description: 'Role do usuário (CUSTOMER, DRIVER, RESTAURANT, ADMIN)',
    required: true,
    enum: Object.values(UserRole),
  })
  @IsNotEmpty({ message: 'A role é obrigatória' })
  @IsEnum(UserRole, {
    message:
      'A role deve ser um dos valores: CUSTOMER, DRIVER, RESTAURANT ou ADMIN',
  })
  role: UserRole;
}
