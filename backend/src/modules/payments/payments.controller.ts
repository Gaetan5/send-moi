import { Controller, Post, Body, Param, Query, UseGuards, Headers, UnauthorizedException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentProvider, TransactionStatus, Role } from '@prisma/client';
import { RolesGuard, Roles, Public } from '../auth';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('webhook/:provider')
  async handleWebhook(
    @Headers('x-webhook-secret') webhookSecret: string,
    @Param('provider') providerStr: string,
    @Body('reference') reference: string,
    @Body('status') status: TransactionStatus,
    @Body() payload: any,
  ) {
    const expectedSecret = process.env.WEBHOOK_SECRET;
    if (expectedSecret && webhookSecret !== expectedSecret) {
      throw new UnauthorizedException('🔒 Signature ou secret de Webhook invalide.');
    }
    const provider = providerStr.toUpperCase() === 'ORANGE' ? PaymentProvider.ORANGE_MONEY : PaymentProvider.MTN_MOMO;
    return this.paymentsService.handleMobileMoneyWebhook(reference, provider, status, payload);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('payouts/weekly')
  async triggerWeeklyPayouts(
    @Query('week') weekNumber: number,
    @Query('year') year: number,
  ) {
    const currentWeek = weekNumber || 32;
    const currentYear = year || 2026;
    return this.paymentsService.generateWeeklyPayouts(currentWeek, currentYear);
  }
}
