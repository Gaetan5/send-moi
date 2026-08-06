import { Module } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';
import { StorageModule } from '../storage/storage.module';
import { PdfContractService } from '../proofs/pdf-contract.service';

@Module({
  imports: [StorageModule],
  controllers: [MissionsController],
  providers: [MissionsService, PdfContractService],
  exports: [MissionsService, PdfContractService],
})
export class MissionsModule {}
