import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SmsService } from './sms.service';
import { BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('AuthService (Security & Penetration Testing)', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('jwt-token-sec-999'),
  };

  const mockSmsService = {
    sendSmsOtp: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
    delete process.env.DEV_MASTER_OTP;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: SmsService, useValue: mockSmsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('requestOtp & SMS Pipeline', () => {
    it('devrait générer un OTP 6 chiffres et demander l\'expédition SMS', async () => {
      const res = await service.requestOtp({ phone: '+237699001122' });
      expect(res.phone).toBe('+237699001122');
      expect(mockSmsService.sendSmsOtp).toHaveBeenCalledWith('+237699001122', expect.stringMatching(/^\d{6}$/));
    });

    it('devrait bloquer et lever BadRequestException en cas d\'échec de l\'API SMS', async () => {
      mockSmsService.sendSmsOtp.mockResolvedValueOnce(false);
      await expect(service.requestOtp({ phone: '+237699001122' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyOtp Security Controls', () => {
    it('devrait valider l\'OTP correct et délivrer un jeton JWT', async () => {
      await service.requestOtp({ phone: '+237699001122' });
      const generatedCode = mockSmsService.sendSmsOtp.mock.calls[0][1];

      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'u-1',
        phone: '+237699001122',
        role: Role.CLIENT,
      });

      const authRes = await service.verifyOtp({ phone: '+237699001122', code: generatedCode });
      expect(authRes.accessToken).toBe('jwt-token-sec-999');
      expect(authRes.user.phone).toBe('+237699001122');
    });

    it('devrait rejeter un OTP incorrect (Tentative de Brute Force)', async () => {
      await service.requestOtp({ phone: '+237699001122' });
      await expect(service.verifyOtp({ phone: '+237699001122', code: '000000' })).rejects.toThrow(BadRequestException);
    });

    it('devrait interdire le code backdoor hardcodé 123456', async () => {
      await service.requestOtp({ phone: '+237699001122' });
      await expect(service.verifyOtp({ phone: '+237699001122', code: '123456' })).rejects.toThrow(BadRequestException);
    });

    it('devrait autoriser DEV_MASTER_OTP uniquement en mode non-production si configuré', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DEV_MASTER_OTP = '999888';

      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'u-dev',
        phone: '+237699001122',
        role: Role.CLIENT,
      });

      const res = await service.verifyOtp({ phone: '+237699001122', code: '999888' });
      expect(res.accessToken).toBeDefined();
    });

    it('devrait REFUSER DEV_MASTER_OTP en environnement de production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DEV_MASTER_OTP = '999888';

      await expect(service.verifyOtp({ phone: '+237699001122', code: '999888' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('googleAuth Account Hijacking Protections', () => {
    it('devrait exiger un googleId non vide', async () => {
      await expect(service.googleAuth({ googleId: '', email: 'test@sendmoi.cm', fullName: 'Test User' })).rejects.toThrow(BadRequestException);
    });

    it('devrait créer un nouvel utilisateur Google si aucun conflit n\'existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValueOnce({
        id: 'g-user-1',
        googleId: 'g-12345',
        email: 'new@sendmoi.cm',
        fullName: 'Jean Google',
        role: Role.CLIENT,
      });

      const res = await service.googleAuth({
        googleId: 'g-12345',
        email: 'new@sendmoi.cm',
        fullName: 'Jean Google',
      });

      expect(res.user.email).toBe('new@sendmoi.cm');
    });

    it('devrait bloquer la liaison automatique par email pour prévenir l\'usurpation de compte existant sans Google ID', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // no user by googleId
        .mockResolvedValueOnce({ id: 'victim-id', email: 'victime@sendmoi.cm', googleId: null }); // existing account without googleId

      await expect(
        service.googleAuth({
          googleId: 'attacker-google-id',
          email: 'victime@sendmoi.cm',
          fullName: 'Attaquant',
        }),
      ).rejects.toThrow('Un compte existe déjà avec cet email.');
    });
  });
});
