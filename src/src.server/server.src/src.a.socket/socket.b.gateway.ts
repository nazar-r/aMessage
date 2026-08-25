import { Server, Socket } from 'socket.io';
import { ChatsGatewayLogic } from './socket.b.service';
import { MessagesService } from '../src.a.messages/messages.service';
import { PrismaService } from '../src.b.prisma/prisma.service';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage } from '@nestjs/websockets';
import { ConnectedSocket, MessageBody, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import type { JwtPayload } from '../src.extensions/extensions.types/types';

@WebSocketGateway({
  cors: {
    credentials: true,
  },
})

export class ChatsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly chatsGatewayLogic: ChatsGatewayLogic,

    private readonly usePrisma: PrismaService,
  ) { }

  @WebSocketServer() server: Server;

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { peerId: string },
  ) {
    const user = client.data.user as JwtPayload | undefined;
    const userId = this.chatsGatewayLogic.resolveUserId(user);
    const peerId = payload.peerId;

    if (!peerId) throw new WsException('Peer not found');

    const roomId = this.chatsGatewayLogic.signRoomId(userId, peerId);
    const previousRoom = client.data.roomId as string | undefined;

    if (previousRoom && previousRoom !== roomId) client.leave(previousRoom);

    client.join(roomId);
    client.data.roomId = roomId;
    client.data.peerId = peerId;

    const onlineUsers = await this.chatsGatewayLogic.getOnlineUsers();

    // client.emit('userStatus', {
    //   userId: peerId,
    //   status: onlineUsers.includes(peerId) ? 'online' : 'offline',
    // });

    const messages = await this.messagesService.findMessagesByRoom(roomId, {
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
    const userId = this.chatsGatewayLogic.resolveUserId(user);
    const createdAt = new Date();

    this.server.to(roomId).emit('newMessage', {
      userId,
      messageId: payload.clientMessageId,
      text: payload.text,
      time: createdAt,
      pending: true,
    });

    const savedMessage = await this.messagesService.createMessage({
      messageId: payload.clientMessageId,
      roomId,
      userId,
      peerId: client.data.peerId,
      content: payload.text,
    });

    this.chatsGatewayLogic.setDataIntoRedis(roomId, async () => {
      await this.chatsGatewayLogic.formattingRedisData(
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
    });
  }

  @SubscribeMessage('messageUpdate')
  async updateUserMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string; text: string },
  ) {
    const roomId = client.data.roomId as string | undefined;

    if (!roomId) {
      throw new WsException('Room not found');
    }

    const user = client.data.user as JwtPayload | undefined;
    const userId = this.chatsGatewayLogic.resolveUserId(user);

    await this.chatsGatewayLogic.formattingRedisData(
      async () => {
        this.server.to(roomId).emit('messageUpdate', {
          messageId: payload.messageId,
          userId,
          text: payload.text,
        });

        await this.messagesService.updateMessage({
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

    if (!roomId) {
      throw new WsException('Room not found');
    }

    const user = client.data.user as JwtPayload | undefined;
    const userId = this.chatsGatewayLogic.resolveUserId(user);

    await this.chatsGatewayLogic.formattingRedisData(
      async () => {
        this.server.to(roomId).emit('messageRemove', {
          messageId: payload.messageId,
          userId,
        });

        await this.messagesService.removeMessage(
          payload.messageId,
          userId,
        );
      },

      'Failed to remove message',
    );
  }

  async afterInit() {
    await this.chatsGatewayLogic.afterInit(this.server);
  }

  async handleConnection(client: Socket) {
    await this.chatsGatewayLogic.handleConnection(client);
  }

  async handleDisconnect(client: Socket) {
    await this.chatsGatewayLogic.handleDisconnect(client);
  }
}