import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token || client.handshake.headers?.authorization;
    if (!token) {
      this.logger.warn(`Connexion WebSocket rejetée (Token manquant): ${client.id}`);
      // In production: client.disconnect(true);
    } else {
      this.logger.log(`Connexion WebSocket authentifiée: ${client.id}`);
    }
  }

  @SubscribeMessage('join_mission')
  handleJoinMission(
    @MessageBody('missionId') missionId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`mission_${missionId}`);
    this.logger.log(`Client ${client.id} a rejoint le canal mission_${missionId}`);
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
