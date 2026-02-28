import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }
  async onModuleInit() {
    await this.$connect();
    console.log('Connected to the database');
  }

  enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit' as never, () => {
      void app.close();
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Disconnected from the database');
  }
}
