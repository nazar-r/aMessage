import { PrismaService } from '../src.b.prisma/prisma.service';
import { SocketService } from './socket.b.service';
import { Server, Socket } from 'socket.io';
import { MessagesService } from '../src.a.messages/messages.service';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import type { JwtPayload } from '../src.c.extensions/extensions.types/types.chats';

@WebSocketGateway({
  cors: {
    credentials: true,
  },
})

export class SocketChatsGateway {
  constructor(
    private readonly usePrisma: PrismaService,
    private readonly useSocketService: SocketService,
    private readonly useMessagesService: MessagesService,
  ) { }

  @WebSocketServer() server: Server;

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { peerId: string },
  ) {
    const user = client.data.user as JwtPayload | undefined;
    const peerId = payload.peerId;
    const userId = this.useSocketService.resolveUserId(user);
    const roomId = this.useSocketService.signRoomId(userId, peerId);
    const previousRoom = client.data.roomId as string | undefined;

    if (previousRoom && previousRoom !== roomId) client.leave(previousRoom);

    client.join(roomId);
    client.data.roomId = roomId;
    client.data.peerId = peerId;

    const messages = await this.useMessagesService.getMessagesByRoom(roomId, {
      take: 30,
    });

    const orderedMessages = messages.reverse();

    client.emit('messagesHistory', {
      messages: orderedMessages.map((msg) => ({
        userId: msg.userId,
        messageId: msg.messageId,
        text: msg.content,
        createdAt: msg.createdAt,
      })),
      nextCursor: orderedMessages[0]?.messageId ?? null,
    });

    const myPublicKey = await this.usePrisma.user.findUnique({
      where: {
        userId,
      },
      select: {
        pubKey: true,
      },
    });

    if (myPublicKey?.pubKey) {
      client.to(roomId).emit('e2ee:peerPublicKey', {
        userId,
        publicKey: myPublicKey.pubKey,
      });
    }

    const peerPublicKey = await this.usePrisma.user.findUnique({
      where: {
        userId: peerId,
      },
      select: {
        pubKey: true,
      },
    });

    if (peerPublicKey?.pubKey) {
      client.emit('e2ee:peerPublicKey', {
        userId: peerId,
        publicKey: peerPublicKey.pubKey,
      });
    }

    client.to(roomId).emit('user-joined', { userId });
  }

  @SubscribeMessage('newMessage')
  async createMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { text: string; from?: string; clientMessageId: string },
  ) {
    const roomId = client.data.roomId as string | undefined;
    const user = client.data.user as JwtPayload | undefined;
    const userId = this.useSocketService.resolveUserId(user);
    const createdAt = new Date();

    this.server.to(roomId).emit('newMessage', {
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
      peerId: client.data.peerId,
      content: payload.text,
    });

    await this.useSocketService.formatAction(
      async () => {
        this.server.to(roomId).emit('messageSaved', {
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
    @MessageBody() payload: { messageId: string; text: string },
  ) {
    const roomId = client.data.roomId as string | undefined;
    const user = client.data.user as JwtPayload | undefined;
    const userId = this.useSocketService.resolveUserId(user);

    await this.useSocketService.formatAction(
      async () => {
        this.server.to(roomId).emit('messageUpdate', {
          messageId: payload.messageId,
          userId,
          text: payload.text,
        });

        await this.useMessagesService.updateMessage({
          messageId: payload.messageId,
          content: payload.text,
        });
      },

      'Failed to update message',
    );
  }

  @SubscribeMessage('messageRemove')
  async removeUserMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string },
  ) {
    const roomId = client.data.roomId as string | undefined;
    const user = client.data.user as JwtPayload | undefined;
    const userId = this.useSocketService.resolveUserId(user);

    await this.useSocketService.formatAction(
      async () => {
        this.server.to(roomId).emit('messageRemove', {
          messageId: payload.messageId,
          userId,
        });

        await this.useMessagesService.removeMessage(
          payload.messageId,
          userId,
        );
      },

      'Failed to remove message',
    );
  }
}