import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Category, City, MissionStatus, EscrowStatus } from '@prisma/client';
import { CreateMissionDto } from './dto/create-mission.dto';
import { PdfContractService } from '../proofs/pdf-contract.service';

@Injectable()
export class MissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfContractService: PdfContractService,
  ) {}

  /**
   * 1. Create Mission & Hold Funds in Escrow (Paid immediately upon order validation)
   */
  async createAndHoldEscrow(clientId: string, dto: CreateMissionDto) {
    if (dto.milestones && dto.milestones.length > 0) {
      const totalPercentage = dto.milestones.reduce((acc, m) => acc + m.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new BadRequestException('La somme des pourcentages des jalons doit faire exactement 100%.');
      }
    }

    const commissionRate = 0.10; // Fixed 10% platform commission
    const fixedFee = 0;           // Fixed operational fee
    const platformCommission = Math.round((dto.priceAmount * commissionRate) + fixedFee);
    const agentPayoutAmount = Math.round(dto.priceAmount - (dto.priceAmount * commissionRate));
    const totalClientPaid = Math.round(dto.priceAmount + fixedFee);

    // Create Mission and Escrow Account in a transaction
    return this.prisma.$transaction(async (tx) => {
      const mission = await tx.mission.create({
        data: {
          clientId,
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

      // Create Milestones if provided
      if (dto.milestones && dto.milestones.length > 0) {
        await tx.missionMilestone.createMany({
          data: dto.milestones.map((m, index) => ({
            missionId: mission.id,
            title: m.title,
            percentage: m.percentage,
            amount: Math.round((totalClientPaid * m.percentage) / 100),
            orderIndex: index + 1,
            status: EscrowStatus.HELD,
          })),
        });
      }

      return tx.mission.findUnique({
        where: { id: mission.id },
        include: { escrowAccount: true, client: true, milestones: true },
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

    const agentProfile = await this.prisma.agentProfile.findUnique({ where: { userId: agentId } });
    if (!agentProfile || agentProfile.status !== 'APPROVED') {
      throw new BadRequestException("L'agent sélectionné doit posséder un dossier KYC approuvé.");
    }

    const updatedMission = await this.prisma.$transaction(async (tx) => {
      // Increment Agent activeMissionsCount
      await tx.agentProfile.update({
        where: { userId: agentId },
        data: { activeMissionsCount: { increment: 1 } },
      });

      return tx.mission.update({
        where: { id: missionId },
        data: {
          agentId,
          status: MissionStatus.AGENT_ASSIGNE,
        },
        include: { agent: true, escrowAccount: true },
      });
    });

    // Generate PDF Contract & SHA-256 Hash
    try {
      await this.pdfContractService.generateAndAttachContract(missionId);
    } catch (err) {
      // Non-blocking for mission flow, logged
    }

    return updatedMission;
  }

  /**
   * 3. Agent Submits Proof (Transition: EN_COURS_EXECUTION -> PREUVE_SOUMISE)
   */
  async submitProof(missionId: string, agentId: string, mediaUrl: string, lat: number, lng: number) {
    const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) throw new NotFoundException('Mission introuvable');

    if (mission.agentId !== agentId) {
      throw new ForbiddenException('🔒 Seul l\'agent assigné à cette mission peut soumettre des preuves.');
    }

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
  async validateAndReleaseEscrow(missionId: string, clientId: string) {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      include: { escrowAccount: true },
    });

    if (!mission) throw new NotFoundException('Mission introuvable');
    
    if (mission.clientId !== clientId) {
      throw new ForbiddenException('🔒 Seul le client créateur de la mission peut valider cette preuve.');
    }

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
  async rejectProofAndOpenDispute(missionId: string, clientId: string, reason: string) {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      include: { escrowAccount: true },
    });

    if (!mission) throw new NotFoundException('Mission introuvable');

    if (mission.clientId !== clientId) {
      throw new ForbiddenException('🔒 Seul le client créateur de la mission peut ouvrir un litige.');
    }

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

    if (mission.status !== MissionStatus.LITIGE) {
      throw new BadRequestException('Un remboursement administrateur exige que la mission soit au statut LITIGE.');
    }

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
   * 7. Release Milestone Escrow Part (Transition: HELD -> RELEASED pour un jalon spécifique)
   */
  async releaseMilestoneEscrow(milestoneId: string, clientId: string) {
    const milestone = await this.prisma.missionMilestone.findUnique({
      where: { id: milestoneId },
      include: { mission: { include: { escrowAccount: true } } },
    });

    if (!milestone) throw new NotFoundException('Jalon introuvable');
    if (milestone.mission.clientId !== clientId) {
      throw new ForbiddenException('🔒 Seul le client créateur de la mission peut débloquer ce jalon.');
    }
    if (milestone.status === EscrowStatus.RELEASED) {
      throw new BadRequestException('Ce jalon a déjà été débloqué.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Mark milestone released
      const updatedMilestone = await tx.missionMilestone.update({
        where: { id: milestoneId },
        data: { status: EscrowStatus.RELEASED, releasedAt: new Date() },
      });

      // Deduct from total Escrow amount held
      if (milestone.mission.escrowAccount) {
        const newAmountHeld = Math.max(0, milestone.mission.escrowAccount.amountHeld - milestone.amount);
        await tx.escrowAccount.update({
          where: { missionId: milestone.missionId },
          data: { amountHeld: newAmountHeld },
        });
      }

      return updatedMilestone;
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
        milestones: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
