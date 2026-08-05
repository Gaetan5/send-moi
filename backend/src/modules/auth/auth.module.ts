import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SmsService } from './sms.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'send_moi_secret_key_2026',
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SmsService],
  exports: [AuthService, JwtModule, SmsService],
})
export class AuthModule {}
