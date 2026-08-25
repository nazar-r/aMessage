import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatRedisAdapter } from '../src.b.redis/redis.adapter';
import { JwtPayload } from '../src.extensions/extensions.types/types';
export declare class ChatsGatewayLogic {
    private readonly jwtService;
    private readonly redisAdapter;
    private readonly logger;
    private readonly roomMessageSaveChains;
    private static readonly ONLINE_USERS_KEY;
    private server;
    constructor(jwtService: JwtService, redisAdapter: ChatRedisAdapter);
    afterInit(server: Server): Promise<void>;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    formattingRedisData(action: () => Promise<void>, errorMessage: string): Promise<void>;
    connectSocket(client: Socket): Promise<void>;
    disconnectSocket(client: Socket): Promise<void>;
    addOnlineUser(userId: string): Promise<void>;
    removeOnlineUser(userId: string): Promise<void>;
    getOnlineUsers(): Promise<string[]>;
    resolveUserId(payload: JwtPayload | undefined): string;
    signRoomId(userA: string, userB: string): string;
    setDataIntoRedis(roomId: string, task: () => Promise<void>): void;
}
