import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RegisterDto } from './dtos/register-request.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole, VehicleType } from 'generated/prisma/enums';
import { LoginDto } from './dtos/login.dto';
import { JwtStrategy } from './strategies/jwt.strategy';
import { BcryptStrategy } from './strategies/bcrypt.strategy';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { MailService } from '../../infrastructure/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcrypt: BcryptStrategy,
    private readonly jwt: JwtStrategy,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const { email, password, name, phone, role, cnh, cnpj, cpf } = dto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Usuário com este e-mail já existe');
    }

    const hashedPassword = await this.bcrypt.hashPassword(password);

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
        omit: {
          password: true,
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

        await this.mail.sendWelcomeEmail(email, name);

        return user;
      } catch (error) {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new UnprocessableEntityException(
            'E-mail ou CPF/CNPJ ja cadastrado',
          );
        }
        throw error;
      }
    });
  }

  async confirmEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException('E-mail não encontrado');
    }
    return this.prisma.user.update({
      where: { email },
      data: { status: 'ACTIVE' },
    });
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        driver: true,
        restaurant: true,
        customer: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnprocessableEntityException('E-mail não verificado');
    }

    const isPasswordValid = await this.bcrypt.comparePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnprocessableEntityException('Senha incorreta');
    }

    const token = this.jwt.createToken(user.id, user.role);

    return { user: { ...user, password: undefined }, token };
  }
}
