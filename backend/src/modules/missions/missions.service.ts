import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Category, City, MissionStatus, EscrowStatus } from '@prisma/client';

export interface CreateMissionDto {
  clientId: string;
  category: Category;
  city: City;
  title: string;
  description: string;
  categoryPayload: any;
  priceAmount: number; // Base service price
  fixedFee?: number;   // Configurable operational fee
  commissionRate?: number; // Configurable commission rate (e.g., 0.10 = 10%)
}

@Injectable()
export class MissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. Create Mission & Hold Funds in Escrow (Paid immediately upon order validation)
   */
  async createAndHoldEscrow(dto: CreateMissionDto) {
    const commissionRate = dto.commissionRate ?? 0.10; // Default 10%
    const fixedFee = dto.fixedFee ?? 0;
    const platformCommission = (dto.priceAmount * commissionRate) + fixedFee;
    const agentPayoutAmount = dto.priceAmount - (dto.priceAmount * commissionRate);
    const totalClientPaid = dto.priceAmount + fixedFee;

    // Create Mission and Escrow Account in a transaction
    return this.prisma.$transaction(async (tx) => {
      const mission = await tx.mission.create({
        data: {
          clientId: dto.clientId,
          category: dto.category,
          city: dto.city,
          title: dto.title,
          description: dto.description,
          categoryPayload: dto.categoryPayload,
          priceAmount: dto.priceAmount,
          commissionRate,
          fixedFee,
          totalClientPaid,
          status: MissionStatus.SOUMISE,
        },
      });

      // Create Escrow Account with Held status
      await tx.escrowAccount.create({
        data: {
          missionId: mission.id,
          status: EscrowStatus.HELD,
          amountHeld: totalClientPaid,
          agentPayoutAmount,
          platformCommissionAmount: platformCommission,
        },
      });

      return tx.mission.findUnique({
        where: { id: mission.id },
        include: { escrowAccount: true, client: true },
      });
    });
  }

  /**
   * 2. Assign Agent to Mission (Transition: SOUMISE -> ASSIGNATION_EN_COURS -> AGENT_ASSIGNE)
   */
  async assignAgent(missionId: string, agentId: string) {
    const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) throw new NotFoundException('Mission introuvable');

    if (mission.status !== MissionStatus.SOUMISE && mission.status !== MissionStatus.ASSIGNATION_EN_COURS) {
      throw new BadRequestException(`Impossible d'assigner une mission au statut ${mission.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Increment Agent activeMissionsCount
      const agentProfile = await tx.agentProfile.findUnique({ where: { userId: agentId } });
      if (agentProfile) {
        await tx.agentProfile.update({
          where: { userId: agentId },
          data: { activeMissionsCount: { increment: 1 } },
        });
      }

      return tx.mission.update({
        where: { id: missionId },
        data: {
          agentId,
          status: MissionStatus.AGENT_ASSIGNE,
        },
        include: { agent: true, escrowAccount: true },
      });
    });
  }

  /**
   * 3. Agent Submits Proof (Transition: EN_COURS_EXECUTION -> PREUVE_SOUMISE)
   */
  async submitProof(missionId: string, mediaUrl: string, lat: number, lng: number) {
    const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) throw new NotFoundException('Mission introuvable');

    return this.prisma.$transaction(async (tx) => {
      // Add Proof
      await tx.missionProof.create({
        data: {
          missionId,
          mediaUrl,
          latitude: lat,
          longitude: lng,
          capturedAt: new Date(),
          isGpsVerified: true,
          isTimestampVerified: true,
        },
      });

      // Update Mission status
      return tx.mission.update({
        where: { id: missionId },
        data: { status: MissionStatus.PREUVE_SOUMISE },
        include: { proofs: true, escrowAccount: true },
      });
    });
  }

  /**
   * 4. Client Validates Proof & Releases Escrow (Transition: PREUVE_SOUMISE -> VALIDEE_PAR_CLIENT -> PAYEE)
   */
  async validateAndReleaseEscrow(missionId: string) {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      include: { escrowAccount: true },
    });

    if (!mission) throw new NotFoundException('Mission introuvable');
    if (mission.status !== MissionStatus.PREUVE_SOUMISE) {
      throw new BadRequestException('Les preuves doivent être soumises avant validation.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Release Escrow
      await tx.escrowAccount.update({
        where: { missionId },
        data: {
          status: EscrowStatus.RELEASED,
          releasedAt: new Date(),
        },
      });

      // Decrement Agent activeMissionsCount
      if (mission.agentId) {
        await tx.agentProfile.updateMany({
          where: { userId: mission.agentId, activeMissionsCount: { gt: 0 } },
          data: { activeMissionsCount: { decrement: 1 } },
        });
      }

      // Update Mission status
      const updatedMission = await tx.mission.update({
        where: { id: missionId },
        data: { status: MissionStatus.VALIDEE_PAR_CLIENT },
        include: { escrowAccount: true, agent: true },
      });

      return updatedMission;
    });
  }

  /**
   * 5. Client Rejects Proof & Opens Dispute (Transition: PREUVE_SOUMISE -> LITIGE)
   */
  async rejectProofAndOpenDispute(missionId: string, reason: string) {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      include: { escrowAccount: true },
    });

    if (!mission) throw new NotFoundException('Mission introuvable');
    if (mission.status !== MissionStatus.PREUVE_SOUMISE) {
      throw new BadRequestException('Un litige ne peut être ouvert que sur une preuve soumise.');
    }

    return this.prisma.mission.update({
      where: { id: missionId },
      data: { status: MissionStatus.LITIGE },
      include: { escrowAccount: true, proofs: true },
    });
  }

  /**
   * 6. Admin Resolves Dispute by Refunding Client (Transition: LITIGE -> ANNULEE & Escrow -> REFUNDED)
   */
  async refundEscrowToClient(missionId: string) {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      include: { escrowAccount: true },
    });

    if (!mission) throw new NotFoundException('Mission introuvable');

    return this.prisma.$transaction(async (tx) => {
      // Update Escrow Account Status
      await tx.escrowAccount.update({
        where: { missionId },
        data: { status: EscrowStatus.REFUNDED },
      });

      // Update Mission Status
      return tx.mission.update({
        where: { id: missionId },
        data: { status: MissionStatus.ANNULEE },
        include: { escrowAccount: true },
      });
    });
  }

  /**
   * Fetch All Missions with Filters
   */
  async findAll(city?: City, category?: Category, status?: MissionStatus) {
    return this.prisma.mission.findMany({
      where: {
        ...(city && { city }),
        ...(category && { category }),
        ...(status && { status }),
      },
      include: {
        client: { select: { id: true, fullName: true, phone: true } },
        agent: { select: { id: true, fullName: true, phone: true } },
        escrowAccount: true,
        proofs: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
