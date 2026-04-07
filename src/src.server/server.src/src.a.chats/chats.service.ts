import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { ConnectedSocket, MessageBody, WsException } from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WsJwtGuard } from '../src.b.jwt/jwt.ws.config';
import { MessagesService } from '../src.a.messages/messages.service';
import type { JwtPayload, E2EEPublicKeyPayload, E2EEPeerPublicKeyPayload } from '../src.extensions/extensions.types/types';
import * as cookie from 'cookie';

@UseGuards(WsJwtGuard)
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'https://amessage.site',
    credentials: true,
  },
})
export class ChatsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatsGateway.name);

  private readonly publicKeys = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagesService: MessagesService,
  ) { }

  @WebSocketServer()
  server: Server;

  afterInit() {
    this.logger.log('ChatsGateway initialized');
  }

  private resolveUserId(payload: JwtPayload | undefined): string {
    const userId = payload?.sub ?? payload?.id ?? payload?.userId;
    if (!userId) throw new WsException('User not found');
    return userId;
  }

  private normalizePublicKey(publicKey: string): string {
    const normalized = publicKey?.trim();
    if (!normalized) throw new WsException('Invalid public key');

    const decoded = Buffer.from(normalized, 'base64');
    if (decoded.length !== 32) {
      throw new WsException('Invalid public key length');
    }

    return normalized;
  }

  async handleConnection(client: Socket) {
    const peerId = client.handshake.query.peerId as string;
    if (!peerId) {
      client.disconnect(true);
      return;
    }

    try {
      const rawCookie = client.handshake.headers.cookie ?? '';
      const cookies = cookie.parse(rawCookie);
      const token = cookies['access_token'];

      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      }) as JwtPayload;

      const userId = this.resolveUserId(payload);
      const roomId = [userId, peerId].sort().join('-');

      client.data.user = payload;
      client.data.roomId = roomId;

      client.join(roomId);
      this.server.to(roomId).emit('user-status', {
        userId,
        status: 'online',
      });

      const socketsInRoom = await this.server.in(roomId).fetchSockets();
      const onlineUsers = socketsInRoom.map((s) => {
        const u = s.data.user;
        return u?.sub ?? u?.id ?? u?.userId;
      })
        .filter(Boolean);

      client.emit('users-online', onlineUsers);
      const messages = await this.messagesService.findMessagesByRoom(roomId, {
        take: 50,
      });

      const orderedMessages = messages.reverse();
      const mapMessage = (msg: any) => ({
        userId: msg.userId,
        messageId: msg.messageId,
        text: msg.content,
        createdAt: msg.createdAt,
      });

      client.emit('messagesHistory', {
        messages: orderedMessages.map(mapMessage),
        nextCursor: orderedMessages[0]?.messageId || null,
      });

      const myPublicKey = this.publicKeys.get(userId);
      if (myPublicKey) {
        client.to(roomId).emit('e2ee:peerPublicKey', {
          userId,
          publicKey: myPublicKey,
        } satisfies E2EEPeerPublicKeyPayload);
      }

      const peerPublicKey = this.publicKeys.get(peerId);
      if (peerPublicKey) {
        client.emit('e2ee:peerPublicKey', {
          userId: peerId,
          publicKey: peerPublicKey,
        } satisfies E2EEPeerPublicKeyPayload);
      }

      client.to(roomId).emit('user-joined', { userId });

      this.logger.log(
        `WS Connection Launched: ${client.id} | User ID: ${userId} | Peer ID: ${peerId} | Room: ${roomId}`,
      );
    } catch (error) {
      this.logger.error(error);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId =
      client.data.user?.sub ??
      client.data.user?.id ??
      client.data.user?.userId;

    const roomId = client.data.roomId;

    if (userId && roomId) {
      this.server.to(roomId).emit('user-status', {
        userId,
        status: 'offline',
      });
    }

    this.logger.log(`WS Connection Closed: ${client.id} | User ID: ${userId}`);
  }

  @SubscribeMessage('e2ee:publicKey')
  async handlePublicKey(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: E2EEPublicKeyPayload,
  ) {
    const user = client.data.user as JwtPayload | undefined;
    const userId = this.resolveUserId(user);
    const roomId = client.data.roomId as string | undefined;

    if (!roomId) {
      throw new WsException('Room not found');
    }

    const publicKey = this.normalizePublicKey(payload?.publicKey);

    this.publicKeys.set(userId, publicKey);
    client.data.e2eePublicKey = publicKey;

    client.to(roomId).emit('e2ee:peerPublicKey', {
      userId,
      publicKey,
    } satisfies E2EEPeerPublicKeyPayload);

    this.logger.log(`Stored E2EE public key for user ${userId}`);

    return { ok: true };
  }

  @SubscribeMessage('e2ee:requestPeerPublicKey')
  async handleRequestPeerPublicKey(@ConnectedSocket() client: Socket) {
    const peerId = client.handshake.query.peerId as string;
    if (!peerId) {
      throw new WsException('Peer not found');
    }

    const publicKey = this.publicKeys.get(peerId);
    client.emit('e2ee:peerPublicKey', {
      userId: peerId,
      publicKey: publicKey ?? null,
    });

    return { ok: true, found: Boolean(publicKey) };
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { text: string; from?: string },
  ) {
    const roomId = client.data.roomId;
    const user = client.data.user as JwtPayload | undefined;
    const userId = this.resolveUserId(user);

    const savedMessage = await this.messagesService.create({
      userId,
      roomId,
      content: payload.text,
    });

    this.server.to(roomId).emit('newMessage', {
      userId,
      messageId: savedMessage.messageId,
      text: savedMessage.content,
    });
  }

  @SubscribeMessage('updateMessage')
  async handleUpdateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string; text: string },
  ) {
    const user = client.data.user as JwtPayload | undefined;
    const userId = this.resolveUserId(user);

    try {
      await this.messagesService.update({
        messageId: payload.messageId,
        content: payload.text,
      });

      this.server.to(client.data.roomId).emit('messageUpdated', {
        messageId: payload.messageId,
        userId,
        text: payload.text,
      });

      this.logger.log(`Message updated: ${payload.messageId} by User ${userId}`);
    } catch (error) {
      this.logger.error(error);
      throw new WsException('Failed to update message');
    }
  }

  @SubscribeMessage('removeMessage')
  async handleRemoveMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string },
  ) {
    const user = client.data.user as JwtPayload | undefined;
    const userId = this.resolveUserId(user);

    try {
      await this.messagesService.remove(payload.messageId, userId);

      const roomId = client.data.roomId;
      this.server.to(roomId).emit('messageRemoved', {
        messageId: payload.messageId,
        userId,
      });

      this.logger.log(`Message removed: ${payload.messageId} by User ${userId}`);
    } catch (error) {
      this.logger.error(error);
      throw new WsException('Failed to remove message');
    }
  }
}