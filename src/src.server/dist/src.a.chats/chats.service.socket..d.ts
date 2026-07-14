import { Server, Socket } from 'socket.io';
import { MessagesService } from '../src.a.messages/messages.service';
import { ChatRedisAdapter } from '../src.b.redis/redis.adapter';
import type { E2EEPublicKeyPayload } from '../src.extensions/extensions.types/types';
export declare class ChatsGatewayLogic {
    private readonly messagesService;
    private readonly redisAdapter;
    private readonly logger;
    private readonly roomMessageSaveChains;
    private static readonly PUBLIC_KEY_PREFIX;
    private static readonly ONLINE_SOCKETS_PREFIX;
    private static readonly WATCHED_ROOMS_PREFIX;
    private server;
    constructor(messagesService: MessagesService, redisAdapter: ChatRedisAdapter);
    setServer(server: Server): void;
    private getServer;
    private catchSocketError;
    private resolveUserId;
    private signRoomId;
    private addWatchedRoom;
    private getWatchedRooms;
    private broadcastPresenceToWatchedRooms;
    private getPublicKey;
    private setPublicKeyIntoRedis;
    private normalizePublicKey;
    private saveMessageIntoDb;
    handleJoinRoom(client: Socket, payload: {
        peerId: string;
    }): Promise<void>;
    setPublicKey(client: Socket, payload: E2EEPublicKeyPayload): Promise<void>;
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
    private addOnlineSocket;
    private removeOnlineSocket;
    private checkUserOnlineStatus;
    connectSocket(client: Socket): Promise<void>;
    disconnectSocket(client: Socket): Promise<void>;
}
