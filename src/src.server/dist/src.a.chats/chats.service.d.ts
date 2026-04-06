import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from '../src.a.messages/messages.service';
import type { E2EEPublicKeyPayload } from '../src.extensions/extensions.types/types';
export declare class ChatsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly messagesService;
    private readonly logger;
    private readonly publicKeys;
    constructor(jwtService: JwtService, messagesService: MessagesService);
    server: Server;
    afterInit(): void;
    private resolveUserId;
    private normalizePublicKey;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handlePublicKey(client: Socket, payload: E2EEPublicKeyPayload): Promise<{
        ok: boolean;
    }>;
    handleRequestPeerPublicKey(client: Socket): Promise<{
        ok: boolean;
        found: boolean;
    }>;
    handleMessage(client: Socket, payload: {
        text: string;
        from?: string;
    }): Promise<void>;
    handleUpdateMessage(client: Socket, payload: {
        messageId: string;
        text: string;
    }): Promise<void>;
    handleRemoveMessage(client: Socket, payload: {
        messageId: string;
    }): Promise<void>;
}
