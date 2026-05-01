import type { AuthUser } from "../src.extensions/extensions.types/auth.types";
export declare class UsersService {
    private prisma;
    findAllUsers(userId: string): import("@prisma/client").Prisma.PrismaPromise<{
        userId: string;
        userName: string;
    }[]>;
    findOrCreateUser(profile: AuthUser): import("@prisma/client").Prisma.Prisma__UserClient<{
        userId: string;
        createdAt: Date;
        role: import("@prisma/client").$Enums.Role;
        userName: string;
        email: string | null;
        refreshToken: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    updateRefreshToken(userId: string, refreshTokenHash: string): import("@prisma/client").Prisma.Prisma__UserClient<{
        userId: string;
        createdAt: Date;
        role: import("@prisma/client").$Enums.Role;
        userName: string;
        email: string | null;
        refreshToken: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
