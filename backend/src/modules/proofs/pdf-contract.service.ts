import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PdfContractService {
  private readonly logger = Logger.name;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Generates a Brokerage Contract PDF text buffer, calculates its SHA-256 hash, and updates the Mission entity.
   */
  async generateAndAttachContract(missionId: string): Promise<{ contractHash: string; contractPdfUrl: string }> {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      include: { client: true, agent: true, escrowAccount: true },
    });

    if (!mission) {
      throw new Error(`Mission ${missionId} introuvable pour la génération du contrat.`);
    }

    const timestamp = new Date().toISOString();
    const contractContent = `
================================================================================
                    SEND MOI — MANDAT DE COURTAGE & TIERCE CONFIANCE
================================================================================
Référence Mission : ${mission.id}
Date Horodatée    : ${timestamp}
Cadre Juridique   : Acte Uniforme OHADA portant Droit Commercial Général

1. PARTIES PRENANTES
--------------------------------------------------------------------------------
Donneur d'Ordre (Client) : ${mission.client.fullName} (${mission.client.phone})
Mandataire (Agent)       : ${mission.agent ? mission.agent.fullName : 'Non Assigné'} (${mission.agent ? mission.agent.phone : 'N/A'})

2. OBJET DU MANDAT & CONDITIONS FINANCIÈRES
--------------------------------------------------------------------------------
Intitulé           : ${mission.title}
Ville d'Exécution  : ${mission.city}
Catégorie          : ${mission.category}
Montant Séquestré  : ${mission.totalClientPaid} FCFA (Net Agent: ${mission.escrowAccount?.agentPayoutAmount ?? 0} FCFA)

3. CLAUSES DE TIERCE CONFIANCE
--------------------------------------------------------------------------------
- Les fonds sont conservés sous séquestre d'ingénierie et ne seront libérés qu'après
  soumission et validation conforme des preuves géolocalisées.
- Toute fausse déclaration ou preuve falsifiée entraîne l'ouverture d'un litige.

================================================================================
Hash Cryptographique d'Authenticité SHA-256
================================================================================
`;

    const contractBuffer = Buffer.from(contractContent, 'utf-8');

    // Calculate SHA-256 Hash
    const contractHash = crypto.createHash('sha256').update(contractBuffer).digest('hex');

    // Save PDF file using StorageService
    const fileName = `contracts/contract_${missionId}_${Date.now()}.txt`;
    const contractPdfUrl = await this.storageService.uploadBuffer(fileName, contractBuffer, 'text/plain');

    // Update Mission in Prisma
    await this.prisma.mission.update({
      where: { id: missionId },
      data: {
        contractHash,
        contractPdfUrl,
      },
    });

    return { contractHash, contractPdfUrl };
  }
}
