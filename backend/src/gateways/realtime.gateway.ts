import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'https://sendmoi.cm'],
    credentials: true,
  },
})
export class RealtimeGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.auth?.token || client.handshake.headers?.authorization;
      if (!authHeader) {
        this.logger.warn(`🚫 Connexion WebSocket rejetée (Token manquant): ${client.id}`);
        client.disconnect(true);
        return;
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'send_moi_dev_secret_key_2026',
      });

      client.data.user = payload;
      this.logger.log(`✅ Connexion WebSocket authentifiée (User: ${payload.sub}): ${client.id}`);
    } catch (err) {
      this.logger.warn(`🚫 Connexion WebSocket rejetée (Token invalide): ${client.id}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join_mission')
  async handleJoinMission(
    @MessageBody('missionId') missionId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.user?.sub;
    if (!userId) {
      return { status: 'unauthorized' };
    }

    const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission || (mission.clientId !== userId && mission.agentId !== userId)) {
      this.logger.warn(`🔒 Accès refusé au canal mission_${missionId} pour l'utilisateur ${userId}`);
      return { status: 'forbidden' };
    }

    client.join(`mission_${missionId}`);
    this.logger.log(`Client ${userId} a rejoint le canal mission_${missionId}`);
    return { status: 'joined', missionId };
  }

  @SubscribeMessage('agent_location_update')
  handleLocationUpdate(
    @MessageBody() data: { missionId: string; lat: number; lng: number },
  ) {
    this.server.to(`mission_${data.missionId}`).emit('location_changed', {
      lat: data.lat,
      lng: data.lng,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('send_chat_message')
  handleChatMessage(
    @MessageBody() data: { missionId: string; senderId: string; text: string },
  ) {
    this.server.to(`mission_${data.missionId}`).emit('new_chat_message', {
      senderId: data.senderId,
      text: data.text,
      sentAt: new Date(),
    });
  }
}
