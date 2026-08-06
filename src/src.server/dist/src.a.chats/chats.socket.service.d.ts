import type { E2EEPublicKeyPayload } from '../src.extensions/extensions.types/types';
import { Server, Socket } from 'socket.io';
import { ChatsGatewayLogic } from './chats.service';
import { MessagesService } from '../src.a.messages/messages.service';
export declare class ChatsGateway {
    private readonly messagesService;
    private readonly chatsGatewayLogic;
    constructor(messagesService: MessagesService, chatsGatewayLogic: ChatsGatewayLogic);
    server: Server;
    handleJoinRoom(client: Socket, payload: {
        peerId: string;
    }): Promise<void>;
    handleMessagesHistory(client: Socket, payload: {
        cursor?: string | null;
    }): Promise<void>;
    setPublicKey(client: Socket, payload: E2EEPublicKeyPayload): Promise<void>;
    requestPeerPublicKey(client: Socket): Promise<{
        ok: boolean;
        found: boolean;
    }>;
    createMessage(client: Socket, payload: {
        text: string;
        from?: string;
        clientMessageId?: string;
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
