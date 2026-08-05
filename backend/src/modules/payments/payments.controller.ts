import { Controller, Post, Body, Param, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentProvider, TransactionStatus } from '@prisma/client';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook/:provider')
  async handleWebhook(
    @Param('provider') providerStr: string,
    @Body('reference') reference: string,
    @Body('status') status: TransactionStatus,
    @Body() payload: any,
  ) {
    const provider = providerStr.toUpperCase() === 'ORANGE' ? PaymentProvider.ORANGE_MONEY : PaymentProvider.MTN_MOMO;
    return this.paymentsService.handleMobileMoneyWebhook(reference, provider, status, payload);
  }

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
