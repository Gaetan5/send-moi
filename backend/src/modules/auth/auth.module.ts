import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SmsService } from './sms.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret && process.env.NODE_ENV === 'production') {
          throw new Error('🔒 SÉCURITÉ : La variable JWT_SECRET est obligatoire en environnement de production !');
        }
        return {
          secret: secret || 'send_moi_dev_secret_key_2026',
          signOptions: { expiresIn: '30d' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SmsService],
  exports: [AuthService, JwtModule, SmsService],
})
export class AuthModule {}
