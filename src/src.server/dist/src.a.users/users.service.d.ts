import type { AuthUser } from "../src.extensions/extensions.types/auth.types";
export declare class UsersService {
    private prisma;
    findAllUsers(userId: string): import("@prisma/client").Prisma.PrismaPromise<{
        userId: string;
        userName: string;
    }[]>;
    findOrCreateUser(profile: AuthUser): import("@prisma/client").Prisma.Prisma__UserClient<import("@prisma/client").User, never>;
    updateRefreshToken(userId: string, refreshTokenHash: string): import("@prisma/client").Prisma.Prisma__UserClient<import("@prisma/client").User, never>;
}
