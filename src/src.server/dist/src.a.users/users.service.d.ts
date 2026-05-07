import type { AuthUser } from "../src.extensions/extensions.types/auth.types";
export declare class UsersService {
    private prisma;
    findAllUsers(userId: string): import("@prisma/client").Prisma.PrismaPromise<{
        userId: string;
        userName: string;
    }[]>;
    findOrCreateUser(profile: AuthUser): Promise<{
        name: string;
        role: import("@prisma/client").$Enums.Role;
        userId: string;
        userName: string;
        email: string | null;
        refreshToken: string | null;
        createdAt: Date;
    }>;
}
