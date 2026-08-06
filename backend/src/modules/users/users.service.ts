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
   * Get User Profile with Agent details (Sanitized for non-owners)
   */
  async getProfile(targetUserId: string, requestingUser?: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { agentProfile: true },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    const isOwner = requestingUser && requestingUser.id === targetUserId;
    const isAdmin = requestingUser && requestingUser.role === Role.ADMIN;

    if (!isOwner && !isAdmin && user.agentProfile) {
      const trustScore = await this.calculateAgentTrustScore(user.agentProfile.userId);
      // Sanitize sensitive KYC data
      return {
        ...user,
        agentProfile: {
          id: user.agentProfile.id,
          userId: user.agentProfile.userId,
          status: user.agentProfile.status,
          rating: user.agentProfile.rating,
          trustScore: trustScore,
          preferredZones: user.agentProfile.preferredZones,
          // Mask CNI and MoMo number for privacy
          cniNumber: '***',
          momoNumber: '***',
        },
      };
    }

    return user;
  }

  /**
   * Calculate TrustScore (Weighted score out of 100 based on rating, no-dispute rate and GPS compliance)
   */
  async calculateAgentTrustScore(agentUserId: string): Promise<number> {
    const profile = await this.prisma.agentProfile.findUnique({ where: { userId: agentUserId } });
    if (!profile) return 50.0; // Default base score

    const totalMissions = await this.prisma.mission.count({ where: { agentId: agentUserId } });
    if (totalMissions === 0) return 80.0; // Starting score for new verified agent

    const disputeMissions = await this.prisma.mission.count({
      where: { agentId: agentUserId, status: 'LITIGE' },
    });

    const successfulMissions = await this.prisma.mission.count({
      where: { agentId: agentUserId, status: { in: ['VALIDEE_PAR_CLIENT', 'PAYEE', 'CLOTUREE'] } },
    });

    const disputeFreeRate = ((totalMissions - disputeMissions) / totalMissions) * 100;
    const ratingScore = (profile.rating / 5.0) * 100;

    // TrustScore formula: 50% Rating + 50% Dispute-Free Rate
    const trustScore = Math.round((ratingScore * 0.5 + disputeFreeRate * 0.5) * 10) / 10;
    return trustScore;
  }
}
