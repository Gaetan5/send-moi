import { Module } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';
import { StorageModule } from '../storage/storage.module';
import { PdfContractService } from '../proofs/pdf-contract.service';
import { MatchingService } from '../matching/matching.service';
import { ProofsService } from '../proofs/proofs.service';

@Module({
  imports: [StorageModule],
  controllers: [MissionsController],
  providers: [MissionsService, PdfContractService, MatchingService, ProofsService],
  exports: [MissionsService, PdfContractService, MatchingService, ProofsService],
})
export class MissionsModule {}
