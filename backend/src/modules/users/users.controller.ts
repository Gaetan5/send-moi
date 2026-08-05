import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { UsersService, ApplyAgentDto } from './users.service';
import { AgentStatus } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getProfile(@Param('id') id: string) {
    return this.usersService.getProfile(id);
  }

  @Post('apply-agent')
  async applyAsAgent(@Body() dto: ApplyAgentDto) {
    return this.usersService.applyAsAgent(dto);
  }

  @Patch('agents/:id/status')
  async updateAgentStatus(
    @Param('id') id: string,
    @Body('status') status: AgentStatus,
  ) {
    return this.usersService.updateAgentStatus(id, status);
  }
}
