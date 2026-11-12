import { UsersService } from './users.service';
import type { TReq } from '../src.c.extensions/extensions.types/types.auth';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    loadUsers(req: TReq): Promise<import("../src.c.extensions/extensions.types/types.chats").ChosenUser[]>;
    setKey(req: any): import("@prisma/client").Prisma.Prisma__UserClient<{
        userId: string;
        role: import("@prisma/client").$Enums.Role;
        userName: string;
        email: string | null;
        pubKey: string | null;
        lastSeen: Date | null;
        refreshToken: string | null;
        createdAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    setUserContact(req: any, contactId: string): import("@prisma/client").Prisma.Prisma__ContactClient<{
        userId: string;
        createdAt: Date;
        contactId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    deleteUserContact(req: TReq, contactId: string): import("@prisma/client").Prisma.Prisma__ContactClient<{
        userId: string;
        createdAt: Date;
        contactId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
