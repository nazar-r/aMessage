import { randomUUID } from 'crypto';
import { Server, Socket } from 'socket.io';
import { ChatsGatewayLogic } from './chats.service';
import { MessagesService } from '../src.a.messages/messages.service';
import { PrismaService } from '../src.b.prisma/prisma.service';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage } from '@nestjs/websockets';
import { ConnectedSocket, MessageBody, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import type { E2EEPeerPublicKeyPayload, E2EEPublicKeyPayload, JwtPayload } from '../src.extensions/extensions.types/types';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5174',
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

    await this.chatsGatewayLogic.addWatchedRoom(userId, roomId);
    await this.chatsGatewayLogic.addWatchedRoom(peerId, roomId);

    client.emit('userStatus', {
      userId: peerId,
      status: (await this.chatsGatewayLogic.checkUserOnlineStatus(peerId)) ? 'online' : 'offline',
    });

    const candidateIds = [userId, peerId].filter(
      (id, index, arr) => arr.indexOf(id) === index,
    );
    const onlineFlags = await Promise.all(
      candidateIds.map((id) => this.chatsGatewayLogic.checkUserOnlineStatus(id)),
    );

    client.emit('usersOnline',
      candidateIds.filter((_, i) => onlineFlags[i]),
    );

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

    const myPublicKey = await this.chatsGatewayLogic.getPublicKey(userId);

    if (myPublicKey) {
      console.log('myPublicKey', myPublicKey),
        client.to(roomId).emit('e2ee:peerPublicKey', {
          userId,
          publicKey: myPublicKey,
        });
    }

    const peerPublicKey = await this.chatsGatewayLogic.getPublicKey(peerId);

    if (peerPublicKey) {
      client.emit('e2ee:peerPublicKey', {
        userId: peerId,
        publicKey: peerPublicKey,
      });
    }

    console.log('peerPublicKey', peerPublicKey),
      client.to(roomId).emit('user-joined', { userId });
  }

  @SubscribeMessage('messagesHistory')
  async handleMessagesHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { cursor?: string | null },
  ) {
    const roomId = client.data.roomId as string | undefined;

    if (!roomId) throw new WsException('Room not found');

    const messages = await this.messagesService.findMessagesByRoom(roomId, {
      take: 30,
      cursor: payload?.cursor ?? undefined,
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
  }

  @SubscribeMessage('e2ee:publicKey')
  async setPublicKey(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: E2EEPublicKeyPayload,
  ) {
    const publicKey = this.chatsGatewayLogic.normalizePublicKey(payload?.publicKey);
    const user = client.data.user as JwtPayload | undefined;
    const userId = this.chatsGatewayLogic.resolveUserId(user);

    await this.chatsGatewayLogic.setPublicKeyIntoRedis(userId, publicKey);
    client.data.e2eePublicKey = publicKey;

    const roomId = client.data.roomId as string | undefined;
    if (roomId) {
      client.to(roomId).emit('e2ee:peerPublicKey', { userId, publicKey });
    }
  }

  @SubscribeMessage('e2ee:requestPeerPublicKey')
  async requestPeerPublicKey(
    @ConnectedSocket() client: Socket,
  ) {
    const peerId = client.data.peerId as string | undefined;

    if (!peerId) {
      throw new WsException('Peer not found');
    }

    const publicKey = await this.chatsGatewayLogic.getPublicKey(peerId);

    client.emit('e2ee:peerPublicKey', {
      userId: peerId,
      publicKey: publicKey ?? null,
    });

    return {
      ok: true,
      found: Boolean(publicKey),
    };
  }

  @SubscribeMessage('newMessage')
  async createMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { text: string; from?: string; clientMessageId?: string },
  ) {
    const roomId = client.data.roomId as string | undefined;

    if (!roomId) {
      throw new WsException('Room not found');
    }

    const user = client.data.user as JwtPayload | undefined;
    const userId = this.chatsGatewayLogic.resolveUserId(user);
    const tempMessageId = payload.clientMessageId ?? randomUUID();
    const createdAt = new Date();

    this.server.to(roomId).emit('newMessage', {
      userId,
      messageId: tempMessageId,
      text: payload.text,
      time: createdAt,
      pending: true,
    });

    this.chatsGatewayLogic.saveMessageIntoDb(roomId, async () => {
      await this.chatsGatewayLogic.catchSocketError(
        async () => {
          await this.chatsGatewayLogic.ensureRoomExists(
            roomId,
            userId,
            client.data.peerId,
          );

          const savedMessage = await this.messagesService.createMessage({
            userId,
            roomId,
            content: payload.text,
          });

          this.server.to(roomId).emit('messageSaved', {
            tempMessageId,
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

    await this.chatsGatewayLogic.catchSocketError(
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

    await this.chatsGatewayLogic.catchSocketError(
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