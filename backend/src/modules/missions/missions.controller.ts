import { Controller, Get, Post, Body, Param, Query, Patch, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { Category, City, MissionStatus, Role } from '@prisma/client';
import { RolesGuard, Roles } from '../auth';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Post()
  async createMission(@Request() req: any, @Body() dto: CreateMissionDto) {
    const clientId = req.user.id;
    return this.missionsService.createAndHoldEscrow(clientId, dto);
  }

  @Get()
  async getMissions(
    @Request() req: any,
    @Query('city') city?: City,
    @Query('category') category?: Category,
    @Query('status') status?: MissionStatus,
  ) {
    const userId = req.user?.id;
    const role = req.user?.role;
    return this.missionsService.findAll(userId, role, city, category, status);
  }

  @Patch('milestones/:id/release')
  async releaseMilestone(@Request() req: any, @Param('id') milestoneId: string) {
    const clientId = req.user.id;
    return this.missionsService.releaseMilestoneEscrow(milestoneId, clientId);
  }

  @Patch(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async assignAgent(@Param('id') id: string, @Body('agentId') agentId: string) {
    return this.missionsService.assignAgent(id, agentId);
  }

  @Patch(':id/proof')
  async submitProof(
    @Request() req: any,
    @Param('id') id: string,
    @Body('mediaUrl') mediaUrl: string,
    @Body('latitude') latitude: number,
    @Body('longitude') longitude: number,
  ) {
    const agentId = req.user.id;
    return this.missionsService.submitProof(id, agentId, mediaUrl, latitude, longitude);
  }

  @Patch(':id/validate')
  async validateMission(@Request() req: any, @Param('id') id: string) {
    const clientId = req.user.id;
    return this.missionsService.validateAndReleaseEscrow(id, clientId);
  }

  @Patch(':id/reject')
  async rejectMission(@Request() req: any, @Param('id') id: string, @Body('reason') reason: string) {
    const clientId = req.user.id;
    return this.missionsService.rejectProofAndOpenDispute(id, clientId, reason);
  }

  @Patch(':id/refund')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async refundMission(@Param('id') id: string) {
    return this.missionsService.refundEscrowToClient(id);
  }
}
