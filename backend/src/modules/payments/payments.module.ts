import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MomoApiService } from './momo-api.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, MomoApiService],
  exports: [PaymentsService, MomoApiService],
})
export class PaymentsModule {}
