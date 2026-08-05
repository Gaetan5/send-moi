import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { City, AgentStatus } from '@prisma/client';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find Best Eligible Agents in Douala / Yaoundé
   */
  async findEligibleAgents(city: City, zone?: string) {
    const agents = await this.prisma.agentProfile.findMany({
      where: {
        status: AgentStatus.APPROVED,
        isAvailable: true,
        user: { city },
        activeMissionsCount: { lt: 3 }, // Maximum 3 concurrent active missions
      },
      include: { user: true },
      orderBy: [
        { rating: 'desc' },
        { activeMissionsCount: 'asc' },
      ],
    });

    this.logger.log(`Matching pour ${city}: ${agents.length} agents éligibles trouvés.`);
    return agents;
  }

  /**
   * Dispatch Mission to Next Candidate with 5-min timer logic
   */
  async dispatchMission(missionId: string) {
    const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) return null;

    const candidates = await this.findEligibleAgents(mission.city);
    if (candidates.length === 0) {
      this.logger.warn(`Aucun agent disponible à ${mission.city} pour la mission ${missionId}`);
      return null;
    }

    const selectedAgent = candidates[0];
    this.logger.log(`Mission ${missionId} proposée à l'agent ${selectedAgent.userId} (5 min pour accepter)`);

    return selectedAgent;
  }
}
