import { PrismaService } from '../src.b.prisma/prisma.service';
import { RedisService } from '../src.b.redis/redis.service';
import type { UserContact, ChosenUser } from '../src.extensions/extensions.types/types';
import type { AuthUser } from '../src.extensions/extensions.types/auth.types';
export declare class UsersService {
    private readonly usePrisma;
    private readonly useRedis;
    constructor(usePrisma: PrismaService, useRedis: RedisService);
    findOrCreateUser(profile: AuthUser): Promise<{
        name: string;
        userId: string;
        email: string | null;
        pubKey: string | null;
        role: import("@prisma/client").$Enums.Role;
        userName: string;
        refreshToken: string | null;
        createdAt: Date;
    }>;
    findAllUsers(userId: string): Promise<ChosenUser[]>;
    setUserPubKey(userId: string, userPubKey: string): import("@prisma/client").Prisma.Prisma__UserClient<{
        userId: string;
        email: string | null;
        pubKey: string | null;
        role: import("@prisma/client").$Enums.Role;
        userName: string;
        refreshToken: string | null;
        createdAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    setUserContact(userContact: UserContact): import("@prisma/client").Prisma.Prisma__ContactClient<{
        userId: string;
        createdAt: Date;
        contactId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    deleteUserContact(userContact: UserContact): import("@prisma/client").Prisma.Prisma__ContactClient<{
        userId: string;
        createdAt: Date;
        contactId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
