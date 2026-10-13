import { PrismaService } from '../src.b.prisma/prisma.service';
export declare class ChatsService {
    private readonly usePrisma;
    constructor(usePrisma: PrismaService);
    getUserChats(userId: string): import("@prisma/client").Prisma.PrismaPromise<unknown>;
    removeUserChat(roomId: string): Promise<{
        roomId: string;
        createdAt: Date;
    }>;
}
