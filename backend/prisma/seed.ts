import { PrismaClient, Role, City, Category, MissionStatus, AgentStatus, EscrowStatus, PaymentProvider } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seeding de la base de données Send Moi...');

  // 1. Create Test Client User (Diaspora)
  const client = await prisma.user.upsert({
    where: { phone: '+33612345678' },
    update: {},
    create: {
      phone: '+33612345678',
      fullName: 'Jean-Paul Nkembe (Diaspora France)',
      role: Role.CLIENT,
      city: City.DOUALA,
    },
  });

  // 2. Create Test Verified Agents in Douala & Yaounde
  const agent1User = await prisma.user.upsert({
    where: { phone: '+237699001122' },
    update: {},
    create: {
      phone: '+237699001122',
      fullName: 'Samuel Kouamé',
      role: Role.AGENT,
      city: City.DOUALA,
    },
  });

  await prisma.agentProfile.upsert({
    where: { userId: agent1User.id },
    update: {},
    create: {
      userId: agent1User.id,
      cniNumber: '118293849',
      status: AgentStatus.APPROVED,
      rating: 4.9,
      ratingCount: 18,
      preferredZones: ['Makepe', 'Akwa', 'Bonapriso'],
      momoNumber: '+237699001122',
      momoProvider: PaymentProvider.MTN_MOMO,
    },
  });

  const agent2User = await prisma.user.upsert({
    where: { phone: '+237677334455' },
    update: {},
    create: {
      phone: '+237677334455',
      fullName: 'Michel Manga',
      role: Role.AGENT,
      city: City.YAOUNDE,
    },
  });

  await prisma.agentProfile.upsert({
    where: { userId: agent2User.id },
    update: {},
    create: {
      userId: agent2User.id,
      cniNumber: '229384950',
      status: AgentStatus.APPROVED,
      rating: 4.8,
      ratingCount: 12,
      preferredZones: ['Bastos', 'Odza', 'Jouvence'],
      momoNumber: '+237677334455',
      momoProvider: PaymentProvider.ORANGE_MONEY,
    },
  });

  // 3. Create Sample Supervision Mission
  const mission = await prisma.mission.create({
    data: {
      clientId: client.id,
      agentId: agent1User.id,
      category: Category.SUPERVISION,
      city: City.DOUALA,
      status: MissionStatus.PREUVE_SOUMISE,
      title: 'Inspection Coulage Dalle R+1',
      description: 'Vérification des poteaux et contrôle livraison ciment à Makepe',
      categoryPayload: { checkpoints: ['poteaux', 'ferraillage', 'ciment'] },
      priceAmount: 25000,
      commissionRate: 0.10,
      fixedFee: 0,
      totalClientPaid: 25000,
    },
  });

  await prisma.escrowAccount.create({
    data: {
      missionId: mission.id,
      status: EscrowStatus.HELD,
      amountHeld: 25000,
      agentPayoutAmount: 22500,
      platformCommissionAmount: 2500,
    },
  });

  await prisma.missionProof.create({
    data: {
      missionId: mission.id,
      mediaUrl: 'assets/chantier_supervision_proof.png',
      latitude: 4.0511,
      longitude: 9.7679,
      capturedAt: new Date(),
      isGpsVerified: true,
      isTimestampVerified: true,
    },
  });

  console.log('✅ Seeding terminé avec succès ! Users, Agents & Mission créés.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
