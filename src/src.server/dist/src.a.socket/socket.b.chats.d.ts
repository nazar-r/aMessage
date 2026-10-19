import { PrismaService } from '../src.b.prisma/prisma.service';
import { SocketService } from './socket.b.service';
import { Server, Socket } from 'socket.io';
import { MessagesService } from '../src.a.messages/messages.service';
export declare class SocketChatsGateway {
    private readonly usePrisma;
    private readonly useSocketService;
    private readonly useMessagesService;
    constructor(usePrisma: PrismaService, useSocketService: SocketService, useMessagesService: MessagesService);
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
}
