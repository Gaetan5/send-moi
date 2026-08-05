import { Controller, Get, Post, Body, Param, Query, Patch } from '@nestjs/common';
import { MissionsService, CreateMissionDto } from './missions.service';
import { Category, City, MissionStatus } from '@prisma/client';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Post()
  async createMission(@Body() dto: CreateMissionDto) {
    return this.missionsService.createAndHoldEscrow(dto);
  }

  @Get()
  async getMissions(
    @Query('city') city?: City,
    @Query('category') category?: Category,
    @Query('status') status?: MissionStatus,
  ) {
    return this.missionsService.findAll(city, category, status);
  }

  @Patch(':id/assign')
  async assignAgent(@Param('id') id: string, @Body('agentId') agentId: string) {
    return this.missionsService.assignAgent(id, agentId);
  }

  @Patch(':id/proof')
  async submitProof(
    @Param('id') id: string,
    @Body('mediaUrl') mediaUrl: string,
    @Body('latitude') latitude: number,
    @Body('longitude') longitude: number,
  ) {
    return this.missionsService.submitProof(id, mediaUrl, latitude, longitude);
  }

  @Patch(':id/validate')
  async validateMission(@Param('id') id: string) {
    return this.missionsService.validateAndReleaseEscrow(id);
  }

  @Patch(':id/reject')
  async rejectMission(@Param('id') id: string, @Body('reason') reason: string) {
    return this.missionsService.rejectProofAndOpenDispute(id, reason);
  }

  @Patch(':id/refund')
  async refundMission(@Param('id') id: string) {
    return this.missionsService.refundEscrowToClient(id);
  }
}
