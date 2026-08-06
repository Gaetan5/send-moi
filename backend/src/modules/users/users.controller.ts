import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService, ApplyAgentDto } from './users.service';
import { AgentStatus, Role } from '@prisma/client';
import { RolesGuard, Roles } from '../auth';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getProfile(@Request() req: any, @Param('id') id: string) {
    return this.usersService.getProfile(id, req.user);
  }

  @Post('apply-agent')
  async applyAsAgent(@Body() dto: ApplyAgentDto) {
    return this.usersService.applyAsAgent(dto);
  }

  @Patch('agents/:id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateAgentStatus(
    @Param('id') id: string,
    @Body('status') status: AgentStatus,
  ) {
    return this.usersService.updateAgentStatus(id, status);
  }
}
