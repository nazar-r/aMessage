import { PrismaService } from '../src.b.prisma/prisma.service';
import { RedisService } from '../src.b.redis/redis.service';
import type { AuthUser } from '../src.c.extensions/extensions.types/types.auth';
import type { UserContact, ChosenUser } from '../src.c.extensions/extensions.types/types.chats';
export declare class UsersService {
    private readonly usePrisma;
    private readonly useRedis;
    constructor(usePrisma: PrismaService, useRedis: RedisService);
    getOrCreateUser(profile: AuthUser): Promise<{
        name: string;
        userId: string;
        role: import("@prisma/client").$Enums.Role;
        userName: string;
        email: string | null;
        pubKey: string | null;
        lastSeen: Date | null;
        refreshToken: string | null;
        createdAt: Date;
    }>;
    getAllUsers(userId: string): Promise<ChosenUser[]>;
    setUserContact(userContact: UserContact): import("@prisma/client").Prisma.Prisma__ContactClient<{
        userId: string;
        createdAt: Date;
        contactId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    setUserPubKey(userId: string, userPubKey: string): import("@prisma/client").Prisma.Prisma__UserClient<{
        userId: string;
        role: import("@prisma/client").$Enums.Role;
        userName: string;
        email: string | null;
        pubKey: string | null;
        lastSeen: Date | null;
        refreshToken: string | null;
        createdAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    deleteUserContact(userContact: UserContact): import("@prisma/client").Prisma.Prisma__ContactClient<{
        userId: string;
        createdAt: Date;
        contactId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
