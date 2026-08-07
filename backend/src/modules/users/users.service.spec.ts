import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('UsersService (IDOR Protection & KYC Privacy)', () => {
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
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
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

  describe('getProfile Privacy Controls (Anti-IDOR)', () => {
    it('devrait lever une exception si l\'utilisateur cible n\'existe pas', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      await expect(service.getProfile('invalid-id', { id: 'caller-id', role: Role.CLIENT })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devrait anonymiser les numéros CNI et MoMo pour un utilisateur tierce partie non administrateur', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'agent-1',
        fullName: 'Agent Douala',
        role: Role.AGENT,
        agentProfile: {
          cniNumber: '118293849',
          momoNumber: '+237699001122',
          status: 'APPROVED',
          trustScore: 85.0,
        },
      });

      mockPrismaService.agentProfile.findUnique.mockResolvedValueOnce({
        status: 'APPROVED',
        trustScore: 85.0,
      });

      mockPrismaService.mission.count.mockResolvedValue(10);

      const result = await service.getProfile('agent-1', { id: 'other-user-client', role: Role.CLIENT });

      expect(result.agentProfile.cniNumber).toBe('*****3849');
      expect(result.agentProfile.momoNumber).toBe('*****1122');
    });

    it('devrait afficher les données CNI et MoMo en clair pour le propriétaire du compte', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'agent-owner',
        fullName: 'Agent Douala',
        role: Role.AGENT,
        agentProfile: {
          cniNumber: '118293849',
          momoNumber: '+237699001122',
          status: 'APPROVED',
          trustScore: 85.0,
        },
      });

      mockPrismaService.agentProfile.findUnique.mockResolvedValueOnce({
        status: 'APPROVED',
        trustScore: 85.0,
      });

      mockPrismaService.mission.count.mockResolvedValue(10);

      const result = await service.getProfile('agent-owner', { id: 'agent-owner', role: Role.AGENT });

      expect(result.agentProfile.cniNumber).toBe('118293849');
      expect(result.agentProfile.momoNumber).toBe('+237699001122');
    });
  });

  describe('applyAsAgent KYC Validation', () => {
    it('devrait créer/mettre à jour un profil agent au statut PENDING', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: 'user-1', role: Role.CLIENT });
      mockPrismaService.agentProfile.upsert.mockResolvedValueOnce({
        id: 'prof-1',
        userId: 'user-1',
        cniNumber: '118293849',
        status: 'PENDING',
      });

      const res = await service.applyAsAgent({
        userId: 'user-1',
        cniNumber: '118293849',
        momoNumber: '+237699001122',
        momoProvider: 'MTN_MOMO' as any,
        preferredZones: ['Akwa'],
      });

      expect(res.status).toBe('PENDING');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: Role.AGENT },
      });
    });
  });
});
