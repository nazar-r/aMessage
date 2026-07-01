import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    loadUsers(req: any): Promise<import("../src.extensions/extensions.types/types").ChosenUser[]>;
    setUserContact(req: any, contactId: string): import("@prisma/client").Prisma.Prisma__ContactClient<{
        userId: string;
        contactId: string;
        createdAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    deleteUserContact(req: any, contactId: string): import("@prisma/client").Prisma.Prisma__ContactClient<{
        userId: string;
        contactId: string;
        createdAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
