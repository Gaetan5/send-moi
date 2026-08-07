import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MissionsModule } from './modules/missions/missions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { StorageModule } from './modules/storage/storage.module';
import { MatchingService } from './modules/matching/matching.service';
import { ProofsService } from './modules/proofs/proofs.service';
import { RealtimeGateway } from './gateways/realtime.gateway';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { HealthController } from './modules/health/health.controller';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 20, // 20 requests per minute max per IP
    }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    MissionsModule,
    PaymentsModule,
    OrganizationsModule,
    StorageModule,
  ],
  controllers: [HealthController, AppController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    MatchingService,
    ProofsService,
    RealtimeGateway,
  ],
})
export class AppModule {}
