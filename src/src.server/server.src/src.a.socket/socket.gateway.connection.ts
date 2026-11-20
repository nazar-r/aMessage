import { SocketService } from './socket.service';
import { Server, Socket } from 'socket.io';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { JwtPayload } from '../src.c.extensions/extensions.types/types.chats';
import type { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, } from '@nestjs/websockets';

@WebSocketGateway({
  cors: { credentials: true },
})

export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly SocketService: SocketService,
  ) { }

  @WebSocketServer() server: Server;

  async afterInit() {
    await this.SocketService.afterInit(this.server);
  }

  async handleConnection(client: Socket) {
    const onlineUsers = await this.SocketService.handleConnection(client);
    const user = client.data.user as JwtPayload | undefined;
    if (!user) {
      client.disconnect(true);
      return;
    }
    const userId = this.SocketService.resolveUserId(user);
    const userRoomId = `user:${userId}`;

    await client.join(userRoomId);
    if (!onlineUsers) return;

    this.server.emit('usersOnline', onlineUsers);
  }

  async handleDisconnect(client: Socket) {
    const onlineUsers = await this.SocketService.handleDisconnect(client);
    if (!onlineUsers) return;

    this.server.emit('usersOnline', onlineUsers);
  }
}
