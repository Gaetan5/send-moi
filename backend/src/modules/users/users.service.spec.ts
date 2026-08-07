import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    agentProfile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    mission: {
      count: jest.fn().mockResolvedValue(5),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  it('devrait lever une exception si l\'utilisateur est introuvable', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);
    await expect(service.getProfile('invalid-id', { id: 'caller-id', role: Role.CLIENT })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('devrait anonymiser les données sensibles KYC si l\'appelant n\'est ni propriétaire ni admin', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'target-id',
      fullName: 'Agent Douala',
      role: Role.AGENT,
      agentProfile: {
        cniNumber: '118293849',
        momoNumber: '+237699001122',
        status: 'APPROVED',
      },
    });

    const result = await service.getProfile('target-id', { id: 'other-user-id', role: Role.CLIENT });

    expect(result.agentProfile.cniNumber).toContain('***');
    expect(result.agentProfile.momoNumber).toContain('***');
  });
});
