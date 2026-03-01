import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RegisterDto } from './dtos/register-request.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole, VehicleType } from 'generated/prisma/enums';
import { sendEmail } from 'src/utils/send-email.util';
import { LoginDto } from './dtos/login.dto';
import { JwtStrategy } from './strategies/jwt.strategy';
import { BcryptStrategy } from './strategies/bcrypt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcrypt: BcryptStrategy,
    private readonly jwt: JwtStrategy,
  ) {}

  async register(dto: RegisterDto) {
    const { email, password, name, phone, role, cnh, cnpj, cpf } =
      dto as RegisterDto;

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
          `<!DOCTYPE html>
            <html>
              <body style="margin:0;padding:0;background:#0b1220;font-family:Arial,Helvetica,sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0"
                        style="background:#0f172a;border-radius:12px;padding:40px;border:1px solid #1e293b;">
                        
                        <!-- Header -->
                        <tr>
                          <td align="center" style="padding-bottom:30px;">
                            <h1 style="margin:0;font-size:26px;color:#FF6B35;font-weight:bold">
                              OrderFlow
                            </h1>
                            <span style="font-size:14px;color:#94a3b8;">
                              Restaurante e Delivery Management System
                            </span>
                          </td>
                        </tr>

                        <!-- Main Card -->
                        <tr>
                          <td style="background:#111827;border-radius:10px;padding:30px;border:1px solid #1f2937;">
                            
                            <h2 style="margin:0 0 16px 0;color:#ffffff;font-size:20px;">
                              Bem-vindo, <span style="color: #FF6B35;">${name}</span>
                            </h2>

                            <p style="margin:0 0 20px 0;color:#cbd5e1;font-size:15px;line-height:1.6;">
                              Sua conta foi criada com sucesso no <strong style="color: #FF6B35">OrderFlow</strong>.
                              Para começar a gerenciar pedidos em tempo real,
                              confirme seu e-mail clicando no botão abaixo.
                            </p>

                            <div style="text-align:center;margin:30px 0;">
                              <a href="http://127.0.0.1:5500/confirmar-email.html?email=${email}"
                                style="background: #FF6B35;
                                        color:#ffffff;
                                        text-decoration:none;
                                        padding:14px 26px;
                                        border-radius:8px;
                                        font-weight:bold;
                                        display:inline-block;">
                                Confirmar minha conta
                              </a>
                            </div>

                            <p style="margin:0;color:#64748b;font-size:13px;">
                              Se você não criou essa conta, ignore este email.
                            </p>

                          </td>
                        </tr>

                        <!-- Divider -->
                        <tr>
                          <td style="padding:30px 0 0 0;">
                            <hr style="border:none;border-top:1px solid #1e293b;">
                          </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                          <td align="center" style="padding-top:20px;">
                            <p style="margin:0;font-size:12px;color:#64748b;">
                              © ${new Date().getFullYear()} OrderFlow — Sistema de Gestão de Pedidos
                            </p>
                          </td>
                        </tr>

                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html> `,
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
    const { email, password } = dto as LoginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
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

    const { password: _, ...userWithoutPassword } = user;

    const token = this.jwt.createToken(user.id, user.role);

    return { ...userWithoutPassword, token };
  }
}
