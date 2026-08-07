import { Test, TestingModule } from '@nestjs/testing';
import { MissionsService } from './missions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PdfContractService } from '../proofs/pdf-contract.service';
import { MatchingService } from '../matching/matching.service';
import { ProofsService } from '../proofs/proofs.service';
import { Category, City, MissionStatus, EscrowStatus } from '@prisma/client';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('MissionsService (Escrow Engine & Security State Machine)', () => {
  let service: MissionsService;

  const mockPrismaService = {
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
    mission: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    escrowAccount: {
      create: jest.fn(),
      update: jest.fn(),
    },
    missionProof: {
      create: jest.fn(),
    },
    missionMilestone: {
      createMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    missionStatusLog: {
      create: jest.fn(),
    },
    agentProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockPdfContractService = {
    generateAndAttachContract: jest.fn().mockResolvedValue({
      contractHash: 'mock-hash-sha256',
      contractPdfUrl: '/uploads/contracts/mock.pdf',
    }),
  };

  const mockMatchingService = {
    dispatchMission: jest.fn().mockResolvedValue(null),
    findEligibleAgents: jest.fn().mockResolvedValue([]),
  };

  const mockProofsService = {
    generateProofSignature: jest.fn().mockReturnValue('mock-sha256-signature'),
    verifyProofSignature: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MissionsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PdfContractService, useValue: mockPdfContractService },
        { provide: MatchingService, useValue: mockMatchingService },
        { provide: ProofsService, useValue: mockProofsService },
      ],
    }).compile();

    service = module.get<MissionsService>(MissionsService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('createAndHoldEscrow', () => {
    it('devrait créer une mission et calculer 10% de commission de plateforme', async () => {
      const dto = {
        category: Category.SUPERVISION,
        city: City.DOUALA,
        title: 'Inspection Chantier Makepe',
        description: 'Vérifier poteaux R+1',
        categoryPayload: { siteAddress: 'Makepe' },
        priceAmount: 25000,
      };

      mockPrismaService.mission.create.mockResolvedValueOnce({
        id: 'm-1',
        clientId: 'client-1',
        ...dto,
        status: MissionStatus.SOUMISE,
      });

      const mission = await service.createAndHoldEscrow('client-1', dto as any);

      expect(mission.id).toBe('m-1');
      expect(mockPrismaService.escrowAccount.create).toHaveBeenCalledWith({
        data: {
          missionId: 'm-1',
          status: EscrowStatus.HELD,
          amountHeld: 25000,
          agentPayoutAmount: 22500, // 90%
          platformCommissionAmount: 2500, // 10%
        },
      });
      expect(mockPrismaService.missionStatusLog.create).toHaveBeenCalledWith({
        data: {
          missionId: 'm-1',
          fromStatus: MissionStatus.SOUMISE,
          toStatus: MissionStatus.SOUMISE,
          changedByUserId: 'client-1',
        },
      });
      expect(mockMatchingService.dispatchMission).toHaveBeenCalledWith('m-1');
    });

    it('devrait rejeter si la somme des jalons ne fait pas exactement 100%', async () => {
      const dto = {
        category: Category.SUPERVISION,
        city: City.DOUALA,
        title: 'Inspection Chantier',
        description: 'Test',
        categoryPayload: {},
        priceAmount: 50000,
        milestones: [
          { title: 'Jalon 1', percentage: 40 },
          { title: 'Jalon 2', percentage: 50 }, // Total = 90% != 100%
        ],
      };

      await expect(service.createAndHoldEscrow('client-1', dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('assignAgent Security Checks', () => {
    it('devrait rejeter l\'assignation d\'un agent dont le dossier KYC n\'est pas APPROVED', async () => {
      mockPrismaService.mission.findUnique.mockResolvedValueOnce({
        id: 'm-1',
        status: MissionStatus.SOUMISE,
      });
      mockPrismaService.agentProfile.findUnique.mockResolvedValueOnce({
        userId: 'agent-pending',
        status: 'PENDING', // Not approved!
      });

      await expect(service.assignAgent('m-1', 'agent-pending')).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitProof Cryptographic & GPS Verification', () => {
    it('devrait interdire la soumission de preuve par un utilisateur qui n\'est pas l\'agent assigné', async () => {
      mockPrismaService.mission.findUnique.mockResolvedValueOnce({
        id: 'm-1',
        agentId: 'real-agent-123',
        status: MissionStatus.AGENT_ASSIGNE,
      });

      await expect(
        service.submitProof('m-1', 'impostor-agent-999', '/uploads/photo.jpg', 4.05, 9.76),
      ).rejects.toThrow(ForbiddenException);
    });

    it('devrait valider et calculer les indicateurs de vérification GPS et horodatage', async () => {
      mockPrismaService.mission.findUnique.mockResolvedValueOnce({
        id: 'm-1',
        agentId: 'agent-123',
        status: MissionStatus.AGENT_ASSIGNE,
      });

      mockPrismaService.mission.update.mockResolvedValueOnce({
        id: 'm-1',
        status: MissionStatus.PREUVE_SOUMISE,
      });

      const res = await service.submitProof('m-1', 'agent-123', '/uploads/proof.jpg', 4.0511, 9.7679);

      expect(mockProofsService.generateProofSignature).toHaveBeenCalled();
      expect(mockPrismaService.missionProof.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          missionId: 'm-1',
          mediaUrl: '/uploads/proof.jpg',
          latitude: 4.0511,
          longitude: 9.7679,
          isGpsVerified: true,
          isTimestampVerified: true,
          proofSignatureHash: 'mock-sha256-signature',
        }),
      });
      expect(mockPrismaService.missionStatusLog.create).toHaveBeenCalledWith({
        data: {
          missionId: 'm-1',
          fromStatus: MissionStatus.AGENT_ASSIGNE,
          toStatus: MissionStatus.PREUVE_SOUMISE,
          changedByUserId: 'agent-123',
        },
      });
    });
  });

  describe('Milestone Escrow State Guards', () => {
    it('devrait interdire le déblocage de jalon sur une mission en litige ou annulée', async () => {
      mockPrismaService.missionMilestone.findUnique.mockResolvedValueOnce({
        id: 'milestone-1',
        missionId: 'm-1',
        amount: 7500,
        status: EscrowStatus.HELD,
        mission: {
          clientId: 'client-1',
          status: MissionStatus.LITIGE, // Disputed mission!
        },
      });

      await expect(service.releaseMilestoneEscrow('milestone-1', 'client-1')).rejects.toThrow(BadRequestException);
    });
  });
});
