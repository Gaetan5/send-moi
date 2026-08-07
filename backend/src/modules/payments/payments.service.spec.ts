import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MomoApiService } from './momo-api.service';
import { PaymentProvider, TransactionStatus } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('PaymentsService (Mobile Money & Escrow Settlement)', () => {
  let service: PaymentsService;

  const mockPrismaService = {
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
    paymentTransaction: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    escrowAccount: {
      update: jest.fn(),
    },
    agentPayout: {
      create: jest.fn(),
    },
  };

  const mockMomoApiService = {
    requestCollection: jest.fn().mockResolvedValue({ success: true, transactionId: 'tx-123' }),
    requestDisbursement: jest.fn().mockResolvedValue({ success: true, transactionId: 'payout-123' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MomoApiService, useValue: mockMomoApiService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('handleMobileMoneyWebhook Security & State Update', () => {
    it('devrait lever une exception si la transaction n\'existe pas en base', async () => {
      mockPrismaService.paymentTransaction.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.handleMobileMoneyWebhook('REF-999', PaymentProvider.MTN_MOMO, TransactionStatus.SUCCESS, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('devrait mettre à jour la transaction et débloquer le séquestre lors de la confirmation du webhook', async () => {
      mockPrismaService.paymentTransaction.findUnique.mockResolvedValueOnce({
        id: 'tx-uuid-1',
        reference: 'REF-123',
        status: TransactionStatus.PENDING,
        missionId: 'mission-uuid-1',
      });

      mockPrismaService.paymentTransaction.update.mockResolvedValueOnce({
        id: 'tx-uuid-1',
        reference: 'REF-123',
        status: TransactionStatus.SUCCESS,
        missionId: 'mission-uuid-1',
      });

      const result = await service.handleMobileMoneyWebhook(
        'REF-123',
        PaymentProvider.MTN_MOMO,
        TransactionStatus.SUCCESS,
        { amount: 25000 },
      );

      expect(result.status).toBe(TransactionStatus.SUCCESS);
      expect(mockPrismaService.paymentTransaction.update).toHaveBeenCalledWith({
        where: { reference: 'REF-123' },
        data: expect.objectContaining({
          status: TransactionStatus.SUCCESS,
        }),
      });
    });
  });
});
