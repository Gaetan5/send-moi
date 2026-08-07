import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestOtpDto, VerifyOtpDto, GoogleAuthDto } from './dto/auth.dto';
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
   * Request OTP code via SMS
   */
  async requestOtp(dto: RequestOtpDto) {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    this.otpCache.set(dto.phone, { code, expiresAt });

    // Trigger SMS dispatch
    const isSent = await this.smsService.sendSmsOtp(dto.phone, code);
    if (!isSent) {
      this.otpCache.delete(dto.phone);
      throw new BadRequestException("❌ Échec de l'expédition du SMS. Veuillez vérifier votre numéro et réessayez.");
    }

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

    // Development master mode strictly if DEV_MASTER_OTP is configured and non-production
    const devMasterCode = process.env.DEV_MASTER_OTP;
    const isDevMasterMode =
      process.env.NODE_ENV !== 'production' &&
      devMasterCode &&
      devMasterCode.length >= 6 &&
      dto.code === devMasterCode;

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

  /**
   * Authenticate or register user via Google OAuth / Email
   */
  async googleAuth(dto: GoogleAuthDto) {
    if (!dto.googleId) {
      throw new BadRequestException('googleId est requis pour l\'authentification Google.');
    }

    let user = await this.prisma.user.findUnique({
      where: { googleId: dto.googleId },
    });

    if (!user && dto.email) {
      const existingEmailUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingEmailUser) {
        if (!existingEmailUser.googleId) {
          // Do NOT automatically hijack account: require user to log in via phone OTP first to bind Google
          throw new BadRequestException(
            'Un compte existe déjà avec cet email. Veuillez vous connecter avec votre numéro de téléphone pour lier votre compte Google.'
          );
        }
        user = existingEmailUser;
      }
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          googleId: dto.googleId,
          email: dto.email,
          fullName: dto.fullName || 'Utilisateur Google',
          avatarUrl: dto.avatarUrl,
          role: Role.CLIENT,
        },
      });
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        city: user.city,
      },
    };
  }
}
