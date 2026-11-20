import { PrismaService } from '../src.b.prisma/prisma.service';
import { SocketService } from './socket.service';
import { Server, Socket } from 'socket.io';
import { MessagesService } from '../src.a.messages/messages.service';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import type { JwtPayload } from '../src.c.extensions/extensions.types/types.chats';

@WebSocketGateway({
  cors: { credentials: true },
})

export class ChatsGateway {
  constructor(
    private readonly usePrisma: PrismaService,
    private readonly useSocketService: SocketService,
    private readonly useMessagesService: MessagesService,
  ) { }

  @WebSocketServer() server: Server;

  private getUserRooms(userId: string, peerId: string) {
    return [
      `user:${userId}`,
      `user:${peerId}`,
    ];
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { peerId: string },
  ) {
    const user = client.data.user as JwtPayload | undefined;
    const userPeerId = payload.peerId;
    const userId = this.useSocketService.resolveUserId(user);
    const roomId = this.useSocketService.signRoomId(userId, userPeerId);

    const messages = await this.useMessagesService.getMessagesByRoom(roomId, {
      take: 30,
    });

    const orderedMessages = messages.reverse();
    const userPublicKey = await this.usePrisma.user.findUnique({
      where: {
        userId,
      },
      select: {
        pubKey: true,
      },
    });

    const peerPublicKey = await this.usePrisma.user.findUnique({
      where: {
        userId: userPeerId,
      },
      select: {
        pubKey: true,
      },
    });

    client.emit('messagesHistory', {
      messages: orderedMessages.map((msg) => ({
        userId: msg.userId,
        messageId: msg.messageId,
        text: msg.content,
        createdAt: msg.createdAt,
      })),
      nextCursor: orderedMessages[0]?.messageId ?? null,
    });

    if (userPublicKey?.pubKey) {
      this.server.to(`user:${userPeerId}`).emit('e2ee:peerPublicKey', {
        userId,
        publicKey: userPublicKey.pubKey,
      });
    }

    if (peerPublicKey?.pubKey) {
      client.emit('e2ee:peerPublicKey', {
        userId: userPeerId,
        publicKey: peerPublicKey.pubKey,
      });
    }

    this.server.to(`user:${userPeerId}`).emit('user-joined', { userId });
  }

  @SubscribeMessage('newMessage')
  async createMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { text: string; peerId: string; clientMessageId: string },
  ) {
    const user = client.data.user as JwtPayload | undefined;
    const peerId = payload.peerId;
    const userId = this.useSocketService.resolveUserId(user);
    const roomId = this.useSocketService.signRoomId(userId, peerId);
    const userRooms = this.getUserRooms(userId, peerId);
    const createdAt = new Date();

    this.server.to(userRooms).emit('newMessage', {
      userId,
      messageId: payload.clientMessageId,
      text: payload.text,
      time: createdAt,
      pending: true,
    });

    const savedMessage = await this.useMessagesService.createMessage({
      messageId: payload.clientMessageId,
      roomId,
      userId,
      peerId,
      content: payload.text,
    });

    await this.useSocketService.formatAction(
      async () => {
        this.server.to(userRooms).emit('messageSaved', {
          messageId: savedMessage.messageId,
          userId: savedMessage.userId,
          text: savedMessage.content,
          time: savedMessage.createdAt,
          pending: false,
        });
      },

      'Failed to save message',
    );
  }

  @SubscribeMessage('messageUpdate')
  async updateUserMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string; text: string; peerId: string },
  ) {
    const user = client.data.user as JwtPayload | undefined;
    const userId = this.useSocketService.resolveUserId(user);
    const userRooms = this.getUserRooms(userId, payload.peerId);

    await this.useSocketService.formatAction(
      async () => {
        await this.useMessagesService.updateMessage({
          messageId: payload.messageId,
          content: payload.text,
        });

        this.server.to(userRooms).emit('messageUpdate', {
          messageId: payload.messageId,
          userId,
          text: payload.text,
        });
      },

      'Failed to update message',
    );
  }

  @SubscribeMessage('messageRemove')
  async removeUserMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string; peerId: string },
  ) {
    const user = client.data.user as JwtPayload | undefined;
    const userId = this.useSocketService.resolveUserId(user);
    const userRooms = this.getUserRooms(userId, payload.peerId);

    await this.useSocketService.formatAction(
      async () => {
        await this.useMessagesService.removeMessage(
          payload.messageId,
          userId,
        );

        this.server.to(userRooms).emit('messageRemove', {
          messageId: payload.messageId,
          userId,
        });
      },

      'Failed to remove message',
    );
  }
}
