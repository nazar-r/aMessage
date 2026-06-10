import type { UserImage } from "../src.extensions/extensions.types/types";
import type { AuthUser } from "../src.extensions/extensions.types/auth.types";
export declare class UsersService {
    private prisma;
    findAllUsers(userId: string): Promise<{
        isContact: boolean;
        userId: string;
        userName: string;
    }[]>;
    setUserContact(usersContact: UserImage): import("@prisma/client").Prisma.Prisma__ContactClient<{
        userId: string;
        createdAt: Date;
        contactId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
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
