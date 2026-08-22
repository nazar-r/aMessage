import { Server, Socket } from 'socket.io';
import { ChatsGatewayLogic } from './chats.service';
import { MessagesService } from '../src.a.messages/messages.service';
import { PrismaService } from '../src.b.prisma/prisma.service';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
export declare class ChatsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly messagesService;
    private readonly chatsGatewayLogic;
    private readonly usePrisma;
    constructor(messagesService: MessagesService, chatsGatewayLogic: ChatsGatewayLogic, usePrisma: PrismaService);
    server: Server;
    handleJoinRoom(client: Socket, payload: {
        peerId: string;
    }): Promise<void>;
    createMessage(client: Socket, payload: {
        text: string;
        from?: string;
        clientMessageId: string;
    }): Promise<void>;
    updateUserMessage(client: Socket, payload: {
        messageId: string;
        text: string;
    }): Promise<void>;
    removeUserMessage(client: Socket, payload: {
        messageId: string;
    }): Promise<void>;
    afterInit(): Promise<void>;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
}
