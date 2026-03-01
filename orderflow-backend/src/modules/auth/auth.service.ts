import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RegisterDto } from './dtos/register-request.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole, VehicleType } from 'generated/prisma/enums';
import { sendEmail } from 'src/utils/send-email.util';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const { email, password, name, phone, role, cnh, cnpj, cpf } =
      dto as RegisterDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Usuário com este e-mail já existe');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          role,
          password: hashedPassword,
          status: 'PENDING',
        },
      });

      try {
        if (role === UserRole.DRIVER) {
          await tx.driver.create({
            data: {
              userId: user.id,
              cnh: cnh!,
              cpf: cpf!,
              vehicleType: VehicleType.MOTORCYCLE,
            },
          });
        } else if (role === UserRole.RESTAURANT) {
          await tx.restaurant.create({
            data: {
              userId: user.id,
              name,
              cnpj: cnpj!,
              slug: name.toLowerCase().trim().replace(/\s+/g, '-'),
              category: 'Geral',
              phone: phone || '',
              address: 'Endereço não informado',
            },
          });
        } else if (role === UserRole.CUSTOMER) {
          await tx.customer.create({
            data: {
              userId: user.id,
            },
          });
        }

        await sendEmail(
          email,
          'Bem-vindo ao OrderFlow!',
          `Olá ${name},\n\nObrigado por se registrar no OrderFlow! Estamos animados para tê-lo conosco.\n\nPara verificar sua conta, acesse o link abaixo:\n\nhttp://127.0.0.1:5500/confirmar-email.html?email=${email}\n\nAtenciosamente,\nEquipe OrderFlow`,
        );

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      } catch (error) {
        console.log(error);
        throw new UnprocessableEntityException(
          'Erro ao criar perfil detalhado: ' + error.message,
        );
      }
    });
  }
}
