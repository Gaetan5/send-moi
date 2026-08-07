import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentProvider, TransactionType, TransactionStatus, EscrowStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Process Incoming Mobile Money Webhook Notification
   */
  async handleMobileMoneyWebhook(
    reference: string,
    provider: PaymentProvider,
    status: TransactionStatus,
    rawPayload: any,
  ) {
    this.logger.log(`Webhook MoMo reçu [${provider}] Ref: ${reference} Statut: ${status}`);

    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { reference },
      include: { mission: true },
    });

    if (!transaction) {
      this.logger.error(`Transaction non trouvée pour référence ${reference}`);
      throw new NotFoundException(`Transaction non trouvée pour la référence ${reference}`);
    }

    // Verify Amount Match if payload contains amount
    if (rawPayload && rawPayload.amount && transaction.mission) {
      const paidAmount = parseFloat(rawPayload.amount);
      if (paidAmount !== transaction.mission.totalClientPaid) {
        this.logger.error(
          `⚠️ Anomalie de montant ! Attendu: ${transaction.mission.totalClientPaid}, Reçu: ${paidAmount}`,
        );
        return this.prisma.paymentTransaction.update({
          where: { reference },
          data: {
            status: TransactionStatus.FAILED,
            rawResponse: { error: 'Montant incohérent avec la commande', rawPayload },
          },
        });
      }
    }

    return this.prisma.paymentTransaction.update({
      where: { reference },
      data: {
        status,
        rawResponse: rawPayload,
      },
    });
  }

  /**
   * Execute Weekly Payout Batch for Verified Independent Agents
   */
  async generateWeeklyPayouts(weekNumber: number, year: number) {
    this.logger.log(`Génération du batch de reversement hebdomadaire Semaine ${weekNumber} / ${year}`);

    // Fetch released escrow accounts not yet paid out
    const releasedEscrows = await this.prisma.escrowAccount.findMany({
      where: { status: EscrowStatus.RELEASED },
      include: { mission: { include: { agent: { include: { agentProfile: true } } } } },
    });

    const agentTotals = new Map<string, number>();

    for (const escrow of releasedEscrows) {
      const agentProfileId = escrow.mission.agent?.agentProfile?.id;
      if (agentProfileId) {
        const current = agentTotals.get(agentProfileId) || 0;
        agentTotals.set(agentProfileId, current + escrow.agentPayoutAmount);
      }
    }

    const createdPayouts = [];
    for (const [agentId, totalAmount] of agentTotals.entries()) {
      const payout = await this.prisma.weeklyPayout.create({
        data: {
          agentId,
          weekNumber,
          year,
          totalAmount,
          status: TransactionStatus.PENDING,
        },
      });
      createdPayouts.push(payout);
    }

    return createdPayouts;
  }
}
