import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, ConnectedSocket, MessageBody, WsException } from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WsJwtGuard } from '../src.b.jwt/jwt.ws.config';
import { MessagesService } from '../src.a.messages/messages.service';
import * as cookie from 'cookie';

@UseGuards(WsJwtGuard)
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5174',
    credentials: true,
  },
})
export class ChatsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagesService: MessagesService,
  ) { }

  @WebSocketServer()
  server: Server;

  afterInit() {
    this.logger.log('ChatsGateway initialized');
  }

  handleConnection(client: Socket) {
    const peerId = client.handshake.query.peerId as string;
    if (!peerId) {
      client.disconnect(true);
      return;
    }

    try {
      const rawCookie = client.handshake.headers.cookie ?? '';
      const cookies = cookie.parse(rawCookie);
      const token = cookies['access_token'];
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      client.data.user = payload;

      const userId = payload.sub ?? payload.id ?? payload.userId;
      const roomId = [userId, peerId].sort().join("-");
      client.data.roomId = roomId;
      client.join(roomId);

      client.to(roomId).emit('user-joined', { userId });

      this.logger.log(`WS Connection Launched: ${client.id} | User ID: ${userId} | Peer ID: ${peerId} | Room: ${roomId}`);
    } catch (error) {
      this.logger.warn(`WS Connection Canceled: ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.user?.sub ?? client.data.user?.id ?? client.data.user?.userId ?? 'unknown';
    this.logger.log(`WS Connection Closed: ${client.id} | User ID: ${userId}`);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { text: string; from?: string }
  ) {
    const roomId =
      client.data.roomId ??
      (() => {
        throw new WsException('Room not found');
      })();

    const user = client.data.user;
    const userId =
      user?.sub ?? user?.id ?? user?.userId ??
      (() => {
        throw new WsException('User not found');
      })();

    const savedMessage = await this.messagesService.create({
      roomId,
      userId,
      content: payload.text,
    });

    
    this.server.to(roomId).emit('newMessage', {
      userId,
      messageId: savedMessage.messageId,
      text: savedMessage.content,
    });
  }
}