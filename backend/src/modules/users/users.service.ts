import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentStatus, Role, City, PaymentProvider } from '@prisma/client';

export interface ApplyAgentDto {
  userId: string;
  cniNumber: string;
  selfieUrl?: string;
  preferredZones: string[];
  momoNumber: string;
  momoProvider: PaymentProvider;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Apply as Independent Agent (Submit KYC info)
   */
  async applyAsAgent(dto: ApplyAgentDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    // Upsert Agent Profile
    const agentProfile = await this.prisma.agentProfile.upsert({
      where: { userId: dto.userId },
      create: {
        userId: dto.userId,
        cniNumber: dto.cniNumber,
        selfieUrl: dto.selfieUrl,
        status: AgentStatus.PENDING,
        preferredZones: dto.preferredZones,
        momoNumber: dto.momoNumber,
        momoProvider: dto.momoProvider,
      },
      update: {
        cniNumber: dto.cniNumber,
        selfieUrl: dto.selfieUrl,
        preferredZones: dto.preferredZones,
        momoNumber: dto.momoNumber,
        momoProvider: dto.momoProvider,
        status: AgentStatus.PENDING,
      },
    });

    // Update User Role to AGENT
    await this.prisma.user.update({
      where: { id: dto.userId },
      data: { role: Role.AGENT },
    });

    return agentProfile;
  }

  /**
   * Admin Approve or Reject Agent Profile
   */
  async updateAgentStatus(agentProfileId: string, status: AgentStatus) {
    const profile = await this.prisma.agentProfile.findUnique({ where: { id: agentProfileId } });
    if (!profile) throw new NotFoundException('Profil agent introuvable.');

    return this.prisma.agentProfile.update({
      where: { id: agentProfileId },
      data: { status },
      include: { user: true },
    });
  }

  /**
   * Get User Profile with Agent details
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { agentProfile: true },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    return user;
  }
}
