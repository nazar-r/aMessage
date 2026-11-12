import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../src.c.extensions/extensions.types/types.chats';
import { PrismaService } from '../src.b.prisma/prisma.service';
import { Server, Socket } from 'socket.io';
import { ChatRedisAdapter } from '../src.b.redis/redis.adapter';
export declare class SocketService {
    private readonly usePrisma;
    private readonly useJwtService;
    private readonly useRedisAdapter;
    private readonly useLogger;
    constructor(usePrisma: PrismaService, useJwtService: JwtService, useRedisAdapter: ChatRedisAdapter);
    formatAction(action: () => Promise<void>, errorMessage: string): Promise<void>;
    afterInit(server: Server): Promise<void>;
    handleConnection(client: Socket): Promise<string[] | undefined>;
    handleDisconnect(client: Socket): Promise<any>;
    getOnlineUsers(client: Socket): Promise<string[]>;
    resolveUserId(payload: JwtPayload | undefined): string;
    signRoomId(userA: string, userB: string): string;
}
