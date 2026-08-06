import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../auth/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async checkHealth() {
    let dbStatus = 'UP';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbStatus = 'DOWN';
    }

    return {
      status: dbStatus === 'UP' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      service: 'send-moi-backend',
      database: dbStatus,
      uptimeSeconds: process.uptime(),
    };
  }
}
