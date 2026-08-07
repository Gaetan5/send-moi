import { Test, TestingModule } from '@nestjs/testing';
import { MissionsService } from './missions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PdfContractService } from '../proofs/pdf-contract.service';
import { MatchingService } from '../matching/matching.service';
import { ProofsService } from '../proofs/proofs.service';
import { Category, City, MissionStatus, EscrowStatus } from '@prisma/client';

describe('MissionsService', () => {
  let service: MissionsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
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
    },
    missionStatusLog: {
      create: jest.fn(),
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
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  it('devrait créer une mission et placer les fonds sous séquestre avec commission configurable (10%)', async () => {
    const dto = {
      clientId: 'client-uuid-1',
      category: Category.SUPERVISION,
      city: City.DOUALA,
      title: 'Inspection Chantier Makepe',
      description: 'Vérifier poteaux R+1',
      categoryPayload: { checkpoints: ['poteaux', 'ciment'] },
      priceAmount: 25000,
      commissionRate: 0.10,
      fixedFee: 0,
    };

    mockPrismaService.mission.create.mockResolvedValue({ id: 'mission-uuid-1', ...dto, status: MissionStatus.SOUMISE });
    mockPrismaService.mission.findUnique.mockResolvedValue({
      id: 'mission-uuid-1',
      ...dto,
      status: MissionStatus.SOUMISE,
      escrowAccount: { status: EscrowStatus.HELD, amountHeld: 25000, agentPayoutAmount: 22500, platformCommissionAmount: 2500 },
    });

    const result = await service.createAndHoldEscrow('client-uuid-1', dto);

    expect(result).toBeDefined();
    expect(mockPrismaService.mission.create).toHaveBeenCalled();
    expect(mockPrismaService.escrowAccount.create).toHaveBeenCalledWith({
      data: {
        missionId: 'mission-uuid-1',
        status: EscrowStatus.HELD,
        amountHeld: 25000,
        agentPayoutAmount: 22500,
        platformCommissionAmount: 2500,
      },
    });
  });
});
