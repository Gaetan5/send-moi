import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SmsService } from './sms.service';
import { BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
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
    sign: jest.fn().mockReturnValue('mock-jwt-token-123'),
  };

  const mockSmsService = {
    sendSmsOtp: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
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

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  it('devrait envoyer un OTP par SMS avec succès', async () => {
    const result = await service.requestOtp({ phone: '+237699001122' });
    expect(result.message).toContain('succès');
    expect(mockSmsService.sendSmsOtp).toHaveBeenCalled();
  });

  it('devrait lever une exception si l\'envoi du SMS échoue', async () => {
    mockSmsService.sendSmsOtp.mockResolvedValueOnce(false);
    await expect(service.requestOtp({ phone: '+237699001122' })).rejects.toThrow(BadRequestException);
  });

  it('devrait refuser une connexion Google qui usurpe un email existant sans googleId', async () => {
    mockPrismaService.user.findUnique
      .mockResolvedValueOnce(null) // no user by googleId
      .mockResolvedValueOnce({ id: 'existing-user-id', email: 'test@sendmoi.cm', googleId: null }); // email exists without googleId

    await expect(
      service.googleAuth({
        googleId: 'new-google-id',
        email: 'test@sendmoi.cm',
        fullName: 'Test User',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
