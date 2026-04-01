import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../src.b.jwt/jwt.ws.config';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5174',
    credentials: true,
  },

})
@UseGuards(WsJwtGuard)
export class ChatsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatsGateway.name);

  @WebSocketServer()
  server: Server;

  afterInit() { }

  handleConnection(client: Socket) {
    console.log(`👤 User Connected: ${client.id} | User: ${client.data.user?.sub || 'Anonymous'}`)
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() message: string,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;

    this.server.emit('newMessage', {
      senderId: user.sub,
      senderName: user.username || 'Anonymous',
      message,
      timestamp: new Date(),
    });
  }
}