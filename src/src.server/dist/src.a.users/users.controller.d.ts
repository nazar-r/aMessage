import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    loadUsers(req: any): Promise<import("../src.c.extensions/extensions.types/types.chats").ChosenUser[]>;
    setKey(req: any): import("@prisma/client").Prisma.Prisma__UserClient<{
        userId: string;
        createdAt: Date;
        role: import("@prisma/client").$Enums.Role;
        userName: string;
        email: string | null;
        pubKey: string | null;
        lastSeen: Date | null;
        refreshToken: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    setUserContact(req: any, contactId: string): import("@prisma/client").Prisma.Prisma__ContactClient<{
        userId: string;
        createdAt: Date;
        contactId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    deleteUserContact(req: any, contactId: string): import("@prisma/client").Prisma.Prisma__ContactClient<{
        userId: string;
        createdAt: Date;
        contactId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
