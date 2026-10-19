import { SocketService } from './socket.b.service';
import { Server, Socket } from 'socket.io';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

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
    if (!onlineUsers) return;
    this.server.emit('usersOnline', onlineUsers);
  }

  async handleDisconnect(client: Socket) {
    const onlineUsers = await this.SocketService.handleDisconnect(client);
    if (!onlineUsers) return;
    this.server.emit('usersOnline', onlineUsers);
  }
}