import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'generated/prisma/enums';

export class RegisterResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: '(11) 98765-4321' })
  phone: string;

  @ApiProperty({ example: UserRole.CUSTOMER })
  role: UserRole;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty({ example: false })
  emailVerified: boolean;

  @ApiProperty({ example: null })
  avatar: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
