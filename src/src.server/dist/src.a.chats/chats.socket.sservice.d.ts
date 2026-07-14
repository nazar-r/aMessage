import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatRedisAdapter } from '../src.b.redis/redis.adapter';
import { ChatsGatewayLogic } from './chats.service';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
export declare class ChatsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly chatsGatewayLogic;
    private readonly redisAdapter;
    private readonly logger;
    constructor(jwtService: JwtService, chatsGatewayLogic: ChatsGatewayLogic, redisAdapter: ChatRedisAdapter);
    server: Server;
    afterInit(): Promise<void>;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleJoinRoom(client: Socket, payload: {
        peerId: string;
    }): Promise<void>;
    setPublicKey(client: Socket, payload: {
        publicKey: string;
    }): Promise<void>;
    requestPeerPublicKey(client: Socket): Promise<{
        ok: boolean;
        found: boolean;
    }>;
    createMessage(client: Socket, payload: {
        text: string;
        from?: string;
    }): Promise<void>;
    updateUserMessage(client: Socket, payload: {
        messageId: string;
        text: string;
    }): Promise<void>;
    removeUserMessage(client: Socket, payload: {
        messageId: string;
    }): Promise<void>;
}
