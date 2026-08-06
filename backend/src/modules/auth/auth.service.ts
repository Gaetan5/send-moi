import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';
import { Role } from '@prisma/client';
import { SmsService } from './sms.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // OTP Memory Store for dev/MVP (Can be backed by Redis in production)
  private readonly otpCache = new Map<string, { code: string; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
  ) {}

  /**
   * Request OTP code via SMS (simulated for dev / Twilio interface)
   */
  async requestOtp(dto: RequestOtpDto) {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    this.otpCache.set(dto.phone, { code, expiresAt });

    // Trigger SMS dispatch
    await this.smsService.sendSmsOtp(dto.phone, code);

    return {
      message: 'Code OTP envoyé par SMS avec succès',
      phone: dto.phone,
    };
  }

  /**
   * Verify OTP code and issue JWT Access Token
   */
  async verifyOtp(dto: VerifyOtpDto) {
    const cached = this.otpCache.get(dto.phone);

    // Development backdoor allowed strictly in non-production mode if enabled via DEV_MASTER_OTP
    const isDevMasterMode = process.env.NODE_ENV !== 'production' && process.env.DEV_MASTER_OTP === dto.code;

    if (!cached && !isDevMasterMode) {
      throw new BadRequestException('Code OTP expiré ou non demandé.');
    }

    if (cached && cached.code !== dto.code && !isDevMasterMode) {
      throw new BadRequestException('Code OTP invalide.');
    }

    if (cached) {
      this.otpCache.delete(dto.phone);
    }

    // Upsert User
    let user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone: dto.phone,
          fullName: `Utilisateur ${dto.phone.slice(-4)}`,
          role: Role.CLIENT,
        },
      });
    }

    this.otpCache.delete(dto.phone);

    const payload = { sub: user.id, phone: user.phone, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        city: user.city,
      },
    };
  }
}
